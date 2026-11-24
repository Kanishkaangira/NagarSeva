import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Alert,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { decode } from 'base64-arraybuffer';
import { createReader } from 'exifreader/core';
import { heic, jpeg, png, webp } from 'exifreader/formats';
import { exif, gps } from 'exifreader/groups';
import { issueCategories, colors } from '../Theme';
import Icon from '../Components/Icon';
import ScaleButton from '../Components/ScaleButton';
import StepHeading from '../Components/StepHeading';
import { loadActiveDistricts } from '../lib/complaints';
import { getCurrentLocation } from '../lib/location';
import { t } from '../lib/i18n';
import styles from './Report.styles';

const headerBuildings = [24, 43, 31, 57, 36, 48, 28, 61, 39, 51, 33];
const gpsExifReader = createReader({
  formats: [jpeg, png, webp, heic],
  groups: [exif, gps],
});

function exifCoordinate(tag, referenceTag) {
  if (!tag) return null;

  let coordinate = Number(tag.description);
  if (!Number.isFinite(coordinate)) {
    const parts = Array.isArray(tag.value)
      ? tag.value.map(value => {
          if (Array.isArray(value) && value.length >= 2) {
            return Number(value[1]) ? Number(value[0]) / Number(value[1]) : NaN;
          }
          return Number(value);
        })
      : [];
    if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
      coordinate = parts[0] + parts[1] / 60 + parts[2] / 3600;
    }
  }

  if (!Number.isFinite(coordinate)) return null;

  const referenceValue = referenceTag?.value ?? referenceTag?.description ?? '';
  const reference = Array.isArray(referenceValue)
    ? referenceValue
        .map(value => {
          const code = Number(value);
          return Number.isFinite(code) && code >= 0 && code <= 127
            ? String.fromCharCode(code)
            : String(value);
        })
        .join('')
    : String(referenceValue);
  const hemisphere = reference.trim().toUpperCase();

  if (hemisphere.includes('S') || hemisphere.includes('W')) {
    return -Math.abs(coordinate);
  }
  return Math.abs(coordinate);
}

function getImageGps(metadata) {
  const latitude = Number(metadata?.gps?.Latitude);
  const longitude = Number(metadata?.gps?.Longitude);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { latitude, longitude };
  }

  const exif = metadata?.exif;
  return {
    latitude: exifCoordinate(exif?.GPSLatitude, exif?.GPSLatitudeRef),
    longitude: exifCoordinate(exif?.GPSLongitude, exif?.GPSLongitudeRef),
  };
}

function readJpegGps(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;

  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x00 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }

    const segmentLength = view.getUint16(offset, false);
    const dataStart = offset + 2;
    const segmentEnd = offset + segmentLength;
    if (segmentLength < 2 || segmentEnd > bytes.length) break;

    const isExif =
      marker === 0xe1 &&
      bytes[dataStart] === 0x45 &&
      bytes[dataStart + 1] === 0x78 &&
      bytes[dataStart + 2] === 0x69 &&
      bytes[dataStart + 3] === 0x66 &&
      bytes[dataStart + 4] === 0 &&
      bytes[dataStart + 5] === 0;

    if (isExif) {
      const tiffStart = dataStart + 6;
      const littleEndian =
        bytes[tiffStart] === 0x49 && bytes[tiffStart + 1] === 0x49;
      const bigEndian =
        bytes[tiffStart] === 0x4d && bytes[tiffStart + 1] === 0x4d;
      if (!littleEndian && !bigEndian) return null;

      const read16 = position => view.getUint16(position, littleEndian);
      const read32 = position => view.getUint32(position, littleEndian);
      if (read16(tiffStart + 2) !== 42) return null;

      const ifd0 = tiffStart + read32(tiffStart + 4);
      const ifd0Count = read16(ifd0);
      let gpsIfd = null;
      for (let index = 0; index < ifd0Count; index += 1) {
        const entry = ifd0 + 2 + index * 12;
        if (read16(entry) === 0x8825) {
          gpsIfd = tiffStart + read32(entry + 8);
          break;
        }
      }
      if (!gpsIfd) return null;

      const gpsCount = read16(gpsIfd);
      const entries = {};
      for (let index = 0; index < gpsCount; index += 1) {
        const entry = gpsIfd + 2 + index * 12;
        const tag = read16(entry);
        const type = read16(entry + 2);
        const count = read32(entry + 4);
        const valueOrOffset = entry + 8;

        if ((tag === 1 || tag === 3) && type === 2 && count > 0) {
          const stringOffset = count <= 4
            ? valueOrOffset
            : tiffStart + read32(valueOrOffset);
          entries[tag] = String.fromCharCode(bytes[stringOffset]).toUpperCase();
        }

        if ((tag === 2 || tag === 4) && type === 5 && count >= 3) {
          const rationalStart = tiffStart + read32(valueOrOffset);
          const parts = [];
          for (let part = 0; part < 3; part += 1) {
            const numerator = read32(rationalStart + part * 8);
            const denominator = read32(rationalStart + part * 8 + 4);
            if (!denominator) return null;
            parts.push(numerator / denominator);
          }
          entries[tag] = parts[0] + parts[1] / 60 + parts[2] / 3600;
        }
      }

      if (
        Number.isFinite(entries[2]) &&
        Number.isFinite(entries[4])
      ) {
        return {
          latitude: entries[1] === 'S' ? -entries[2] : entries[2],
          longitude: entries[3] === 'W' ? -entries[4] : entries[4],
        };
      }
      return null;
    }

    offset = segmentEnd;
  }

  return null;
}

