import {
  getPublicEnvVariables,
  getSessionTools,
} from "cyberstorm/security/publicEnvVariables";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { TicketList } from "@thunderstore/cyberstorm";
import { DapperTs } from "@thunderstore/dapper-ts";

export async function loader() {
  return { tickets: [] };
}

export async function clientLoader({ params }: LoaderFunctionArgs) {
  const sessionTools = getSessionTools();
  const dapper = new DapperTs(
    () => sessionTools.getConfig(),
    () => sessionTools.clearInvalidSession()
  );

  const tickets = await dapper.getTickets();
  const teamTickets = tickets.filter(
    (t: any) => t.team?.name === params.namespaceId
  );

  return { tickets: teamTickets };
}

clientLoader.hydrate = true;

export function HydrateFallback() {
  return <div>Loading tickets...</div>;
}

export default function TeamTickets() {
  const { tickets } = useLoaderData<typeof clientLoader>();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-thunderstore-gray-100">
          Team Tickets
        </h2>
      </div>
      <TicketList tickets={tickets} />
    </div>
  );
}
