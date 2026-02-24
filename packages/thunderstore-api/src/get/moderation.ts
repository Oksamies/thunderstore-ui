import { z } from "zod";

import { apiFetch } from "../apiFetch";
import type { ApiEndpointProps } from "../index";
import {
  type ModerationStats,
  type UserModerationCommunity,
  moderationStatsSchema,
  userModerationCommunitySchema,
} from "../schemas/moderation";

export async function fetchGetModerationStats(
  props: ApiEndpointProps<object, object, object>
): Promise<ModerationStats> {
  const { config } = props;
  const path = "api/cyberstorm/user/moderation-stats/";

  return await apiFetch({
    args: {
      config,
      path,
      useSession: true,
    },
    requestSchema: undefined,
    queryParamsSchema: undefined,
    responseSchema: moderationStatsSchema,
  });
}

export async function fetchGetUserModeratedCommunities(
  props: ApiEndpointProps<object, object, object>
): Promise<UserModerationCommunity[]> {
  const { config } = props;
  const path = "api/cyberstorm/user/communities/";

  return await apiFetch({
    args: {
      config,
      path,
      useSession: true,
    },
    requestSchema: undefined,
    queryParamsSchema: undefined,
    responseSchema: z.array(userModerationCommunitySchema),
  });
}
