import path from "path-browserify";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Profile, { ImmutableProfile } from "../model/Profile";
import FsProvider from "../providers/FsProvider";
import ProfileProvider from "../providers/ProfileProvider";
import "./Profiles.css";

const Profiles: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<string[]>([]);
  const [newProfileName, setNewProfileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [renamingProfile, setRenamingProfile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const fetchProfiles = async () => {
    try {
      const root = Profile.getRootDir();
      if (!(await FsProvider.instance.exists(root))) {
        await FsProvider.instance.mkdirs(root);
      }
      const entries = await FsProvider.instance.readdir(root);
      const validProfiles: string[] = [];
      for (const entry of entries) {
        const fullPath = path.join(root, entry);
        const stat = await FsProvider.instance.stat(fullPath);
        if (
          stat &&
          stat.isDirectory &&
          entry.toLowerCase() !== "_profile_update"
        ) {
          validProfiles.push(entry);
        }
      }

      // Ensure Default exists
      if (!validProfiles.includes("Default")) {
        await ProfileProvider.instance.createProfile("Default");
        validProfiles.push("Default");
      }

      setProfiles(validProfiles.sort());
    } catch (e) {
      console.error("Failed to list profiles", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreate = async () => {
    if (!newProfileName) return;
    if (profiles.includes(newProfileName)) {
      alert("Profile already exists");
      return;
    }

    try {
      await ProfileProvider.instance.createProfile(newProfileName);
      setNewProfileName("");
      await fetchProfiles();
    } catch (e) {
      console.error("Failed to create profile", e);
      alert("Failed to create profile");
    }
  };

  const handleDelete = async (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (
      !confirm(
        `Are you sure you want to delete profile "${name}"? This cannot be undone.`
      )
    )
      return;

    try {
      await ProfileProvider.instance.deleteProfile(name);
      await fetchProfiles();
    } catch (e) {
      console.error("Failed to delete profile", e);
      alert("Failed to delete profile");
    }
  };

  const handleRename = async (oldName: string) => {
    if (!renameValue || renameValue === oldName) {
      setRenamingProfile(null);
      return;
    }
    try {
      await ProfileProvider.instance.renameProfile(oldName, renameValue);
      setRenamingProfile(null);
      await fetchProfiles();
    } catch (e) {
      console.error("Failed to rename profile", e);
      alert("Failed to rename profile");
    }
  };

  const handleExport = async (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    try {
      const path = await ProfileProvider.instance.exportProfile(name);
      alert(`Profile exported to: ${path}`);
    } catch (e) {
      console.error("Failed to export profile", e);
      alert("Failed to export profile");
    }
  };

  const handleImport = async () => {
    try {
      const result = await window.electronAPI.openDialog({
        properties: ["openFile"],
        filters: [{ name: "Thunderstore Profile", extensions: ["r2z", "zip"] }],
      });
      if (result && result.length > 0) {
        const filePath = result[0];
        const name = prompt("Enter name for imported profile:");
        if (name) {
          await ProfileProvider.instance.importProfile(filePath, name);
          await fetchProfiles();
        }
      }
    } catch (e) {
      console.error("Failed to import profile", e);
      alert("Failed to import profile");
    }
  };

  const selectProfile = (name: string) => {
    if (renamingProfile) return;
    new Profile(name); // Sets active profile singleton
    navigate("/manager/installed");
  };

  const changeGame = () => {
    navigate("/", { state: { clearGame: true } });
  };

  return (
    <div className="profiles-page">
      <div className="profiles-page__header">
        <div className="profiles-page__header-left">
          <button onClick={changeGame} className="profiles-page__back-btn">
            &larr; Change Game
          </button>
          <h1 className="profiles-page__title">Select Profile</h1>
        </div>
        <div className="profiles-page__actions">
          <button className="profiles-page__btn-primary" onClick={handleImport}>
            Import File
          </button>
          <button
            className="profiles-page__btn-primary"
            onClick={async () => {
              const code = prompt("Enter profile import code:");
              if (code) {
                const name = prompt("Enter name for imported profile:");
                if (name) {
                  try {
                    await ProfileProvider.instance.importProfileCode(
                      code,
                      name
                    );
                    await fetchProfiles();
                    alert("Profile imported successfully!");
                  } catch (e) {
                    console.error(e);
                    alert("Failed to import profile code");
                  }
                }
              }
            }}
          >
            Import Code
          </button>
        </div>
      </div>

      <div className="profiles-page__create-row">
        <input
          className="profiles-page__input"
          placeholder="New Profile Name"
          value={newProfileName}
          onChange={(e) => setNewProfileName(e.target.value)}
        />
        <button className="profiles-page__create-btn" onClick={handleCreate}>
          Create
        </button>
      </div>

      <div className="profiles-page__list">
        {loading ? (
          <div>Loading profiles...</div>
        ) : (
          profiles.map((p) => (
            <div
              key={p}
              className="profiles-page__card group"
              onClick={() => selectProfile(p)}
            >
              {renamingProfile === p ? (
                <div
                  className="profiles-page__rename-container"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    className="profiles-page__rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    autoFocus
                  />
                  <button
                    className="profiles-page__btn-save"
                    onClick={() => handleRename(p)}
                  >
                    Save
                  </button>
                  <button
                    className="profiles-page__btn-cancel"
                    onClick={() => setRenamingProfile(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <span className="profiles-page__card-name">{p}</span>
              )}

              <div className="profiles-page__card-actions">
                {renamingProfile !== p && (
                  <>
                    <button
                      className="profiles-page__action-btn profiles-page__action-btn--rename"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingProfile(p);
                        setRenameValue(p);
                      }}
                      title="Rename Profile"
                    >
                      Rename
                    </button>
                    <button
                      className="profiles-page__action-btn profiles-page__action-btn--code"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const code =
                            await ProfileProvider.instance.exportProfileCode(p);
                          await navigator.clipboard.writeText(code);
                          alert(`Profile Code copied to clipboard: ${code}`);
                        } catch (e) {
                          console.error(e);
                          alert("Failed to export profile code");
                        }
                      }}
                      title="Export Profile as Code"
                    >
                      Code
                    </button>
                    <button
                      className="profiles-page__action-btn profiles-page__action-btn--file"
                      onClick={(e) => handleExport(e, p)}
                      title="Export Profile to File"
                    >
                      File
                    </button>
                    <button
                      className="profiles-page__action-btn profiles-page__action-btn--delete"
                      onClick={(e) => handleDelete(e, p)}
                      title="Delete Profile"
                    >
                      Delete
                    </button>
                    <span className="profiles-page__select-hint">
                      Select &rarr;
                    </span>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        {!loading && profiles.length === 0 && <div>No profiles found.</div>}
      </div>
    </div>
  );
};

export default Profiles;
