import '@testing-library/jest-dom';

// Mock IndexedDB for tests
import { vi } from 'vitest';

// Simple mock for IDB operations in tests
vi.mock('idb', () => ({
  openDB: vi.fn(),
}));
