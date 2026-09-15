import type {
  Page,
  TestInfo,
  ConsoleMessage,
  Request,
  Response,
} from "@playwright/test";
import type { Capture } from "../../core/evidence.js";
import { redactText, redactUrl } from "../../privacy/redact.js";

/** Call after navigation and before the interaction being investigated.
 * Call finish() in finally while the page is still open. Captures this page only.
 */
export function collectEvidence(page: Page): {
  finish: (testInfo: TestInfo) => Promise<void>;
} {
  const capture: Capture = {
    version: 1,
    networkComplete: true,
    requestsObserved: 0,
    consoleErrors: [],
    networkFailures: [],
  };
  let finished = false;
  const text = (s: string) => redactText(s).slice(0, 4000);
  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    if (capture.consoleErrors.length < 40)
      capture.consoleErrors.push({ type: "error", text: text(msg.text()) });
  };
  const onRequest = () => {
    capture.requestsObserved++;
  };
  const add = (request: Request, status?: number, failureText?: string) => {
    if (capture.networkFailures.length >= 40) {
      capture.networkComplete = false;
      return;
    }
    capture.networkFailures.push({
      method: request.method(),
      url: text(redactUrl(request.url())),
      ...(status ? { status } : {}),
      ...(failureText ? { failureText: text(failureText) } : {}),
    });
  };
  const onResponse = (response: Response) => {
    if (response.status() >= 400) add(response.request(), response.status());
  };
  const onFailed = (request: Request) =>
    add(request, undefined, request.failure()?.errorText ?? "Request failed");
  const onClose = () => {
    capture.networkComplete = false;
  };
  page.on("console", onConsole);
  page.on("request", onRequest);
  page.on("response", onResponse);
  page.on("requestfailed", onFailed);
  page.on("close", onClose);
  return {
    async finish(testInfo: TestInfo) {
      if (finished) return;
      finished = true;
      page.off("console", onConsole);
      page.off("request", onRequest);
      page.off("response", onResponse);
      page.off("requestfailed", onFailed);
      page.off("close", onClose);
      // Inline body intentionally avoids following arbitrary paths in a later report.
      testInfo.attachments.push({
        name: "faillens-evidence-v1",
        contentType: "application/json",
        body: Buffer.from(JSON.stringify(capture)),
      });
    },
  };
}
