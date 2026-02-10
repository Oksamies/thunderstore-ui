import type { DapperInterface } from "@thunderstore/dapper";
import {
  commentDelete as commentDeleteApi,
  commentRestore as commentRestoreApi,
  createListingComment as createListingCommentApi,
  getListingComments as getListingCommentsApi,
} from "@thunderstore/thunderstore-api";

import type { DapperTsInterface } from "../index";

export async function deleteComment(
  this: DapperTsInterface,
  uuid: string
): ReturnType<DapperInterface["deleteComment"]> {
  const config = this.config();
  await commentDeleteApi({
    config: () => config,
    params: { uuid },
    data: {},
    queryParams: {},
  });
}

export async function restoreComment(
  this: DapperTsInterface,
  uuid: string
): ReturnType<DapperInterface["restoreComment"]> {
  const config = this.config();
  await commentRestoreApi({
    config: () => config,
    params: { uuid },
    data: {},
    queryParams: {},
  });
}

export async function getListingComments(
  this: DapperTsInterface,
  community: string,
  namespace: string,
  name: string
): ReturnType<DapperInterface["getListingComments"]> {
  const config = this.config();
  const result = await getListingCommentsApi({
    config: () => config,
    params: {
      community_id: community,
      namespace_id: namespace,
      package_name: name,
    },
    data: {},
    queryParams: {},
  });
  return result.map((c) => ({
    ...c,
    author: {
      ...c.author,
      avatar: c.author.avatar ?? null,
    },
  }));
}

export async function createListingComment(
  this: DapperTsInterface,
  community: string,
  namespace: string,
  name: string,
  body: string,
  parent?: string,
  is_internal?: boolean
): ReturnType<DapperInterface["createListingComment"]> {
  const config = this.config();
  const result = await createListingCommentApi({
    config: () => config,
    params: {
      community_id: community,
      namespace_id: namespace,
      package_name: name,
    },
    data: {
      body,
      parent,
      is_internal,
    },
    queryParams: {},
  });
  return {
    ...result,
    author: {
      ...result.author,
      avatar: result.author.avatar ?? null,
    },
  };
}
