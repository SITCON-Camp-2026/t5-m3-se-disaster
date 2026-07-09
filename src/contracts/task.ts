import { z } from "zod";
import { commonRecordSchema } from "./common.ts";

export const taskStatusSchema = z.enum([
  "draft",
  "needs_review",
  "open",
  "matching",
  "assigned",
  "fulfilled",
  "cancelled",
  "rejected",
]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const matchModeSchema = z.enum([
  "self_claim",
  "assigned",
  "hybrid",
  "locked",
]);
export type MatchMode = z.infer<typeof matchModeSchema>;

export const needTypeSchema = z.enum([
  "cleanup",
  "delivery",
  "repair",
  "care",
  "other",
]);

export const taskSchema = commonRecordSchema.extend({
  reportId: z.string().optional(),
  relatedSiteId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  needType: needTypeSchema,
  peopleNeeded: z.number().int().positive().optional(),
  peopleClaimed: z.number().int().min(0).optional(),
  status: taskStatusSchema,
  matchMode: matchModeSchema,
  requiredSkills: z.array(z.string()).optional(),
});
export type Task = z.infer<typeof taskSchema>;
export const tasksSchema = z.array(taskSchema);
