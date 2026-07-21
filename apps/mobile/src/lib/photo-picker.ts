import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface PickedPhoto {
  /** Local file URI ready for upload or display. */
  uri: string;
  /** MIME type, e.g. "image/jpeg" */
  mimeType: string;
  width: number;
  height: number;
}

/** Opens either the camera or the photo library and returns the picked image. */
export async function pickPhoto(source: 'camera' | 'library'): Promise<PickedPhoto | null> {
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera access', 'Please allow camera access in your settings to take a photo.');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });

    if (result.canceled) return null;
    const asset = result.assets[0];
    if (!asset) return null;
    return {
      uri: asset.uri,
      mimeType: asset.mimeType ?? 'image/jpeg',
      width: asset.width,
      height: asset.height,
    };
  }

  // Library
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Photo library', 'Please allow photo library access in your settings.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.85,
  });

  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    width: asset.width,
    height: asset.height,
  };
}
