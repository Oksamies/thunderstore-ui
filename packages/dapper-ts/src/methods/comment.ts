import { DapperInterface } from "@thunderstore/dapper";
import {
  commentDelete as commentDeleteApi,
  commentRestore as commentRestoreApi,
  createListingComment as createListingCommentApi,
  getListingComments as getListingCommentsApi,
} from "@thunderstore/thunderstore-api";

import { DapperTsInterface } from "../index";

export async function deleteComment(
  this: DapperTsInterface,
  uuid: string
): ReturnType<DapperInterface["deleteComment"]> {
  const config = this.config();
  await commentDeleteApi({
    config,
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
    config,
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
  return await getListingCommentsApi({
    config,
    params: {
      community_id: community,
      namespace_id: namespace,
      package_name: name,
    },
    data: {},
    queryParams: {},
  });
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
  return await createListingCommentApi({
    config,
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
}
