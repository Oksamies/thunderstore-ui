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
import { useRef, useState } from "react";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormat = (type: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let prefix = "";
    let suffix = "";
    let defaultText = "";

    switch (type) {
      case "bold":
        prefix = "**";
        suffix = "**";
        defaultText = "bold text";
        break;
      case "italic":
        prefix = "*";
        suffix = "*";
        defaultText = "italic text";
        break;
      case "link":
        prefix = "[";
        suffix = "](url)";
        defaultText = "link text";
        break;
      case "code":
        prefix = "`";
        suffix = "`";
        defaultText = "code";
        break;
      case "quote":
        prefix = "> ";
        suffix = "";
        defaultText = "quote";
        break;
      case "list":
        prefix = "- ";
        suffix = "";
        defaultText = "list item";
        break;
    }

    const textToInsert = selectedText || defaultText;
    const newText =
      value.substring(0, start) +
      prefix +
      textToInsert +
      suffix +
      value.substring(end);

    onChange(newText);

    // Set cursor position after state update
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + selectedText.length
        );
      } else {
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + defaultText.length
        );
      }
    }, 0);
  };

  return (
    <div className="comment-input">
      <div className="comment-input__toolbar">
        <div className="comment-input__toolbar-group">
          <Button
            csVariant="secondary"
            csSize="small"
            onClick={() => handleFormat("bold")}
            title="Bold"
            csModifiers={["only-icon", "ghost"]}
          >
            <Icon noWrapper>
              <FontAwesomeIcon icon={faBold} />
            </Icon>
          </Button>
          <Button
            csVariant="secondary"
            csSize="small"
            onClick={() => handleFormat("italic")}
            title="Italic"
            csModifiers={["only-icon", "ghost"]}
          >
            <Icon noWrapper>
              <FontAwesomeIcon icon={faItalic} />
            </Icon>
          </Button>
          <Button
            csVariant="secondary"
            csSize="small"
            onClick={() => handleFormat("link")}
            title="Link"
            csModifiers={["only-icon", "ghost"]}
          >
            <Icon noWrapper>
              <FontAwesomeIcon icon={faLink} />
            </Icon>
          </Button>
          <Button
            csVariant="secondary"
            csSize="small"
            onClick={() => handleFormat("code")}
            title="Code"
            csModifiers={["only-icon", "ghost"]}
          >
            <Icon noWrapper>
              <FontAwesomeIcon icon={faCode} />
            </Icon>
          </Button>
          <Button
            csVariant="secondary"
            csSize="small"
            onClick={() => handleFormat("quote")}
            title="Quote"
            csModifiers={["only-icon", "ghost"]}
          >
            <Icon noWrapper>
              <FontAwesomeIcon icon={faQuoteRight} />
            </Icon>
          </Button>
          <Button
            csVariant="secondary"
            csSize="small"
            onClick={() => handleFormat("list")}
            title="List"
            csModifiers={["only-icon", "ghost"]}
          >
            <Icon noWrapper>
              <FontAwesomeIcon icon={faListUl} />
            </Icon>
          </Button>
        </div>

        <div className="comment-input__spacer" />

        <div className="comment-input__toolbar-group">
          <Button
            csVariant="secondary"
            csSize="small"
            onClick={() => setMode(mode === "edit" ? "preview" : "edit")}
            csModifiers={["ghost"]}
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
          ref={textareaRef}
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
          csVariant="secondary"
          csSize="small"
          onClick={onSubmit}
          disabled={isSubmitting || !value.trim()}
        >
          Post
        </Button>
      </div>
    </div>
  );
}
