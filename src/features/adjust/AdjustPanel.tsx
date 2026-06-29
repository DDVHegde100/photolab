import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Slider } from '../../ui/components/Slider';
import { useEditorStore } from '../../core/store';
import {
  BASIC_ADJUSTMENTS,
  COLOR_ADJUSTMENTS,
  DETAIL_ADJUSTMENTS,
  ADJUSTMENT_RANGES,
} from '../../rendering/filterPipeline';
import { colors, spacing, typography, radius } from '../../ui/theme';
import type { AdjustmentValues } from '../../core/types';

const SUB_PANELS = [
  { id: 'basic', label: 'Light' },
  { id: 'color', label: 'Color' },
  { id: 'detail', label: 'Detail' },
  { id: 'hsl', label: 'HSL' },
  { id: 'curves', label: 'Curves' },
  { id: 'grade', label: 'Grade' },
  { id: 'filters', label: 'Presets' },
];

export function AdjustPanel() {
  const [subPanel, setSubPanel] = useState('basic');
  const recipe = useEditorStore((s) => s.recipe);
  const updateAdjustment = useEditorStore((s) => s.updateAdjustment);
  const setActiveSubPanel = useEditorStore((s) => s.setActiveSubPanel);
  const applyPreset = useEditorStore((s) => s.applyPreset);
  const setHSL = useEditorStore((s) => s.setHSL);
  const setColorGrade = useEditorStore((s) => s.setColorGrade);
  const setCurves = useEditorStore((s) => s.setCurves);

  if (!recipe) return null;

  const renderSliders = (keys: (keyof AdjustmentValues)[]) =>
    keys.map((key) => {
      const range = ADJUSTMENT_RANGES[key];
      return (
        <Slider
          key={key}
          label={range.label}
          value={recipe.adjustments[key]}
          min={range.min}
          max={range.max}
          onChange={(v) => updateAdjustment(key, v)}
        />
      );
    });

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabs}
        contentContainerStyle={styles.tabsContent}
      >
        {SUB_PANELS.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.tab, subPanel === p.id && styles.tabActive]}
            onPress={() => {
              setSubPanel(p.id);
              setActiveSubPanel(p.id);
            }}
          >
            <Text style={[styles.tabText, subPanel === p.id && styles.tabTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {subPanel === 'basic' && renderSliders(BASIC_ADJUSTMENTS)}
        {subPanel === 'color' && renderSliders(COLOR_ADJUSTMENTS)}
        {subPanel === 'detail' && renderSliders(DETAIL_ADJUSTMENTS)}

        {subPanel === 'hsl' && (
          <HSLPanel
            hsl={recipe.hsl}
            onChange={(channel, field, value) => {
              const updated = { ...recipe.hsl };
              updated[channel] = { ...updated[channel], [field]: value };
              setHSL(updated);
            }}
          />
        )}

        {subPanel === 'grade' && (
          <ColorGradePanel
            grade={recipe.colorGrade}
            onChange={(zone, field, value) => {
              const updated = { ...recipe.colorGrade };
              updated[zone] = { ...updated[zone], [field]: value };
              setColorGrade(updated);
            }}
            onBalanceChange={(balance) => {
              setColorGrade({ ...recipe.colorGrade, balance });
            }}
          />
        )}

        {subPanel === 'curves' && (
          <CurvePanel
            curves={recipe.curves}
            onChange={(channel, points) => {
              setCurves({ ...recipe.curves, [channel]: points });
            }}
          />
        )}

        {subPanel === 'filters' && (
          <PresetPanel
            activeFilter={recipe.activeFilter}
            onApply={(id, adjustments) => applyPreset(adjustments, id)}
          />
        )}
      </ScrollView>
    </View>
  );
}

function HSLPanel({
  hsl,
  onChange,
}: {
  hsl: import('../../core/types').HSLAdjustments;
  onChange: (
    channel: keyof import('../../core/types').HSLAdjustments,
    field: 'hue' | 'saturation' | 'luminance',
    value: number
  ) => void;
}) {
  const channels = Object.keys(hsl) as (keyof typeof hsl)[];
  const [active, setActive] = useState(channels[0]);
  const ch = hsl[active];

  const CHANNEL_COLORS: Record<string, string> = {
    red: '#FF3B30',
    orange: '#FF9500',
    yellow: '#FFCC00',
    green: '#34C759',
    aqua: '#5AC8FA',
    blue: '#007AFF',
    purple: '#AF52DE',
    magenta: '#FF2D55',
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        {channels.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.colorChip, active === c && { borderColor: CHANNEL_COLORS[c] }]}
            onPress={() => setActive(c)}
          >
            <View style={[styles.colorDot, { backgroundColor: CHANNEL_COLORS[c] }]} />
            <Text style={styles.colorChipText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Slider label="Hue" value={ch.hue} min={-100} max={100} onChange={(v) => onChange(active, 'hue', v)} />
      <Slider label="Saturation" value={ch.saturation} min={-100} max={100} onChange={(v) => onChange(active, 'saturation', v)} />
      <Slider label="Luminance" value={ch.luminance} min={-100} max={100} onChange={(v) => onChange(active, 'luminance', v)} />
    </View>
  );
}

