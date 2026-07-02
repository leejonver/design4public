import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Vitest 환경에서만 사용되도록 보호
if (!globalThis.fetch && typeof process !== "undefined" && process.env.VITEST) {
  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const { default: fetch } = await import("node-fetch");
    return fetch(
      input as unknown as Parameters<typeof fetch>[0],
      init as unknown as Parameters<typeof fetch>[1],
    ) as unknown as Promise<Response>;
  };
}

// Admin component test mocks (ported from CMS jest.setup.js).
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
// @ts-expect-error test env stub
global.localStorage = localStorageMock;

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";

if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
