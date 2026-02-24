import { z } from "zod";

export const moderationStatsSchema = z.object({
  pending_package_reviews: z.number(),
  open_tickets: z.number(),
});

export type ModerationStats = z.infer<typeof moderationStatsSchema>;

export const userModerationCommunitySchema = z.object({
  name: z.string(),
  identifier: z.string(),
  short_description: z.string().nullable(),
  description: z.string().nullable(),
  discord_url: z.string().nullable(),
  wiki_url: z.string().nullable(),
  datetime_created: z.string(),
  background_image_url: z.string().nullable(),
  hero_image_url: z.string().nullable(),
  cover_image_url: z.string().nullable(),
  icon_url: z.string().nullable(),
  community_icon_url: z.string().nullable(),
  total_download_count: z.number(),
  total_package_count: z.number(),
  has_mod_manager_support: z.boolean(),
  is_listed: z.boolean(),
});

export type UserModerationCommunity = z.infer<
  typeof userModerationCommunitySchema
>;
