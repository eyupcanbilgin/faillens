#!/usr/bin/env node
import { open, writeFile } from "node:fs/promises";
import { Command, Option } from "commander";
import { parseReport, MAX_REPORT_BYTES } from "./adapters/playwright/parser.js";
import { analyze } from "./core/analyzer.js";
import { render, type Format } from "./renderers.js";
import { startTelemetry } from "./telemetry.js";
import { OpenAITriageProvider } from "./providers/openai.js";
const program = new Command()
  .name("faillens")
  .description(
    "Evidence-first Playwright failure hypotheses. AI is off by default.",
  )
  .version("0.1.0");
program
  .command("analyze")
  .description(
    "Analyze failed attempts in a Playwright JSON report, including retry recoveries.",
  )
  .argument("<report>", "Path to a JSON reporter file (maximum 10 MiB)")
  .addOption(
    new Option("--ai <provider>", "Optional read-only AI enhancement")
      .choices(["off", "openai"])
      .default("off"),
  )
  .addOption(
    new Option("--format <format>", "Output encoding")
      .choices(["console", "json", "markdown"])
      .default("console"),
  )
  .option("--output <path>", "Write output to a file")
  .option("--max-failures <count>", "Maximum failures, from 1 to 100", "20")
  .option("--model <model>", "OpenAI model name", "gpt-4.1-mini")
  .option(
    "--telemetry",
    "Enable OTLP traces using standard OTEL configuration",
    false,
  )
  .action(
    async (
      path: string,
      options: {
        ai: string;
        format: Format;
        output?: string;
        maxFailures: string;
        model: string;
        telemetry: boolean;
      },
    ) => {
      const stop = await startTelemetry(options.telemetry);
      try {
        const limit = Number(options.maxFailures);
        if (!Number.isInteger(limit) || limit < 1 || limit > 100)
          throw new Error("max-failures must be an integer from 1 to 100");
        if (options.ai === "openai" && !process.env.OPENAI_API_KEY)
          throw new Error(
            "AI mode requires OPENAI_API_KEY. Use --ai off for local diagnostics.",
          );
        const file = await open(path, "r").catch(() => {
          throw new Error(
            "Cannot open report. Check the path and enable the Playwright JSON reporter.",
          );
        });
        let raw: string;
        try {
          const stat = await file.stat();
          if (!stat.isFile() || stat.size > MAX_REPORT_BYTES)
            throw new Error(
              "Input must be a regular JSON file of at most 10 MiB",
            );
          const buffer = Buffer.alloc(MAX_REPORT_BYTES + 1);
          let length = 0;
          while (length < buffer.length) {
            const { bytesRead } = await file.read(
              buffer,
              length,
              buffer.length - length,
              null,
            );
            if (!bytesRead) break;
            length += bytesRead;
          }
          if (length > MAX_REPORT_BYTES)
            throw new Error("Report exceeds 10 MiB");
          raw = buffer.subarray(0, length).toString("utf8");
        } finally {
          await file.close();
        }
        const failures = parseReport(raw, limit);
        if (failures.length === limit)
          process.stderr.write(
            "FailLens reached the failure limit; additional failures may be omitted.\n",
          );
        const provider =
          options.ai === "openai"
            ? new OpenAITriageProvider(options.model)
            : undefined;
        const analyses = [];
        for (const failure of failures)
          analyses.push(await analyze(failure, provider));
        const output = render(analyses, options.format);
        if (options.output)
          await writeFile(options.output, output).catch(() => {
            throw new Error(
              "Cannot write output. Check the destination directory and permissions.",
            );
          });
        else process.stdout.write(output);
      } finally {
        await stop();
      }
    },
  );
program.parseAsync().catch((error: unknown) => {
  process.stderr.write(
    `FailLens: ${error instanceof Error ? error.message : "Analysis failed"}\n`,
  );
  process.exitCode = 1;
});
