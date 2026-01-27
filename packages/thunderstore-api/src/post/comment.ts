import { apiFetch } from "../apiFetch";
import type { ApiEndpointProps } from "../index";
import type { CommentRequestParams } from "../schemas/requestSchemas";

export function commentRestore(
  props: ApiEndpointProps<CommentRequestParams, object, object>
): Promise<undefined> {
  const { config, params } = props;
  const path = `/api/cyberstorm/comments/${params.uuid}/restore/`;

  return apiFetch({
    args: {
      config,
      path,
      request: {
        method: "POST",
      },
      useSession: true,
    },
    requestSchema: undefined,
    queryParamsSchema: undefined,
    responseSchema: undefined,
  });
}