function ColorGradePanel({
  grade,
  onChange,
  onBalanceChange,
}: {
  grade: import('../../core/types').ColorGrade;
  onChange: (
    zone: 'shadows' | 'midtones' | 'highlights',
    field: 'hue' | 'saturation' | 'luminance',
    value: number
  ) => void;
  onBalanceChange: (v: number) => void;
}) {
  const [zone, setZone] = useState<'shadows' | 'midtones' | 'highlights'>('shadows');
  const z = grade[zone];

  return (
    <View>
      <View style={styles.zoneRow}>
        {(['shadows', 'midtones', 'highlights'] as const).map((zName) => (
          <TouchableOpacity
            key={zName}
            style={[styles.zoneBtn, zone === zName && styles.zoneBtnActive]}
            onPress={() => setZone(zName)}
          >
            <Text style={[styles.zoneText, zone === zName && styles.zoneTextActive]}>
              {zName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Slider label="Hue" value={z.hue} min={-180} max={180} onChange={(v) => onChange(zone, 'hue', v)} />
      <Slider label="Saturation" value={z.saturation} min={-100} max={100} onChange={(v) => onChange(zone, 'saturation', v)} />
      <Slider label="Luminance" value={z.luminance} min={-100} max={100} onChange={(v) => onChange(zone, 'luminance', v)} />
      <Slider label="Balance" value={grade.balance} min={-100} max={100} onChange={onBalanceChange} />
    </View>
  );
}

function CurvePanel({
  curves,
  onChange,
}: {
  curves: import('../../core/types').CurveData;
  onChange: (channel: keyof import('../../core/types').CurveData, points: { x: number; y: number }[]) => void;
}) {
  const [channel, setChannel] = useState<keyof import('../../core/types').CurveData>('rgb');
  const pts = curves[channel];

  const presets = [
    { name: 'Linear', points: [{ x: 0, y: 0 }, { x: 255, y: 255 }] },
    { name: 'Brighten', points: [{ x: 0, y: 0 }, { x: 128, y: 160 }, { x: 255, y: 255 }] },
    { name: 'Darken', points: [{ x: 0, y: 0 }, { x: 128, y: 100 }, { x: 255, y: 255 }] },
    { name: 'S-Curve', points: [{ x: 0, y: 0 }, { x: 64, y: 48 }, { x: 192, y: 208 }, { x: 255, y: 255 }] },
  ];

  return (
    <View>
      <View style={styles.zoneRow}>
        {(['rgb', 'red', 'green', 'blue'] as const).map((ch) => (
          <TouchableOpacity
            key={ch}
            style={[styles.zoneBtn, channel === ch && styles.zoneBtnActive]}
            onPress={() => setChannel(ch)}
          >
            <Text style={[styles.zoneText, channel === ch && styles.zoneTextActive]}>
              {ch.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.curvePreview}>
        <Text style={styles.curveHint}>Curve: {pts.length} control points</Text>
      </View>
      {presets.map((p) => (
        <TouchableOpacity
          key={p.name}
          style={styles.presetRow}
          onPress={() => onChange(channel, p.points)}
        >
          <Text style={styles.presetName}>{p.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function PresetPanel({
  activeFilter,
  onApply,
}: {
  activeFilter: string | null;
  onApply: (id: string, adjustments: Partial<AdjustmentValues>) => void;
}) {
  const { FILTER_PRESETS, PRESET_PACKS } = require('../../assets/presets');
  const [pack, setPack] = useState('cinematic');

  const filtered = FILTER_PRESETS.filter(
    (p: { category: string }) => p.category.toLowerCase() === pack
  );

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        {PRESET_PACKS.map((p: { id: string; name: string; icon: string }) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.packChip, pack === p.id && styles.packChipActive]}
            onPress={() => setPack(p.id)}
          >
            <Text style={styles.packIcon}>{p.icon}</Text>
            <Text style={[styles.packText, pack === p.id && styles.packTextActive]}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {filtered.map((preset: { id: string; name: string; adjustments: Partial<AdjustmentValues> }) => (
        <TouchableOpacity
          key={preset.id}
          style={[styles.presetRow, activeFilter === preset.id && styles.presetRowActive]}
          onPress={() => onApply(preset.id, preset.adjustments)}
        >
          <Text style={styles.presetName}>{preset.name}</Text>
          {activeFilter === preset.id && <Text style={styles.activeBadge}>Active</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 280,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabs: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.accentGlow,
  },
  tabText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.accentLight,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  colorChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  zoneRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  zoneBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
  },
  zoneBtnActive: {
    backgroundColor: colors.accentGlow,
  },
  zoneText: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'capitalize',
  },
  zoneTextActive: {
    color: colors.accentLight,
  },
  curvePreview: {
    height: 80,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  curveHint: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  presetRowActive: {
    backgroundColor: colors.accentGlow,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  presetName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  activeBadge: {
    ...typography.micro,
    color: colors.accentLight,
  },
  packChip: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
  },
  packChipActive: {
    backgroundColor: colors.accentGlow,
  },
  packIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  packText: {
    ...typography.micro,
    color: colors.textTertiary,
  },
  packTextActive: {
    color: colors.accentLight,
  },
});
