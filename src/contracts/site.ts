import { z } from "zod";
import { commonRecordSchema } from "./common.ts";

export const siteStatusSchema = z.enum([
  "unknown",
  "reported_open",
  "reported_closed",
  "verified_open",
  "verified_closed",
  "needs_review",
]);
export type SiteStatus = z.infer<typeof siteStatusSchema>;

export const siteTypeSchema = z.enum([
  "supply",
  "shelter",
  "medical",
  "water",
  "toilet",
  "repair",
  "other",
]);

export const siteSchema = commonRecordSchema.extend({
  name: z.string().min(1),
  siteType: siteTypeSchema,
  addressText: z.string().optional(),
  area: z.string().optional(),
  status: siteStatusSchema,
  lastConfirmedAt: z.string().datetime().optional(),
});
export type Site = z.infer<typeof siteSchema>;
export const sitesSchema = z.array(siteSchema);

export const siteStatusReportSchema = commonRecordSchema.extend({
  siteId: z.string().min(1),
  suggestedStatus: siteStatusSchema,
  message: z.string().min(1),
  reportedByRole: z.string().min(1),
});
export type SiteStatusReport = z.infer<typeof siteStatusReportSchema>;
export const siteStatusReportsSchema = z.array(siteStatusReportSchema);
