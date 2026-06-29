import * as Haptics from 'expo-haptics';

export function selectionHaptic(): void {
  Haptics.selectionAsync();
}

export function impactHaptic(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light): void {
  Haptics.impactAsync(style);
}

export { ImpactFeedbackStyle } from 'expo-haptics';
