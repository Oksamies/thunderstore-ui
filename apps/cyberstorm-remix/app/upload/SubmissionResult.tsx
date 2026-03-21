import {
  faArrowUpRight,
  faFileZip,
  faUsers,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  Heading,
  NewButton,
  NewIcon,
  NewLink,
  NewTable,
  NewTableSort,
  NewTag,
} from "@thunderstore/cyberstorm";
import { type PackageSubmissionResult } from "@thunderstore/dapper/types";

import { PageHeader } from "../commonComponents/PageHeader/PageHeader";
import "./SubmissionResult.css";

export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) {
    return "0 Bytes";
  }

  const k = 1024; // changed
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [
    "Bytes",
    "KiB",
    "MiB",
    "GiB",
    "TiB",
    "PiB",
    "EiB",
    "ZiB",
    "YiB",
  ];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export interface MiniPackageCardProps {
  iconUrl?: string | null;
  name: string;
  author: string;
  version?: string;
  overlayText?: string;
  onAction?: (e: React.MouseEvent) => void;
  actionText?: string;
  actionVariant?: "primary" | "danger";
}

export function MiniPackageCard(props: MiniPackageCardProps) {
  return (
    <div className="submission-result__mini-card">
      <div className="submission-result__mini-card-icon-wrapper">
        {props.iconUrl ? (
          <img
            src={props.iconUrl}
            alt="icon"
            className="submission-result__mini-card-icon"
          />
        ) : (
          <FontAwesomeIcon
            icon={faFileZip}
            className="submission-result__mini-card-icon-fallback"
          />
        )}
      </div>
      <div className="submission-result__mini-card-content">
        <h4 className="submission-result__mini-card-title">
          {props.name || "Unknown Package"}
        </h4>
        <div className="submission-result__mini-card-meta">
          <span>{props.author || "Unknown Author"}</span>
          {props.version && <span>{props.version}</span>}
        </div>
        {props.overlayText && (
          <span className="submission-result__mini-card-desc">{props.overlayText}</span>
        )}
      </div>
      {props.actionText && props.onAction && (
        <NewButton
          onClick={props.onAction}
          csVariant={props.actionVariant || "primary"}
          csSize="small"
        >
          {props.actionText}
        </NewButton>
      )}
    </div>
  );
}

export interface SubmissionResultProps {
  submissionStatusResult: PackageSubmissionResult;
}

export function SubmissionResult(props: SubmissionResultProps) {
  return (
    <div className="container container--y container--full island">
      <PageHeader
        headingLevel="1"
        headingSize="3"
        image={props.submissionStatusResult.package_version.icon}
        description={props.submissionStatusResult.package_version.description}
        variant="detailed"
        meta={
          <>
            <span className="page-header__meta-item">
              <NewIcon csMode="inline" noWrapper>
                <FontAwesomeIcon icon={faUsers} />
              </NewIcon>
              By {props.submissionStatusResult.package_version.namespace}
            </span>
            {props.submissionStatusResult.package_version.website_url ? (
              <NewLink
                primitiveType="link"
                href={props.submissionStatusResult.package_version.website_url}
                csVariant="cyber"
                rootClasses="page-header__meta-item"
              >
                {props.submissionStatusResult.package_version.website_url}
                <NewIcon csMode="inline" noWrapper>
                  <FontAwesomeIcon icon={faArrowUpRight} />
                </NewIcon>
              </NewLink>
            ) : null}
          </>
        }
      >
        {props.submissionStatusResult.package_version.name}
      </PageHeader>

      <NewTable
        titleRowContent={
          <>
            <Heading csLevel="3" csSize="3">
              Success!
            </Heading>
            <p>
              The package is listed in{" "}
              {props.submissionStatusResult.available_communities.length}{" "}
              {props.submissionStatusResult.available_communities.length !== 1
                ? "communities"
                : "community"}
              :
            </p>
          </>
        }
        headers={[
          {
            value: "Community",
            disableSort: false,
            columnClasses: "versions__version",
          },
          {
            value: "Link",
            disableSort: true,
            columnClasses: "versions__upload-date",
          },
          {
            value: "Categories",
            disableSort: true,
            columnClasses: "versions__downloads",
          },
        ]}
        rows={props.submissionStatusResult.available_communities.map((v) => [
          {
            value: v.community.name,
            sortValue: v.community.name,
          },
          {
            value: (
              <NewLink
                primitiveType="link"
                href={`/c/${v.community.identifier}/p/${props.submissionStatusResult.package_version.namespace}/${props.submissionStatusResult.package_version.name}/`}
                target="_blank"
                csVariant="cyber"
              >
                View listing
              </NewLink>
            ),
            sortValue: v.url,
          },
          {
            value: v.categories.map((c) => (
              <NewTag key={c.slug} csSize="small">
                {c.name}
              </NewTag>
            )),
            sortValue: v.categories.map((c) => c.name).join(", "),
          },
        ])}
        sortDirection={NewTableSort.ASC}
        csModifiers={["alignLastColumnRight"]}
      />
    </div>
  );
}
