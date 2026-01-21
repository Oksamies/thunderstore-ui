import {
  getPublicEnvVariables,
  getSessionTools,
} from "cyberstorm/security/publicEnvVariables";
import { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { TicketList } from "@thunderstore/cyberstorm/components/Ticket/TicketList";
import { DapperTs } from "@thunderstore/dapper-ts";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await getSessionTools().getSession(
    request.headers.get("Cookie")
  );
  const dapper = new DapperTs(() => ({
    apiHost: getPublicEnvVariables().CYBERSTORM_API_URL,
    sessionId: session.get("session_id"),
  }));

  // TODO: Update backend to support filtering by Team/Namespace efficiently.
  // For now, this might return an empty list or requires backend support for `package__namespace`
  // passing params.namespaceId (which is the team name)
  const tickets = await dapper.getTickets({
    // @ts-ignore - Assuming backend might accept this or we add it later
    package__namespace: params.namespaceId,
  });

  return { tickets };
}

export default function TeamTickets() {
  const { tickets } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-thunderstore-gray-100">
          Team Tickets
        </h2>
      </div>
      <TicketList tickets={tickets.results} />
    </div>
  );
}
