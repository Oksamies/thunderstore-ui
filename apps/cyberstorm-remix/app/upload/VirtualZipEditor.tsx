import {
  faFile,
  faFilePlus,
  faFolder,
  faFolderPlus,
  faPenToSquare,
  faTrash,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useRef, useState } from "react";

import { NewButton, NewIcon, NewTextInput } from "@thunderstore/cyberstorm";

import "./VirtualZipEditor.css";

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
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [draggingPath, setDraggingPath] = useState<string | null>(null);
  const [targetParent, setTargetParent] = useState<string>("");

  const [addingFolderTo, setAddingFolderTo] = useState<string | null>(null);
  const [subFolderName, setSubFolderName] = useState("");
  const isRenamingCancelled = useRef(false);

  useEffect(() => {
    if (editingPath && renameInputRef.current) {
      renameInputRef.current.focus();
    }
  }, [editingPath]);

  const handleAddFolder = (overrideName?: string | React.MouseEvent) => {
    const nameToUse =
      typeof overrideName === "string" ? overrideName : newFolderName;
    if (!nameToUse) return;
    const baseName = nameToUse.endsWith("/") ? nameToUse : `${nameToUse}/`;

    const folderPath = targetParent + baseName;

    if (!files.find((f) => f.path === folderPath)) {
      setFiles([...files, { path: folderPath, content: null }]);
    }
    setNewFolderName("");
    setTargetParent("");
  };

  const handleAddSubFolder = (
    parentPath: string,
    overrideName?: string | React.MouseEvent
  ) => {
    const nameToUse =
      typeof overrideName === "string" ? overrideName : subFolderName;
    if (!nameToUse) return;
    const baseName = nameToUse.endsWith("/") ? nameToUse : `${nameToUse}/`;

    const folderPath = parentPath + baseName;

    if (!files.find((f) => f.path === folderPath)) {
      setFiles([...files, { path: folderPath, content: null }]);
    }
    setSubFolderName("");
    setAddingFolderTo(null);
  };

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: VirtualFile[] = [];
      for (const file of Array.from(e.target.files)) {
        const lowerName = file.name.toLowerCase();
        if (
          targetParent === "" &&
          lowerName === "readme.md" &&
          onReadmeChange
        ) {
          const text = await file.text();
          onReadmeChange(text);
        } else if (
          targetParent === "" &&
          lowerName === "changelog.md" &&
          onChangelogChange
        ) {
          const text = await file.text();
          onChangelogChange(text);
        } else {
          newFiles.push({
            path: targetParent + file.name,
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
    setTargetParent("");
  };

  const startRename = (oldPath: string) => {
    setEditingPath(oldPath);
    setEditName(oldPath);
  };

  const commitRename = (overrideName?: string) => {
    const finalName =
      overrideName !== undefined && typeof overrideName === "string"
        ? overrideName
        : editName;
    if (editingPath && finalName && finalName !== editingPath) {
      const isFolder = editingPath.endsWith("/");
      let finalNewName = finalName;

      if (isFolder && !finalNewName.endsWith("/")) {
        finalNewName += "/";
      }

      setFiles((prev) =>
        prev.map((f) => {
          if (f.path === editingPath) {
            return { ...f, path: finalNewName };
          }
          if (isFolder && f.path.startsWith(editingPath)) {
            return {
              ...f,
              path: finalNewName + f.path.substring(editingPath.length),
            };
          }
          return f;
        })
      );
    }
    setEditingPath(null);
    setEditName("");
  };

  const cancelRename = () => {
    setEditingPath(null);
    setEditName("");
  };

  const removeFile = (pathToRemove: string) => {
    if (pathToRemove.endsWith("/")) {
      setFiles((prev) => prev.filter((f) => !f.path.startsWith(pathToRemove)));
    } else {
      setFiles((prev) => prev.filter((f) => f.path !== pathToRemove));
    }
  };

  const handleDragStart = (e: React.DragEvent, path: string) => {
    setDraggingPath(path);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetFolder: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggingPath || draggingPath === targetFolder) {
      setDraggingPath(null);
      return;
    }

    if (draggingPath.endsWith("/") && targetFolder.startsWith(draggingPath)) {
      setDraggingPath(null);
      return;
    }

    setFiles((prev) => {
      const itemName =
        draggingPath.split("/").filter(Boolean).pop() +
        (draggingPath.endsWith("/") ? "/" : "");
      const newPath = targetFolder + itemName;

      return prev.map((f) => {
        if (f.path === draggingPath) {
          return { ...f, path: newPath };
        }
        if (draggingPath.endsWith("/") && f.path.startsWith(draggingPath)) {
          return {
            ...f,
            path: newPath + f.path.substring(draggingPath.length),
          };
        }
        return f;
      });
    });
    setDraggingPath(null);
  };

  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  const getDepth = (path: string) => {
    const parts = path.split("/");
    return path.endsWith("/") ? parts.length - 2 : parts.length - 1;
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
        <ul
          className="virtual-zip-editor__list"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "")}
        >
          {sortedFiles.map((file) => {
            const depth = getDepth(file.path);
            const isFolder = file.path.endsWith("/");

            return (
              <React.Fragment key={file.path}>
                <li
                  className="virtual-zip-editor__list-item"
                  style={{ marginLeft: `${depth * 20}px` }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, file.path)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => isFolder && handleDrop(e, file.path)}
                >
                  <span className="virtual-zip-editor__list-item-content">
                    <NewIcon
                      csMode="inline"
                      noWrapper
                      rootClasses="virtual-zip-editor__icon"
                    >
                      <FontAwesomeIcon icon={isFolder ? faFolder : faFile} />
                    </NewIcon>
                    {editingPath === file.path ? (
                      <NewTextInput
                        type="text"
                        value={editName}
                        csSize="small"
                        ref={renameInputRef}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditName(e.target.value)
                        }
                        enterHook={() => commitRename()}
                        onKeyDown={(
                          e: React.KeyboardEvent<HTMLInputElement>
                        ) => {
                          console.log("Key pressed:", e.key);
                          if (e.key === "Escape") {
                            console.log("Escape recognized");
                            isRenamingCancelled.current = true;
                            cancelRename();
                          }
                        }}
                        onBlur={() => {
                          if (isRenamingCancelled.current) {
                            isRenamingCancelled.current = false;
                            return;
                          }
                          commitRename();
                        }}
                        className="virtual-zip-editor__inline-input"
                      />
                    ) : (
                      file.path.split("/").filter(Boolean).pop() +
                      (isFolder ? "/" : "")
                    )}
                  </span>
                  <div className="virtual-zip-editor__actions">
                    {isFolder && (
                      <>
                        <button
                          className="virtual-zip-editor__action-btn virtual-zip-editor__action-btn--add"
                          onClick={() => {
                            setAddingFolderTo(file.path);
                            setSubFolderName("");
                          }}
                          title="Add Folder Here"
                        >
                          <NewIcon csMode="inline" noWrapper>
                            <FontAwesomeIcon icon={faFolderPlus} />
                          </NewIcon>
                        </button>
                        <button
                          className="virtual-zip-editor__action-btn virtual-zip-editor__action-btn--add"
                          onClick={() => {
                            setTargetParent(file.path);
                            fileInputRef.current?.click();
                          }}
                          title="Add File Here"
                        >
                          <NewIcon csMode="inline" noWrapper>
                            <FontAwesomeIcon icon={faFilePlus} />
                          </NewIcon>
                        </button>
                      </>
                    )}
                    <button
                      className="virtual-zip-editor__action-btn"
                      onClick={() => startRename(file.path)}
                      title="Rename"
                    >
                      <NewIcon csMode="inline" noWrapper>
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </NewIcon>
                    </button>
                    <button
                      className="virtual-zip-editor__action-btn virtual-zip-editor__action-btn--danger"
                      onClick={() => removeFile(file.path)}
                      title="Remove"
                    >
                      <NewIcon csMode="inline" noWrapper>
                        <FontAwesomeIcon icon={faTrash} />
                      </NewIcon>
                    </button>
                  </div>
                </li>
                {addingFolderTo === file.path && (
                  <li
                    className="virtual-zip-editor__list-item"
                    style={{ marginLeft: `${(depth + 1) * 20}px` }}
                  >
                    <span className="virtual-zip-editor__list-item-content">
                      <NewIcon
                        csMode="inline"
                        noWrapper
                        rootClasses="virtual-zip-editor__icon"
                      >
                        <FontAwesomeIcon icon={faFolderPlus} />
                      </NewIcon>
                      <NewTextInput
                        type="text"
                        placeholder={`New subfolder in ${file.path}...`}
                        value={subFolderName}
                        csSize="small"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setSubFolderName(e.target.value)
                        }
                        enterHook={() => handleAddSubFolder(file.path)}
                        onKeyDown={(
                          e: React.KeyboardEvent<HTMLInputElement>
                        ) => {
                          if (e.key === "Escape") {
                            setAddingFolderTo(null);
                            setSubFolderName("");
                          }
                        }}
                        className="virtual-zip-editor__inline-input"
                      />
                    </span>
                    <div className="virtual-zip-editor__actions">
                      <NewButton
                        onClick={() => handleAddSubFolder(file.path)}
                        csSize="small"
                        csVariant="secondary"
                      >
                        Add
                      </NewButton>
                      <NewButton
                        onClick={() => {
                          setAddingFolderTo(null);
                          setSubFolderName("");
                        }}
                        csSize="small"
                        csVariant="secondary"
                      >
                        Cancel
                      </NewButton>
                    </div>
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ul>
        <div
          className="virtual-zip-editor__list-item virtual-zip-editor__add-controls"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "")}
        >
          <span className="virtual-zip-editor__list-item-content">
            <NewIcon
              csMode="inline"
              noWrapper
              rootClasses="virtual-zip-editor__icon"
            >
              <FontAwesomeIcon icon={faFolderPlus} />
            </NewIcon>
            <NewTextInput
              type="text"
              placeholder={
                targetParent
                  ? `New folder in ${targetParent}...`
                  : "New folder name..."
              }
              value={newFolderName}
              csSize="small"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewFolderName(e.target.value)
              }
              enterHook={() => handleAddFolder()}
              className="virtual-zip-editor__inline-input"
            />
          </span>
          <div className="virtual-zip-editor__actions">
            <NewButton
              onClick={() => setTargetParent("")}
              csSize="small"
              csVariant="secondary"
              style={{ display: targetParent ? "block" : "none" }}
            >
              Clear Target
            </NewButton>
            <NewButton
              onClick={handleAddFolder}
              csSize="small"
              csVariant="secondary"
            >
              Add
            </NewButton>
            <NewButton
              onClick={() => {
                setTargetParent("");
                fileInputRef.current?.click();
              }}
              csSize="small"
              csVariant="secondary"
            >
              <NewIcon csMode="inline" noWrapper>
                <FontAwesomeIcon icon={faFilePlus} />
              </NewIcon>
              Add Files
            </NewButton>
          </div>
        </div>
      </div>
    </div>
  );
}
