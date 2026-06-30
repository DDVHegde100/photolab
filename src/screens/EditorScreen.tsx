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
import { DrawingOverlay } from '../features/brush-tool/DrawingOverlay';
import { AdjustPanel } from '../features/adjust/AdjustPanel';
import { CropPanel } from '../features/crop/CropPanel';
import { MaskPanel } from '../features/mask-tool/MaskPanel';
import { BrushPanel } from '../features/brush-tool/BrushPanel';
import { EnhancePanel } from '../features/enhance/EnhancePanel';
import { ExportPanel } from '../features/export/ExportPanel';
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

  React.useEffect(() => {
    return historyManager.subscribe(() => forceUpdate((n) => n + 1));
  }, []);

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
      case 'crop':
        return <CropPanel />;
      case 'mask':
        return <MaskPanel />;
      case 'brush':
        return <BrushPanel />;
      case 'enhance':
        return <EnhancePanel />;
      case 'export':
        return <ExportPanel />;
      default:
        return <AdjustPanel />;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleClose} style={styles.topBtn}>
          <Text style={styles.topBtnText}>←</Text>
        </TouchableOpacity>

        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={undo}
            disabled={!historyManager.canUndo()}
            style={[styles.topBtn, !historyManager.canUndo() && styles.disabled]}
          >
            <Text style={styles.topBtnText}>↩</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={redo}
            disabled={!historyManager.canRedo()}
            style={[styles.topBtn, !historyManager.canRedo() && styles.disabled]}
          >
            <Text style={styles.topBtnText}>↪</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={resetAll} style={styles.topBtn}>
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
          />
          <DrawingOverlay
            width={layout.screenWidth}
            height={layout.canvasHeight}
            enabled={activeTool === 'brush' || activeTool === 'mask'}
            onStrokeUpdate={setLiveStroke}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBtnText: {
    fontSize: 18,
    color: colors.textPrimary,
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
