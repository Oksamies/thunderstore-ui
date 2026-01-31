import { z } from "zod";

export const CommentSchema = z.object({
  uuid: z.string().uuid(),
  parent: z.string().uuid().nullable().optional(),
  author: z.object({
    username: z.string(),
    avatar: z.string().nullable(),
  }),
  body: z.string(),
  is_internal: z.boolean(),
  is_deleted: z.boolean(),
  datetime_created: z.string(),
  datetime_updated: z.string(),
});

export const CommentCreateSchema = z.object({
  parent: z.string().uuid().optional(),
  body: z.string().min(1),
  is_internal: z.boolean().optional(),
});

export type Comment = z.infer<typeof CommentSchema>;
export type CommentCreate = z.infer<typeof CommentCreateSchema>;
