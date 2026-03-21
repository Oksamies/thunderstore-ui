import { MarkdownEditor } from "~/commonComponents/MarkdownEditor/MarkdownEditor";

export interface MarkdownConfigurationProps {
  readmeContent: string;
  setReadmeContent: React.Dispatch<React.SetStateAction<string>>;
  changelogContent: string;
  setChangelogContent: React.Dispatch<React.SetStateAction<string>>;
}

export function MarkdownConfiguration({
  readmeContent,
  setReadmeContent,
  changelogContent,
  setChangelogContent,
}: MarkdownConfigurationProps) {
  return (
    <>
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
    </>
  );
}
