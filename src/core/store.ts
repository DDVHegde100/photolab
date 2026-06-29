import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  ImageRecipe,
  GalleryImage,
  EditorTool,
  AdjustmentValues,
  BrushStroke,
  MaskData,
  DrawingLayer,
  EnhancementRecord,
  CropData,
  HSLAdjustments,
  ColorGrade,
  CurveData,
} from './types';
import { createRecipe, updateAdjustments, resetAdjustments } from './editEngine';
import { historyManager } from './historyManager';
import { DEFAULT_HSL, DEFAULT_COLOR_GRADE, DEFAULT_CURVES } from './defaults';

interface EditorState {
  gallery: GalleryImage[];
  currentImage: GalleryImage | null;
  recipe: ImageRecipe | null;
  activeTool: EditorTool;
  activeSubPanel: string | null;
  isComparing: boolean;
  comparePosition: number;
  isLoading: boolean;
  brushSettings: {
    size: number;
    opacity: number;
    hardness: number;
    color: string;
    tool: BrushStroke['tool'];
    enhancementType: BrushStroke['enhancementType'];
  };
  maskSettings: {
    opacity: number;
    feather: number;
    overlayColor: string;
  };

  setGallery: (images: GalleryImage[]) => void;
  addImage: (image: GalleryImage) => void;
  removeImage: (id: string) => void;
  openEditor: (image: GalleryImage, recipe?: ImageRecipe) => void;
  closeEditor: () => void;
  setActiveTool: (tool: EditorTool) => void;
  setActiveSubPanel: (panel: string | null) => void;
  setComparing: (comparing: boolean) => void;
  setComparePosition: (position: number) => void;

  updateAdjustment: (key: keyof AdjustmentValues, value: number) => void;
  setAdjustments: (adjustments: Partial<AdjustmentValues>) => void;
  setHSL: (hsl: HSLAdjustments) => void;
  setColorGrade: (grade: ColorGrade) => void;
  setCurves: (curves: CurveData) => void;
  setCrop: (crop: CropData | null) => void;
  setActiveFilter: (filterId: string | null) => void;
  applyPreset: (adjustments: Partial<AdjustmentValues>, filterId?: string) => void;
  resetAll: () => void;

  addMask: (mask: MaskData) => void;
  updateMask: (id: string, updates: Partial<MaskData>) => void;
  addDrawingLayer: (layer: DrawingLayer) => void;
  addStrokeToLayer: (layerId: string, stroke: BrushStroke) => void;
  applyEnhancement: (
    enhancement: EnhancementRecord,
    result: { uri: string; width: number; height: number }
  ) => void;

  undo: () => void;
  redo: () => void;
  scrubHistory: (index: number) => void;

  setBrushSettings: (settings: Partial<EditorState['brushSettings']>) => void;
  setMaskSettings: (settings: Partial<EditorState['maskSettings']>) => void;
}

function pushHistory(label: string, recipe: ImageRecipe) {
  historyManager.push(label, recipe);
}

