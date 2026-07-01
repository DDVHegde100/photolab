import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { EditorScreen } from './src/screens/EditorScreen';
import { colors } from './src/ui/theme';

export default function App() {
  const [editing, setEditing] = useState(false);
  const { width } = useWindowDimensions();
  const openEditor = useCallback(() => setEditing(true), []);
  const closeEditor = useCallback(() => setEditing(false), []);

  const isDesktop = width >= 768;
  const shellWidth = isDesktop ? Math.min(480, width) : width;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={[styles.shell, isDesktop && styles.shellDesktop]}>
          <View style={[styles.appFrame, isDesktop && styles.appFrameDesktop, { width: shellWidth, maxWidth: shellWidth }]}>
            {editing ? (
              <EditorScreen onClose={closeEditor} />
            ) : (
              <HomeScreen onOpenEditor={openEditor} />
            )}
          </View>
        </View>
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
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  appFrameDesktop: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
