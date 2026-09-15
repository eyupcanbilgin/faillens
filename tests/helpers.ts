import { parseReport } from "../src/adapters/playwright/parser.js";
export function report(
  result: Record<string, unknown> = {
    status: "failed",
    retry: 0,
    error: { message: "assertion failed" },
  },
  extra: Record<string, unknown> = {},
) {
  return JSON.stringify({
    suites: [
      {
        title: "checkout",
        specs: [
          {
            title: "creates an order",
            file: "checkout.spec.ts",
            tests: [{ results: [result], ...extra }],
          },
        ],
      },
    ],
  });
}
export const evidence = () => parseReport(report())[0]!;
