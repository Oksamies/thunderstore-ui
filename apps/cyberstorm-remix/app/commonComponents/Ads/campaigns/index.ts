import type { AdCampaign } from "../adCampaign";

/**
 * The campaigns that are live, in priority order — the first one whose
 * pathPrefixes match a path takes it over. Adding a campaign is a one-line
 * change here plus a file beside this one; removing one at the end of its flight
 * is the same line, and the slots go back to the ad network on their own.
 */
export const CAMPAIGNS: readonly AdCampaign[] = [];
