import { useCallback, useEffect, useRef } from "react";

import { useToast } from "@thunderstore/cyberstorm";
import type { DapperTs } from "@thunderstore/dapper-ts";
import type { PackageSubmissionStatus } from "@thunderstore/dapper/types";
import type {
  PackageSubmissionRequestData,
  RequestConfig,
} from "@thunderstore/thunderstore-api";
import {
  type IBaseUploadHandle,
  MultipartUpload,
  type UserMedia,
} from "@thunderstore/ts-uploader";

import type { VirtualFile } from "./VirtualZipEditor";
import {
  createNewPackageZip,
  extractPackageContents,
  repackageExistingZip,
} from "./zipUtils";

export interface UseUploadActionsProps {
  dapper: DapperTs;
  toast: ReturnType<typeof useToast>;
  requestConfig: () => RequestConfig;
  setOriginalZipBuffer: (buffer: ArrayBuffer | null) => void;
  setVirtualFiles: (virtualFiles: VirtualFile[]) => void;
  setVersionNumber: (version: string) => void;
  setPackageName: (name: string) => void;
  setWebsiteUrl: (url: string) => void;
  setPackageDescription: (desc: string) => void;
  setIconPreviewUrl: (url: string) => void;
  setReadmeContent: (content: string) => void;
  setChangelogContent: (content: string) => void;
  setFile: (file: File | null) => void;
  formInputs: PackageSubmissionRequestData;
  searchPackageName: string;
  intent: "new" | "update";
  file: File | null;
  originalZipBuffer: ArrayBuffer | null;
  virtualFiles: VirtualFile[];
  readmeContent: string;
  changelogContent: string;
  newIconFile: File | null;
  packageName: string;
  versionNumber: string;
  websiteUrl: string;
  packageDescription: string;
  dependencies: { name: string; namespace: string; version: string }[];
  setDependencies: (
    deps: { name: string; namespace: string; version: string }[]
  ) => void;
  setHandle: (handle: IBaseUploadHandle | undefined) => void;
  setUsermedia: (usermedia: UserMedia) => void;
  setIsDone: (done: boolean) => void;
  submissionStatus: PackageSubmissionStatus | undefined;
  setSubmissionStatus: (status: PackageSubmissionStatus | undefined) => void;
}

export function useUploadActions({
  dapper,
  toast,
  requestConfig,
  setOriginalZipBuffer,
  setVirtualFiles,
  setVersionNumber,
  setWebsiteUrl,
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
  websiteUrl,
  versionNumber,
  packageDescription,
  dependencies,
  setDependencies,
  setHandle,
  setUsermedia,
  setIsDone,
  submissionStatus,
  setSubmissionStatus,
}: UseUploadActionsProps) {
  const extractFilesFromZip = async (zipFile: File) => {
    try {
      const {
        buffer,
        readme,
        changelog,
        manifest,
        iconPreviewUrl,
        virtualFiles,
      } = await extractPackageContents(zipFile);
      setOriginalZipBuffer(buffer);
      setVirtualFiles(virtualFiles);
      setReadmeContent(readme);
      setChangelogContent(changelog);
      if (manifest.version_number) setVersionNumber(manifest.version_number);
      if (manifest.website_url) setWebsiteUrl(manifest.website_url);
      if (manifest.name) setPackageName(manifest.name);
      if (manifest.description) setPackageDescription(manifest.description);
      if (manifest.dependencies && Array.isArray(manifest.dependencies)) {
        const parsedDependencies = manifest.dependencies.reduce(
          (acc, dep) => {
            if (typeof dep !== "string") return acc;
            const parts = dep.split("-");
            if (parts.length >= 3) {
              const version = parts.pop()!;
              const name = parts.pop()!;
              const namespace = parts.join("-");
              acc.push({ namespace, name, version });
            }
            return acc;
          },
          [] as { namespace: string; name: string; version: string }[]
        );
        setDependencies(parsedDependencies);
      }
      if (iconPreviewUrl) setIconPreviewUrl(iconPreviewUrl);
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
        // Just to be completely certain we get the true latest, sort them by date created descending.
        const sortedVersions = [...versions].sort(
          (a, b) =>
            new Date(b.datetime_created).getTime() -
            new Date(a.datetime_created).getTime()
        );
        const latestVersion = sortedVersions[0];
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
        fileToUpload = await createNewPackageZip({
          virtualFiles,
          readmeContent,
          changelogContent,
          newIconFile,
          packageName,
          versionNumber,
          websiteUrl,
          packageDescription,
          dependencies,
          authorName: formInputs.author_name || "",
        });
      } catch (error) {
        toast.addToast({
          csVariant: "danger",
          children:
            error instanceof Error
              ? error.message
              : "Failed to compile files into zip",
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
          websiteUrl ||
          newIconFile ||
          virtualFiles.length > 0 ||
          dependencies.length > 0 ||
          packageName ||
          packageDescription)
      ) {
        try {
          fileToUpload = await repackageExistingZip({
            originalZipBuffer,
            virtualFiles,
            readmeContent,
            changelogContent,
            newIconFile,
            packageName,
            websiteUrl,
            versionNumber,
            packageDescription,
            dependencies,
            authorName: formInputs.author_name || "",
            originalFileName: file.name,
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
      toast.addToast({
        csVariant: "danger",
        children: "API host is not configured",
        duration: 8000,
      });
      return;
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
    websiteUrl,
    newIconFile,
    packageName,
    formInputs.author_name,
    intent,
    virtualFiles,
    packageDescription,
    dependencies,
    setHandle,
    setUsermedia,
    setIsDone,
  ]);

  const pollSubmission = useCallback(
    async (
      submissionId: string,
      noSleep?: boolean
    ): Promise<PackageSubmissionStatus> => {
      if (!noSleep) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
      toast.addToast({
        csVariant: "info",
        children: "Polling submission status",
        duration: 4000,
      });
      return await dapper.getPackageSubmissionStatus(submissionId);
    },
    [dapper, toast]
  );

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
          toast.addToast({
            csVariant: "danger",
            children: `Error polling submission status: ${error.message}`,
            duration: 8000,
          });
        });
    }
  }, [submissionStatus, pollSubmission, setSubmissionStatus, toast]);

  const retryPolling = useCallback(() => {
    if (submissionStatus?.id) {
      pollSubmission(submissionStatus.id, true).then((data) => {
        setSubmissionStatus(data);
      });
    }
  }, [submissionStatus?.id, pollSubmission, setSubmissionStatus]);

  return {
    extractFilesFromZip,
    fetchExistingPackage,
    startUpload,
    pollSubmission,
    retryPolling,
  };
}
