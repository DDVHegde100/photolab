export enum ImpactFeedbackStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
}

export function selectionHaptic(): void {}

export function impactHaptic(_style?: ImpactFeedbackStyle): void {}
