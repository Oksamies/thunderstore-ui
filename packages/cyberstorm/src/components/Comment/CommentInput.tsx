import {
  faBold,
  faCode,
  faEye,
  faItalic,
  faLink,
  faListUl,
  faPen,
  faQuoteRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";

import { Button } from "../../newComponents/Button/Button";
import { Icon } from "../../newComponents/Icon/Icon";
import "./Comment.css";

export interface CommentInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  isSubmitting?: boolean;
}

export function CommentInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Leave a comment",
  isSubmitting = false,
}: CommentInputProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  // TODO: Implement actual text insertion logic (using ref for cursor position)
  const handleFormat = (type: string) => {
    // Placeholder logic
    console.log("Format", type);
  };

  return (
    <div className="comment-input">
      <div className="comment-input__toolbar">
        <div className="comment-input__toolbar-group">
          <Button
            csVariant="tertiary"
            csSize="small"
            onClick={() => handleFormat("bold")}
            title="Bold"
          >
            <Icon noWrapper>
              <FontAwesomeIcon icon={faBold} />
            </Icon>
          </Button>
          <Button
            csVariant="tertiary"
            csSize="small"
            onClick={() => handleFormat("italic")}
            title="Italic"
          >
            <Icon noWrapper>
              <FontAwesomeIcon icon={faItalic} />
            </Icon>
          </Button>
          <Button
            csVariant="tertiary"
            csSize="small"
            onClick={() => handleFormat("link")}
            title="Link"
          >
            <Icon noWrapper>
              <FontAwesomeIcon icon={faLink} />
            </Icon>
          </Button>
          <Button
            csVariant="tertiary"
            csSize="small"
            onClick={() => handleFormat("code")}
            title="Code"
          >
            <Icon noWrapper>
              <FontAwesomeIcon icon={faCode} />
            </Icon>
          </Button>
          <Button
            csVariant="tertiary"
            csSize="small"
            onClick={() => handleFormat("quote")}
            title="Quote"
          >
            <Icon noWrapper>
              <FontAwesomeIcon icon={faQuoteRight} />
            </Icon>
          </Button>
          <Button
            csVariant="tertiary"
            csSize="small"
            onClick={() => handleFormat("list")}
            title="List"
          >
            <Icon noWrapper>
              <FontAwesomeIcon icon={faListUl} />
            </Icon>
          </Button>
        </div>

        <div className="comment-input__spacer" />

        <div className="comment-input__toolbar-group">
          <Button
            csVariant="tertiary"
            csSize="small"
            onClick={() => setMode(mode === "edit" ? "preview" : "edit")}
          >
            <Icon csMode="inline" noWrapper>
              <FontAwesomeIcon icon={mode === "edit" ? faEye : faPen} />
            </Icon>
            <span style={{ marginLeft: "0.5rem" }}>
              {mode === "edit" ? "Preview" : "Edit"}
            </span>
          </Button>
        </div>
      </div>

      {mode === "edit" ? (
        <textarea
          className="comment-input__textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={isSubmitting}
        />
      ) : (
        <div className="comment-input__preview">
          {value ? (
            value.split("\n").map((line, i) => <p key={i}>{line}</p>)
          ) : (
            <span className="comment-input__preview-empty">
              Nothing to preview
            </span>
          )}
        </div>
      )}

      <div className="comment-input__footer">
        <span className="comment-input__hint">Markdown supported</span>
        <Button
          csVariant="primary"
          onClick={onSubmit}
          disabled={isSubmitting || !value.trim()}
        >
          Post Comment
        </Button>
      </div>
    </div>
  );
}
