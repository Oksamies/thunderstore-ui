import {
  NewButton,
  NewSelectSearch,
  NewTextInput,
} from "@thunderstore/cyberstorm";
import { useToast } from "@thunderstore/cyberstorm";
import type { DapperTs } from "@thunderstore/dapper-ts";

import { useDependencySearch } from "./useDependencySearch";

export interface ManifestConfigurationProps {
  versionNumber: string;
  setVersionNumber: (val: string) => void;
  packageDescription: string;
  setPackageDescription: (val: string) => void;
  dependencies: { name: string; namespace: string; version: string }[];
  setDependencies: (
    val: { name: string; namespace: string; version: string }[]
  ) => void;
  communityOptions: { value: string; label: string }[];
  dapper: DapperTs;
}

export function ManifestConfiguration({
  versionNumber,
  setVersionNumber,
  packageDescription,
  setPackageDescription,
  dependencies,
  setDependencies,
  communityOptions,
  dapper,
}: ManifestConfigurationProps) {
  const toast = useToast();

  const {
    dependencySourceCommunity,
    setDependencySourceCommunity,
    dependencySearchQuery,
    setDependencySearchQuery,
    dependencySearchResults,
    selectedDependency,
    setSelectedDependency,
    isAddingDependency,
    setIsAddingDependency,
  } = useDependencySearch(dapper);

  return (
    <div className="upload__step-container">
      <div className="upload__dnd-edit-fields">
        <fieldset className="upload__manifest-fieldset">
          <legend className="upload__dnd-edit-legend">
            <h2>Manifest Configuration</h2>
          </legend>

          <div className="upload__dnd-edit-field">
            <label htmlFor="versionNumber" className="upload__dnd-edit-label">
              Version Number (from manifest.json)
            </label>
            <NewTextInput
              id="versionNumber"
              value={versionNumber}
              onChange={(e) => setVersionNumber(e.target.value)}
              placeholder="e.g. 1.0.0"
              className="upload__dnd-edit-input"
            />
          </div>

          <div className="upload__dnd-edit-field">
            <label
              htmlFor="packageDescription"
              className="upload__dnd-edit-label"
            >
              Package Description (from manifest.json)
            </label>
            <NewTextInput
              id="packageDescription"
              value={packageDescription}
              onChange={(e) => setPackageDescription(e.target.value)}
              placeholder="Short description of your package"
              className="upload__dnd-edit-input"
            />
          </div>

          <div className="upload__dnd-edit-field">
            <span className="upload__dnd-edit-label">Dependencies</span>
            <div className="upload__dnd-dependencies">
              {dependencies.map((dep, idx) => (
                <div key={idx} className="upload__dnd-dependency-item">
                  <span>
                    {dep.namespace}-{dep.name}-{dep.version}
                  </span>
                  <NewButton
                    csSize="small"
                    csVariant="danger"
                    onClick={() =>
                      setDependencies(dependencies.filter((_, i) => i !== idx))
                    }
                  >
                    Remove
                  </NewButton>
                </div>
              ))}

              {!isAddingDependency ? (
                <NewButton
                  csSize="small"
                  csVariant="primary"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsAddingDependency(true);
                  }}
                >
                  Add Dependency
                </NewButton>
              ) : (
                <div className="upload__dnd-dependency-search">
                  <NewSelectSearch
                    placeholder="Filter by community..."
                    options={communityOptions}
                    onChange={(val) => {
                      setDependencySourceCommunity(val ? val.value : "");
                      setDependencySearchQuery("");
                      setSelectedDependency(null);
                    }}
                    value={
                      dependencySourceCommunity
                        ? {
                            value: dependencySourceCommunity,
                            label:
                              communityOptions.find(
                                (c) => c.value === dependencySourceCommunity
                              )?.label || "",
                          }
                        : undefined
                    }
                  />

                  <NewSelectSearch
                    placeholder="Search packages..."
                    options={dependencySearchResults}
                    disabled={!dependencySourceCommunity}
                    onChange={(val) => {
                      if (val) {
                        const match = dependencySearchResults.find(
                          (r) => r.value === val.value
                        );
                        if (match) {
                          setDependencySearchQuery(match.label);
                          setSelectedDependency(match);
                        }
                      } else {
                        setDependencySearchQuery("");
                        setSelectedDependency(null);
                      }
                    }}
                    value={selectedDependency || undefined}
                  />

                  <div className="upload__dnd-dependency-search-actions">
                    <NewButton
                      csSize="small"
                      csVariant="primary"
                      disabled={!selectedDependency}
                      onClick={async (e) => {
                        e.preventDefault();
                        if (selectedDependency) {
                          try {
                            const details =
                              await dapper.getPackageListingDetails(
                                dependencySourceCommunity,
                                selectedDependency.pkg.namespace,
                                selectedDependency.pkg.name
                              );
                            setDependencies([
                              ...dependencies,
                              {
                                name: selectedDependency.pkg.name,
                                namespace: selectedDependency.pkg.namespace,
                                version: details.latest_version_number,
                              },
                            ]);
                            setIsAddingDependency(false);
                            setSelectedDependency(null);
                            setDependencySearchQuery("");
                          } catch (err) {
                            console.error(
                              "Failed to fetch dependency details",
                              err
                            );
                            toast.addToast({
                              csVariant: "danger",
                              children:
                                "Failed to fetch version details for dependency.",
                            });
                          }
                        }
                      }}
                    >
                      Confirm
                    </NewButton>
                    <NewButton
                      csSize="small"
                      csVariant="danger"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsAddingDependency(false);
                        setSelectedDependency(null);
                        setDependencySearchQuery("");
                      }}
                    >
                      Cancel
                    </NewButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  );
}
