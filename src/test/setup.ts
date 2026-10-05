import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
});

if (typeof window !== 'undefined') {
  window.alert = vi.fn();
  window.confirm = vi.fn(() => true);
  if (window.HTMLElement) {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  }
}
