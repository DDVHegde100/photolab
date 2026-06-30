import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOP_BAR_HEIGHT = 52;
const HISTORY_HEIGHT = 56;
const TOOLBAR_HEIGHT = 64;
const PANEL_HEIGHT_RATIO = 0.26;
const MIN_CANVAS_HEIGHT = 180;
const MAX_PANEL_HEIGHT = 240;

export interface EditorLayout {
  screenWidth: number;
  screenHeight: number;
  canvasHeight: number;
  panelMaxHeight: number;
  topBarHeight: number;
  historyHeight: number;
  toolbarHeight: number;
}

export function useEditorLayout(): EditorLayout {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const panelMaxHeight = Math.min(MAX_PANEL_HEIGHT, height * PANEL_HEIGHT_RATIO);
    const chromeHeight =
      insets.top +
      TOP_BAR_HEIGHT +
      HISTORY_HEIGHT +
      panelMaxHeight +
      TOOLBAR_HEIGHT +
      insets.bottom +
      16;

    const canvasHeight = Math.max(MIN_CANVAS_HEIGHT, height - chromeHeight);

    return {
      screenWidth: width,
      screenHeight: height,
      canvasHeight,
      panelMaxHeight,
      topBarHeight: TOP_BAR_HEIGHT,
      historyHeight: HISTORY_HEIGHT,
      toolbarHeight: TOOLBAR_HEIGHT,
    };
  }, [width, height, insets.top, insets.bottom]);
}
