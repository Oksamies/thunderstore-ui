import { useState } from "react";
import { Markdown } from "~/commonComponents/Markdown/Markdown";

import { TextAreaInput } from "@thunderstore/cyberstorm";

import "./MarkdownEditor.css";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 10,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  return (
    <div className="markdown-editor">
      <div className="markdown-editor__tabs">
        <button
          className={`markdown-editor__tab ${
            activeTab === "edit" ? "markdown-editor__tab--active" : ""
          }`}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("edit");
          }}
        >
          Edit
        </button>
        <button
          className={`markdown-editor__tab ${
            activeTab === "preview" ? "markdown-editor__tab--active" : ""
          }`}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("preview");
          }}
        >
          Preview
        </button>
      </div>
      <div className="markdown-editor__content">
        {activeTab === "edit" ? (
          <TextAreaInput
            value={value}
            setValue={onChange}
            placeHolder={placeholder || "Enter markdown here..."}
            rows={rows}
            customClasses="markdown-editor__textarea"
          />
        ) : (
          <div className="markdown-editor__preview">
            <Markdown input={value} />
          </div>
        )}
      </div>
    </div>
  );
}
