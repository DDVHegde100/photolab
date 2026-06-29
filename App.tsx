import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { EditorScreen } from './src/screens/EditorScreen';
import { colors } from './src/ui/theme';

export default function App() {
  const [editing, setEditing] = useState(false);
  const openEditor = useCallback(() => setEditing(true), []);
  const closeEditor = useCallback(() => setEditing(false), []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {editing ? (
          <EditorScreen onClose={closeEditor} />
        ) : (
          <HomeScreen onOpenEditor={openEditor} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
