jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  PermissionsAndroid: {
    PERMISSIONS: {
      ACCESS_FINE_LOCATION: 'fine',
      ACCESS_COARSE_LOCATION: 'coarse',
    },
    RESULTS: { GRANTED: 'granted' },
    requestMultiple: jest.fn().mockResolvedValue({
      fine: 'granted',
      coarse: 'granted',
    }),
  },
}));

jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: {
    setRNConfiguration: jest.fn(),
    getCurrentPosition: jest.fn(),
  },
}));

import Geolocation from '@react-native-community/geolocation';
import { getCurrentLocation } from '../src/lib/location';

describe('getCurrentLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('retries Android native location provider when Play Services times out', async () => {
    Geolocation.getCurrentPosition
      .mockImplementationOnce((_success, error) =>
        error({ code: 3, message: 'Location request timed out' }),
      )
      .mockImplementationOnce(success =>
        success({ coords: { latitude: 28.6139, longitude: 77.209 } }),
      );

    await expect(getCurrentLocation()).resolves.toEqual({
      latitude: 28.6139,
      longitude: 77.209,
    });

    expect(Geolocation.setRNConfiguration).toHaveBeenLastCalledWith({
      locationProvider: 'android',
      skipPermissionRequests: true,
    });
    expect(Geolocation.getCurrentPosition).toHaveBeenCalledTimes(2);
  });
});
