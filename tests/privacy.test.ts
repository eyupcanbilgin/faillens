import { it, expect } from "vitest";
import {
  redactHeaders,
  redactText,
  redactUrl,
  redactEvidence,
} from "../src/privacy/redact.js";
import { evidence } from "./helpers.js";
it.each([
  ["Authorization: Basic dXNlcjpwYXNz", "dXNlcjpwYXNz"],
  ["Proxy-Authorization: Bearer abcdef", "abcdef"],
  ["Cookie: session=topsecret; other=private", "topsecret"],
  ["Set-Cookie: session=private", "private"],
  ["Bearer abcdefgh", "abcdefgh"],
  ["access_token=private", "private"],
  ["refresh_token: private", "private"],
  ['password="private words"', "private words"],
  ["client_secret: private", "private"],
  ["session_id=private", "private"],
  ["api_key=private", "private"],
  ["eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl", "eyJhbGci"],
  ["alice@example.test", "alice@example.test"],
  ["https://host.test/a?token=private&q=hidden", "private"],
  ["/api?a=private", "private"],
  ["sk-proj-FAKE_EXAMPLE_NOT_A_REAL_KEY", "FAKE_EXAMPLE_NOT_A_REAL_KEY"],
  ["C:\\Users\\alice\\secret.txt", "alice"],
  ["\u001b[31mred\u001b[0m", "\u001b"],
])("redacts %s", (input, secret) =>
  expect(redactText(input)).not.toContain(secret),
);
it("redacts headers case-insensitively", () =>
  expect(
    redactHeaders({
      Authorization: "private",
      "x-api-key": "private",
      Accept: "json",
    }),
  ).toEqual({
    Authorization: "[REDACTED]",
    "x-api-key": "[REDACTED]",
    Accept: "json",
  }));
it("removes credentials, queries and fragments", () => {
  const s = redactUrl("https://user:pass@host.test/a?q=private#private");
  expect(s).not.toContain("private");
  expect(s).not.toContain("user");
  expect(redactUrl("http://[")).toBe("[REDACTED]");
});
it("is nonmutating and drops attachment metadata", () => {
  const e = evidence();
  e.title = "password=private";
  e.attachments = [{ id: "attachment-1", name: "secret.png" }];
  const r = redactEvidence(e);
  expect(e.title).toContain("private");
  expect(r.title).not.toContain("private");
  expect(r.attachments).toEqual([]);
});
it("covers optional normalized fields and rejects undeclared metadata", () => {
  const e = evidence();
  e.file = "";
  e.error!.stack = "password=private";
  e.steps = [{ id: "step-1", title: "password=private", status: "passed" }];
  e.consoleErrors = [
    { id: "console-1", text: "password=private", type: "error" },
    { id: "console-2", text: "safe" },
  ];
  e.networkFailures = [
    {
      id: "network-1",
      method: "GET",
      url: "/api",
      failureText: "password=private",
    },
    { id: "network-2", method: "GET", url: "/api" },
  ];
  const output = redactEvidence({
    ...e,
    metadata: { password: "undeclared-secret" },
  } as typeof e);
  expect(JSON.stringify(output)).not.toContain("private");
  expect(JSON.stringify(output)).not.toContain("undeclared-secret");
  expect(redactEvidence({ ...e, error: undefined }).error).toBeUndefined();
});
