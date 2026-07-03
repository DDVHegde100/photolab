import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { EditorScreen } from './src/screens/EditorScreen';
import { ErrorBoundary } from './src/ui/components/ErrorBoundary';
import { colors, spacing, typography } from './src/ui/theme';

export default function App() {
  const [editing, setEditing] = useState(false);
  const { width } = useWindowDimensions();
  const openEditor = useCallback(() => setEditing(true), []);
  const closeEditor = useCallback(() => setEditing(false), []);

  const isDesktop = width >= 768;
  const shellWidth = isDesktop ? Math.min(editing ? 1120 : 980, width) : width;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <StatusBar style="light" />
          <View style={[styles.shell, isDesktop && styles.shellDesktop]}>
            <View
              style={[
                styles.appFrame,
                isDesktop && styles.appFrameDesktop,
                { width: shellWidth, maxWidth: shellWidth },
              ]}
            >
              {isDesktop && !editing && (
                <View style={styles.brandPane}>
                  <Text style={styles.badge}>Local-first photo editor</Text>
                  <Text style={styles.hero}>Private, polished edits from your browser.</Text>
                  <Text style={styles.copy}>
                    PhotoLab keeps originals on your device, applies non-destructive recipes, and
                    exports finished images without accounts or uploads.
                  </Text>
                  <View style={styles.featureGrid}>
                    <Text style={styles.feature}>Offline adjustments</Text>
                    <Text style={styles.feature}>Canvas web export</Text>
                    <Text style={styles.feature}>Algorithmic upscale</Text>
                    <Text style={styles.feature}>No cloud processing</Text>
                  </View>
                </View>
              )}
              <View style={styles.productPane}>
                {editing ? (
                  <EditorScreen onClose={closeEditor} />
                ) : (
                  <HomeScreen onOpenEditor={openEditor} />
                )}
              </View>
            </View>
          </View>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  shell: {
    flex: 1,
  },
  shellDesktop: {
    alignItems: 'center',
    backgroundColor: '#050508',
  },
  appFrame: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  appFrameDesktop: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  brandPane: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxxl,
    borderRightWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#08080d',
  },
  productPane: {
    flex: 1,
    minWidth: 0,
  },
  badge: {
    ...typography.micro,
    color: colors.accentLight,
    textTransform: 'uppercase',
    marginBottom: spacing.lg,
  },
  hero: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1.2,
    marginBottom: spacing.lg,
  },
  copy: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 23,
    marginBottom: spacing.xl,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  feature: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