async function readImageGps(base64) {
  const bytes = new Uint8Array(decode(base64));
  let jpegGps;
  try {
    jpegGps = readJpegGps(bytes);
  } catch {
    jpegGps = null;
  }
  if (jpegGps) return jpegGps;

  try {
    const metadata = await gpsExifReader.load(bytes, { expanded: true });
    const metadataGps = getImageGps(metadata);
    if (
      Number.isFinite(metadataGps?.latitude) &&
      Number.isFinite(metadataGps?.longitude)
    ) {
      return metadataGps;
    }
  } catch {
    // Continue with OCR for GPS Camera images that print their coordinates on the photo.
  }

  return null;
}

function readPrintedGps(text) {
  const sourceText = String(text || '');
  // Supports common GPS Camera DMS overlays such as 48°51'34.1"N 2°17'24.2"E.
  // Unicode escapes keep these symbols safe across Windows source encodings.
  const dmsPattern = /(-?\d{1,3})\s*[\u00b0\u00ba]\s*(\d{1,2})\s*['\u2032\u2019]\s*(\d{1,2}(?:[.,]\d+)?)\s*(?:["\u2033\u201d])?\s*([NSEW])/gi;
  const dmsCoordinates = [...sourceText.matchAll(dmsPattern)].map(match => {
    const degrees = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3].replace(',', '.'));
    const direction = match[4].toUpperCase();
    const value = Math.abs(degrees) + minutes / 60 + seconds / 3600;
    return { direction, value: direction === 'S' || direction === 'W' ? -value : value };
  });
  const dmsLatitude = dmsCoordinates.find(item => item.direction === 'N' || item.direction === 'S');
  const dmsLongitude = dmsCoordinates.find(item => item.direction === 'E' || item.direction === 'W');
  if (dmsLatitude && dmsLongitude) {
    return { latitude: dmsLatitude.value, longitude: dmsLongitude.value };
  }

  const latitude = sourceText.match(/\b(?:lat|latitude)\s*[:=]?\s*(-?\d{1,2}(?:[.,]\d+)?)/i);
  const longitude = sourceText.match(/\b(?:lon|long|longitude)\s*[:=]?\s*(-?\d{1,3}(?:[.,]\d+)?)/i);
  if (latitude && longitude) {
    return {
      latitude: Number(latitude[1].replace(',', '.')),
      longitude: Number(longitude[1].replace(',', '.')),
    };
  }

  const hemispherePattern = /(-?\d{1,3}(?:[.,]\d+)?)\s*([NSEW])\b/gi;
  const hemisphereCoordinates = [...sourceText.matchAll(hemispherePattern)].map(match => ({
    direction: match[2].toUpperCase(),
    value:
      Number(match[1].replace(',', '.')) *
      (match[2].toUpperCase() === 'S' || match[2].toUpperCase() === 'W' ? -1 : 1),
  }));
  const hemisphereLatitude = hemisphereCoordinates.find(item => item.direction === 'N' || item.direction === 'S');
  const hemisphereLongitude = hemisphereCoordinates.find(item => item.direction === 'E' || item.direction === 'W');
  if (hemisphereLatitude && hemisphereLongitude) {
    return { latitude: hemisphereLatitude.value, longitude: hemisphereLongitude.value };
  }

  // Some overlays omit labels and hemispheres. Infer a pair only when the OCR
  // also identifies this text as GPS/location data and both values are precise.
  if (/\b(gps|location|coordinates?)\b/i.test(sourceText)) {
    const decimals = [...sourceText.matchAll(/[-+]?\d{1,3}[.,]\d{4,}/g)].map(match =>
      Number(match[0].replace(',', '.')),
    );
    for (let index = 0; index < decimals.length; index += 1) {
      if (Math.abs(decimals[index]) > 90) continue;
      const longitudeValue = decimals.slice(index + 1).find(value => Math.abs(value) <= 180);
      if (longitudeValue !== undefined) {
        return { latitude: decimals[index], longitude: longitudeValue };
      }
    }
  }

  return null;
}
async function readGpsFromImage(base64, uri) {
  const metadataGps = await readImageGps(base64);
  if (metadataGps) return metadataGps;

  const recognizedText = await TextRecognition.recognize(uri);
  return readPrintedGps(recognizedText.text || '');
}

