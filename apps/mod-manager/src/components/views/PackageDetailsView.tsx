import {
  faUpRightFromSquare,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import Markdown from "react-markdown";
import { useParams, useSearchParams } from "react-router-dom";

import {
  NewButton,
  NewIcon,
  NewLink,
  NewTag,
  RelativeTime,
  SkeletonBox,
  Tabs,
  ThunderstoreLogo,
  formatFileSize,
  formatInteger,
  formatToDisplayName,
} from "@thunderstore/cyberstorm";
import { useDapper } from "@thunderstore/dapper";
import { usePromise } from "@thunderstore/use-promise";

import { PageHeader } from "../common/PageHeader/PageHeader";
import "./PackageDetailsView.css";

const PackageDetailsView: React.FC = () => {
  const {
    community,
    namespace,
    package: pkg,
    version,
  } = useParams<{
    community: string;
    namespace: string;
    package: string;
    version?: string;
  }>();

  const dapper = useDapper();
  const [activeTab, setActiveTab] = useState("details");

  // Fetch data
  const packageRequest = usePromise(
    (c: string | undefined, n: string | undefined, p: string | undefined) => {
      if (!c || !n || !p) return Promise.reject("Missing params");
      return dapper.getPackageListingDetails(c, n, p);
    },
    [community, namespace, pkg]
  );

  const teamRequest = usePromise(
    (n: string | undefined) => {
      if (!n) return Promise.reject("Missing namespace");
      return dapper.getTeamDetails(n);
    },
    [namespace]
  );

  const handleDownload = () => {
    // Implement download logic or open ModInstaller
    alert("Download logic to be implemented here (same as OnlineModView)");
  };

  if (packageRequest.loading) {
    return (
      <div className="package-details-view__loading">
        Loading package details...
      </div>
    );
  }

  if (packageRequest.error || !packageRequest.data) {
    return (
      <div className="package-details-view__error">
        Error: {packageRequest.error?.message || "Package not found"}
      </div>
    );
  }

  const listing = packageRequest.data;
  const team = teamRequest.data;

  const renderTabContent = () => {
    switch (activeTab) {
      case "details":
        return (
          <div className="package-details-view__readme-section">
            <div className="package-details-view__readme-placeholder">
              <h3 className="package-details-view__readme-title">
                Wait, where is the README?
              </h3>
              <p>
                Rendering the markdown readme requires fetching the specific
                version details which contains the README html or markdown.
                Currently `dapper.getPackageListingDetails` returns basic info.
              </p>
              <p className="package-details-view__desc-text">
                Description: {listing.description}
              </p>
            </div>
          </div>
        );
      case "versions":
        return (
          <div>
            <h3 className="package-details-view__versions-title">Versions</h3>
            <p className="package-details-view__tab-not-implemented">
              Version history implementation pending.
            </p>
          </div>
        );
      default:
        return (
          <div className="package-details-view__tab-not-implemented">
            Tab content not implemented yet.
          </div>
        );
    }
  };

  return (
    <div className="package-details-view">
      {/* Header Section */}
      <div className="package-details-view__header">
        <PageHeader
          headingLevel="1"
          headingSize="3"
          image={listing.icon_url}
          description={listing.description}
          variant="detailed"
          meta={
            <div className="package-details-view__header-meta">
              <NewLink
                primitiveType="cyberstormLink"
                linkId="Team"
                community={listing.community_identifier}
                team={listing.namespace}
                csVariant="cyber"
                rootClasses="package-details-view__header-link"
              >
                <NewIcon csMode="inline" noWrapper>
                  <FontAwesomeIcon icon={faUsers} />
                </NewIcon>
                {listing.namespace}
              </NewLink>
              {listing.website_url && (
                <NewLink
                  primitiveType="link"
                  href={listing.website_url}
                  csVariant="cyber"
                  rootClasses="package-details-view__header-link"
                >
                  Website
                  <NewIcon csMode="inline" noWrapper>
                    <FontAwesomeIcon icon={faUpRightFromSquare} />
                  </NewIcon>
                </NewLink>
              )}
            </div>
          }
        >
          {formatToDisplayName(listing.name)}
        </PageHeader>
      </div>

      <div className="package-details-view__content-area">
        {/* Main Content Area */}
        <div className="package-details-view__main custom-scrollbar">
          <Tabs>
            <div
              className={`package-details-view__tab ${
                activeTab === "details"
                  ? "package-details-view__tab--active"
                  : ""
              }`}
              onClick={() => setActiveTab("details")}
            >
              Details
            </div>
            <div
              className={`package-details-view__tab ${
                activeTab === "versions"
                  ? "package-details-view__tab--active"
                  : ""
              }`}
              onClick={() => setActiveTab("versions")}
            >
              Versions
            </div>
            {/* Add more fake tabs for now */}
          </Tabs>

          <div className="package-details-view__tab-content">
            {renderTabContent()}
          </div>
        </div>

        {/* Sidebar */}
        <div className="package-details-view__sidebar custom-scrollbar">
          <NewButton
            csVariant="accent"
            csSize="big"
            primitiveType="button"
            onClick={handleDownload}
            rootClasses="package-details-view__install-btn-root"
          >
            <NewIcon csMode="inline">
              <ThunderstoreLogo />
            </NewIcon>
            Install
          </NewButton>

          <div className="package-details-view__meta-list">
            {/* Meta Info */}
            <MetaRow label="Last Updated">
              <RelativeTime time={listing.last_updated} />
            </MetaRow>
            <MetaRow label="Created">
              <RelativeTime time={listing.datetime_created} />
            </MetaRow>
            <MetaRow label="Downloads">
              {formatInteger(listing.download_count)}
            </MetaRow>
            <MetaRow label="Likes">
              {formatInteger(listing.rating_count)}
            </MetaRow>
            <MetaRow label="Size">{formatFileSize(listing.size)}</MetaRow>
          </div>

          {/* Categories */}
          {listing.categories.length > 0 && (
            <div>
              <h4 className="package-details-view__section-title">
                Categories
              </h4>
              <div className="package-details-view__tags">
                {listing.categories.map((c) => (
                  <NewTag
                    key={c.id}
                    csSize="small"
                    csVariant="primary"
                    csMode="link" // Just a link style, non-functional for now or link to search
                    href={`#/manager/online?q=${c.name}`} // Hacky link
                  >
                    {c.name}
                  </NewTag>
                ))}
              </div>
            </div>
          )}

          {/* Team Members if available */}
          {/* Requires extra fetch or team data */}
          {team && (
            <div>
              <h4 className="package-details-view__section-title">Team</h4>
              <div className="package-details-view__team-list">
                {team.members.map((m) => (
                  <div
                    key={m.username}
                    className="package-details-view__team-member"
                  >
                    {m.avatar && (
                      <img
                        src={m.avatar}
                        className="package-details-view__avatar"
                        alt=""
                      />
                    )}
                    <span>{m.username}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetaRow: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="package-details-view__meta-row">
    <span className="package-details-view__meta-label">{label}</span>
    <span className="package-details-view__meta-value">{children}</span>
  </div>
);

export default PackageDetailsView;
