import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickImageFromLibrary } from '../platform/pickImage';
import { useEditorStore } from '../core/store';
import { loadGallery, importImage, deleteImage, loadRecipe } from '../storage/imageStorage';
import { colors, spacing, typography, radius, shadows } from '../ui/theme';
import type { GalleryImage } from '../core/types';

const GAP = 12;
const PADDING = spacing.lg;
const MAX_IMPORT_BYTES = 30 * 1024 * 1024;

interface HomeScreenProps {
  onOpenEditor: () => void;
}

function formatDimensions(w: number, h: number): string {
  if (w <= 0 || h <= 0) return '';
  const mp = ((w * h) / 1_000_000).toFixed(1);
  return `${w}x${h} · ${mp}MP`;
}

function sampleImageUri(): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1000" viewBox="0 0 1400 1000">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="#0A84FF"/>
          <stop offset="0.55" stop-color="#BF5AF2"/>
          <stop offset="1" stop-color="#FF9F0A"/>
        </linearGradient>
        <radialGradient id="r" cx="0.32" cy="0.28" r="0.72">
          <stop stop-color="#ffffff" stop-opacity="0.82"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1400" height="1000" fill="#08080d"/>
      <rect x="80" y="80" width="1240" height="840" rx="72" fill="url(#g)"/>
      <circle cx="430" cy="335" r="180" fill="url(#r)"/>
      <path d="M120 785 C280 610 430 640 560 710 C720 796 850 545 1010 615 C1135 670 1232 754 1280 820 L1280 880 L120 880 Z" fill="#111114" opacity="0.82"/>
      <text x="112" y="170" fill="#fff" font-family="Helvetica,Arial,sans-serif" font-size="68" font-weight="800">PhotoLab Sample</text>
      <text x="116" y="230" fill="#fff" opacity="0.75" font-family="Helvetica,Arial,sans-serif" font-size="30">Try adjustments, cleanup, filters, and export.</text>
    </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function imageFromFile(file: globalThis.File) {
  if (!file.type.startsWith('image/')) {
    throw new Error(`${file.name} is not an image.`);
  }
  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error(`${file.name} is larger than 30MB. Try a smaller source image.`);
  }

  const uri = URL.createObjectURL(file);
  const img = new window.Image();
  const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error(`Could not decode ${file.name}.`));
    img.src = uri;
  });

  if (dims.width * dims.height > 80_000_000) {
    URL.revokeObjectURL(uri);
    throw new Error(`${file.name} is too large for browser canvas processing.`);
  }

  return importImage(uri, dims);
}

