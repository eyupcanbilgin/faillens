import { EventEmitter } from "node:events";
import type {
  Page,
  TestInfo,
  Request,
  Response,
  ConsoleMessage,
} from "@playwright/test";
import { it, expect } from "vitest";
import { collectEvidence } from "../src/adapters/playwright/collector.js";
import { CaptureSchema } from "../src/core/evidence.js";
it("bounds page events, removes listeners, and attaches once", async () => {
  const page = new EventEmitter();
  const info = { attachments: [] } as unknown as TestInfo;
  const collector = collectEvidence(page as unknown as Page);
  const request = {
    method: () => "POST",
    url: () => "https://demo.test/api?token=private",
    failure: () => ({ errorText: "ECONNREFUSED" }),
  } as Request;
  for (let i = 0; i < 45; i++) {
    page.emit("request", request);
    page.emit("requestfailed", request);
    page.emit("console", {
      type: () => "error",
      text: () => "password=private",
    } as ConsoleMessage);
  }
  page.emit("console", { type: () => "log" } as ConsoleMessage);
  page.emit("response", { status: () => 200 } as Response);
  page.emit("close");
  await collector.finish(info);
  await collector.finish(info);
  expect(info.attachments).toHaveLength(1);
  expect(page.eventNames()).toEqual([]);
  const body = info.attachments[0]!.body!.toString("utf8");
  expect(body).not.toContain("private");
  const capture = CaptureSchema.parse(JSON.parse(body));
  expect(capture.networkComplete).toBe(false);
  expect(capture.requestsObserved).toBe(45);
  expect(capture.networkFailures).toHaveLength(40);
  expect(capture.consoleErrors).toHaveLength(40);
});
