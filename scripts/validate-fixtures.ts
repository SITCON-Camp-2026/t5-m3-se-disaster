import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import {
  assignmentsSchema,
  reportsSchema,
  siteStatusReportsSchema,
  sitesSchema,
  tasksSchema,
} from "../src/contracts/index.ts";
import { parseFixture } from "../src/lib/load-fixture.ts";

const validations: Array<readonly [string, z.ZodType<unknown>]> = [
  ["src/fixtures/shared/reports.json", reportsSchema],
  ["src/fixtures/shared/sites.json", sitesSchema],
  ["src/fixtures/shared/site-status-reports.json", siteStatusReportsSchema],
  ["src/fixtures/shared/tasks.json", tasksSchema],
  ["src/fixtures/shared/assignments.json", assignmentsSchema],
] as const;

let failed = false;

for (const [path, schema] of validations) {
  const absolute = join(process.cwd(), path);
  if (!existsSync(absolute)) {
    console.error(`Missing fixture: ${path}`);
    failed = true;
    continue;
  }
  const data = JSON.parse(readFileSync(absolute, "utf8"));
  try {
    parseFixture(schema, data, path);
    console.log(`Valid fixture: ${path}`);
  } catch (error) {
    failed = true;
    console.error(
      error instanceof Error ? error.message : `Invalid fixture: ${path}`,
    );
  }
}

if (failed) process.exit(1);
