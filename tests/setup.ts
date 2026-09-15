import { vi } from "vitest";
// Default tests cannot accidentally contact a model via fetch.
vi.stubGlobal(
  "fetch",
  vi.fn(() => {
    throw new Error("External network disabled in default tests");
  }),
);
