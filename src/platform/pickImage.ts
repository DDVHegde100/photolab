import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
}

export async function pickImageFromLibrary(): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
  };
}
