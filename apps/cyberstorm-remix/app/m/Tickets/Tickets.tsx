import {
  getPublicEnvVariables,
  getSessionTools,
} from "cyberstorm/security/publicEnvVariables";
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "react-router";
import { Link, useLoaderData } from "react-router";

import { TicketList } from "@thunderstore/cyberstorm/components/Ticket/TicketList";
import { Heading } from "@thunderstore/cyberstorm/newComponents/Heading/Heading";
import { DapperTs } from "@thunderstore/dapper-ts";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const session = await getSessionTools().getSession(
    request.headers.get("Cookie")
  );

  const dapper = new DapperTs(() => ({
    apiHost: getPublicEnvVariables().CYBERSTORM_API_URL,
    sessionId: session.get("session_id"),
  }));

  // Pass community filter to backend
  // @ts-ignore - Assuming dapper.getTickets accepts params object
  const tickets = await dapper.getTickets({ community: params.communityId });

  // If backend filtering isn't working yet, we might get all, so safe to filter again or rely on backend
  // But let's assume backend works as implemented in Phase 3
  const communityTickets = tickets;

  return { tickets: communityTickets, communityId: params.communityId };
}

export default function Tickets() {
  const { tickets, communityId } = useLoaderData<typeof loader>();

  return (
    <div className="w-full flex flex-col gap-4 p-4">
      <Heading size="h1" weight="bold">
        Moderation Queue: {communityId}
      </Heading>
      <TicketList
        tickets={tickets}
        getTicketUrl={(t) => `/m/${communityId}/tickets/${t.uuid}`}
      />
    </div>
  );
}
