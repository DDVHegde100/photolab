import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickImageFromLibrary } from '../platform/pickImage';
import { useEditorStore, createGalleryImage } from '../core/store';
import { loadGallery, importImage, deleteImage, loadRecipe } from '../storage/imageStorage';
import { colors, spacing, typography, radius } from '../ui/theme';
import type { GalleryImage } from '../core/types';

const { width: SCREEN_W } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const GAP = 2;
const ITEM_SIZE = (SCREEN_W - GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

interface HomeScreenProps {
  onOpenEditor: () => void;
}

export function HomeScreen({ onOpenEditor }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const gallery = useEditorStore((s) => s.gallery);
  const setGallery = useEditorStore((s) => s.setGallery);
  const addImage = useEditorStore((s) => s.addImage);
  const openEditor = useEditorStore((s) => s.openEditor);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGallery().then((images) => {
      setGallery(images);
      setLoading(false);
    });
  }, [setGallery]);

  const pickImage = useCallback(async () => {
    const picked = await pickImageFromLibrary();
    if (!picked) return;

    try {
      const image = await importImage(picked.uri, {
        width: picked.width,
        height: picked.height,
      });
      addImage(image);
    } catch (e) {
      Alert.alert('Import Failed', String(e));
    }
  }, [addImage]);

  const handleOpen = useCallback(
    async (item: GalleryImage) => {
      const recipe = await loadRecipe(item.id);
      openEditor(item, recipe ?? undefined);
      onOpenEditor();
    },
    [openEditor, onOpenEditor]
  );

  const handleDelete = useCallback(
    (item: GalleryImage) => {
      Alert.alert('Delete Photo', 'Remove this photo and all edits?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteImage(item.id);
            const updated = await loadGallery();
            setGallery(updated);
          },
        },
      ]);
    },
    [setGallery]
  );

  const renderItem = ({ item }: { item: GalleryImage }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => handleOpen(item)}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnail} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>PhotoLab</Text>
          <Text style={styles.subtitle}>
            {gallery.length} {gallery.length === 1 ? 'photo' : 'photos'}
          </Text>
        </View>
        <TouchableOpacity style={styles.importBtn} onPress={pickImage}>
          <Text style={styles.importIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {gallery.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyTitle}>No photos yet</Text>
          <Text style={styles.emptyDesc}>
            Import a photo to start editing with professional-grade tools
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={pickImage}>
            <Text style={styles.emptyBtnText}>Import Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={gallery}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.hero,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  importBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importIcon: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: '300',
  },
  grid: {
    padding: GAP,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceElevated,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  emptyTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyBtn: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  emptyBtnText: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
});
