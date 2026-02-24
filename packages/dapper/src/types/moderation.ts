export interface ModerationStats {
  pending_package_reviews: number;
  open_tickets: number;
}

export interface UserModerationCommunity {
  name: string;
  identifier: string;
  short_description: string | null;
  description: string | null;
  discord_url: string | null;
  wiki_url: string | null;
  datetime_created: string;
  background_image_url: string | null;
  hero_image_url: string | null;
  cover_image_url: string | null;
  icon_url: string | null;
  community_icon_url: string | null;
  total_download_count: number;
  total_package_count: number;
  has_mod_manager_support: boolean;
  is_listed: boolean;
}
