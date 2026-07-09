import { z } from "zod";
import { commonRecordSchema } from "./common.ts";

export const assignmentStatusSchema = z.enum([
  "requested",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
]);

export const assignmentSchema = commonRecordSchema.extend({
  taskId: z.string().min(1),
  volunteerGroupId: z.string().min(1),
  peopleCount: z.number().int().positive(),
  status: assignmentStatusSchema,
  decidedByRole: z.string().optional(),
  decisionReason: z.string().optional(),
});
export type Assignment = z.infer<typeof assignmentSchema>;
export const assignmentsSchema = z.array(assignmentSchema);
