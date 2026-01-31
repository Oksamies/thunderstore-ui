import { z } from "zod";

import { apiFetch } from "../apiFetch";
import type { ApiEndpointProps } from "../index";
import { CommentSchema } from "../schemas/comment";
import type {
  ListingCommentCreateRequestData,
  ListingCommentCreateRequestParams,
} from "../schemas/requestSchemas";

const responseSchema = CommentSchema;

export function createListingComment(
  props: ApiEndpointProps<
    ListingCommentCreateRequestParams,
    object,
    ListingCommentCreateRequestData
  >
): Promise<z.infer<typeof responseSchema>> {
  const { config, params, data } = props;
  const path = `/api/cyberstorm/listing/${params.community_id}/${params.namespace_id}/${params.package_name}/comments/`;

  return apiFetch({
    args: {
      config,
      path,
      request: {
        method: "POST",
        body: JSON.stringify(data),
      },
      useSession: true,
    },
    requestSchema: undefined,
    queryParamsSchema: undefined,
    responseSchema,
  });
}
