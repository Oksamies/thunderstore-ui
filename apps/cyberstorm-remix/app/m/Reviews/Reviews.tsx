import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getSessionTools } from "cyberstorm/security/publicEnvVariables";
import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import {
  Heading,
  NewButton,
  NewIcon,
  NewTable,
  NewTag,
} from "@thunderstore/cyberstorm";
import type { NewTableLabels, NewTableRows } from "@thunderstore/cyberstorm";
import { DapperTs } from "@thunderstore/dapper-ts";

import "../Dashboard.css";

export async function loader({ params }: LoaderFunctionArgs) {
  return { listings: [], communityId: params.communityId };
}

export async function clientLoader({ params }: LoaderFunctionArgs) {
  const sessionTools = getSessionTools();
  const dapper = new DapperTs(
    () => sessionTools.getConfig(),
    () => sessionTools.clearInvalidSession()
  );

  const communityId = params.communityId;

  if (!communityId) {
    throw new Error("Community ID is required");
  }

  const listings = await dapper.getPackageListings(
    { kind: "community", communityId },
    undefined, // ordering
    undefined, // page
    undefined, // q
    undefined, // includedCategories
    undefined, // excludedCategories
    undefined, // section
    undefined, // nsfw
    undefined, // deprecated
    "unreviewed" // status
  );

  return { listings: listings.results, communityId };
}

clientLoader.hydrate = true;

export function HydrateFallback() {
  return (
    <div className="dashboard-root">
      <div className="dashboard-header">
        <Heading csLevel="1">Loading reviews...</Heading>
      </div>
    </div>
  );
}

export default function Reviews() {
  const { listings, communityId } = useLoaderData<typeof clientLoader>();

  const headers: NewTableLabels = [
    { value: "Package", disableSort: false },
    { value: "Status", disableSort: false },
    { value: "Last Updated", disableSort: false },
    { value: "Actions", disableSort: true },
  ];

  const rows: NewTableRows = listings.map((l) => [
    {
      value: (
        <div className="flex items-center gap-2 p-4">
          <img
            src={l.icon_url ?? undefined}
            alt=""
            className="w-8 h-8 rounded"
          />
          <div className="flex flex-col">
            <span className="font-bold">{l.name}</span>
            <span className="text-sm text-typography-secondary">
              {l.namespace}
            </span>
          </div>
        </div>
      ),
      sortValue: l.name,
    },
    {
      value: (
        <NewTag csVariant="primary" csSize="small">
          {l.review_status}
        </NewTag>
      ),
      sortValue: l.review_status ?? "",
    },
    {
      value: new Date(l.last_updated).toLocaleDateString(),
      sortValue: new Date(l.last_updated).getTime(),
    },
    {
      value: (
        <div className="flex gap-2 justify-end">
          <NewButton
            primitiveType="link"
            href={`/c/${communityId}/p/${l.namespace}/${l.name}/`}
            csSize="small"
            csVariant="secondary"
          >
            View Package
          </NewButton>
        </div>
      ),
      sortValue: 0,
    },
  ]);

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
        <Heading csLevel="1">Review Queue: {communityId}</Heading>
        <p className="dashboard-header__description">
          Packages waiting for approval in {communityId}.
        </p>
      </div>

      <div className="dashboard-section">
        {listings.length > 0 ? (
          <NewTable headers={headers} rows={rows} />
        ) : (
          <div className="dashboard-empty-state">
            <p>No packages pending review.</p>
          </div>
        )}
      </div>
    </div>
  );
}
