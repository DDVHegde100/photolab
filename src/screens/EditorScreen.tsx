import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { impactHaptic, ImpactFeedbackStyle } from '../platform/haptics';
import { useEditorStore } from '../core/store';
import { historyManager } from '../core/historyManager';
import { saveRecipe } from '../storage/imageStorage';
import { ImageCanvas } from '../ui/components/ImageCanvas';
import { BottomToolbar } from '../ui/components/BottomToolbar';
import { HistoryTimeline } from '../ui/components/HistoryTimeline';
import { HealTapOverlay } from '../ui/components/HealTapOverlay';
import { DrawingOverlay } from '../features/brush-tool/DrawingOverlay';
import { AdjustPanel } from '../features/adjust/AdjustPanel';
import { CropPanel } from '../features/crop/CropPanel';
import { MaskPanel } from '../features/mask-tool/MaskPanel';
import { BrushPanel } from '../features/brush-tool/BrushPanel';
import { EnhancePanel } from '../features/enhance/EnhancePanel';
import { ExportPanel } from '../features/export/ExportPanel';
import { FiltersPanel } from '../features/filters/FiltersPanel';
import { BackgroundPanel } from '../features/background/BackgroundPanel';
import { UnifiedLayersPanel } from '../features/layers/UnifiedLayersPanel';
import { EffectsPanel } from '../features/effects/EffectsPanel';
import { SplitTonePanel } from '../features/split-tone/SplitTonePanel';
import { SelectivePanel } from '../features/selective/SelectivePanel';
import { TextPanel } from '../features/text/TextPanel';
import { TiltShiftPanel } from '../features/focus/TiltShiftPanel';
import { HealPanel } from '../features/heal/HealPanel';
import { TransformPanel } from '../features/transform/TransformPanel';
import { OverlayPanel } from '../features/overlay/OverlayPanel';
import { getDisplayUri } from '../core/types';
import { useEditorLayout } from '../ui/layout/useEditorLayout';
import { colors, spacing, typography } from '../ui/theme';

interface EditorScreenProps {
  onClose: () => void;
}

export function EditorScreen({ onClose }: EditorScreenProps) {
  const insets = useSafeAreaInsets();
  const layout = useEditorLayout();
  const recipe = useEditorStore((s) => s.recipe);
  const currentImage = useEditorStore((s) => s.currentImage);
  const activeTool = useEditorStore((s) => s.activeTool);
  const activeLocalEditId = useEditorStore((s) => s.activeLocalEditId);
  const isComparing = useEditorStore((s) => s.isComparing);
  const comparePosition = useEditorStore((s) => s.comparePosition);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const setComparing = useEditorStore((s) => s.setComparing);
  const setComparePosition = useEditorStore((s) => s.setComparePosition);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const scrubHistory = useEditorStore((s) => s.scrubHistory);
  const resetAll = useEditorStore((s) => s.resetAll);
  const closeEditor = useEditorStore((s) => s.closeEditor);

  const [, forceUpdate] = useState(0);
  const [liveStroke, setLiveStroke] = useState<import('../core/types').BrushStroke | null>(null);
  const [healTapMode, setHealTapMode] = useState(false);
  const [healRadius, setHealRadius] = useState(0.02);

  React.useEffect(() => {
    return historyManager.subscribe(() => forceUpdate((n) => n + 1));
  }, []);

  React.useEffect(() => {
    if (activeTool !== 'heal') setHealTapMode(false);
  }, [activeTool]);

  const handleClose = useCallback(async () => {
    if (recipe) await saveRecipe(recipe);
    closeEditor();
    onClose();
  }, [recipe, closeEditor, onClose]);

  const handleCompareStart = useCallback(() => {
    impactHaptic(ImpactFeedbackStyle.Medium);
    setComparing(true);
  }, [setComparing]);

  const handleCompareEnd = useCallback(() => {
    setComparing(false);
  }, [setComparing]);

  if (!recipe || !currentImage) return null;

  const renderToolPanel = () => {
    switch (activeTool) {
      case 'adjust':
        return <AdjustPanel />;
      case 'layers':
        return <UnifiedLayersPanel />;
      case 'effects':
        return <EffectsPanel />;
      case 'tone':
        return <SplitTonePanel />;
      case 'selective':
        return <SelectivePanel />;
      case 'text':
        return <TextPanel />;
      case 'focus':
        return <TiltShiftPanel />;
      case 'heal':
        return (
          <HealPanel
            tapMode={healTapMode}
            onTapModeChange={setHealTapMode}
            radius={healRadius}
            onRadiusChange={setHealRadius}
          />
        );
      case 'transform':
        return <TransformPanel />;
      case 'overlay':
        return <OverlayPanel />;
      case 'crop':
        return <CropPanel />;
      case 'mask':
        return <MaskPanel />;
      case 'brush':
        return <BrushPanel />;
      case 'enhance':
        return <EnhancePanel />;
      case 'filters':
        return <FiltersPanel />;
      case 'background':
        return <BackgroundPanel />;
      case 'export':
        return <ExportPanel />;
      default:
        return <AdjustPanel />;
    }
  };

  const drawingEnabled =
    activeTool === 'brush' ||
    activeTool === 'mask' ||
    activeTool === 'selective';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleClose} style={styles.topBtn}>
          <Text style={styles.topBtnText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.titleLabel}>Edit</Text>
        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={undo}
            disabled={!historyManager.canUndo()}
            style={[styles.topBtn, !historyManager.canUndo() && styles.disabled]}
          >
            <Text style={styles.topBtnText}>Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={redo}
            disabled={!historyManager.canRedo()}
            style={[styles.topBtn, !historyManager.canRedo() && styles.disabled]}
          >
            <Text style={styles.topBtnText}>Redo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={resetAll} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Pressable
        onLongPress={handleCompareStart}
        onPressOut={handleCompareEnd}
        delayLongPress={200}
        style={styles.canvasWrapper}
      >
        <View style={{ width: layout.screenWidth, height: layout.canvasHeight }}>
          <ImageCanvas
            uri={getDisplayUri(recipe)}
            recipe={recipe}
            height={layout.canvasHeight}
            isComparing={isComparing}
            comparePosition={comparePosition}
            onComparePositionChange={setComparePosition}
            liveStroke={liveStroke}
            showMasks={activeTool === 'mask'}
            showCropOverlay={activeTool === 'crop'}
            showHealSpots={activeTool === 'heal'}
          />
          <DrawingOverlay
            width={layout.screenWidth}
            height={layout.canvasHeight}
            enabled={drawingEnabled}
            mode={activeTool === 'selective' ? 'selective' : 'brush'}
            localEditId={activeLocalEditId}
            onStrokeUpdate={setLiveStroke}
          />
          <HealTapOverlay
            width={layout.screenWidth}
            height={layout.canvasHeight}
            enabled={healTapMode && activeTool === 'heal'}
            radius={healRadius}
          />
        </View>
        {isComparing && (
          <View style={styles.compareBadge}>
            <Text style={styles.compareText}>Before / After</Text>
          </View>
        )}
      </Pressable>

      <HistoryTimeline onScrub={scrubHistory} />

      <View style={[styles.panelContainer, { maxHeight: layout.panelMaxHeight }]}>
        {renderToolPanel()}
      </View>

      <BottomToolbar activeTool={activeTool} onToolChange={setActiveTool} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topBtn: {
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBtnText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  titleLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    pointerEvents: 'none',
  },
  resetBtn: {
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  disabled: {
    opacity: 0.3,
  },
  canvasWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelContainer: {
    overflow: 'hidden',
  },
  compareBadge: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  compareText: {
    ...typography.micro,
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
});
