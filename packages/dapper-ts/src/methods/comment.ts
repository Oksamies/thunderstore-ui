import { DapperInterface } from "@thunderstore/dapper";
import {
  commentDelete as commentDeleteApi,
  commentRestore as commentRestoreApi,
  getListingComments as getListingCommentsApi,
} from "@thunderstore/thunderstore-api";

import { getConfig } from "../config";

export const deleteComment: DapperInterface["deleteComment"] = async (uuid) => {
  const config = getConfig();
  await commentDeleteApi({
    config,
    params: { uuid },
    data: {},
    queryParams: {},
  });
};

export const restoreComment: DapperInterface["restoreComment"] = async (
  uuid
) => {
  const config = getConfig();
  await commentRestoreApi({
    config,
    params: { uuid },
    data: {},
    queryParams: {},
  });
};

export const getListingComments: DapperInterface["getListingComments"] = async (
  community,
  namespace,
  name
) => {
  const config = getConfig();
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
};
