import "@testing-library/jest-dom";

jest.mock("next/font/google", () => ({
  Geist: () => ({
    className: "mock-geist-font",
    variable: "--font-geist-sans",
    style: { fontFamily: "mock-geist" },
  }),
}));

export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue(mockRouter),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
  useParams: jest.fn(),
  useSelectedLayoutSegment: jest.fn(),
}));

jest.mock("~/env", () => ({
  env: {
    NODE_ENV: "test",
    AUTH_SECRET: "test-secret",
    AUTH_DISCORD_ID: "test-discord-id",
    AUTH_DISCORD_SECRET: "test-discord-secret",
    AUTH_GOOGLE_ID: "test-google-id",
    AUTH_GOOGLE_SECRET: "test-google-secret",
    CI: "false",
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    SUPABASE_SECRET_KEY: "test-supabase-secret",
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  },
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

document.elementFromPoint = jest.fn().mockReturnValue(null);
