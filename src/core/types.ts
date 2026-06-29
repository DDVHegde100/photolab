/** Core type definitions for PhotoLab non-destructive editing pipeline */

export type EditType =
  | 'exposure'
  | 'contrast'
  | 'highlights'
  | 'shadows'
  | 'whites'
  | 'blacks'
  | 'temperature'
  | 'tint'
  | 'vibrance'
  | 'saturation'
  | 'clarity'
  | 'texture'
  | 'sharpness'
  | 'hsl'
  | 'colorGrade'
  | 'curve'
  | 'filter'
  | 'crop'
  | 'mask'
  | 'brush'
  | 'enhance'
  | 'drawing';

export interface EditOperation {
  id: string;
  type: EditType;
  value: number | Record<string, unknown>;
  timestamp: number;
  enabled: boolean;
}

export interface HSLChannel {
  hue: number;
  saturation: number;
  luminance: number;
}

export interface HSLAdjustments {
  red: HSLChannel;
  orange: HSLChannel;
  yellow: HSLChannel;
  green: HSLChannel;
  aqua: HSLChannel;
  blue: HSLChannel;
  purple: HSLChannel;
  magenta: HSLChannel;
}

export interface ColorGradeChannel {
  hue: number;
  saturation: number;
  luminance: number;
}

export interface ColorGrade {
  shadows: ColorGradeChannel;
  midtones: ColorGradeChannel;
  highlights: ColorGradeChannel;
  blending: number;
  balance: number;
}

export interface CurvePoint {
  x: number;
  y: number;
}

export interface CurveData {
  rgb: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  aspectRatio: string | null;
}

export interface MaskRegion {
  kind: 'rect' | 'ellipse' | 'gradient-linear' | 'gradient-radial' | 'luminance';
  x: number;
  y: number;
  width: number;
  height: number;
  feather: number;
  invert?: boolean;
  targetType: 'sky' | 'subject' | 'foreground' | 'background' | 'luminance';
  threshold?: number;
}

export interface MaskData {
  id: string;
  type: 'brush' | 'sky' | 'subject' | 'foreground' | 'background' | 'luminance';
  region?: MaskRegion;
  strokes: BrushStroke[];
  inverted: boolean;
  opacity: number;
  feather: number;
  overlayColor: string;
}

export interface BrushStroke {
  points: { x: number; y: number }[];
  size: number;
  opacity: number;
  hardness: number;
  color: string;
  tool: 'brush' | 'pencil' | 'eraser' | 'enhancement';
  enhancementType?: EnhancementPaintType;
}

export type EnhancementPaintType =
  | 'muscle'
  | 'beard'
  | 'contour'
  | 'skin-smooth'
  | 'sharpen';

export interface DrawingLayer {
  id: string;
  name: string;
  strokes: BrushStroke[];
  visible: boolean;
  opacity: number;
  blendMode: 'normal' | 'multiply' | 'overlay' | 'soft-light';
}

export interface EnhancementRecord {
  type: 'upscale' | 'denoise' | 'portrait' | 'lowlight' | 'autocolor';
  factor?: 2 | 4 | 8;
  strength: number;
  appliedAt: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  category: string;
  adjustments: Partial<AdjustmentValues>;
}

export interface AdjustmentValues {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number;
  tint: number;
  vibrance: number;
  saturation: number;
  clarity: number;
  texture: number;
  sharpness: number;
}

export interface ImageRecipe {
  imageId: string;
  /** Original import — never modified */
  originalUri: string;
  /** Latest algorithmically processed base (upscale, denoise, etc.) */
  workingUri?: string;
  thumbnailUri?: string;
  edits: EditOperation[];
  adjustments: AdjustmentValues;
  hsl: HSLAdjustments;
  colorGrade: ColorGrade;
  curves: CurveData;
  crop: CropData | null;
  masks: MaskData[];
  drawingLayers: DrawingLayer[];
  enhancements: EnhancementRecord[];
  /** @deprecated migrated to enhancements */
  aiEnhancements?: EnhancementRecord[];
  activeFilter: string | null;
  createdAt: number;
  updatedAt: number;
}

export function getDisplayUri(recipe: ImageRecipe): string {
  return recipe.workingUri ?? recipe.originalUri;
}

export interface GalleryImage {
  id: string;
  uri: string;
  thumbnailUri: string;
  width: number;
  height: number;
  createdAt: number;
  recipe?: ImageRecipe;
}

export interface HistoryEntry {
  id: string;
  label: string;
  recipe: ImageRecipe;
  timestamp: number;
}

export type EditorTool =
  | 'adjust'
  | 'crop'
  | 'mask'
  | 'brush'
  | 'enhance'
  | 'export'
  | 'filters'
  | 'curves'
  | 'hsl'
  | 'colorGrade';

export interface ExportOptions {
  format: 'png' | 'jpeg';
  quality: number;
  scale: 1 | 2 | 4;
}
