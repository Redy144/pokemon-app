import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Crypto from 'expo-crypto';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useMapPins } from '@/contexts/MapPinsContext';
import { getCurrentLocation } from '@/hooks/useCurrentLocation';
import { persistPinPhoto } from '@/lib/photoStorage';
import type { CameraPreviewRef } from '@/types/camera';

const SAVED_TITLE = 'Saved';
const SAVED_WITH_PIN_MESSAGE = 'Photo saved and pin added on the map.';
const SAVED_WITHOUT_PIN_MESSAGE =
  'Photo saved to your library. Location unavailable — pin was not added.';
const PERMISSION_REQUIRED_TITLE = 'Permission required';
const LIBRARY_PERMISSION_MESSAGE = 'Allow photo library access to save photos.';
const CAPTURE_FAILED_TITLE = 'Capture failed';
const CAPTURE_FAILED_MESSAGE = 'Could not save the photo. Try again.';

type Params = {
  cameraRef: React.RefObject<CameraPreviewRef | null>;
};

export function usePhotoCapture({ cameraRef }: Params) {
  const { addPhotoPin } = useMapPins();
  const [isCapturing, setIsCapturing] = useState(false);

  const capturePhoto = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      const uri = await cameraRef.current.captureForSave();

      const { status } = await requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert(PERMISSION_REQUIRED_TITLE, LIBRARY_PERMISSION_MESSAGE);
        return;
      }

      await Asset.create(uri.startsWith('file://') ? uri : `file://${uri}`);

      const location = await getCurrentLocation();
      if (location) {
        const pinId = Crypto.randomUUID();
        const permanentUri = await persistPinPhoto(uri, pinId);
        addPhotoPin(pinId, location.latitude, location.longitude, permanentUri);
        Alert.alert(SAVED_TITLE, SAVED_WITH_PIN_MESSAGE);
      } else {
        Alert.alert(SAVED_TITLE, SAVED_WITHOUT_PIN_MESSAGE);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(CAPTURE_FAILED_TITLE, CAPTURE_FAILED_MESSAGE);
    } finally {
      setIsCapturing(false);
    }
  }, [addPhotoPin, cameraRef, isCapturing]);

  return { capturePhoto, isCapturing };
}
