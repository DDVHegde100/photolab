import { v4 as uuidv4 } from 'uuid';
import type { ImageRecipe, HistoryEntry } from './types';

const MAX_HISTORY = 50;

export class HistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private listeners: Set<() => void> = new Set();

  push(label: string, recipe: ImageRecipe): void {
    this.undoStack.push({
      id: uuidv4(),
      label,
      recipe: structuredClone(recipe),
      timestamp: Date.now(),
    });

    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }

    this.redoStack = [];
    this.notify();
  }

  undo(current: ImageRecipe): ImageRecipe | null {
    if (this.undoStack.length === 0) return null;

    const entry = this.undoStack.pop()!;
    this.redoStack.push({
      id: uuidv4(),
      label: entry.label,
      recipe: structuredClone(current),
      timestamp: Date.now(),
    });

    this.notify();
    return entry.recipe;
  }

  redo(current: ImageRecipe): ImageRecipe | null {
    if (this.redoStack.length === 0) return null;

    const entry = this.redoStack.pop()!;
    this.undoStack.push({
      id: uuidv4(),
      label: entry.label,
      recipe: structuredClone(current),
      timestamp: Date.now(),
    });

    this.notify();
    return entry.recipe;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getTimeline(): HistoryEntry[] {
    return [...this.undoStack];
  }

  getCurrentIndex(): number {
    return this.undoStack.length - 1;
  }

  scrubTo(index: number, current: ImageRecipe): ImageRecipe | null {
    if (index < 0 || index >= this.undoStack.length) return null;
    const entry = this.undoStack[index];
    const removed = this.undoStack.splice(index + 1);
    removed.forEach((e) => {
      this.redoStack.unshift({
        id: uuidv4(),
        label: e.label,
        recipe: structuredClone(current),
        timestamp: Date.now(),
      });
    });
    this.notify();
    return entry.recipe;
  }

  reset(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }
}

export const historyManager = new HistoryManager();
