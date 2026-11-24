import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

const androidLocationOptions = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 0,
  showLocationDialog: true,
  forceRequestLocation: true,
};

export async function getCurrentLocation() {
  if (Platform.OS === 'android') {
    await requestAndroidLocationPermission();
  } else if (Platform.OS === 'ios') {
    const authorization = await Geolocation.requestAuthorization('whenInUse');
    if (authorization !== 'granted') {
      throw new Error('Allow NagarSeva to use your location while using the app.');
    }
  }

  try {
    return await requestPosition(
      Platform.OS === 'android' ? androidLocationOptions : iosLocationOptions,
    );
  } catch (firstError) {
    if (Platform.OS !== 'android' || ![2, 3, 4, 5].includes(firstError.code)) {
      throw explainLocationError(firstError);
    }

    // If GPS cannot get a fix (often indoors), retry with a lower-power fused
    // Wi-Fi/cell estimate before using Android's native location manager.
    try {
      return await requestPosition({
        ...androidLocationOptions,
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 10000,
      });
    } catch {
      try {
        return await requestPosition({
          ...androidLocationOptions,
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 10000,
          forceLocationManager: true,
          showLocationDialog: false,
        });
      } catch (fallbackError) {
        throw explainLocationError(fallbackError);
      }
    }
  }
}

const iosLocationOptions = {
  enableHighAccuracy: true,
  timeout: 30000,
  maximumAge: 10000,
};

async function requestAndroidLocationPermission() {
  const permissions = [
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ];
  const results = await PermissionsAndroid.requestMultiple(permissions);
  const granted = permissions.some(
    permission => results[permission] === PermissionsAndroid.RESULTS.GRANTED,
  );

  if (!granted) {
    throw new Error(
      'Location permission was not granted. Allow precise or approximate location for NagarSeva in Android settings.',
    );
  }
}

function requestPosition(options) {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          reject(new Error('Your device returned invalid coordinates.'));
          return;
        }
        resolve({ latitude, longitude });
      },
      reject,
      options,
    );
  });
}

function explainLocationError(error) {
  if (error.code === 1) {
    return new Error(
      'Location permission was denied. Allow NagarSeva to access your location in phone settings.',
    );
  }
  if (error.code === 2) {
    return new Error(
      `Your phone could not determine a location. Move near a window or outdoors and retry. (${error.message || 'Position unavailable'})`,
    );
  }
  if (error.code === 3) {
    return new Error(
      'The location request timed out. Try again near a window or outdoors.',
    );
  }
  if (error.code === 4) {
    return new Error(
      'Google Play Services could not provide a location, and Android could not find a fallback location.',
    );
  }
  if (error.code === 5) {
    return new Error(
      'Android location settings need attention. Turn on Location and choose a more accurate location mode.',
    );
  }
  return new Error(error.message || 'Could not get your current location.');
}
