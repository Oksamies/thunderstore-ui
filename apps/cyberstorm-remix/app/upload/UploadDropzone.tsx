import { faFileZip, faTreasureChest } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { MutableRefObject } from "react";

import {
  NewAlert,
  NewButton,
  NewIcon,
  classnames,
} from "@thunderstore/cyberstorm";
import { DnDFileInput } from "@thunderstore/react-dnd";
import type { IBaseUploadHandle, UserMedia } from "@thunderstore/ts-uploader";

import { formatBytes } from "./SubmissionResult";

interface UploadDropzoneProps {
  file: File | null;
  setFile: (file: File | null) => void;
  iconPreviewUrl: string;
  packageName: string;
  authorName: string;
  versionNumber: string;
  packageDescription: string;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  setReadmeContent: (content: string) => void;
  setChangelogContent: (content: string) => void;
  setVersionNumber: (version: string) => void;
  setPackageName: (name: string) => void;
  setPackageDescription: (desc: string) => void;
  setIconPreviewUrl: (url: string) => void;
  setNewIconFile: (file: File | null) => void;
  setOriginalZipBuffer: (buffer: ArrayBuffer | null) => void;
  handle: IBaseUploadHandle | undefined;
  setHandle: (handle: IBaseUploadHandle | undefined) => void;
  setUsermedia: (userMedia: UserMedia | undefined) => void;
  setIsDone: (isDone: boolean) => void;
  extractFilesFromZip: (file: File) => void;
}

export function UploadDropzone({
  file,
  setFile,
  iconPreviewUrl,
  packageName,
  authorName,
  versionNumber,
  packageDescription,
  fileInputRef,
  setReadmeContent,
  setChangelogContent,
  setVersionNumber,
  setPackageName,
  setPackageDescription,
  setIconPreviewUrl,
  setNewIconFile,
  setOriginalZipBuffer,
  handle,
  setHandle,
  setUsermedia,
  setIsDone,
  extractFilesFromZip,
}: UploadDropzoneProps) {
  return (
    <div className="upload__source-column">
      <NewAlert csVariant="info">
        Upload a ZIP file to auto-fill metadata and markdown contents, or
        continue without one to enter details manually.
      </NewAlert>
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
                  <span>{authorName || "Unknown Author"}</span>
                  <span>•</span>
                  <span>{versionNumber || "Unknown Version"}</span>
                  <span>•</span>
                  <span>
                    {file.size > 0 ? formatBytes(file.size) : "0 Bytes"}
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
              <NewIcon wrapperClasses="drag-n-drop__icon" csVariant="accent">
                <FontAwesomeIcon icon={faFileZip} />
              </NewIcon>
              <span className="drag-n-drop__main-text">
                Drag and drop your ZIP file here
              </span>
              <span className="drag-n-drop__sub-text">5GB max</span>
            </div>
          )
        }
        dragState={
          <div className="drag-n-drop__body">
            <NewIcon wrapperClasses="drag-n-drop__icon" csVariant="accent">
              <FontAwesomeIcon icon={faTreasureChest} />
            </NewIcon>
            {file ? (
              <span>{file.name}</span>
            ) : (
              <span className="drag-n-drop__main-text">Drag file here</span>
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
              setIconPreviewUrl(URL.createObjectURL(selectedFile));
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
  );
}
