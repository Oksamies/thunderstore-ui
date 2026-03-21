import {
  faArrowDown,
  faArrowUpRight,
  faFileZip,
  faImage,
  faPen,
  faTreasureChest,
  faUsers,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useStrongForm } from "cyberstorm/utils/StrongForm/useStrongForm";
import { getApiHostForSsr } from "cyberstorm/utils/env";
import { createSeo } from "cyberstorm/utils/meta";
// @ts-expect-error missing types
import JSZip from "jszip";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useLoaderData, useOutletContext } from "react-router";
import { useDebounce } from "use-debounce";
import { MarkdownEditor } from "~/commonComponents/MarkdownEditor/MarkdownEditor";

import {
  Heading,
  NewButton,
  NewIcon,
  NewLink,
  NewSelectSearch,
  NewSwitch,
  NewTable,
  NewTableSort,
  NewTag,
  NewTextInput,
  classnames,
  useToast,
} from "@thunderstore/cyberstorm";
import {
  DapperTs,
  postPackageSubmissionMetadata,
} from "@thunderstore/dapper-ts";
import {
  type PackageListing,
  type PackageSubmissionResult,
  type PackageSubmissionStatus,
} from "@thunderstore/dapper/types";
import { DnDFileInput } from "@thunderstore/react-dnd";
import { type PackageSubmissionRequestData } from "@thunderstore/thunderstore-api";
import {
  type IBaseUploadHandle,
  MultipartUpload,
  type UserMedia,
} from "@thunderstore/ts-uploader";