export const useEditorStore = create<EditorState>((set, get) => ({
  gallery: [],
  currentImage: null,
  recipe: null,
  activeTool: 'adjust',
  activeSubPanel: 'basic',
  isComparing: false,
  comparePosition: 0.5,
  isLoading: false,
  brushSettings: {
    size: 24,
    opacity: 0.6,
    hardness: 0.7,
    color: '#FFFFFF',
    tool: 'brush',
    enhancementType: 'contour',
  },
  maskSettings: {
    opacity: 0.5,
    feather: 20,
    overlayColor: '#FF6B35',
  },

  setGallery: (images) => set({ gallery: images }),
  addImage: (image) => set((s) => ({ gallery: [image, ...s.gallery] })),
  removeImage: (id) =>
    set((s) => ({ gallery: s.gallery.filter((i) => i.id !== id) })),

  openEditor: (image, recipe) => {
    const r = recipe ?? createRecipe(image.id, image.uri);
    historyManager.reset();
    historyManager.push('Initial state', r);
    set({ currentImage: image, recipe: r, activeTool: 'adjust', activeSubPanel: 'basic' });
  },

  closeEditor: () => {
    historyManager.reset();
    set({ currentImage: null, recipe: null });
  },

  setActiveTool: (tool) => set({ activeTool: tool, activeSubPanel: null }),
  setActiveSubPanel: (panel) => set({ activeSubPanel: panel }),
  setComparing: (comparing) => set({ isComparing: comparing }),
  setComparePosition: (position) => set({ comparePosition: position }),

  updateAdjustment: (key, value) => {
    const { recipe } = get();
    if (!recipe) return;
    const updated = updateAdjustments(recipe, { [key]: value });
    pushHistory(`Adjust ${key}`, updated);
    set({ recipe: updated });
  },

  setAdjustments: (adjustments) => {
    const { recipe } = get();
    if (!recipe) return;
    const updated = updateAdjustments(recipe, adjustments);
    pushHistory('Batch adjust', updated);
    set({ recipe: updated });
  },

  setHSL: (hsl) => {
    const { recipe } = get();
    if (!recipe) return;
    const updated = { ...recipe, hsl, updatedAt: Date.now() };
    pushHistory('HSL adjust', updated);
    set({ recipe: updated });
  },

  setColorGrade: (colorGrade) => {
    const { recipe } = get();
    if (!recipe) return;
    const updated = { ...recipe, colorGrade, updatedAt: Date.now() };
    pushHistory('Color grade', updated);
    set({ recipe: updated });
  },

  setCurves: (curves) => {
    const { recipe } = get();
    if (!recipe) return;
    const updated = { ...recipe, curves, updatedAt: Date.now() };
    pushHistory('Curve adjust', updated);
    set({ recipe: updated });
  },

  setCrop: (crop) => {
    const { recipe } = get();
    if (!recipe) return;
    const updated = { ...recipe, crop, updatedAt: Date.now() };
    pushHistory('Crop', updated);
    set({ recipe: updated });
  },

  setActiveFilter: (filterId) => {
    const { recipe } = get();
    if (!recipe) return;
    const updated = { ...recipe, activeFilter: filterId, updatedAt: Date.now() };
    pushHistory('Apply filter', updated);
    set({ recipe: updated });
  },

  applyPreset: (adjustments, filterId) => {
    const { recipe } = get();
    if (!recipe) return;
    const updated = {
      ...updateAdjustments(recipe, adjustments),
      activeFilter: filterId ?? recipe.activeFilter,
      updatedAt: Date.now(),
    };
    pushHistory('Apply preset', updated);
    set({ recipe: updated });
  },

  resetAll: () => {
    const { recipe } = get();
    if (!recipe) return;
    const updated = resetAdjustments(recipe);
    pushHistory('Reset all', updated);
    set({ recipe: updated });
  },

  addMask: (mask) => {
    const { recipe } = get();
    if (!recipe) return;
    const updated = {
      ...recipe,
      masks: [...recipe.masks, mask],
      updatedAt: Date.now(),
    };
    pushHistory('Add mask', updated);
    set({ recipe: updated });
  },

  updateMask: (id, updates) => {
    const { recipe } = get();
    if (!recipe) return;
    const updated = {
      ...recipe,
      masks: recipe.masks.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      updatedAt: Date.now(),
    };
    pushHistory('Update mask', updated);
    set({ recipe: updated });
  },

  addDrawingLayer: (layer) => {
    const { recipe } = get();
    if (!recipe) return;
    const updated = {
      ...recipe,
      drawingLayers: [...recipe.drawingLayers, layer],
      updatedAt: Date.now(),
    };
    pushHistory('Add layer', updated);
    set({ recipe: updated });
  },

  addStrokeToLayer: (layerId, stroke) => {
    const { recipe } = get();
    if (!recipe) return;
    const updated = {
      ...recipe,
      drawingLayers: recipe.drawingLayers.map((l) =>
        l.id === layerId ? { ...l, strokes: [...l.strokes, stroke] } : l
      ),
      updatedAt: Date.now(),
    };
    pushHistory('Draw stroke', updated);
    set({ recipe: updated });
  },

  applyEnhancement: (enhancement, result) => {
    const { recipe, currentImage } = get();
    if (!recipe) return;
    const updated = {
      ...recipe,
      workingUri: result.uri,
      enhancements: [...recipe.enhancements, enhancement],
      updatedAt: Date.now(),
    };
    pushHistory(`Enhance: ${enhancement.type}`, updated);
    set({
      recipe: updated,
      currentImage: currentImage
        ? { ...currentImage, width: result.width, height: result.height, uri: result.uri }
        : null,
    });
  },

  undo: () => {
    const { recipe } = get();
    if (!recipe) return;
    const prev = historyManager.undo(recipe);
    if (prev) set({ recipe: prev });
  },

  redo: () => {
    const { recipe } = get();
    if (!recipe) return;
    const next = historyManager.redo(recipe);
    if (next) set({ recipe: next });
  },

  scrubHistory: (index) => {
    const { recipe } = get();
    if (!recipe) return;
    const target = historyManager.scrubTo(index, recipe);
    if (target) set({ recipe: target });
  },

  setBrushSettings: (settings) =>
    set((s) => ({ brushSettings: { ...s.brushSettings, ...settings } })),
  setMaskSettings: (settings) =>
    set((s) => ({ maskSettings: { ...s.maskSettings, ...settings } })),
}));

export function createGalleryImage(
  uri: string,
  width: number,
  height: number,
  thumbnailUri?: string
): GalleryImage {
  return {
    id: uuidv4(),
    uri,
    thumbnailUri: thumbnailUri ?? uri,
    width,
    height,
    createdAt: Date.now(),
  };
}
