import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getPublicEnvVariables,
  getSessionTools,
} from "cyberstorm/security/publicEnvVariables";
import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import {
  Heading,
  NewButton,
  NewIcon,
  TicketList,
} from "@thunderstore/cyberstorm";
import { DapperTs } from "@thunderstore/dapper-ts";
import type { Ticket } from "@thunderstore/dapper/types";

import "../Dashboard.css";

export async function loader({ params }: LoaderFunctionArgs) {
  return { tickets: [], communityId: params.communityId };
}

export async function clientLoader({ params }: LoaderFunctionArgs) {
  const sessionTools = getSessionTools();
  const dapper = new DapperTs(
    () => sessionTools.getConfig(),
    () => sessionTools.clearInvalidSession()
  );

  const communityId = params.communityId;
  const tickets = communityId
    ? await dapper.getCommunityTickets(communityId)
    : [];

  return { tickets, communityId };
}

clientLoader.hydrate = true;

export function HydrateFallback() {
  return (
    <div className="dashboard-root">
      <div className="dashboard-header">
        <Heading csLevel="1">Loading tickets...</Heading>
      </div>
    </div>
  );
}

export default function Tickets() {
  const { tickets, communityId } = useLoaderData<typeof clientLoader>();

  return (
    <div className="dashboard-root">
      <div className="dashboard-header">
        <div className="flex items-center gap-4">
          <NewButton
            primitiveType="cyberstormLink"
            linkId="ModerationDashboard"
            csSize="small"
            csVariant="secondary"
          >
            <NewIcon csMode="inline" noWrapper>
              <FontAwesomeIcon icon={faArrowLeft} />
            </NewIcon>
            Back to Dashboard
          </NewButton>
        </div>
        <Heading csLevel="1">Moderation Queue: {communityId}</Heading>
        <p className="dashboard-header__description">
          Managing tickets specifically for {communityId}.
        </p>
      </div>

      <div className="dashboard-section">
        <TicketList tickets={tickets} />
      </div>
    </div>
  );
}
