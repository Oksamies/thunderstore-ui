import { getSessionTools } from "cyberstorm/security/publicEnvVariables";
import { useLoaderData } from "react-router";

import { Heading, NewButton } from "@thunderstore/cyberstorm";
import { DapperTs } from "@thunderstore/dapper-ts";
import type { UserModerationCommunity } from "@thunderstore/dapper/types";

import "./Dashboard.css";

export async function loader() {
  return {};
}

export async function clientLoader() {
  const sessionTools = getSessionTools();
  const dapper = new DapperTs(
    () => sessionTools.getConfig(),
    () => sessionTools.clearInvalidSession()
  );

  const userCommunities = await dapper.getUserModeratedCommunities();

  return { userCommunities };
}

clientLoader.hydrate = true;

export function HydrateFallback() {
  return (
    <div className="dashboard-root">
      <div className="dashboard-header">
        <Heading csLevel="1">Moderation Dashboard</Heading>
        <p className="dashboard-header__description">
          Unified queue for all communities you moderate.
        </p>
      </div>
      <div>Loading dashboard data...</div>
    </div>
  );
}

function CommunityModCard({
  community,
}: {
  community: UserModerationCommunity;
}) {
  return (
    <div className="community-card">
      <div className="community-card__header">
        <div className="community-card__title">{community.name}</div>
        <div className="community-card__count">
          {community.total_package_count} packages
        </div>
      </div>
      <div className="community-card__actions">
        <NewButton
          primitiveType="cyberstormLink"
          linkId="CommunityModeration"
          community={community.identifier}
          csSize="small"
          csVariant="primary"
          className="flex-1 w-full"
        >
          Tickets
        </NewButton>
        <NewButton
          primitiveType="cyberstormLink"
          linkId="CommunityModerationReviews"
          community={community.identifier}
          csSize="small"
          csVariant="secondary"
          className="flex-1 w-full"
        >
          Reviews
        </NewButton>
        <NewButton
          primitiveType="cyberstormLink"
          linkId="CommunityModerationComments"
          community={community.identifier}
          csSize="small"
          csVariant="secondary"
          className="flex-1 w-full"
        >
          Comments
        </NewButton>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { userCommunities } = useLoaderData<typeof clientLoader>() as {
    userCommunities: UserModerationCommunity[];
  };

  return (
    <div className="dashboard-root">
      <div className="dashboard-header">
        <Heading csLevel="1">Moderation Center</Heading>
        <p className="dashboard-header__description">
          Overview of your moderation responsibilities. Manage disputes, review
          packages, and access tools for your communities.
        </p>
      </div>

      <div className="dashboard-section">
        <Heading csLevel="2">My Moderated Communities</Heading>
        {userCommunities.length > 0 ? (
          <div className="community-grid">
            {userCommunities.map((c) => (
              <CommunityModCard key={c.identifier} community={c} />
            ))}
          </div>
        ) : (
          <div className="dashboard-empty-state">
            <p>You do not have moderation permissions for any communities.</p>
          </div>
        )}
      </div>
    </div>
  );
}
