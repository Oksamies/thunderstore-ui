import { z } from "zod";

import { apiFetch } from "../apiFetch";
import type { ApiEndpointProps } from "../index";
import { CommentSchema } from "../schemas/comment";
import type { PackageDependantsListingsRequestParams } from "../schemas/requestSchemas";

const responseSchema = z.array(CommentSchema);

export function getListingComments(
  props: ApiEndpointProps<
    PackageDependantsListingsRequestParams,
    object,
    object
  >
): Promise<z.infer<typeof responseSchema>> {
  const { config, params } = props;
  const path = `/api/cyberstorm/listing/${params.community_id}/${params.namespace_id}/${params.package_name}/comments/`;

  return apiFetch({
    args: {
      config,
      path,
      request: {
        method: "GET",
      },
      useSession: true, // Assuming auth might be needed or harmless
    },
    requestSchema: undefined,
    queryParamsSchema: undefined,
    responseSchema,
  });
}
