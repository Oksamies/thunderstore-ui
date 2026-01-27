import { apiFetch } from "../apiFetch";
import type { ApiEndpointProps } from "../index";
import type { CommentRequestParams } from "../schemas/requestSchemas";

export function commentDelete(
  props: ApiEndpointProps<CommentRequestParams, object, object>
): Promise<undefined> {
  const { config, params } = props;
  const path = `/api/cyberstorm/comments/${params.uuid}/`;

  return apiFetch({
    args: {
      config,
      path,
      request: {
        method: "DELETE",
      },
      useSession: true,
    },
    requestSchema: undefined,
    queryParamsSchema: undefined,
    responseSchema: undefined,
  });
}
