import { z } from "zod";

export const ticketUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email().optional(),
  avatar: z.string().url().optional().nullable(),
});

export const ticketStatusSchema = z.enum([
  "open",
  "user_replied",
  "mod_replied",
  "resolved",
  "closed",
]);

export const ticketMessageSchema = z.object({
  uuid: z.string().uuid(),
  author: ticketUserSchema.optional().nullable(),
  content: z.string().min(1),
  created_at: z.string().datetime(),
});

export const ticketNoteSchema = z.object({
  uuid: z.string().uuid(),
  author: ticketUserSchema.optional().nullable(),
  content: z.string().min(1),
  created_at: z.string().datetime(),
});

export const ticketSchema = z.object({
  uuid: z.string().uuid(),
  listing: z
    .object({
      package_name: z.string(),
      namespace: z.string(),
      community: z.string(),
    })
    .optional()
    .nullable(),
  community: z
    .object({
      identifier: z.string(),
      name: z.string(),
    })
    .optional()
    .nullable(),
  team: z
    .object({
      name: z.string(),
    })
    .optional()
    .nullable(),
  status: ticketStatusSchema,
  created_by: ticketUserSchema.optional().nullable(),
  created_at: z.string().datetime(),
  last_updated: z.string().datetime(),
  messages: z.array(ticketMessageSchema),
  notes: z.array(ticketNoteSchema).optional(),
});

export type Ticket = z.infer<typeof ticketSchema>;
export type TicketMessage = z.infer<typeof ticketMessageSchema>;
export type TicketNote = z.infer<typeof ticketNoteSchema>;
export type TicketStatus = z.infer<typeof ticketStatusSchema>;

export const ticketCreateSchema = z.object({
  content: z.string().min(1),
});

export const ticketStatusUpdateSchema = z.object({
  status: ticketStatusSchema,
});
