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
import { useEditorStore } from '../core/store';
import { loadGallery, importImage, deleteImage, loadRecipe } from '../storage/imageStorage';
import { colors, spacing, typography, radius, shadows } from '../ui/theme';
import type { GalleryImage } from '../core/types';

const { width: SCREEN_W } = Dimensions.get('window');
const NUM_COLUMNS = 2;
const GAP = 12;
const PADDING = spacing.lg;
const ITEM_SIZE = (SCREEN_W - PADDING * 2 - GAP) / NUM_COLUMNS;

interface HomeScreenProps {
  onOpenEditor: () => void;
}

function formatDimensions(w: number, h: number): string {
  if (w <= 0 || h <= 0) return '';
  const mp = ((w * h) / 1_000_000).toFixed(1);
  return `${w}×${h} · ${mp}MP`;
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
    try {
      const picked = await pickImageFromLibrary();
      if (!picked) return;
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
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnail} />
      <View style={styles.cardMeta}>
        <Text style={styles.cardMetaText} numberOfLines={1}>
          {formatDimensions(item.width, item.height) || 'Photo'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>PhotoLab</Text>
          <Text style={styles.subtitle}>
            {gallery.length} {gallery.length === 1 ? 'photo' : 'photos'} · Pro editing
          </Text>
        </View>
        <TouchableOpacity style={styles.importBtn} onPress={pickImage}>
          <Text style={styles.importIcon}>＋</Text>
        </TouchableOpacity>
      </View>

      {gallery.length === 0 && !loading ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Text style={styles.emptyIcon}>📷</Text>
          </View>
          <Text style={styles.emptyTitle}>Start editing</Text>
          <Text style={styles.emptyDesc}>
            Import a photo to upscale, replace backgrounds, apply filters, and export in full quality.
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
    paddingHorizontal: PADDING,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  importIcon: {
    fontSize: 26,
    color: colors.textPrimary,
    fontWeight: '300',
    marginTop: -2,
  },
  grid: {
    paddingHorizontal: PADDING,
    paddingBottom: spacing.xxxl,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  gridItem: {
    width: ITEM_SIZE,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    ...shadows.card,
  },
  thumbnail: {
    width: '100%',
    height: ITEM_SIZE,
    backgroundColor: colors.surfaceElevated,
  },
  cardMeta: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  cardMetaText: {
    ...typography.micro,
    color: colors.textTertiary,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyIcon: {
    fontSize: 36,
    opacity: 0.6,
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
    marginBottom: spacing.xxl,
    lineHeight: 22,
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
