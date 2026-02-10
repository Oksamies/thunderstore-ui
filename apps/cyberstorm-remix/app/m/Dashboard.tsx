import {
  faBoxOpen,
  faCheckCircle,
  faExclamationCircle,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getSessionTools } from "cyberstorm/security/publicEnvVariables";
import { useState } from "react";
import { useLoaderData } from "react-router";

import {
  Heading,
  NewButton,
  NewIcon,
  NewTextInput,
  TicketList,
} from "@thunderstore/cyberstorm";
import { DapperTs } from "@thunderstore/dapper-ts";
import type { Ticket } from "@thunderstore/dapper/types";

import "./Dashboard.css";

export async function loader() {
  return { tickets: [], pendingReviewCount: 0 };
}

export async function clientLoader() {
  const sessionTools = getSessionTools();
  const dapper = new DapperTs(
    () => sessionTools.getConfig(),
    () => sessionTools.clearInvalidSession()
  );

  const tickets = await dapper.getTickets();

  // Get unique communities from tickets
  // In a real implementation, we should probably have a "getMyCommunities" endpoint
  const uniqueCommunityIds = Array.from(
    new Set(tickets.map((t) => t.community?.identifier).filter(Boolean))
  ) as string[];

  // Asynchronously fetch pending reviews count for each community
  // We use Promise.all to do this parallel
  const pendingReviewsResults = await Promise.all(
    uniqueCommunityIds.map(async (communityId) => {
      try {
        const result = await dapper.getPackageListings(
          { kind: "community", communityId },
          undefined, // ordering
          1, // page
          undefined, // q
          undefined, // includedCategories
          undefined, // excludedCategories
          undefined, // section
          undefined, // nsfw
          undefined, // deprecated
          "unreviewed" // status
        );
        return result.count;
      } catch (e) {
        console.error(`Failed to fetch pending reviews for ${communityId}`, e);
        return 0;
      }
    })
  );

  const pendingReviewCount = pendingReviewsResults.reduce((a, b) => a + b, 0);

  return { tickets, pendingReviewCount };
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

function StatsCard({
  title,
  value,
  icon,
  description,
  isActive = false,
  onClick,
}: {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`stats-card ${isActive ? "stats-card--active" : ""} ${
        onClick ? "stats-card--clickable" : ""
      }`}
      onClick={onClick}
    >
      <div className="stats-card__header">
        <div className="stats-card__title">{title}</div>
        <NewIcon csMode="inline" noWrapper className="stats-card__icon">
          <FontAwesomeIcon icon={icon} />
        </NewIcon>
      </div>
      <div className="stats-card__value">{value}</div>
      {description && (
        <div className="stats-card__description">{description}</div>
      )}
    </div>
  );
}

function CommunityModCard({
  communityId,
  tickets,
}: {
  communityId: string;
  tickets: Ticket[];
}) {
  const openCount = tickets.filter(
    (t) => t.status === "open" || t.status === "user_replied"
  ).length;

  return (
    <div className="community-card">
      <div className="community-card__header">
        <div className="community-card__title">{communityId}</div>
        <div className="community-card__count">{tickets.length} tickets</div>
      </div>
      <div className="community-card__status">
        <div className="community-card__status-item">
          <span
            className={`community-card__dot ${
              openCount > 0
                ? "community-card__dot--danger"
                : "community-card__dot--success"
            }`}
          />
          <span className="community-card__status-text">
            {openCount} needs attention
          </span>
        </div>
      </div>
      <div className="community-card__actions">
        <NewButton
          primitiveType="cyberstormLink"
          linkId="Community"
          community={communityId}
          csSize="small"
          csVariant="secondary"
          className="flex-1 w-full"
        >
          View Page
        </NewButton>
        <NewButton
          primitiveType="link"
          href={`/m/${communityId}/tickets`}
          csSize="small"
          csVariant="primary"
          className="flex-1 w-full"
        >
          Manage Tickets
        </NewButton>
      </div>
    </div>
  );
}

type FilterType = "all" | "needs_attention" | "resolved";

export default function Dashboard() {
  const { tickets, pendingReviewCount } = useLoaderData<
    typeof clientLoader
  >() as {
    tickets: Ticket[];
    pendingReviewCount: number;
  };

  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const uniqueCommunityIds = Array.from(
    new Set(tickets.map((t) => t.community?.identifier).filter(Boolean))
  ) as string[];

  // Metrics
  const needsAttentionCount = tickets.filter(
    (t) => t.status === "open" || t.status === "user_replied"
  ).length;
  const resolvedCount = tickets.filter(
    (t) => t.status === "resolved" || t.status === "closed"
  ).length;

  // Filter Logic
  const filteredTickets = tickets.filter((t) => {
    // 1. Text Search
    const searchMatch =
      !search ||
      t.listing?.package_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.community?.identifier?.toLowerCase().includes(search.toLowerCase()) ||
      t.uuid.includes(search);

    if (!searchMatch) return false;

    // 2. Status Filter
    if (filter === "needs_attention") {
      return t.status === "open" || t.status === "user_replied";
    }
    if (filter === "resolved") {
      return t.status === "resolved" || t.status === "closed";
    }
    return true;
  });

  return (
    <div className="dashboard-root">
      <div className="dashboard-header">
        <Heading csLevel="1">Moderation Center</Heading>
        <p className="dashboard-header__description">
          Overview of your moderation responsibilities. Manage disputes, review
          packages, and access tools for your communities.
        </p>
      </div>

      <div className="dashboard-grid">
        <StatsCard
          title="Needs Attention"
          value={needsAttentionCount}
          icon={faExclamationCircle}
          description="Open or User Replied"
          isActive={filter === "needs_attention"}
          onClick={() =>
            setFilter(filter === "needs_attention" ? "all" : "needs_attention")
          }
        />
        <StatsCard
          title="Active Communities"
          value={uniqueCommunityIds.length}
          icon={faUsers}
          description="Assignments"
        />
        <StatsCard
          title="Pending Reviews"
          value={pendingReviewCount}
          icon={faBoxOpen}
          description="Packages needing approval"
        />
        <StatsCard
          title="Resolved"
          value={resolvedCount}
          icon={faCheckCircle}
          description="Closed tickets"
          isActive={filter === "resolved"}
          onClick={() => setFilter(filter === "resolved" ? "all" : "resolved")}
        />
      </div>

      {filter === "all" && !search && uniqueCommunityIds.length > 0 && (
        <div className="dashboard-section">
          <Heading csLevel="2">Community Overview</Heading>
          <div className="community-grid">
            {uniqueCommunityIds.map((cId) => (
              <CommunityModCard
                key={cId}
                communityId={cId}
                tickets={tickets.filter((t) => t.community?.identifier === cId)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <Heading csLevel="2">
            {filter === "needs_attention"
              ? "Priority Queue"
              : filter === "resolved"
                ? "History"
                : "Global Queue"}
          </Heading>
          <div className="w-full md:w-auto md:min-w-[300px]">
            <NewTextInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search package, community, or ID..."
            />
          </div>
        </div>
        <TicketList tickets={filteredTickets} showCommunity={true} />
      </div>
    </div>
  );
}
