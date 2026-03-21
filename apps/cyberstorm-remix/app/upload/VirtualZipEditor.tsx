import {
  faFile,
  faFilePlus,
  faFolder,
  faFolderPlus,
  faPenToSquare,
  faTrash,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useRef, useState } from "react";

import { NewButton, NewTextInput } from "@thunderstore/cyberstorm";

export interface VirtualFile {
  path: string;
  content: File | null;
}

export interface VirtualZipEditorProps {
  files: VirtualFile[];
  setFiles: React.Dispatch<React.SetStateAction<VirtualFile[]>>;
  onReadmeChange?: (content: string) => void;
  onChangelogChange?: (content: string) => void;
}

export function VirtualZipEditor({
  files,
  setFiles,
  onReadmeChange,
  onChangelogChange,
}: VirtualZipEditorProps) {
  const [newFolderName, setNewFolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddFolder = () => {
    if (!newFolderName) return;
    const folderPath = newFolderName.endsWith("/")
      ? newFolderName
      : `${newFolderName}/`;

    if (!files.find((f) => f.path === folderPath)) {
      setFiles([...files, { path: folderPath, content: null }]);
    }
    setNewFolderName("");
  };

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: VirtualFile[] = [];
      for (const file of Array.from(e.target.files)) {
        const lowerName = file.name.toLowerCase();
        if (lowerName === "readme.md" && onReadmeChange) {
          const text = await file.text();
          onReadmeChange(text);
        } else if (lowerName === "changelog.md" && onChangelogChange) {
          const text = await file.text();
          onChangelogChange(text);
        } else {
          newFiles.push({
            path: file.name,
            content: file,
          });
        }
      }
      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRename = (oldPath: string) => {
    const newPath = prompt("Enter new name:", oldPath);
    if (newPath && newPath !== oldPath) {
      setFiles(
        files.map((f) => (f.path === oldPath ? { ...f, path: newPath } : f))
      );
    }
  };

  const removeFile = (pathToRemove: string) => {
    setFiles(files.filter((f) => f.path !== pathToRemove));
  };

  return (
    <div className="virtual-zip-editor">
      <div className="virtual-zip-editor__file-tree">
        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleAddFiles}
        />
        <ul className="virtual-zip-editor__list">
          {files.map((file) => (
            <li key={file.path} className="virtual-zip-editor__list-item">
              <span className="virtual-zip-editor__list-item-content">
                <FontAwesomeIcon
                  icon={file.path.endsWith("/") ? faFolder : faFile}
                  className="virtual-zip-editor__icon"
                />
                {file.path}
              </span>
              <div className="virtual-zip-editor__actions">
                <button
                  className="virtual-zip-editor__action-btn"
                  onClick={() => handleRename(file.path)}
                  title="Rename"
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                </button>
                <button
                  className="virtual-zip-editor__action-btn virtual-zip-editor__action-btn--danger"
                  onClick={() => removeFile(file.path)}
                  title="Remove"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </li>
          ))}
          <li className="virtual-zip-editor__list-item virtual-zip-editor__add-controls">
            <span className="virtual-zip-editor__list-item-content">
              <FontAwesomeIcon
                icon={faFolderPlus}
                className="virtual-zip-editor__icon"
              />
              <NewTextInput
                type="text"
                placeholder="New folder name..."
                value={newFolderName}
                csSize="small"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewFolderName(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    handleAddFolder();
                  }
                }}
                className="virtual-zip-editor__inline-input"
              />
            </span>
            <div className="virtual-zip-editor__actions">
              <NewButton
                onClick={handleAddFolder}
                csSize="small"
                csVariant="secondary"
              >
                Add
              </NewButton>
              <NewButton
                onClick={() => fileInputRef.current?.click()}
                csSize="small"
                csVariant="primary"
              >
                <FontAwesomeIcon icon={faFilePlus} /> Add Files
              </NewButton>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
