import {
  faCaretDown,
  faCaretUp,
  faCode,
  faEllipsisH,
  faFlag,
  faGem,
  faHeartCircleBolt,
  faPen,
  faQuoteLeft,
  faReply,
  faTrash,
  faTrashRestore,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

import { Avatar } from "../../newComponents/Avatar/Avatar";
import { Button } from "../../newComponents/Button/Button";
import { DropDown, DropDownItem } from "../../newComponents/DropDown/DropDown";
import { Icon } from "../../newComponents/Icon/Icon";
import { Popover } from "../../newComponents/Popover/Popover";
import { Tag } from "../../newComponents/Tag/Tag";
import { classnames, componentClasses } from "../../utils/utils";
import { RelativeTime } from "../RelativeTime/RelativeTime";
import "./Comment.css";
import { CommentInput } from "./CommentInput";

export interface CommentProps {
  id: string;
  rootClasses?: string;
  author: {
    username: string;
    avatar: string;
    badges?: string[];
  };
  timestamp: string;
  content: string; // Markdown supported in theory, but currently strings.
  reactions?: Record<string, { count: number; user_reacted: boolean }>;
  replies?: CommentProps[];
  replyCount?: number;
  isReply?: boolean; // Prop to indicate if this is a reply (child comment)
  onReply?: (commentId: string) => void;
  onSubmitReply?: (commentId: string, content: string) => Promise<void> | void;
  onVote?: (commentId: string, vote: -1 | 0 | 1) => void;
  onReaction?: (commentId: string, reaction: string) => void;
  onEdit?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  onRestore?: (commentId: string) => void;
  onReport?: (commentId: string) => void;
  onExpandReplies?: (commentId: string) => void;
  isDeleted?: boolean;
}

/**
 * Parsing helper (temporary until we have full MD parser here or pass in components)
 * This is just to demonstrate the Quote and Pre blocks support.
 */
const parseContent = (content: string) => {
  const parts = [];
  const lines = content.split("\n");
  let inCode = false;
  let codeBlock: string[] = [];
  let inQuote = false;
  let quoteBlock: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle Code Blocks
    if (line.trim().startsWith("```")) {
      if (inCode) {
        parts.push({ type: "code", content: codeBlock.join("\n") });
        codeBlock = [];
        inCode = false;
      } else {
        // Flush any existing text
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBlock.push(line);
      continue;
    }

    // Handle Quotes
    if (line.trim().startsWith(">")) {
      inQuote = true;
      quoteBlock.push(line.replace(/^>\s?/, ""));
      continue;
    }
    if (inQuote && line.trim() === "") {
      parts.push({ type: "quote", content: quoteBlock.join("\n") });
      quoteBlock = [];
      inQuote = false;
      continue;
    }

    // Normal Text
    if (!inQuote && !inCode) {
      if (quoteBlock.length > 0) {
        parts.push({ type: "quote", content: quoteBlock.join("\n") });
        quoteBlock = [];
        inQuote = false;
      }
      parts.push({ type: "text", content: line });
    }
  }

  // Cleanup
  if (codeBlock.length > 0)
    parts.push({ type: "code", content: codeBlock.join("\n") });
  if (quoteBlock.length > 0)
    parts.push({ type: "quote", content: quoteBlock.join("\n") });

  return parts;
};

const REACTION_EMOJIS: Record<string, string> = {
  thumbs_up: "👍",
  thumbs_down: "👎",
  heart: "❤️",
  laugh: "😄",
  confused: "😕",
  rocket: "🚀",
};

export function Comment({
  id,
  author,
  timestamp,
  content,
  reactions,
  replies,
  replyCount,
  rootClasses,
  isReply = false,
  onReply,
  onVote,
  onReaction,
  onEdit,
  onDelete,
  onRestore,
  onReport,
  onExpandReplies,
  onSubmitReply,
  isDeleted = false,
}: CommentProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [areRepliesOpen, setAreRepliesOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);

  const handleReplyClick = () => {
    if (onReply) {
      onReply(id);
    }
    setIsReplying(!isReplying);
  };

  const handleReplySubmit = async () => {
    if (onSubmitReply && replyText.trim()) {
      await onSubmitReply(id, replyText);
      setReplyText("");
      setIsReplying(false);
      setAreRepliesOpen(true);
    }
  };

  const handleEditClick = () => {
    onEdit?.(id);
  };

  const handleDeleteClick = () => {
    onDelete?.(id);
  };

  const handleRestoreClick = () => {
    onRestore?.(id);
  };

  const handleReportClick = () => {
    onReport?.(id);
  };

  const handleReaction = (reaction: string) => {
    onReaction?.(id, reaction);
    setIsReactionPickerOpen(false);
  };

  const handleRepliesClick = () => {
    if (!areRepliesOpen && onExpandReplies) {
      onExpandReplies(id);
    }
    setAreRepliesOpen(!areRepliesOpen);
  };

  const parsedContent = parseContent(content);
  const totalReplies = replyCount ?? replies?.length ?? 0;
  const showRepliesButton = totalReplies > 0;

  return (
    <div className={classnames("comment", rootClasses)}>
      <div className="comment__entry">
        {/* Thread visual elements */}
        {isReply && <div className="comment__thread-curve" />}

        <div className="comment__gutter">
          <div className="comment__avatar-background">
            <Avatar
              username={author.username}
              src={author.avatar}
              csSize="verySmoll"
            />
          </div>
          {areRepliesOpen && replies && replies.length > 0 && (
            <div className="comment__thread-line" />
          )}
        </div>

        <div className="comment__wrapper">
          <div className="comment__main">
            <div className="comment__header">
              <div className="comment__badges">
                {author.badges?.map((badge) => {
                  if (badge === "maintainer") {
                    return (
                      <span
                        className="comment__badge"
                        title="Maintainer"
                        key={badge}
                      >
                        <Icon csMode="inline" csVariant="danger">
                          <FontAwesomeIcon icon={faCode} />
                        </Icon>
                      </span>
                    );
                  }
                  if (badge === "developer") {
                    return (
                      <span
                        className="comment__badge"
                        title="Developer"
                        key={badge}
                      >
                        <Icon csMode="inline" csVariant="info">
                          <FontAwesomeIcon icon={faGem} />
                        </Icon>
                      </span>
                    );
                  }
                  return (
                    <Tag key={badge} csSize="small" csVariant="primary">
                      {badge}
                    </Tag>
                  );
                })}
              </div>
              <span className="comment__author">{author.username}</span>
              <span className="comment__timestamp">
                <RelativeTime time={timestamp} />
              </span>
            </div>

            <div
              className={classnames(
                "comment__body",
                isDeleted ? "comment__body--deleted" : ""
              )}
            >
              {isDeleted ? (
                <div className="comment__deleted-message">
                  <Icon csMode="inline" csVariant="warning">
                    <FontAwesomeIcon icon={faTrash} />
                  </Icon>
                  <span>This comment has been deleted.</span>
                </div>
              ) : (
                parsedContent.map((part, i) => {
                  if (part.type === "quote") {
                    return (
                      <div className="comment__quote" key={i}>
                        <div className="comment__quote-content">
                          <div className="comment__quote-header">
                            <Icon csMode="inline" csVariant="primary">
                              <FontAwesomeIcon icon={faQuoteLeft} />
                            </Icon>
                            {author.username} wrote:
                          </div>
                          <div className="comment__quote-text">
                            {part.content}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  if (part.type === "code") {
                    return (
                      <pre className="comment__pre" key={i}>
                        {part.content}
                      </pre>
                    );
                  }
                  return (
                    <p key={i}>
                      {part.content || (
                        <span style={{ opacity: 0.5 }}>Empty line</span>
                      )}
                    </p>
                  );
                })
              )}
            </div>

            <div className="comment__footer">
              {!isDeleted && (
                <>
                  <Button
                    csVariant="secondary"
                    csSize="small"
                    onClick={handleReplyClick}
                  >
                    <Icon csMode="inline" noWrapper>
                      <FontAwesomeIcon icon={faReply} />
                    </Icon>
                    Reply
                  </Button>
                  <div className="comment-like-system">
                    {reactions &&
                      Object.entries(REACTION_EMOJIS).map(([key, emoji]) => {
                        const reactionData = reactions[key];
                        if (
                          !reactionData ||
                          (reactionData.count === 0 &&
                            !reactionData.user_reacted)
                        ) {
                          return null;
                        }
                        return (
                          <Button
                            key={key}
                            csVariant="secondary"
                            csSize="small"
                            csModifiers={["ghost"]}
                            rootClasses={classnames(
                              "comment-like-system__button",
                              reactionData.user_reacted
                                ? "comment-like-system__button--active"
                                : ""
                            )}
                            onClick={() => handleReaction(key)}
                            title={key.replace("_", " ")}
                          >
                            <span className="comment-like-system__emoji">
                              {emoji}
                            </span>
                            <span className="comment-like-system__count">
                              {reactionData.count}
                            </span>
                          </Button>
                        );
                      })}

                    <div className="comment-like-system__wrapper">
                      <Popover
                        open={isReactionPickerOpen}
                        onOpenChange={setIsReactionPickerOpen}
                        trigger={
                          <Button
                            csVariant="secondary"
                            csSize="small"
                            csModifiers={["ghost", "only-icon"]}
                            rootClasses="comment-like-system__button"
                            title="Add reaction"
                          >
                            <Icon csMode="inline" noWrapper>
                              <FontAwesomeIcon icon={faHeartCircleBolt} />
                            </Icon>
                          </Button>
                        }
                      >
                        <div className="comment-reaction-picker">
                          {Object.entries(REACTION_EMOJIS).map(
                            ([key, emoji]) => (
                              <button
                                key={key}
                                className="comment-reaction-picker__button"
                                onClick={() => handleReaction(key)}
                                title={key.replace("_", " ")}
                              >
                                {emoji}
                              </button>
                            )
                          )}
                        </div>
                      </Popover>
                    </div>
                  </div>
                  {showRepliesButton && (
                    <Button
                      csVariant="secondary"
                      csSize="small"
                      onClick={handleRepliesClick}
                    >
                      <Icon csMode="inline" noWrapper>
                        <FontAwesomeIcon
                          icon={areRepliesOpen ? faCaretUp : faCaretDown}
                        />
                      </Icon>
                      Replies
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      csVariant="secondary"
                      csSize="small"
                      onClick={handleEditClick}
                    >
                      <Icon csMode="inline" noWrapper>
                        <FontAwesomeIcon icon={faPen} />
                      </Icon>
                      Edit
                    </Button>
                  )}

                  {(onReport || onDelete) && (
                    <DropDown
                      trigger={
                        <button
                          className={classnames(
                            "button",
                            ...componentClasses(
                              "button",
                              "secondary",
                              "small",
                              ["only-icon"]
                            )
                          )}
                        >
                          <Icon csMode="inline" noWrapper>
                            <FontAwesomeIcon icon={faEllipsisH} />
                          </Icon>
                        </button>
                      }
                    >
                      {onReport && (
                        <DropDownItem onClick={handleReportClick}>
                          <div className="dropdown-item-content">
                            <Icon csMode="inline" noWrapper>
                              <FontAwesomeIcon icon={faFlag} />
                            </Icon>
                            Report
                          </div>
                        </DropDownItem>
                      )}
                      {onDelete && (
                        <DropDownItem
                          onClick={handleDeleteClick}
                          csVariant="primary"
                        >
                          <div className="dropdown-item-content">
                            <Icon csMode="inline" noWrapper>
                              <FontAwesomeIcon icon={faTrash} />
                            </Icon>
                            Delete
                          </div>
                        </DropDownItem>
                      )}
                    </DropDown>
                  )}
                </>
              )}
              {isDeleted && onRestore && (
                <div className="comment__actions-dropdown">
                  <DropDown
                    trigger={
                      <button
                        className={classnames(
                          "button",
                          ...componentClasses("button", "secondary", "small", [
                            "only-icon",
                          ])
                        )}
                      >
                        <Icon csMode="inline" noWrapper>
                          <FontAwesomeIcon icon={faEllipsisH} />
                        </Icon>
                      </button>
                    }
                  >
                    <DropDownItem onClick={handleRestoreClick}>
                      <div className="dropdown-item-content">
                        <Icon csMode="inline" noWrapper>
                          <FontAwesomeIcon icon={faTrashRestore} />
                        </Icon>
                        Restore
                      </div>
                    </DropDownItem>
                  </DropDown>
                </div>
              )}
            </div>

            {isReplying && (
              <div
                className="comment__reply-input"
                style={{ marginTop: "1rem", marginBottom: "1rem" }}
              >
                <CommentInput
                  value={replyText}
                  onChange={setReplyText}
                  onSubmit={handleReplySubmit}
                  placeholder={`Replying to ${author.username}...`}
                />
              </div>
            )}
          </div>

          {areRepliesOpen && replies && replies.length > 0 && (
            <div className="comment__replies">
              {replies.map((reply) => (
                <Comment
                  key={reply.id}
                  {...reply}
                  isReply={true}
                  onReply={onReply}
                  onSubmitReply={onSubmitReply}
                  onVote={onVote}
                  onReaction={onReaction}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onRestore={onRestore}
                  onReport={onReport}
                  onExpandReplies={onExpandReplies}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
