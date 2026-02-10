import {
  faCaretDown,
  faCaretUp,
  faCode,
  faFlag,
  faGem,
  faPen,
  faQuoteLeft,
  faReply,
  faThumbsDown,
  faThumbsUp,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

import { Avatar } from "../../newComponents/Avatar/Avatar";
import { Button } from "../../newComponents/Button/Button";
import { Icon } from "../../newComponents/Icon/Icon";
import { Tag } from "../../newComponents/Tag/Tag";
import { classnames } from "../../utils/utils";
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
  voteScore: number;
  userVote: -1 | 0 | 1;
  replies?: CommentProps[];
  replyCount?: number;
  isReply?: boolean; // Prop to indicate if this is a reply (child comment)
  onReply?: (commentId: string) => void;
  onSubmitReply?: (commentId: string, content: string) => Promise<void> | void;
  onVote?: (commentId: string, vote: -1 | 0 | 1) => void;
  onEdit?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  onReport?: (commentId: string) => void;
  onExpandReplies?: (commentId: string) => void;
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

export function Comment({
  id,
  author,
  timestamp,
  content,
  voteScore,
  userVote,
  replies,
  replyCount,
  rootClasses,
  isReply = false,
  onReply,
  onVote,
  onEdit,
  onDelete,
  onReport,
  onExpandReplies,
  onSubmitReply,
}: CommentProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [areRepliesOpen, setAreRepliesOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

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

  const handleReportClick = () => {
    onReport?.(id);
  };

  const handleUpvote = () => {
    const newVote = userVote === 1 ? 0 : 1;
    onVote?.(id, newVote);
  };

  const handleDownvote = () => {
    const newVote = userVote === -1 ? 0 : -1;
    onVote?.(id, newVote);
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

            <div className="comment__body">
              {parsedContent.map((part, i) => {
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
              })}
            </div>

            <div className="comment__footer">
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
                <Button
                  csVariant="secondary"
                  csModifiers={["ghost", "only-icon"]}
                  rootClasses={classnames(
                    "comment-like-system__button",
                    "comment-like-system__button--upvote",
                    userVote === 1 ? "comment-like-system__button--active" : ""
                  )}
                  onClick={handleUpvote}
                  title="Upvote"
                >
                  <Icon csMode="inline" noWrapper>
                    <FontAwesomeIcon icon={faThumbsUp} />
                  </Icon>
                </Button>
                <span className="comment-like-system__count">{voteScore}</span>
                <Button
                  csVariant="secondary"
                  csModifiers={["ghost", "only-icon"]}
                  rootClasses={classnames(
                    "comment-like-system__button",
                    "comment-like-system__button--downvote",
                    userVote === -1 ? "comment-like-system__button--active" : ""
                  )}
                  onClick={handleDownvote}
                  title="Downvote"
                >
                  <Icon csMode="inline" noWrapper>
                    <FontAwesomeIcon icon={faThumbsDown} />
                  </Icon>
                </Button>
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
              {onReport && (
                <Button
                  csVariant="secondary"
                  csSize="small"
                  onClick={handleReportClick}
                >
                  <Icon csMode="inline" noWrapper>
                    <FontAwesomeIcon icon={faFlag} />
                  </Icon>
                  Report
                </Button>
              )}
              {onDelete && (
                <div className="comment__action-icon">
                  <Button
                    csVariant="danger"
                    csSize="small"
                    onClick={handleDeleteClick}
                    title="Delete"
                  >
                    <Icon csMode="inline" noWrapper>
                      <FontAwesomeIcon icon={faTrash} />
                    </Icon>
                  </Button>
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
                  onEdit={onEdit}
                  onDelete={onDelete}
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
