import type {
  ModerationStats,
  UserModerationCommunity,
} from "@thunderstore/dapper/types";
import {
  fetchGetModerationStats,
  fetchGetUserModeratedCommunities,
} from "@thunderstore/thunderstore-api";

import type { DapperTsInterface } from "../index";

export async function getModerationStats(
  this: DapperTsInterface
): Promise<ModerationStats> {
  const config = this.config;
  return await fetchGetModerationStats({
    config,
    data: {},
    params: {},
    queryParams: {},
  });
}

export async function getUserModeratedCommunities(
  this: DapperTsInterface
): Promise<UserModerationCommunity[]> {
  const config = this.config;
  return await fetchGetUserModeratedCommunities({
    config,
    data: {},
    params: {},
    queryParams: {},
  });
}