export function ReportHeader({ onHome, language = 'English' }) {
  return (
    <View style={styles.titleBlock}>
        <View style={styles.headerGlow} />
        <View pointerEvents="none" style={styles.headerSkyline}>
          {headerBuildings.map((height, index) => (
            <View
              key={index}
              style={[styles.headerBuilding, { height, width: index % 3 === 0 ? 25 : 19 }]}
            >
              <View style={styles.headerWindows}>
                <View style={styles.headerWindow} />
                <View style={styles.headerWindow} />
                <View style={styles.headerWindow} />
                <View style={styles.headerWindow} />
              </View>
            </View>
          ))}
        </View>
        <View style={styles.headerTopLine}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t(language, 'Return to home')}
            activeOpacity={0.6}
            onPress={onHome}
            style={styles.backButton}
          >
            <Icon name="arrowLeft" color={colors.white} size={17} />
          </TouchableOpacity>
          <View style={styles.eyebrowBadge}>
            <Icon name="shield" color={colors.yellow} size={12} />
            <Text style={styles.eyebrow}>{t(language, 'CITIZEN SERVICES')}</Text>
          </View>
        </View>
        <Text style={styles.pageTitle}>{t(language, 'Report an issue')}</Text>
        <Text style={styles.pageSubtitle}>
          {t(language, "Tell us what happened. We'll get it to the right team.")}
        </Text>
        <View style={styles.headerProgress}>
          <Text style={styles.progressCaption}>{t(language, '4 SIMPLE STEPS')}</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressSegmentActive} />
            <View style={styles.progressSegment} />
            <View style={styles.progressSegment} />
            <View style={styles.progressSegment} />
          </View>
          <Text style={styles.progressTime}>{t(language, '~1 min')}</Text>
        </View>
    </View>
  );
}

