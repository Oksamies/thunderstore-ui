import { faArrowDown } from "@fortawesome/pro-light-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useStrongForm } from "cyberstorm/utils/StrongForm/useStrongForm";
import { getApiHostForSsr } from "cyberstorm/utils/env";
import { createSeo } from "cyberstorm/utils/meta";
import { useEffect, useReducer, useRef, useState } from "react";
import { useLoaderData, useOutletContext } from "react-router";

import {
  NewButton,
  NewIcon,
  NewSelectSearch,
  NewSwitch,
  useToast,
} from "@thunderstore/cyberstorm";
import {
  DapperTs,
  postPackageSubmissionMetadata,
} from "@thunderstore/dapper-ts";
import { type PackageSubmissionStatus } from "@thunderstore/dapper/types";
import { type PackageSubmissionRequestData } from "@thunderstore/thunderstore-api";
import {
  type IBaseUploadHandle,
  type UserMedia,
} from "@thunderstore/ts-uploader";

import { PageHeader } from "../commonComponents/PageHeader/PageHeader";
import { type OutletContextShape } from "../root";
import type { Route } from "./+types/upload";
import { IntentSwitcher } from "./IntentSwitcher";
import { ManifestConfiguration } from "./ManifestConfiguration";
import { MarkdownConfiguration } from "./MarkdownConfiguration";
import { SubmissionResult } from "./SubmissionResult";
import { TeamSelect } from "./TeamSelect";
import { UpdateSourceSelect } from "./UpdateSourceSelect";
import "./Upload.css";
import { UploadDropzone } from "./UploadDropzone";
import { type VirtualFile, VirtualZipEditor } from "./VirtualZipEditor";
import { useTeamPackages } from "./useTeamPackages";
import { useUploadActions } from "./useUploadActions";

interface CommunityOption {
  value: string;
  label: string;
}

interface CategoryOption {
  value: string;
  label: string;
}

export async function loader() {
  const dapper = new DapperTs(() => {
    return {
      apiHost: getApiHostForSsr(),
      sessionId: undefined,
    };
  });
  const communities = await dapper.getCommunities();
  return {
    ...communities,
    seo: createSeo({
      descriptors: [
        { title: "Upload package | Thunderstore" },
        {
          name: "description",
          content: "Upload a package to Thunderstore.",
        },
      ],
    }),
  };
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const communities = await serverLoader();
  return communities;
}

