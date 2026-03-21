import { NewAlert, NewButton, NewSelectSearch } from "@thunderstore/cyberstorm";

import { MiniPackageCard } from "./SubmissionResult";

interface UpdateSourceSelectProps {
  intent: "new" | "update";
  sourceCommunity: string;
  setSourceCommunity: (val: string) => void;
  communityOptions: { value: string; label: string }[];
  searchPackageName: string;
  setSearchPackageName: (val: string) => void;
  teamPackages: { value: string; label: string }[];
  fetchExistingPackage: () => void;
  teamPackageListings: {
    name: string;
    namespace: string;
    description: string;
    icon_url: string | null;
  }[];
}

export function UpdateSourceSelect({
  intent,
  sourceCommunity,
  setSourceCommunity,
  communityOptions,
  searchPackageName,
  setSearchPackageName,
  teamPackages,
  fetchExistingPackage,
  teamPackageListings,
}: UpdateSourceSelectProps) {
  if (intent !== "update") return null;

  const selectedRemotePackage = teamPackageListings.find(
    (p) => p.name === searchPackageName
  );

  return (
    <div className="upload__source-column">
      <div className="upload__source-field-group">
        <div className="upload__source-field">
          <label htmlFor="sourceCommunity" className="upload__source-label">
            Source Community
          </label>
          <NewSelectSearch
            placeholder="Filter by community..."
            options={communityOptions}
            onChange={(val) => {
              setSourceCommunity(val ? val.value : "");
              setSearchPackageName("");
            }}
            value={
              sourceCommunity
                ? {
                    value: sourceCommunity,
                    label:
                      communityOptions.find((c) => c.value === sourceCommunity)
                        ?.label || "",
                  }
                : undefined
            }
          />
        </div>
        <div className="upload__source-field">
          <label htmlFor="searchPackageName" className="upload__source-label">
            Select Package
          </label>
          <NewSelectSearch
            placeholder="Select package..."
            options={teamPackages}
            onChange={(val) => {
              if (val) {
                setSearchPackageName(val.value);
              } else {
                setSearchPackageName("");
              }
            }}
            value={
              searchPackageName
                ? {
                    value: searchPackageName,
                    label: searchPackageName,
                  }
                : undefined
            }
          />
        </div>
        <div className="upload__source-fetch-button">
          <NewButton
            onClick={fetchExistingPackage}
            csVariant="primary"
            csSize="medium"
            rootClasses="upload__source-fetch-button-inner"
          >
            Import
          </NewButton>
        </div>
      </div>
      <div className="upload__source-preview upload__source-preview--margin">
        <NewAlert csVariant="info">
          If you have recently updated the package, the newest version might not
          be available yet. Either import it manually or wait a moment until you
          see the newest package version in Thunderstore.
        </NewAlert>
      </div>
      {selectedRemotePackage ? (
        <div className="upload__source-preview upload__source-preview--margin">
          <MiniPackageCard
            iconUrl={selectedRemotePackage.icon_url}
            name={selectedRemotePackage.name}
            author={selectedRemotePackage.namespace}
            overlayText={selectedRemotePackage.description}
          />
        </div>
      ) : null}
    </div>
  );
}