export default function Report({
  category,
  onCategoryChange,
  districtId,
  onDistrictChange,
  place,
  onPlaceChange,
  coordinates,
  onCoordinatesChange,
  title,
  onTitleChange,
  details,
  onDetailsChange,
  photo,
  onPhotoChange,
  onSubmit,
  darkMode = false,
  language = 'English',
  isSubmitting = false,
}) {
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [districtMenuOpen, setDistrictMenuOpen] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(true);
  const [districtLoadError, setDistrictLoadError] = useState('');
  const [districtRetry, setDistrictRetry] = useState(0);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [gpsPhotoErrorVisible, setGpsPhotoErrorVisible] = useState(false);
  const locationPulse = useRef(new Animated.Value(0)).current;
  const selectedCategory = issueCategories.find(item => item.name === category);
  const selectedDistrict = districts.find(
    district => Number(district.id) === Number(districtId),
  );

  useEffect(() => {
    if (coordinates || isGettingLocation) {
      locationPulse.stopAnimation();
      locationPulse.setValue(0);
      return undefined;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(locationPulse, {
          toValue: 1,
          duration: 1050,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(locationPulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [coordinates, isGettingLocation, locationPulse]);

  const useCurrentLocation = async () => {
    if (isGettingLocation || isSubmitting) return;
    setIsGettingLocation(true);
    try {
      const currentLocation = await getCurrentLocation();
      onCoordinatesChange(currentLocation);
    } catch (error) {
      Alert.alert(
        t(language, 'Could not get location'),
        `${error.message || t(language, 'Please try again.')}\n\n${t(language, 'Check that Location is on and NagarSeva has location permission.')}`,
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoadingDistricts(true);
    setDistrictLoadError('');
    loadActiveDistricts()
      .then(rows => {
        if (isMounted) {
          setDistricts(rows);
          if (!rows.length) {
            setDistrictLoadError('No active districts are available right now. Please try again later.');
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setDistrictLoadError('Districts could not be loaded. Check your connection and try again.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingDistricts(false);
      });

    return () => {
      isMounted = false;
    };
  }, [districtRetry]);

  const choosePhoto = async () => {
    if (isPickingPhoto) return;
    setIsPickingPhoto(true);
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
        includeBase64: true,
        assetRepresentationMode: 'current',
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        throw new Error(result.errorMessage || 'Could not open your photo gallery.');
      }

      const selected = result.assets?.[0];
      if (!selected?.uri || !selected.base64) {
        throw new Error('The selected photo could not be loaded. Please try again.');
      }

      if (selected.fileSize > 5 * 1024 * 1024) {
        throw new Error('This photo is over 5 MB. Choose a smaller original photo.');
      }

      let gpsData;
      try {
        gpsData = await readGpsFromImage(selected.base64, selected.uri);
      } catch {
        throw new Error(
          'We could not read GPS details from this image. Choose an original, GPS-tagged photo.',
        );
      }

      if (
        !Number.isFinite(gpsData?.latitude) ||
        !Number.isFinite(gpsData?.longitude) ||
        gpsData.latitude < -90 ||
        gpsData.latitude > 90 ||
        gpsData.longitude < -180 ||
        gpsData.longitude > 180
      ) {
        throw new Error(
          'No GPS coordinates were found. Choose a GPS-tagged photo or one with clear Lat and Long text printed on it.',
        );
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
        throw new Error('This photo format is not supported. Choose a JPG, PNG, or WebP photo.');
      }

      onPhotoChange?.({
        uri: selected.uri,
        base64: selected.base64,
        fileName: selected.fileName,
        type: selected.type,
        gps: { latitude: gpsData.latitude, longitude: gpsData.longitude },
      });
    } catch (error) {
      const message = error.message || 'Please choose another photo.';
      if (
        message.includes('No GPS coordinates were found') ||
        message.includes('could not read GPS details')
      ) {
        setGpsPhotoErrorVisible(true);
      } else {
        Alert.alert(t(language, 'Photo not accepted'), t(language, message));
      }
    } finally {
      setIsPickingPhoto(false);
    }
  };

  return (
    <>
      <View style={[styles.formCard, darkMode && styles.darkSurface]}>
        <StepHeading number={1} title={t(language, 'Photo')} required darkMode={darkMode} />
        <Text style={[styles.stepHint, darkMode && styles.darkMuted]}>
          {t(language, 'Add a clear photo so the city team can understand the problem.')}
        </Text>
        <ScaleButton
          style={[styles.uploadBox, photo?.uri && styles.uploadBoxSelected]}
          onPress={choosePhoto}
          disabled={isPickingPhoto || isSubmitting}
          accessibilityLabel={t(language, photo ? 'Replace selected report photo' : 'Choose a GPS-tagged report photo from gallery')}
        >
          {photo?.uri ? (
            <View pointerEvents="none" style={styles.photoSelectedContent}>
              <View style={styles.photoThumbnailFrame}>
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.photoThumbnail}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.photoSelectedInfo}>
                <View style={styles.photoSelectedBadge}>
                  <Icon name="check" size={10} color={colors.green} strokeWidth={3} />
                  <Text style={styles.photoSelectedText}>{t(language, 'GPS verified')}</Text>
                </View>
                <Text style={styles.photoSelectedTitle}>{t(language, 'GPS location found')}</Text>
                <Text style={styles.photoSelectedHint}>
                  {photo.gps
                    ? `${photo.gps.latitude.toFixed(6)}, ${photo.gps.longitude.toFixed(6)}`
                    : t(language, 'Location details verified')}
                </Text>
                <Text style={styles.photoSelectedHint}>{t(language, 'Tap to change photo')}</Text>
              </View>
              <Icon name="chevronRight" size={17} color={colors.blue} />
            </View>
          ) : (
            <>
              <View pointerEvents="none" style={styles.photoOrbLeft} />
              <View pointerEvents="none" style={styles.photoOrbRight} />
              <View style={styles.cameraButton}>
                <Icon name="camera" size={20} color={colors.white} />
              </View>
              <Text style={styles.uploadTitle}>
                {t(language, isPickingPhoto ? 'Checking photo...' : 'Add a photo')}
              </Text>
              <Text style={styles.uploadSubtitle}>{t(language, 'GPS tags or visible latitude and longitude required')}</Text>
            </>
          )}
        </ScaleButton>

        <StepHeading number={2} title={t(language, 'Issue type')} required darkMode={darkMode} />
        <Text style={[styles.issueTypeHint, darkMode && styles.darkMuted]}>
          {t(language, 'Choose the option that best matches the problem.')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(language, selectedCategory?.name ?? 'Select the issue type')}
          accessibilityState={{ expanded: categoryMenuOpen }}
          onPress={() => setCategoryMenuOpen(open => !open)}
          style={({ pressed }) => [
            styles.categorySelector,
            darkMode && styles.darkInput,
            categoryMenuOpen && styles.categorySelectorOpen,
            pressed && { opacity: 0.82 },
          ]}
        >
          <Icon
            name={selectedCategory?.icon ?? 'all'}
            color={selectedCategory ? colors.blue : colors.muted}
            size={18}
          />
          <Text
            style={[
              styles.categorySelectorText,
              darkMode && styles.darkText,
              !selectedCategory && styles.categorySelectorPlaceholder,
            ]}
          >
            {t(language, selectedCategory?.name ?? 'Select the issue type')}
          </Text>
          <Icon
            name={categoryMenuOpen ? 'chevronUp' : 'chevronDown'}
            color={colors.muted}
            size={17}
          />
        </Pressable>
        {categoryMenuOpen ? (
          <View style={[styles.categoryMenu, darkMode && styles.darkSurface]}>
            {issueCategories.map((item, index) => {
              const active = category === item.name;
              return (
                <Pressable
                  key={item.name}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    onCategoryChange(item.name);
                    setCategoryMenuOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.categoryOption,
                    darkMode && styles.darkOption,
                    active && styles.categoryOptionActive,
                    index === issueCategories.length - 1
                      ? styles.categoryOptionLast
                      : null,
                    pressed && { opacity: 0.78 },
                  ]}
                >
                  <Icon
                    name={item.icon}
                    color={active ? colors.blue : colors.muted}
                    size={17}
                  />
                  <Text
                    style={[
                      styles.categoryOptionText,
                      active && styles.categoryOptionTextActive,
                    ]}
                  >
                    {t(language, item.name)}
                  </Text>
                  {active ? (
                    <Icon name="check" color={colors.blue} size={15} strokeWidth={3} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <StepHeading number={3} title={t(language, 'What needs attention?')} required darkMode={darkMode} />
        <Text style={[styles.stepHint, darkMode && styles.darkMuted]}>
          {t(language, 'Give it a short title, then add details to help the team respond.')}
        </Text>
        <TextInput
          value={title}
          onChangeText={onTitleChange}
          placeholder={t(language, 'e.g. Pothole outside the school')}
          placeholderTextColor="#91A0B7"
          returnKeyType="next"
          maxLength={100}
          accessibilityLabel={t(language, 'Issue title')}
          style={[styles.input, darkMode && styles.darkInput]}
        />
        <TextInput
          value={details}
          onChangeText={onDetailsChange}
          placeholder={t(language, 'More details (optional)')}
          placeholderTextColor="#91A0B7"
          multiline
          textAlignVertical="top"
          maxLength={500}
          accessibilityLabel={t(language, 'Additional issue details')}
          style={[styles.input, styles.details, darkMode && styles.darkInput]}
        />

        <StepHeading number={4} title={t(language, 'Location')} darkMode={darkMode} />
        <View style={[styles.gpsCard, darkMode && styles.darkSurface, coordinates && styles.gpsCardLocated]}>
          <View style={styles.gpsCardTop}>
            <View style={styles.gpsCardIcon}>
              <Icon name="location" color={colors.blue} size={20} />
            </View>
            <View style={styles.gpsCardCopy}>
              <View style={styles.gpsTitleRow}>
                <Text style={[styles.gpsCardTitle, darkMode && styles.darkText]}>{t(language, 'GPS location')}</Text>
                <Text style={styles.requiredTag}>{t(language, 'REQUIRED')}</Text>
              </View>
            </View>
            <View style={styles.gpsActionWrap}>
              {!coordinates && !isGettingLocation ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.gpsActionRipple,
                    {
                      opacity: locationPulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.42, 0],
                      }),
                      transform: [
                        {
                          scale: locationPulse.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.45],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(language, coordinates ? 'Update current GPS location' : 'Get current GPS location, required')}
                accessibilityState={{ disabled: isGettingLocation || isSubmitting }}
                disabled={isGettingLocation || isSubmitting}
                onPress={useCurrentLocation}
                style={({ pressed }) => [
                  styles.gpsAction,
                  isGettingLocation && styles.gpsActionLoading,
                  pressed && { opacity: 0.82 },
                ]}
              >
                {isGettingLocation ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Icon name={coordinates ? 'refresh' : 'locate'} color={colors.white} size={15} />
                )}
                <Text style={styles.gpsActionText}>
                  {t(language, isGettingLocation ? 'Wait' : coordinates ? 'Update' : 'Add location')}
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={[styles.gpsCoordinatePanel, coordinates && styles.gpsCoordinatePanelReady]}>
            <Text style={[styles.gpsCoordinateText, !coordinates && styles.gpsCoordinatePlaceholder]}>
              {coordinates
                ? `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`
                : t(language, 'Location not added')}
            </Text>
          </View>
        </View>

        <Text style={[styles.locationFieldLabel, darkMode && styles.darkText]}>{t(language, 'District')} <Text style={styles.requiredMark}>*</Text></Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(language, selectedDistrict?.name ?? 'Select your district')}
          accessibilityState={{ expanded: districtMenuOpen }}
          disabled={isLoadingDistricts || Boolean(districtLoadError)}
          onPress={() => setDistrictMenuOpen(open => !open)}
          style={({ pressed }) => [
            styles.districtSelector,
            darkMode && styles.darkInput,
            districtMenuOpen && styles.districtSelectorOpen,
            pressed && { opacity: 0.82 },
          ]}
        >
          <Icon name="location" color={selectedDistrict ? colors.blue : colors.muted} size={18} />
          <Text
            style={[
              styles.categorySelectorText,
              darkMode && styles.darkText,
              !selectedDistrict && styles.categorySelectorPlaceholder,
            ]}
          >
            {isLoadingDistricts
              ? t(language, 'Loading districts...')
              : t(language, selectedDistrict?.name ?? 'Select your district')}
          </Text>
          <Icon
            name={districtMenuOpen ? 'chevronUp' : 'chevronDown'}
            color={colors.muted}
            size={17}
          />
        </Pressable>
        {districtLoadError ? (
          <View style={styles.districtErrorRow}>
            <Text style={styles.districtError}>{t(language, districtLoadError)}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDistrictRetry(retry => retry + 1)}
              hitSlop={8}
            >
              <Text style={styles.districtRetry}>{t(language, 'Retry')}</Text>
            </Pressable>
          </View>
        ) : null}
        {districtMenuOpen && districts.length ? (
          <View style={[styles.districtMenu, darkMode && styles.darkSurface]}>
            <ScrollView nestedScrollEnabled style={styles.districtList}>
              {districts.map((district, index) => {
                const active = Number(district.id) === Number(districtId);
                return (
                  <Pressable
                    key={district.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      onDistrictChange(district.id);
                      setDistrictMenuOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.districtOption,
                      darkMode && styles.darkOption,
                      active && styles.categoryOptionActive,
                      index === districts.length - 1 && styles.categoryOptionLast,
                      pressed && { opacity: 0.78 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        active && styles.categoryOptionTextActive,
                      ]}
                    >
                      {district.name}
                    </Text>
                    {active ? (
                      <Icon name="check" color={colors.blue} size={15} strokeWidth={3} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
        <Text style={[styles.locationFieldLabel, styles.addressFieldLabel, darkMode && styles.darkText]}>
          {t(language, 'Street or nearby landmark')} <Text style={styles.requiredMark}>*</Text>
        </Text>
        <TextInput
          value={place}
          onChangeText={onPlaceChange}
          placeholder={t(language, 'Street, sector, village or nearby landmark')}
          placeholderTextColor="#91A0B7"
          returnKeyType="next"
          maxLength={240}
          accessibilityLabel={t(language, 'Issue location address')}
          style={[styles.input, styles.locationAddressInput, darkMode && styles.darkInput]}
        />
      </View>

      <View style={styles.privacyRow}>
        <View style={styles.privacyIcon}>
          <Icon name="shield" color={colors.blue} size={15} />
        </View>
        <Text style={styles.privacy}>
          {t(language, 'Your contact details stay private. The team receives only the issue and location.')}
        </Text>
      </View>
      <ScaleButton
        style={[styles.submitButton, isSubmitting && { opacity: 0.72 }]}
        onPress={onSubmit}
        disabled={isSubmitting}
        accessibilityLabel={t(language, isSubmitting ? 'Submitting report...' : 'Submit report')}
      >
        <Text style={styles.submitText}>
          {t(language, isSubmitting ? 'Submitting report...' : 'Submit report')}
        </Text>
        {!isSubmitting ? (
          <Icon name="arrowRight" color={colors.white} size={17} />
        ) : null}
      </ScaleButton>

      <Modal
        visible={gpsPhotoErrorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGpsPhotoErrorVisible(false)}
      >
        <View style={styles.gpsErrorOverlay}>
          <View style={styles.gpsErrorCard}>
            <View style={styles.gpsErrorIconCircle}>
              <Icon name="location" color={colors.blue} size={25} />
              <View style={styles.gpsErrorMark}>
                <Text style={styles.gpsErrorMarkText}>!</Text>
              </View>
            </View>
            <Text style={styles.gpsErrorEyebrow}>{t(language, 'LOCATION VERIFICATION')}</Text>
            <Text style={styles.gpsErrorTitle}>{t(language, 'GPS image required')}</Text>
            <View style={styles.gpsErrorMessageBox}>
              <Text style={styles.gpsErrorMessage}>
                {t(language, 'A GPS image is needed to verify the reported location. Please choose another image.')}
              </Text>
            </View>
            <ScaleButton
              containerStyle={styles.gpsErrorButtonContainer}
              style={styles.gpsErrorButton}
              onPress={() => setGpsPhotoErrorVisible(false)}
              accessibilityLabel={t(language, 'Close GPS photo message')}
            >
              <Text style={styles.gpsErrorButtonText}>{t(language, 'Got it')}</Text>
            </ScaleButton>
          </View>
        </View>
      </Modal>
    </>
  );
}