const formatFieldName = (field: string) => {
  return field
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function Upload() {
  const uploadData = useLoaderData<typeof loader | typeof clientLoader>();

  const outletContext = useOutletContext() as OutletContextShape;
  const requestConfig = outletContext.requestConfig;
  const currentUser = outletContext.currentUser;
  const dapper = outletContext.dapper;

  const toast = useToast();

  function formFieldUpdateAction(
    state: PackageSubmissionRequestData,
    action: {
      field: keyof PackageSubmissionRequestData;
      value: PackageSubmissionRequestData[keyof PackageSubmissionRequestData];
    }
  ) {
    return {
      ...state,
      [action.field]: action.value,
    };
  }

  const [formInputs, updateFormFieldState] = useReducer(formFieldUpdateAction, {
    author_name: "",
    communities: [],
    has_nsfw_content: false,
    upload_uuid: "",
    categories: undefined,
    community_categories: undefined,
  });

  // Category options
  const [categoryOptions, setCategoryOptions] = useState<
    { communityId: string; categories: CategoryOption[] }[]
  >([]);

  // Available teams
  const [availableTeams, setAvailableTeams] = useState<
    {
      name: string;
      role: string;
      member_count: number;
    }[]
  >([]);
  useEffect(() => {
    setAvailableTeams(currentUser?.teams_full ?? []);
  }, [currentUser?.teams_full]);

  // Community options
  const communityOptions: CommunityOption[] = [];
  for (const community of uploadData.results) {
    communityOptions.push({
      value: community.identifier,
      label: community.name,
    });
  }

  const [submissionStatus, setSubmissionStatus] =
    useState<PackageSubmissionStatus>();

  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [handle, setHandle] = useState<IBaseUploadHandle>();
  const [isDone, setIsDone] = useState<boolean>(false);

  // README, CHANGELOG, and MANIFEST management
  const [readmeContent, setReadmeContent] = useState<string>("");
  const [changelogContent, setChangelogContent] = useState<string>("");
  const [versionNumber, setVersionNumber] = useState<string>("");
  const [packageName, setPackageName] = useState<string>("");
  const [packageDescription, setPackageDescription] = useState<string>("");
  const [sourceCommunity, setSourceCommunity] = useState<string>("");
  const [iconPreviewUrl, setIconPreviewUrl] = useState<string>("");
  const [newIconFile, setNewIconFile] = useState<File | null>(null);
  const [originalZipBuffer, setOriginalZipBuffer] =
    useState<ArrayBuffer | null>(null);

  const [usermedia, setUsermedia] = useState<UserMedia>();
  const [autoSubmit, setAutoSubmit] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Intent: "new" or "update"
  const [intent, setIntent] = useState<"new" | "update">("new");

  const [dependencies, setDependencies] = useState<
    { name: string; namespace: string; version: string }[]
  >([]);
  const [virtualFiles, setVirtualFiles] = useState<VirtualFile[]>([]);

  const {
    teamPackages,
    teamPackageListings,
    searchPackageName,
    setSearchPackageName,
  } = useTeamPackages(dapper, formInputs.author_name, sourceCommunity);

  const {
    extractFilesFromZip,
    fetchExistingPackage,
    startUpload,
    retryPolling,
  } = useUploadActions({
    dapper,
    toast,
    requestConfig,
    setOriginalZipBuffer,
    setVirtualFiles,
    setVersionNumber,
    setPackageName,
    setPackageDescription,
    setIconPreviewUrl,
    setReadmeContent,
    setChangelogContent,
    setFile,
    formInputs,
    searchPackageName,
    intent,
    file,
    originalZipBuffer,
    virtualFiles,
    readmeContent,
    changelogContent,
    newIconFile,
    packageName,
    versionNumber,
    packageDescription,
    dependencies,
    setDependencies,
    setHandle,
    setUsermedia,
    setIsDone,
    submissionStatus,
    setSubmissionStatus,
  });

  // Deleted from here

  useEffect(() => {
    for (const community of formInputs.communities) {
      // Skip if we already have categories for this community
      if (categoryOptions.some((opt) => opt.communityId === community)) {
        continue;
      }
      dapper.getCommunityFilters(community).then((filters) => {
        setCategoryOptions((prev) => [
          ...prev,
          {
            communityId: community,
            categories: filters.package_categories.map((cat) => ({
              value: cat.slug,
              label: cat.name,
            })),
          },
        ]);
      });
    }
  }, [formInputs.communities, categoryOptions, dapper]);

  type SubmitorOutput = Awaited<
    ReturnType<typeof postPackageSubmissionMetadata>
  >;

  async function submitor(data: typeof formInputs): Promise<SubmitorOutput> {
    const config = requestConfig();
    const localDapper = new DapperTs(() => config);
    return await localDapper.postPackageSubmissionMetadata(
      data.author_name,
      data.communities,
      data.has_nsfw_content,
      data.upload_uuid,
      data.categories,
      data.community_categories
    );
  }

  type InputErrors = {
    [key in keyof typeof formInputs]?: string | string[];
  };

  const strongForm = useStrongForm<
    typeof formInputs,
    PackageSubmissionRequestData,
    Error,
    SubmitorOutput,
    Error,
    InputErrors
  >({
    inputs: formInputs,
    submitor,
    onSubmitSuccess: () => {
      toast.addToast({
        csVariant: "info",
        children: `Package submitted, wait for processing to complete.`,
        duration: 4000,
      });
    },
    onSubmitError: (error) => {
      toast.addToast({
        csVariant: "danger",
        children: `Error occurred: ${error.message || "Unknown error"}`,
        duration: 8000,
      });
    },
  });

  useEffect(() => {
    if (usermedia?.uuid) {
      updateFormFieldState({
        field: "upload_uuid",
        value: usermedia.uuid,
      });
    }
  }, [usermedia?.uuid]);

  useEffect(() => {
    setSubmissionStatus(strongForm.submitOutput);
  }, [strongForm.submitOutput]);

  const handlePublishPackage = () => {
    // Cross-team duplicate check warning logic (I-003)
    const activeTeam = formInputs.author_name;
    const isDuplicateOtherTeam = teamPackageListings.some(
      (pkg) => pkg.namespace !== activeTeam && pkg.package_name === packageName
    );
    if (isDuplicateOtherTeam && intent === "new") {
      toast.addToast({
        csVariant: "warning",
        children: `Warning: ${packageName} is owned by another team. Proceeding will create a duplicate.`,
        duration: 5000,
      });
    }

    if (currentStep < 4) {
      setCurrentStep(4);
      return;
    }

    // If we've already uploaded the file for some reason, just submit.
    if (usermedia?.uuid && isDone) {
      strongForm.submit();
      return;
    }
    // Otherwise, start the upload process, and we'll automatically submit when done.
    setAutoSubmit(true);
    startUpload();
  };

  useEffect(() => {
    if (autoSubmit && isDone && formInputs.upload_uuid) {
      strongForm.submit();
      setAutoSubmit(false);
    }
  }, [autoSubmit, isDone, formInputs.upload_uuid, strongForm]);

  return (
    <>
      <PageHeader headingLevel="1" headingSize="2">
        Upload package
      </PageHeader>
      <section className="container container--y container--full upload">
        {currentStep === 1 && (
          <>
            <TeamSelect
              availableTeams={availableTeams}
              authorName={formInputs.author_name}
              updateFormFieldState={updateFormFieldState}
            />
            {formInputs.author_name && (
              <>
                <div className="container container--x container--full upload__row">
                  <div className="upload__meta">
                    <p className="upload__title">Intent</p>
                    <p className="upload__description">
                      Are you uploading a completely new package, or updating an existing one?
                    </p>
                  </div>
                  <div className="upload__content">
                    <IntentSwitcher
                      intent={intent}
                      setIntent={setIntent}
                      onNewIntent={() => {
                        setFile(null);
                        setReadmeContent("");
                        setChangelogContent("");
                        setVersionNumber("");
                        setPackageName("");
                        setPackageDescription("");
                        setSearchPackageName("");
                        setSourceCommunity("");
                        setIconPreviewUrl("");
                        setNewIconFile(null);
                        setOriginalZipBuffer(null);
                        setVirtualFiles([]);
                        setDependencies([]);
                      }}
                    />
                  </div>
                </div>
                <NewButton onClick={() => setCurrentStep(2)}>Next</NewButton>
              </>
            )}
          </>
        )}
        {formInputs.author_name && currentStep === 2 && (
          <>
            <div className="container container--x container--full upload__row">
              <div className="upload__meta">
                <p className="upload__title">Listing Details</p>
                <p className="upload__description">
                  Select communities you want your package to be listed
                  under, choose categories, and indicate if it contains NSFW
                  material.
                </p>
              </div>
              <div className="upload__content">
                <div className="upload__communities-section">
                  <span className="upload__label-block">
                    Target Communities
                  </span>
                  <NewSelectSearch
                    placeholder="Select target communities"
                    multiple
                    options={communityOptions}
                    onChange={(val) => {
                      if (val) {
                        updateFormFieldState({
                          field: "communities",
                          value: val.map((c) => c.value),
                        });
                      } else {
                        updateFormFieldState({
                          field: "communities",
                          value: [],
                        });
                      }
                    }}
                    value={formInputs.communities?.map((communityId) => ({
                      value: communityId,
                      label:
                        communityOptions.find((c) => c.value === communityId)
                          ?.label || "",
                    }))}
                    disabled={isDone || !!handle}
                  />
                </div>

                {formInputs.communities &&
                  formInputs.communities.length !== 0 && (
                    <div className="upload__field--margin">
                      {formInputs.communities.map((community) => {
                        const communityData = uploadData.results.find(
                          (c) => c.identifier === community
                        );
                        const categories =
                          categoryOptions.find(
                            (c) => c.communityId === community
                          )?.categories || [];

                        return (
                          <div
                            key={community}
                            className="upload__category upload__field--margin"
                          >
                            <span className="upload__label">
                              {communityData?.name} Categories
                            </span>
                            <NewSelectSearch
                              placeholder={`Select ${communityData?.name} categories...`}
                              multiple
                              options={categories}
                              onChange={(val) => {
                                if (val) {
                                  updateFormFieldState({
                                    field: "community_categories",
                                    value: {
                                      ...formInputs.community_categories,
                                      [community]: val
                                        ? val.map((v) => v.value)
                                        : [],
                                    },
                                  });
                                } else {
                                  if (
                                    formInputs.community_categories &&
                                    formInputs.community_categories[community]
                                  ) {
                                    const temp = {
                                      ...formInputs.community_categories,
                                    };
                                    delete temp[community];
                                    updateFormFieldState({
                                      field: "community_categories",
                                      value: temp,
                                    });
                                  }
                                }
                              }}
                              value={
                                formInputs.community_categories
                                  ? formInputs.community_categories[
                                      community
                                    ]?.map((categoryId) => ({
                                      value: categoryId,
                                      label:
                                        categories.find(
                                          (c) => c.value === categoryId
                                        )?.label || "",
                                    }))
                                  : []
                              }
                              disabled={isDone || !!handle}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                <div>
                  <span className="upload__label-block">
                    Contains NSFW content
                  </span>
                  <div className="upload__nsfw-switch">
                    No
                    <NewSwitch
                      value={formInputs.has_nsfw_content}
                      onChange={(checked) => {
                        updateFormFieldState({
                          field: "has_nsfw_content",
                          value: checked,
                        });
                      }}
                    />
                    Yes
                  </div>
                </div>
              </div>
            </div>
            <div className="upload__divider" />
            <div className="upload__buttons" style={{ marginTop: "1rem" }}>
              <NewButton onClick={() => setCurrentStep(1)} csVariant="secondary">Back</NewButton>
              <NewButton onClick={() => setCurrentStep(3)} disabled={formInputs.communities.length === 0}>Next</NewButton>
            </div>
          </>
        )}

        {formInputs.author_name && currentStep === 3 && (
          <>
            <div className="container container--x container--full upload__row">
              <div className="upload__meta">
                <p className="upload__title">Package Content & Configuration</p>
                <p className="upload__description">
                  Upload a new package zip, fetch an existing one to update, or
                  create a new package. Review and edit details like your
                  version number, README.md, and CHANGELOG.md before uploading.
                </p>
              </div>
              <div className="upload__content">
                <div className="upload__step-container">
                  <div className="upload__source-split">
                    <UpdateSourceSelect
                      intent={intent}
                      sourceCommunity={sourceCommunity}
                      setSourceCommunity={setSourceCommunity}
                      communityOptions={communityOptions}
                      searchPackageName={searchPackageName}
                      setSearchPackageName={setSearchPackageName}
                      teamPackages={teamPackages}
                      fetchExistingPackage={fetchExistingPackage}
                      teamPackageListings={teamPackageListings}
                    />

                    <UploadDropzone
                      file={file}
                      setFile={setFile}
                      iconPreviewUrl={iconPreviewUrl}
                      packageName={packageName}
                      authorName={formInputs.author_name}
                      versionNumber={versionNumber}
                      packageDescription={packageDescription}
                      fileInputRef={fileInputRef}
                      setReadmeContent={setReadmeContent}
                      setChangelogContent={setChangelogContent}
                      setVersionNumber={setVersionNumber}
                      setPackageName={setPackageName}
                      setPackageDescription={setPackageDescription}
                      setIconPreviewUrl={setIconPreviewUrl}
                      setNewIconFile={setNewIconFile}
                      setOriginalZipBuffer={setOriginalZipBuffer}
                      handle={handle}
                      setHandle={setHandle}
                      setUsermedia={setUsermedia}
                      setIsDone={setIsDone}
                      extractFilesFromZip={extractFilesFromZip}
                    />
                  </div>
                </div>

                <ManifestConfiguration
                  versionNumber={versionNumber}
                  setVersionNumber={setVersionNumber}
                  packageDescription={packageDescription}
                  setPackageDescription={setPackageDescription}
                  dependencies={dependencies}
                  setDependencies={setDependencies}
                  communityOptions={communityOptions}
                  dapper={dapper}
                />

                <div className="upload__step-container">
                  <div className="upload__field">
                    <span className="upload__label">
                      <h2>Files</h2>
                    </span>
                    <VirtualZipEditor
                      files={virtualFiles}
                      setFiles={setVirtualFiles}
                      onReadmeChange={setReadmeContent}
                      onChangelogChange={setChangelogContent}
                    />
                  </div>
                </div>

                <MarkdownConfiguration
                  readmeContent={readmeContent}
                  setReadmeContent={setReadmeContent}
                  changelogContent={changelogContent}
                  setChangelogContent={setChangelogContent}
                />
              </div>
            </div>
            <div className="upload__divider" />
            
            <div className="upload__buttons" style={{ marginTop: "1rem" }}>
              <NewButton onClick={() => setCurrentStep(2)} csVariant="secondary">Back</NewButton>
              <NewButton onClick={() => setCurrentStep(4)} disabled={!file && intent === "new"}>Review & Publish</NewButton>
            </div>
          </>
        )}

        {formInputs.author_name && currentStep === 4 && (
          <>
            <div className="container container--x container--full upload__row">
              <div className="upload__meta">
                <p className="upload__title">Review & Publish</p>
                <p className="upload__description">
                  Please review your submission details before bringing it live.
                </p>
              </div>
              <div className="upload__content">
                <div className="upload__field--margin">
                  <strong>Action:</strong> {intent === "new" ? "Creating New Package" : "Updating Existing Package"}
                </div>
                <div className="upload__field--margin">
                  <strong>Target Team:</strong> {formInputs.author_name}
                </div>
                <div className="upload__field--margin">
                  <strong>Package Name:</strong> {packageName || "(Extracted from manifest)"}
                </div>
                <div className="upload__field--margin">
                  <strong>Version:</strong> {versionNumber}
                </div>
                <div className="upload__field--margin">
                  <strong>Target Communities:</strong> {formInputs.communities.length > 0 ? formInputs.communities.join(", ") : "None Selected"}
                </div>

                <div className="upload__divider" />
                
                <div className="upload__buttons">
                  <NewButton
                    onClick={() => setCurrentStep(3)}
                    csVariant="secondary"
                    csSize="big"
                    disabled={isDone || !!handle}
                  >
                    Back to Edit
                  </NewButton>
                  <NewButton
                    disabled={formInputs.communities.length === 0 || !!handle || isDone}
                    onClick={handlePublishPackage}
                    csVariant="primary"
                    csSize="big"
                    rootClasses="upload__submit"
                  >
                    {isDone ? "Submission Completing..." : "Publish Package"}
                  </NewButton>
                </div>
              </div>
            </div>
          </>
        )}
        {submissionStatus ? (
          <div className="submission__status">
            {submissionStatus.form_errors &&
              Object.keys(submissionStatus.form_errors).length > 0 && (
                <div className="submission__error">
                  <p>Form Errors:</p>
                  <ul>
                    {Object.entries(submissionStatus.form_errors).map(
                      ([field, error]) => (
                        <li key={field}>
                          {field !== "__all__" && (
                            <strong>{formatFieldName(field)}: </strong>
                          )}
                          {Array.isArray(error)
                            ? error.join(", ")
                            : String(error)}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            {submissionStatus.result && (
              <SubmissionResult
                submissionStatusResult={submissionStatus.result}
              />
            )}
            <NewButton onClick={retryPolling}>Retry Status Check</NewButton>
          </div>
        ) : null}
      </section>
    </>
  );
}