import { PageHeader } from "../commonComponents/PageHeader/PageHeader";
import { type OutletContextShape } from "../root";
import type { Route } from "./+types/upload";
import "./Upload.css";
import { type VirtualFile, VirtualZipEditor } from "./VirtualZipEditor";

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
  const [searchPackageName, setSearchPackageName] = useState<string>("");
  const [sourceCommunity, setSourceCommunity] = useState<string>("");
  const [teamPackages, setTeamPackages] = useState<
    { value: string; label: string }[]
  >([]);
  const [teamPackageListings, setTeamPackageListings] = useState<
    PackageListing[]
  >([]);
  const [iconPreviewUrl, setIconPreviewUrl] = useState<string>("");
  const [newIconFile, setNewIconFile] = useState<File | null>(null);
  const [originalZipBuffer, setOriginalZipBuffer] =
    useState<ArrayBuffer | null>(null);

  const [usermedia, setUsermedia] = useState<UserMedia>();
  const [autoSubmit, setAutoSubmit] = useState<boolean>(false);

  // Intent: "new" or "update"
  const [intent, setIntent] = useState<"new" | "update">("new");

  const [dependencies, setDependencies] = useState<
    { name: string; namespace: string; version: string }[]
  >([]);
  const [virtualFiles, setVirtualFiles] = useState<VirtualFile[]>([]);

  // Dependency Search State
  const [dependencySourceCommunity, setDependencySourceCommunity] =
    useState<string>("");
  const [dependencySearchQuery, setDependencySearchQuery] =
    useState<string>("");
  const [debouncedDependencySearchQuery] = useDebounce(
    dependencySearchQuery,
    300
  );
  const [dependencySearchResults, setDependencySearchResults] = useState<
    { value: string; label: string; pkg: PackageListing }[]
  >([]);
  const [selectedDependency, setSelectedDependency] = useState<{
    value: string;
    label: string;
    pkg: PackageListing;
  } | null>(null);
  const [isAddingDependency, setIsAddingDependency] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    async function loadTeamPackages() {
      if (formInputs.author_name && sourceCommunity) {
        try {
          const result = await dapper.getPackageListings({
            kind: "namespace",
            communityId: sourceCommunity,
            namespaceId: formInputs.author_name,
          });
          if (active) {
            setTeamPackageListings(result.results);
            setTeamPackages(
              result.results.map((pkg) => ({
                value: pkg.name,
                label: pkg.name,
              }))
            );
          }
        } catch (err) {
          console.error("Failed to fetch team packages", err);
          if (active) {
            setTeamPackages([]);
            setTeamPackageListings([]);
          }
        }
      } else {
        setTeamPackages([]);
        setTeamPackageListings([]);
      }
    }
    loadTeamPackages();
    return () => {
      active = false;
    };
  }, [formInputs.author_name, sourceCommunity, dapper]);

  useEffect(() => {
    let active = true;
    async function searchCommunityPackages() {
      if (dependencySourceCommunity) {
        try {
          const result = await dapper.getPackageListings(
            { kind: "community", communityId: dependencySourceCommunity },
            undefined,
            1,
            debouncedDependencySearchQuery || undefined
          );
          if (active) {
            setDependencySearchResults(
              result.results.map((pkg) => ({
                value: `${pkg.namespace}-${pkg.name}`,
                label: `${pkg.name} by ${pkg.namespace}`,
                pkg: pkg,
              }))
            );
          }
        } catch (err) {
          console.error("Failed to fetch dependency packages", err);
          if (active) {
            setDependencySearchResults([]);
          }
        }
      } else {
        if (active) setDependencySearchResults([]);
      }
    }
    searchCommunityPackages();
    return () => {
      active = false;
    };
  }, [dependencySourceCommunity, debouncedDependencySearchQuery, dapper]);

  const extractFilesFromZip = async (zipFile: File) => {
    try {
      const buffer = await zipFile.arrayBuffer();
      setOriginalZipBuffer(buffer);
      const zip = new JSZip();
      await zip.loadAsync(buffer);

      let readme = "";
      let changelog = "";

      const readmeFile =
        zip.file("README.md") || zip.file("readme.md") || zip.file("README.MD");
      if (readmeFile) {
        readme = await readmeFile.async("text");
      }

      const changelogFile =
        zip.file("CHANGELOG.md") ||
        zip.file("changelog.md") ||
        zip.file("CHANGELOG.MD");
      if (changelogFile) {
        changelog = await changelogFile.async("text");
      }

      const manifestFile = zip.file("manifest.json");
      if (manifestFile) {
        try {
          const manifestRaw = await manifestFile.async("text");
          const manifestJson = JSON.parse(manifestRaw);
          if (manifestJson.version_number) {
            setVersionNumber(manifestJson.version_number);
          }
          if (manifestJson.name) {
            setPackageName(manifestJson.name);
          }
          if (manifestJson.description) {
            setPackageDescription(manifestJson.description);
          }
        } catch (e) {
          console.error("Failed to parse manifest.json", e);
        }
      }

      const iconFile = zip.file("icon.png");
      if (iconFile) {
        try {
          const iconBlob = await iconFile.async("blob");
          setIconPreviewUrl(URL.createObjectURL(iconBlob));
        } catch (e) {
          console.error("Failed to load icon.png", e);
        }
      }

      setReadmeContent(readme);
      setChangelogContent(changelog);
    } catch (error) {
      toast.addToast({
        csVariant: "danger",
        children:
          error instanceof Error
            ? error.message
            : "Failed to extract files from zip",
        duration: 8000,
      });
    }
  };

  const fetchExistingPackage = async () => {
    if (!formInputs.author_name || !searchPackageName) {
      toast.addToast({
        csVariant: "warning",
        children: "Select a team and enter a package name first.",
        duration: 4000,
      });
      return;
    }

    try {
      toast.addToast({
        csVariant: "info",
        children: "Fetching package details...",
        duration: 4000,
      });
      const versions = await dapper.getPackageVersions(
        formInputs.author_name,
        searchPackageName
      );
      if (versions && versions.length > 0) {
        const latestVersion = versions[0];
        const res = await fetch(latestVersion.download_url);
        if (!res.ok) throw new Error("Could not download zip");
        const blob = await res.blob();
        const downloadedFile = new File(
          [blob],
          `${formInputs.author_name}-${searchPackageName}-${latestVersion.version_number}.zip`,
          {
            type: "application/zip",
          }
        );
        setFile(downloadedFile);
        extractFilesFromZip(downloadedFile);
        toast.addToast({
          csVariant: "success",
          children: "Package fetched! You can now edit its files.",
          duration: 4000,
        });
      } else {
        throw new Error("No versions found for this package");
      }
    } catch (error) {
      toast.addToast({
        csVariant: "danger",
        children:
          error instanceof Error
            ? error.message
            : "Failed to fetch existing package",
        duration: 8000,
      });
    }
  };

  const startUpload = useCallback(async () => {
    let fileToUpload: File;

    if (intent === "new" && !file && !originalZipBuffer) {
      // Build everything from scratch
      try {
        const createZip = new JSZip();
        virtualFiles.forEach((vf) => {
          if (vf.content) {
            createZip.file(vf.path, vf.content);
          } else {
            createZip.folder(vf.path);
          }
        });

        if (readmeContent) createZip.file("README.md", readmeContent);
        if (changelogContent) createZip.file("CHANGELOG.md", changelogContent);
        if (newIconFile) {
          const iconBuffer = await newIconFile.arrayBuffer();
          createZip.file("icon.png", iconBuffer);
        }

        const manifestObj: Record<string, unknown> = {};
        manifestObj["name"] =
          packageName || formInputs.author_name || "NewPackage";
        manifestObj["version_number"] = versionNumber || "1.0.0";
        manifestObj["description"] = packageDescription || "";

        const depStrings = dependencies.map(
          (dep) => `${dep.namespace}-${dep.name}-${dep.version}`
        );
        manifestObj["dependencies"] = depStrings;

        createZip.file("manifest.json", JSON.stringify(manifestObj, null, 2));

        const compiledBlob = await createZip.generateAsync({ type: "blob" });
        const zipName =
          formInputs.author_name &&
          manifestObj.name &&
          manifestObj.version_number
            ? `${formInputs.author_name}-${manifestObj.name}-${manifestObj.version_number}.zip`
            : "package.zip";

        fileToUpload = new File([compiledBlob], zipName, {
          type: "application/zip",
        });
      } catch (error) {
        toast.addToast({
          csVariant: "danger",
          children:
            error instanceof Error
              ? error.message
              : "Failed to compile virtual files into zip",
          duration: 8000,
        });
        return;
      }
    } else {
      // Repackage existing file/buffer
      if (!file) {
        toast.addToast({
          csVariant: "danger",
          children: "No package selected.",
          duration: 8000,
        });
        return;
      }
      fileToUpload = file;

      if (
        originalZipBuffer &&
        (readmeContent ||
          changelogContent ||
          versionNumber ||
          newIconFile ||
          virtualFiles.length > 0 ||
          dependencies.length > 0)
      ) {
        try {
          const zip = new JSZip();
          await zip.loadAsync(originalZipBuffer);

          if (readmeContent) zip.file("README.md", readmeContent);
          if (changelogContent) zip.file("CHANGELOG.md", changelogContent);

          virtualFiles.forEach((vf) => {
            if (vf.content) {
              zip.file(vf.path, vf.content);
            } else {
              zip.folder(vf.path);
            }
          });

          const manifestFile = zip.file("manifest.json");
          if (manifestFile) {
            try {
              const manifestRaw = await manifestFile.async("text");
              const manifestJson = JSON.parse(manifestRaw);
              if (versionNumber) {
                manifestJson.version_number = versionNumber;
              }
              if (packageName) {
                manifestJson.name = packageName;
              }
              if (packageDescription) {
                manifestJson.description = packageDescription;
              }
              const depStrings = dependencies.map(
                (dep) => `${dep.namespace}-${dep.name}-${dep.version}`
              );
              manifestJson.dependencies = [
                ...new Set([
                  ...((manifestJson.dependencies as string[]) || []),
                  ...depStrings,
                ]),
              ];

              zip.file("manifest.json", JSON.stringify(manifestJson, null, 2));
            } catch (e) {
              console.error("Failed to parse/update manifest.json", e);
            }
          }

          if (newIconFile) {
            const iconBuffer = await newIconFile.arrayBuffer();
            zip.file("icon.png", iconBuffer);
          }

          const repackagedBlob = await zip.generateAsync({ type: "blob" });
          const zipName =
            formInputs.author_name && packageName && versionNumber
              ? `${formInputs.author_name}-${packageName}-${versionNumber}.zip`
              : file.name || "package.zip";
          fileToUpload = new File([repackagedBlob], zipName, {
            type: "application/zip",
          });
        } catch (error) {
          toast.addToast({
            csVariant: "danger",
            children:
              error instanceof Error
                ? error.message
                : "Failed to repackage zip",
            duration: 8000,
          });
          return;
        }
      }
    }

    const config = requestConfig();
    if (!config.apiHost) {
      throw new Error("API host is not configured");
    }
    const upload = new MultipartUpload(
      {
        file: fileToUpload,
      },
      requestConfig
    );

    setHandle(upload);
    toast.addToast({
      csVariant: "info",
      children: "Starting upload",
      duration: 4000,
    });
    try {
      await upload.start();
      setUsermedia(upload.handle);
      setIsDone(true);
    } catch (error) {
      toast.addToast({
        csVariant: "danger",
        children: error instanceof Error ? error.message : "Upload failed",
        duration: 8000,
      });
      setHandle(undefined);
    }
  }, [
    file,
    requestConfig,
    toast,
    originalZipBuffer,
    readmeContent,
    changelogContent,
    versionNumber,
    newIconFile,
    packageName,
    formInputs.author_name,
    intent,
    virtualFiles,
    packageDescription,
    dependencies,
  ]);

  useEffect(() => {
    // startUpload is intentionally not triggered immediately on file selection
    // so the user can edit README and CHANGELOG first.
  }, [file]);

  const pollSubmission = async (
    submissionId: string,
    noSleep?: boolean
  ): Promise<PackageSubmissionStatus> => {
    if (!noSleep) {
      // Wait 5 seconds before polling again
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    toast.addToast({
      csVariant: "info",
      children: "Polling submission status",
      duration: 4000,
    });
    return await dapper.getPackageSubmissionStatus(submissionId);
  };

  const submissionStatusRef = useRef<PackageSubmissionStatus | undefined>(
    submissionStatus
  );

  useEffect(() => {
    if (
      submissionStatus &&
      submissionStatusRef.current !== submissionStatus &&
      submissionStatus.status === "PENDING"
    ) {
      pollSubmission(submissionStatus.id)
        .then((data) => {
          submissionStatusRef.current = data;
          setSubmissionStatus(data);
          if (data.status === "PENDING") {
            toast.addToast({
              csVariant: "info",
              children:
                "Submission is still pending, polling again in 5 seconds",
              duration: 4000,
            });
          } else {
            if (data.form_errors || !data.result) {
              toast.addToast({
                csVariant: "danger",
                children:
                  "Submission completed, but there were issues. Please check the form errors.",
                duration: 8000,
              });
            } else {
              toast.addToast({
                csVariant: "success",
                children: `Package ${data.result?.package_version
                  .full_name} uploaded successfully! It's now available in ${
                  data.result?.available_communities.length === 1
                    ? data.result?.available_communities[0].community.name
                    : `${data.result?.available_communities.length} communities`
                }!`,
                duration: 8000,
              });
            }
          }
        })
        .catch((error) => {
          // TODO: Add sentry logging
          toast.addToast({
            csVariant: "danger",
            children: `Error polling submission status: ${error.message}`,
            duration: 8000,
          });
        });
    }
  }, [submissionStatus]);

  const retryPolling = () => {
    if (submissionStatus?.id) {
      pollSubmission(submissionStatus.id, true).then((data) => {
        setSubmissionStatus(data);
      });
    }
  };

  // Helper function to format field names for display
  const formatFieldName = (field: string) => {
    return field
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

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
  }, [formInputs.communities]);

  type SubmitorOutput = Awaited<
    ReturnType<typeof postPackageSubmissionMetadata>
  >;

  async function submitor(data: typeof formInputs): Promise<SubmitorOutput> {
    const config = requestConfig();
    const dapper = new DapperTs(() => config);
    return await dapper.postPackageSubmissionMetadata(
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
        <div className="container container--x container--full upload__row">
          <div className="upload__meta">
            <p className="upload__title">Team</p>
            <p className="upload__description">
              Select the team you want your package to be associated with.
            </p>
          </div>
          <div className="upload__content">
            <NewSelectSearch
              placeholder="Select team"
              options={availableTeams?.map((team) => ({
                value: team.name,
                label: team.name,
              }))}
              onChange={(val) => {
                if (val) {
                  updateFormFieldState({
                    field: "author_name",
                    value: val.value,
                  });
                } else {
                  updateFormFieldState({
                    field: "author_name",
                    value: "",
                  });
                }
              }}
              value={
                formInputs.author_name
                  ? {
                      value: formInputs.author_name,
                      label: formInputs.author_name,
                    }
                  : undefined
              }
            />
            <span className="upload__no-teams">
              <p className="upload__no-teams-text">No teams available?</p>
              <NewLink
                key="create-team-link"
                primitiveType="cyberstormLink"
                linkId="Teams"
                csVariant="cyber"
                rootClasses="community__item"
              >
                <span>Create team</span>
              </NewLink>
            </span>
          </div>
        </div>
        <div className="upload__divider" />
        {formInputs.author_name ? (
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
                  <div className="upload__intent-switchers">
                    <div
                      role="button"
                      tabIndex={0}
                      className={classnames(
                        "upload__intent-button",
                        intent === "new"
                          ? "upload__intent-button--active"
                          : null
                      )}
                      onClick={() => {
                        setIntent("new");
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setIntent("new");
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
                        }
                      }}
                    >
                      <h3>New Package</h3>
                      <p>Create and upload a brand new package</p>
                      {intent === "new" && (
                        <div className="upload__intent-converge">
                          <NewIcon>
                            <FontAwesomeIcon icon={faArrowDown} />
                          </NewIcon>
                        </div>
                      )}
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      className={classnames(
                        "upload__intent-button",
                        intent === "update"
                          ? "upload__intent-button--active"
                          : null
                      )}
                      onClick={() => setIntent("update")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setIntent("update");
                        }
                      }}
                    >
                      <h3>Update Package</h3>
                      <p>Fetch an existing package to release a new version</p>
                      {intent === "update" && (
                        <div className="upload__intent-converge">
                          <NewIcon>
                            <FontAwesomeIcon icon={faArrowDown} />
                          </NewIcon>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="upload__step-arrow"
                  style={{ marginTop: "1rem" }}
                >
                  <NewIcon>
                    <FontAwesomeIcon icon={faArrowDown} />
                  </NewIcon>
                </div>

                <div className="upload__step-container">
                  <div className="upload__source-split">
                    {/* UPDATE PACKAGE MODE: REMOTE FETCH + DROPZONE */}
                    {intent === "update" && (
                      <div className="upload__source-column">
                        <div className="upload__source-field-group">
                          <div className="upload__source-field">
                            <label
                              htmlFor="sourceCommunity"
                              className="upload__source-label"
                            >
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
                                        communityOptions.find(
                                          (c) => c.value === sourceCommunity
                                        )?.label || "",
                                    }
                                  : undefined
                              }
                            />
                          </div>
                          <div className="upload__source-field">
                            <label
                              htmlFor="searchPackageName"
                              className="upload__source-label"
                            >
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
                              Fetch
                            </NewButton>
                          </div>
                        </div>
                        {(() => {
                          const selectedRemotePackage =
                            teamPackageListings.find(
                              (p) => p.name === searchPackageName
                            );
                          return selectedRemotePackage ? (
                            <div className="upload__source-preview upload__source-preview--margin">
                              <MiniPackageCard
                                iconUrl={selectedRemotePackage.icon_url}
                                name={selectedRemotePackage.name}
                                author={selectedRemotePackage.namespace}
                                overlayText={selectedRemotePackage.description}
                              />
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}

                    {/* ZIP DROPZONE ALWAYS SHOWN OR AS NEW PACKAGE STARTER */}
                    <div className="upload__source-column">
                      <DnDFileInput
                        rootClasses={classnames(
                          "drag-n-drop",
                          file ? "drag-n-drop--success" : null
                        )}
                        name="file"
                        baseState={
                          file ? (
                            <div className="upload__dnd-file-details">
                              {iconPreviewUrl ? (
                                <img
                                  src={iconPreviewUrl}
                                  alt="icon"
                                  className="upload__dnd-file-icon"
                                />
                              ) : (
                                <FontAwesomeIcon
                                  icon={faFileZip}
                                  className="upload__dnd-file-icon-fallback"
                                />
                              )}
                              <div className="upload__dnd-file-info">
                                <span className="upload__dnd-file-name">
                                  {packageName || file.name}
                                </span>
                                <div className="upload__dnd-file-meta">
                                  <span>
                                    {formInputs.author_name || "Unknown Author"}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {versionNumber || "Unknown Version"}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {file.size > 0
                                      ? formatBytes(file.size)
                                      : "0 Bytes"}
                                  </span>
                                </div>
                                {packageDescription && (
                                  <span className="upload__dnd-file-desc">
                                    {packageDescription}
                                  </span>
                                )}
                              </div>
                              <div className="upload__dnd-file-actions">
                                <NewButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (fileInputRef.current) {
                                      fileInputRef.current.click();
                                    }
                                  }}
                                  csVariant="primary"
                                  csSize="small"
                                >
                                  Change
                                </NewButton>
                                <NewButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setFile(null);
                                    setReadmeContent("");
                                    setChangelogContent("");
                                    setVersionNumber("");
                                    setPackageName("");
                                    setPackageDescription("");
                                    setIconPreviewUrl("");
                                    setNewIconFile(null);
                                    setOriginalZipBuffer(null);
                                    if (fileInputRef.current) {
                                      fileInputRef.current.value = "";
                                    }
                                    handle?.abort();
                                    setHandle(undefined);
                                    setUsermedia(undefined);
                                    setIsDone(false);
                                  }}
                                  csVariant="danger"
                                  csSize="small"
                                >
                                  Remove
                                </NewButton>
                              </div>
                            </div>
                          ) : (
                            <div className="drag-n-drop__body drag-n-drop__body--full-height">
                              <NewIcon
                                wrapperClasses="drag-n-drop__icon"
                                csVariant="accent"
                              >
                                <FontAwesomeIcon icon={faFileZip} />
                              </NewIcon>
                              <span className="drag-n-drop__main-text">
                                Drag and drop your ZIP file here
                              </span>
                              <span className="drag-n-drop__sub-text">
                                5GB max
                              </span>
                            </div>
                          )
                        }
                        dragState={
                          <div className="drag-n-drop__body">
                            <NewIcon
                              wrapperClasses="drag-n-drop__icon"
                              csVariant="accent"
                            >
                              <FontAwesomeIcon icon={faTreasureChest} />
                            </NewIcon>
                            {file ? (
                              <span>{file.name}</span>
                            ) : (
                              <span className="drag-n-drop__main-text">
                                Drag file here
                              </span>
                            )}
                          </div>
                        }
                        onChange={async (files) => {
                          if (!files || files.length === 0) return;

                          let foundZip = false;
                          for (let i = 0; i < files.length; i++) {
                            const selectedFile = files.item(i);
                            if (!selectedFile) continue;

                            const lowerName = selectedFile.name.toLowerCase();
                            if (lowerName === "readme.md") {
                              const text = await selectedFile.text();
                              setReadmeContent(text);
                            } else if (lowerName === "changelog.md") {
                              const text = await selectedFile.text();
                              setChangelogContent(text);
                            } else if (lowerName === "icon.png") {
                              setNewIconFile(selectedFile);
                              setIconPreviewUrl(
                                URL.createObjectURL(selectedFile)
                              );
                            } else if (lowerName.endsWith(".zip")) {
                              setFile(selectedFile);
                              extractFilesFromZip(selectedFile);
                              foundZip = true;
                            } else if (!foundZip && files.length === 1) {
                              setFile(selectedFile);
                              extractFilesFromZip(selectedFile);
                            }
                          }
                        }}
                        readonly={!!handle}
                        fileInputRef={fileInputRef}
                      />
                    </div>
                  </div>
                </div>

                {!isDone && (
                  <>
                    <div
                      className="upload__step-arrow"
                      style={{ marginTop: "1rem" }}
                    >
                      <NewIcon>
                        <FontAwesomeIcon icon={faArrowDown} />
                      </NewIcon>
                    </div>
                    <div className="upload__step-container">
                      <div className="upload__dnd-edit-fields">
                        {/* MANIFEST EDITOR SECTION */}
                        <fieldset className="upload__manifest-fieldset">
                          <legend className="upload__dnd-edit-legend">
                            <h2>Manifest Configuration</h2>
                          </legend>

                          <div className="upload__dnd-edit-field">
                            <label
                              htmlFor="versionNumber"
                              className="upload__dnd-edit-label"
                            >
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
                              onChange={(e) =>
                                setPackageDescription(e.target.value)
                              }
                              placeholder="Short description of your package"
                              className="upload__dnd-edit-input"
                            />
                          </div>

                          <div className="upload__dnd-edit-field">
                            <span className="upload__dnd-edit-label">
                              Dependencies
                            </span>
                            <div className="upload__dnd-dependencies">
                              {dependencies.map((dep, idx) => (
                                <div
                                  key={idx}
                                  className="upload__dnd-dependency-item"
                                >
                                  <span>
                                    {dep.namespace}-{dep.name}-{dep.version}
                                  </span>
                                  <NewButton
                                    csSize="small"
                                    csVariant="danger"
                                    onClick={() =>
                                      setDependencies(
                                        dependencies.filter((_, i) => i !== idx)
                                      )
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
                                      setDependencySourceCommunity(
                                        val ? val.value : ""
                                      );
                                      setDependencySearchQuery("");
                                      setSelectedDependency(null);
                                    }}
                                    value={
                                      dependencySourceCommunity
                                        ? {
                                            value: dependencySourceCommunity,
                                            label:
                                              communityOptions.find(
                                                (c) =>
                                                  c.value ===
                                                  dependencySourceCommunity
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
                                        const match =
                                          dependencySearchResults.find(
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
                                                selectedDependency.pkg
                                                  .namespace,
                                                selectedDependency.pkg.name
                                              );
                                            setDependencies([
                                              ...dependencies,
                                              {
                                                name: selectedDependency.pkg
                                                  .name,
                                                namespace:
                                                  selectedDependency.pkg
                                                    .namespace,
                                                version:
                                                  details.latest_version_number,
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

                        <div className="upload__dnd-edit-field upload__dnd-edit-field--margin">
                          <label
                            className="upload__dnd-edit-label upload__dnd-edit-label--bold"
                            htmlFor="iconFile"
                          >
                            Package Icon (icon.png)
                          </label>
                          <div className="upload__dnd-icon-upload">
                            <label
                              htmlFor="iconFile"
                              className="upload__dnd-icon-overlay-container"
                            >
                              {iconPreviewUrl ? (
                                <img
                                  src={iconPreviewUrl}
                                  alt="Package Icon Preview"
                                  className="upload__dnd-icon-preview"
                                />
                              ) : (
                                <div className="upload__dnd-icon-preview-fallback">
                                  <FontAwesomeIcon icon={faImage} />
                                </div>
                              )}
                              <div className="upload__dnd-icon-overlay">
                                <FontAwesomeIcon icon={faPen} />
                              </div>
                            </label>
                            <input
                              id="iconFile"
                              type="file"
                              accept="image/png"
                              className="upload__hidden-file-input"
                              onChange={(e) => {
                                if (
                                  e.target.files &&
                                  e.target.files.length > 0
                                ) {
                                  const file = e.target.files[0];
                                  setNewIconFile(file);
                                  setIconPreviewUrl(URL.createObjectURL(file));
                                }
                              }}
                            />
                          </div>
                        </div>

                        <div
                          className="upload__step-arrow"
                          style={{ marginTop: "1rem" }}
                        >
                          <NewIcon>
                            <FontAwesomeIcon icon={faArrowDown} />
                          </NewIcon>
                        </div>

                        <div className="upload__step-container">
                          <div className="upload__dnd-edit-field">
                            <span className="upload__dnd-edit-label">
                              <h2>Virtual Files</h2>
                            </span>
                            <VirtualZipEditor
                              files={virtualFiles}
                              setFiles={setVirtualFiles}
                              onReadmeChange={setReadmeContent}
                              onChangelogChange={setChangelogContent}
                            />
                          </div>
                        </div>

                        <div className="upload__step-arrow">
                          <NewIcon>
                            <FontAwesomeIcon icon={faArrowDown} />
                          </NewIcon>
                        </div>

                        <div className="upload__step-container">
                          <div className="upload__dnd-edit-field">
                            <span className="upload__dnd-edit-label">
                              <h2>README.md</h2>
                            </span>
                            <MarkdownEditor
                              value={readmeContent}
                              onChange={setReadmeContent}
                              placeholder="README.md content"
                            />
                          </div>
                        </div>

                        <div className="upload__step-arrow">
                          <NewIcon>
                            <FontAwesomeIcon icon={faArrowDown} />
                          </NewIcon>
                        </div>

                        <div className="upload__step-container">
                          <div className="upload__dnd-edit-field">
                            <span className="upload__dnd-edit-label">
                              <h2>CHANGELOG.md</h2>
                            </span>
                            <MarkdownEditor
                              value={changelogContent}
                              onChange={setChangelogContent}
                              placeholder="CHANGELOG.md content"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="upload__divider" />

            {!isDone && (
              <>
                {/* TARGET COMMUNITIES AND CATEGORIES */}
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
                            communityOptions.find(
                              (c) => c.value === communityId
                            )?.label || "",
                        }))}
                        disabled={isDone || !!handle}
                      />
                    </div>

                    {formInputs.communities &&
                      formInputs.communities.length !== 0 && (
                        <div className="upload__dnd-edit-field--margin">
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
                                className="upload__category upload__dnd-edit-field--margin"
                              >
                                <span className="upload__dnd-edit-label">
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
                                        formInputs.community_categories[
                                          community
                                        ]
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
              </>
            )}
          </>
        ) : null}

        {(file || intent === "new") && (
          <>
            <div className="container container--x container--full upload__row">
              <div className="upload__meta">
                <p className="upload__title">Publish</p>
                <p className="upload__description">
                  {isDone
                    ? "Your package has been successfully processed! Submission is now completing."
                    : "Ready to publish? This will zip your modifications and automatically submit the package to the selected communities."}
                </p>
              </div>
              <div className="upload__content">
                <div className="upload__buttons">
                  <NewButton
                    onClick={() => {
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
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                      handle?.abort();
                      setHandle(undefined);
                      setUsermedia(undefined);
                      setIsDone(false);
                      updateFormFieldState({
                        field: "author_name",
                        value: "",
                      });
                      updateFormFieldState({
                        field: "communities",
                        value: [],
                      });
                      updateFormFieldState({
                        field: "has_nsfw_content",
                        value: false,
                      });
                      updateFormFieldState({
                        field: "upload_uuid",
                        value: "",
                      });
                      updateFormFieldState({
                        field: "categories",
                        value: undefined,
                      });
                      updateFormFieldState({
                        field: "community_categories",
                        value: undefined,
                      });
                      setSubmissionStatus(undefined);
                    }}
                    csVariant="secondary"
                    csSize="big"
                  >
                    Reset
                  </NewButton>
                  <NewButton
                    disabled={
                      formInputs.communities.length === 0 || !!handle || isDone
                    }
                    onClick={handlePublishPackage}
                    csVariant="primary"
                    csSize="big"
                    rootClasses="upload__submit"
                  >
                    Publish Package
                  </NewButton>
                </div>
              </div>
            </div>
            <div className="upload__divider" />
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

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
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

function MiniPackageCard(props: {
  iconUrl?: string | null;
  name: string;
  author: string;
  version?: string;
  overlayText?: string;
  onAction?: (e: React.MouseEvent) => void;
  actionText?: string;
  actionVariant?: "primary" | "danger";
}) {
  return (
    <div className="upload__mini-card">
      <div className="upload__mini-card-icon-wrapper">
        {props.iconUrl ? (
          <img
            src={props.iconUrl}
            alt="icon"
            className="upload__mini-card-icon"
          />
        ) : (
          <FontAwesomeIcon
            icon={faFileZip}
            className="upload__mini-card-icon-fallback"
          />
        )}
      </div>
      <div className="upload__mini-card-content">
        <h4 className="upload__mini-card-title">
          {props.name || "Unknown Package"}
        </h4>
        <div className="upload__mini-card-meta">
          <span>{props.author || "Unknown Author"}</span>
          {props.version && <span>{props.version}</span>}
        </div>
        {props.overlayText && (
          <span className="upload__mini-card-desc">{props.overlayText}</span>
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

const SubmissionResult = (props: {
  submissionStatusResult: PackageSubmissionResult;
}) => {
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
};
