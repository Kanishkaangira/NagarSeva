import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { issueCategories, colors } from '../Theme';
import Icon from '../Components/Icon';
import ScaleButton from '../Components/ScaleButton';
import StepHeading from '../Components/StepHeading';
import styles from './Report.styles';

const headerBuildings = [24, 43, 31, 57, 36, 48, 28, 61, 39, 51, 33];

export function ReportHeader({ onHome }) {
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
            accessibilityLabel="Return to home"
            activeOpacity={0.6}
            onPress={onHome}
            style={styles.backButton}
          >
            <Icon name="arrowLeft" color={colors.white} size={17} />
          </TouchableOpacity>
          <View style={styles.eyebrowBadge}>
            <Icon name="shield" color={colors.yellow} size={12} />
            <Text style={styles.eyebrow}>CITIZEN SERVICES</Text>
          </View>
        </View>
        <Text style={styles.pageTitle}>Report an issue</Text>
        <Text style={styles.pageSubtitle}>
          Tell us what happened. We’ll get it to the right team.
        </Text>
        <View style={styles.headerProgress}>
          <Text style={styles.progressCaption}>4 SIMPLE STEPS</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressSegmentActive} />
            <View style={styles.progressSegment} />
            <View style={styles.progressSegment} />
            <View style={styles.progressSegment} />
          </View>
          <Text style={styles.progressTime}>~1 min</Text>
        </View>
    </View>
  );
}

export default function Report({
  category,
  onCategoryChange,
  title,
  onTitleChange,
  details,
  onDetailsChange,
  photo,
  onPhotoChange,
  onSubmit,
  isSubmitting = false,
}) {
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const selectedCategory = issueCategories.find(item => item.name === category);

  const choosePhoto = async () => {
    if (isPickingPhoto) return;
    setIsPickingPhoto(true);
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.8,
        includeBase64: true,
        assetRepresentationMode: 'compatible',
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        throw new Error(result.errorMessage || 'Could not open your photo gallery.');
      }

      const selected = result.assets?.[0];
      if (!selected?.uri || !selected.base64) {
        throw new Error('The selected photo could not be loaded. Please try again.');
      }
      onPhotoChange?.({
        uri: selected.uri,
        base64: selected.base64,
        fileName: selected.fileName,
        type: selected.type,
      });
    } catch (error) {
      Alert.alert('Unable to select photo', error.message || 'Please try again.');
    } finally {
      setIsPickingPhoto(false);
    }
  };

  return (
    <>
      <View style={styles.formCard}>
        <StepHeading number={1} title="Photo" />
        <Text style={styles.stepHint}>
          Add a clear photo so the city team can understand the problem.
        </Text>
        <ScaleButton
          style={styles.uploadBox}
          onPress={choosePhoto}
          disabled={isPickingPhoto || isSubmitting}
          accessibilityLabel={photo ? 'Replace selected report photo' : 'Choose report photo from gallery'}
        >
          {photo?.uri ? (
            <>
              <Image
                pointerEvents="none"
                source={{ uri: photo.uri }}
                style={styles.photoPreview}
                resizeMode="cover"
              />
              <View pointerEvents="none" style={styles.photoPreviewOverlay} />
            </>
          ) : (
            <>
              <View pointerEvents="none" style={styles.photoOrbLeft} />
              <View pointerEvents="none" style={styles.photoOrbRight} />
            </>
          )}
          <View style={styles.cameraButton}>
            <Icon name="camera" size={20} color={colors.white} />
          </View>
          <Text style={[styles.uploadTitle, photo && styles.uploadTitleOnPhoto]}>
            {isPickingPhoto ? 'Opening gallery…' : photo ? 'Photo selected' : 'Add a photo'}
          </Text>
          <Text style={[styles.uploadSubtitle, photo && styles.uploadSubtitleOnPhoto]}>
            {photo ? 'Tap to choose a different photo' : 'Choose a clear photo from your gallery'}
          </Text>
        </ScaleButton>

        <StepHeading number={2} title="Issue type" />
        <Text style={styles.issueTypeHint}>
          Choose the option that best matches the problem.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={selectedCategory?.name ?? 'Select the issue type'}
          accessibilityState={{ expanded: categoryMenuOpen }}
          onPress={() => setCategoryMenuOpen(open => !open)}
          style={({ pressed }) => [
            styles.categorySelector,
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
              !selectedCategory && styles.categorySelectorPlaceholder,
            ]}
          >
            {selectedCategory?.name ?? 'Select the issue type'}
          </Text>
          <Icon
            name={categoryMenuOpen ? 'chevronUp' : 'chevronDown'}
            color={colors.muted}
            size={17}
          />
        </Pressable>
        {categoryMenuOpen ? (
          <View style={styles.categoryMenu}>
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
                    {item.name}
                  </Text>
                  {active ? (
                    <Icon name="check" color={colors.blue} size={15} strokeWidth={3} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <StepHeading number={3} title="What needs attention?" />
        <Text style={styles.stepHint}>
          Give it a short title, then add details to help the team respond.
        </Text>
        <TextInput
          value={title}
          onChangeText={onTitleChange}
          placeholder="e.g. Pothole outside the school"
          placeholderTextColor="#91A0B7"
          returnKeyType="next"
          maxLength={100}
          accessibilityLabel="Issue title"
          style={styles.input}
        />
        <TextInput
          value={details}
          onChangeText={onDetailsChange}
          placeholder="More details (optional)"
          placeholderTextColor="#91A0B7"
          multiline
          textAlignVertical="top"
          maxLength={500}
          accessibilityLabel="Additional issue details"
          style={[styles.input, styles.details]}
        />

        <StepHeading number={4} title="Location" />
        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Icon name="location" size={19} color={colors.blue} />
          </View>
          <View style={styles.locationCopy}>
            <Text style={styles.locationTitle}>Sector 15, New Delhi</Text>
            <Text style={styles.locationSubtitle}>Current report location</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              Alert.alert(
                'Change location',
                'Location services will be connected later.',
              )
            }
          >
            <Text style={styles.link}>Change</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.privacyRow}>
        <View style={styles.privacyIcon}>
          <Icon name="shield" color={colors.blue} size={15} />
        </View>
        <Text style={styles.privacy}>
          Your contact details stay private. The team receives only the issue and location.
        </Text>
      </View>
      <ScaleButton
        style={[styles.submitButton, isSubmitting && { opacity: 0.72 }]}
        onPress={onSubmit}
        disabled={isSubmitting}
        accessibilityLabel={isSubmitting ? 'Submitting report' : 'Submit report'}
      >
        <Text style={styles.submitText}>
          {isSubmitting ? 'Submitting report…' : 'Submit report'}
        </Text>
        {!isSubmitting ? (
          <Icon name="arrowRight" color={colors.white} size={17} />
        ) : null}
      </ScaleButton>
    </>
  );
}
