import React, { useEffect, useState } from "react";

// Unused imports removed
import ConfigFile from "../../model/ConfigFile";
import ConfigLine from "../../model/ConfigLine";
import Profile from "../../model/Profile";
import LoggerProvider, { LogSeverity } from "../../providers/LoggerProvider";
import ConfigService from "../../services/ConfigService";
import "./ConfigEditorView.css";

const ConfigEditorView: React.FC = () => {
  const [configFiles, setConfigFiles] = useState<ConfigFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ConfigFile | null>(null);
  const [fileContent, setFileContent] = useState<{
    [section: string]: { [variable: string]: ConfigLine };
  } | null>(null);
  const [originalContent, setOriginalContent] = useState<string>("");

  // UI States
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    loadConfigFiles();
  }, []);

  const loadConfigFiles = async () => {
    setLoading(true);
    try {
      const profile = Profile.getActiveAsImmutableProfile();
      const files = await ConfigService.getConfigFiles(profile);
      setConfigFiles(files);
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Loaded ${files.length} config files.`
      );
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Failed to load config files: ${e.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = async (file: ConfigFile) => {
    if (unsavedChanges) {
      if (!confirm("You have unsaved changes. Discard them?")) return;
    }

    setLoading(true);
    setSelectedFile(file);
    setUnsavedChanges(false);

    try {
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Opening config file: ${file.getName()}`
      );
      const content = await ConfigService.readConfigFile(file);
      setOriginalContent(content);
      const parsed = await ConfigService.parseConfig(content);
      setFileContent(parsed);
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Failed to parse config file ${file.getName()}: ${e.message}`
      );
      alert("Failed to parse configuration file.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFile || !fileContent) return;

    setLoading(true);
    try {
      await ConfigService.updateConfig(
        selectedFile,
        originalContent,
        fileContent
      );
      setUnsavedChanges(false);

      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Saved config file: ${selectedFile.getName()}`
      );

      // Reload to ensure sync
      const content = await ConfigService.readConfigFile(selectedFile);
      setOriginalContent(content);
      const parsed = await ConfigService.parseConfig(content);
      setFileContent(parsed);
      alert("Config saved successfully!");
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Failed to save config ${selectedFile.getName()}: ${e.message}`
      );
      alert(`Failed to save config: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateValue = (
    section: string,
    variable: string,
    newValue: string
  ) => {
    if (!fileContent) return;

    // Deep copy to trigger potential re-renders or safety
    const newContent = { ...fileContent };
    newContent[section] = { ...newContent[section] };

    const line = newContent[section][variable];
    line.value = newValue;

    setFileContent(newContent);
    setUnsavedChanges(true);
  };

  const filteredFiles = configFiles.filter((f) =>
    f.getName().toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="config-editor-view">
      {/* Sidebar List */}
      <div className="config-editor-view__sidebar">
        <div className="config-editor-view__sidebar-search">
          <input
            className="config-editor-view__search-input"
            placeholder="Search configs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="config-editor-view__file-list">
          {filteredFiles.map((file) => (
            <div
              key={file.getName()}
              onClick={() => handleSelectFile(file)}
              className={`config-editor-view__file-item ${
                selectedFile?.getName() === file.getName()
                  ? "config-editor-view__file-item--active"
                  : ""
              }`}
            >
              <div
                className="config-editor-view__file-name"
                title={file.getName()}
              >
                {file.getName()}
              </div>
              <div className="config-editor-view__file-date">
                Last updated: {file.getLastUpdated().toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="config-editor-view__editor">
        {selectedFile && fileContent ? (
          <>
            <div className="config-editor-view__header">
              <h2 className="config-editor-view__title">
                {selectedFile.getName()}.cfg
              </h2>
              <button
                onClick={handleSave}
                disabled={!unsavedChanges}
                className={`config-editor-view__save-btn ${
                  unsavedChanges
                    ? "config-editor-view__save-btn--unsaved"
                    : "config-editor-view__save-btn--disabled"
                }`}
              >
                Save Changes
              </button>
            </div>
            <div className="config-editor-view__content">
              {Object.keys(fileContent).map((section) => (
                <div key={section} className="config-editor-view__section">
                  <h3 className="config-editor-view__section-title">
                    [{section}]
                  </h3>
                  <div className="config-editor-view__variables">
                    {Object.keys(fileContent[section]).map((variable) => {
                      const line = fileContent[section][variable];
                      const isBool =
                        line.value.toLowerCase() === "true" ||
                        line.value.toLowerCase() === "false";

                      // Check allowed values
                      const hasAllowed =
                        line.allowedValues && line.allowedValues.length > 0;

                      return (
                        <div
                          key={variable}
                          className="config-editor-view__item"
                        >
                          <div className="config-editor-view__label-row">
                            <label className="config-editor-view__label">
                              {variable}
                            </label>
                            {line.comments.length > 0 && (
                              <div className="config-editor-view__comments">
                                {line.comments.map((c, i) => (
                                  <div key={i}>{c.replace(/^[#;]\s*/, "")}</div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            {isBool ? (
                              <div className="config-editor-view__radio-group">
                                <label className="config-editor-view__radio-label">
                                  <input
                                    type="radio"
                                    name={`${section}-${variable}`}
                                    checked={
                                      line.value.toLowerCase() === "true"
                                    }
                                    onChange={() =>
                                      handleUpdateValue(
                                        section,
                                        variable,
                                        "true"
                                      )
                                    }
                                  />
                                  True
                                </label>
                                <label className="config-editor-view__radio-label">
                                  <input
                                    type="radio"
                                    name={`${section}-${variable}`}
                                    checked={
                                      line.value.toLowerCase() === "false"
                                    }
                                    onChange={() =>
                                      handleUpdateValue(
                                        section,
                                        variable,
                                        "false"
                                      )
                                    }
                                  />
                                  False
                                </label>
                              </div>
                            ) : (
                              <input
                                className="config-editor-view__input-text"
                                value={line.value}
                                onChange={(e) =>
                                  handleUpdateValue(
                                    section,
                                    variable,
                                    e.target.value
                                  )
                                }
                              />
                            )}
                            {/* Range validation visual could go here */}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="config-editor-view__empty">
            <div className="config-editor-view__empty-icon">⚙️</div>
            <div>Select a configuration file to edit</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigEditorView;
