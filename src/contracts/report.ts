import { z } from "zod";
import { commonRecordSchema } from "./common.ts";

export const reportTypeSchema = z.enum([
  "human_need",
  "supply_need",
  "site_update",
  "task_update",
  "unknown",
]);
export type ReportType = z.infer<typeof reportTypeSchema>;

export const reportSchema = commonRecordSchema.extend({
  reportType: reportTypeSchema,
  rawText: z.string().min(1),
  locationText: z.string().optional(),
  reporterRole: z.string().min(1),
  subjectRole: z.string().optional(),
  needsManualReview: z.boolean(),
  relatedTaskId: z.string().optional(),
  relatedSiteId: z.string().optional(),
});
export type Report = z.infer<typeof reportSchema>;
export const reportsSchema = z.array(reportSchema);