export function HomeScreen({ onOpenEditor }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const gallery = useEditorStore((s) => s.gallery);
  const setGallery = useEditorStore((s) => s.setGallery);
  const addImage = useEditorStore((s) => s.addImage);
  const openEditor = useEditorStore((s) => s.openEditor);
  const dropRef = useRef<View>(null);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);

  const numColumns = width >= 900 ? 3 : 2;
  const itemSize = useMemo(
    () => (Math.min(width, 520) - PADDING * 2 - GAP * (numColumns - 1)) / numColumns,
    [numColumns, width]
  );

  useEffect(() => {
    loadGallery().then((images) => {
      setGallery(images);
      setLoading(false);
    });
  }, [setGallery]);

  const addImages = useCallback(
    async (images: GalleryImage[]) => {
      images.forEach(addImage);
      if (images.length === 1) {
        const recipe = await loadRecipe(images[0].id);
        openEditor(images[0], recipe ?? undefined);
        onOpenEditor();
      }
    },
    [addImage, onOpenEditor, openEditor]
  );

  const pickImage = useCallback(async () => {
    try {
      const picked = await pickImageFromLibrary();
      if (!picked) return;
      const image = await importImage(picked.uri, {
        width: picked.width,
        height: picked.height,
      });
      await addImages([image]);
    } catch (e) {
      Alert.alert('Import Failed', String(e));
    }
  }, [addImages]);

  const trySample = useCallback(async () => {
    const uri = sampleImageUri();
    const image = await importImage(uri, { width: 1400, height: 1000 });
    await addImages([image]);
  }, [addImages]);

  const importFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      try {
        const imported = await Promise.all(Array.from(files).map(imageFromFile));
        await addImages(imported);
      } catch (e) {
        Alert.alert('Import Failed', String(e));
      }
    },
    [addImages]
  );

  useEffect(() => {
    const el = dropRef.current as unknown as HTMLElement | null;
    if (!el) return;

    const dragEnter = (event: DragEvent) => {
      event.preventDefault();
      setDragging(true);
    };
    const dragOver = (event: DragEvent) => event.preventDefault();
    const dragLeave = () => setDragging(false);
    const drop = (event: DragEvent) => {
      event.preventDefault();
      setDragging(false);
      importFiles(event.dataTransfer?.files ?? null);
    };

    el.addEventListener('dragenter', dragEnter);
    el.addEventListener('dragover', dragOver);
    el.addEventListener('dragleave', dragLeave);
    el.addEventListener('drop', drop);
    return () => {
      el.removeEventListener('dragenter', dragEnter);
      el.removeEventListener('dragover', dragOver);
      el.removeEventListener('dragleave', dragLeave);
      el.removeEventListener('drop', drop);
    };
  }, [importFiles]);

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
      const confirmed = window.confirm('Remove this photo and all edits?');
      if (!confirmed) return;
      deleteImage(item.id).then(async () => {
        const updated = await loadGallery();
        setGallery(updated);
      });
    },
    [setGallery]
  );

  const renderItem = ({ item }: { item: GalleryImage }) => (
    <TouchableOpacity
      style={[styles.gridItem, { width: itemSize }]}
      onPress={() => handleOpen(item)}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.thumbnailUri }} style={[styles.thumbnail, { height: itemSize }]} />
      <View style={styles.cardMeta}>
        <Text style={styles.cardMetaText} numberOfLines={1}>
          {formatDimensions(item.width, item.height) || 'Photo'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      ref={dropRef}
      style={[
        styles.container,
        { paddingTop: insets.top },
        dragging && styles.dragging,
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>PhotoLab</Text>
          <Text style={styles.subtitle}>
            {gallery.length} {gallery.length === 1 ? 'photo' : 'photos'} · local edits only
          </Text>
        </View>
        <TouchableOpacity style={styles.importBtn} onPress={pickImage}>
          <Text style={styles.importIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {gallery.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.badge}>Private by design</Text>
          <Text style={styles.emptyTitle}>Drop a photo here to start editing.</Text>
          <Text style={styles.emptyDesc}>
            Nothing is uploaded. PhotoLab runs adjustments, cleanup, background tools, and export in
            your browser using local storage.
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.emptyBtn} onPress={pickImage}>
              <Text style={styles.emptyBtnText}>Import Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={trySample}>
              <Text style={styles.secondaryBtnText}>Try Sample</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.dropHint}>
            Supports JPG, PNG, HEIC where your browser supports it, and batch drag-and-drop.
          </Text>
        </View>
      ) : (
        <FlatList
          data={gallery}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <Text style={styles.footer}>
              Your files stay local. Privacy and terms are included in the public repository.
            </Text>
          }
        />
      )}

      {dragging && (
        <View pointerEvents="none" style={styles.dropOverlay}>
          <Text style={styles.dropOverlayText}>Release to import</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dragging: {
    backgroundColor: '#07111f',
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
    fontSize: 30,
    color: colors.textPrimary,
    fontWeight: '300',
    marginTop: -3,
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
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    ...shadows.card,
  },
  thumbnail: {
    width: '100%',
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
    paddingHorizontal: spacing.xxl,
  },
  badge: {
    ...typography.micro,
    alignSelf: 'flex-start',
    color: colors.accentLight,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.accentGlow,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.8,
    marginBottom: spacing.md,
  },
  emptyDesc: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 23,
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  emptyBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  emptyBtnText: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  secondaryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderActive,
  },
  secondaryBtnText: {
    ...typography.subtitle,
    color: colors.textSecondary,
  },
  dropHint: {
    ...typography.caption,
    color: colors.textTertiary,
    lineHeight: 20,
  },
  footer: {
    ...typography.micro,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  dropOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10,132,255,0.18)',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  dropOverlayText: {
    ...typography.title,
    color: colors.textPrimary,
  },
});
