import {
  faReply,
  faThumbsDown,
  faThumbsUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";

import { Avatar } from "../../newComponents/Avatar/Avatar";
import { Button } from "../../newComponents/Button/Button";
import { Icon } from "../../newComponents/Icon/Icon";
import { Tag } from "../../newComponents/Tag/Tag";
import { classnames } from "../../utils/utils";
import { RelativeTime } from "../RelativeTime/RelativeTime";
import "./Comment.css";

export interface CommentProps {
  id: string;
  rootClasses?: string;
  author: {
    username: string;
    avatar: string;
    badges?: string[];
  };
  timestamp: string;
  content: string;
  voteScore: number;
  userVote: -1 | 0 | 1;
  replies?: CommentProps[];
  onReply?: (commentId: string) => void;
  onVote?: (commentId: string, vote: -1 | 0 | 1) => void;
}

export function Comment({
  id,
  author,
  timestamp,
  content,
  voteScore,
  userVote,
  replies,
  rootClasses,
  onReply,
  onVote,
}: CommentProps) {
  const [isReplying, setIsReplying] = useState(false);

  const handleReplyClick = () => {
    if (onReply) {
      onReply(id);
    }
    setIsReplying(!isReplying);
  };

  const handleUpvote = () => {
    const newVote = userVote === 1 ? 0 : 1;
    onVote?.(id, newVote);
  };

  const handleDownvote = () => {
    const newVote = userVote === -1 ? 0 : -1;
    onVote?.(id, newVote);
  };

  return (
    <div className={classnames("comment", rootClasses)}>
      <div className="comment__entry">
        <div className="comment__gutter">
          <Avatar
            username={author.username}
            src={author.avatar}
            csSize="small"
          />
          {replies && replies.length > 0 && (
            <div className="comment__thread-line" />
          )}
        </div>
        <div className="comment__main">
          <div className="comment__header">
            <span className="comment__author">{author.username}</span>
            {author.badges?.map((badge) => (
              <Tag key={badge} csSize="small" csVariant="primary">
                {badge}
              </Tag>
            ))}
            <span className="comment__timestamp">
              <RelativeTime time={timestamp} />
            </span>
          </div>

          <div className="comment__body">
            {content.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          <div className="comment__footer">
            <div className="comment-like-system">
              <button
                className={classnames(
                  "comment-like-system__button",
                  userVote === 1 ? "comment-like-system__button--active" : ""
                )}
                onClick={handleUpvote}
                title="Upvote"
              >
                <Icon csVariant={userVote === 1 ? "primary" : undefined}>
                  <FontAwesomeIcon icon={faThumbsUp} />
                </Icon>
              </button>
              <span className="comment-like-system__count">{voteScore}</span>
              <button
                className={classnames(
                  "comment-like-system__button",
                  userVote === -1 ? "comment-like-system__button--active" : ""
                )}
                onClick={handleDownvote}
                title="Downvote"
              >
                <Icon csVariant={userVote === -1 ? "destructive" : undefined}>
                  <FontAwesomeIcon icon={faThumbsDown} />
                </Icon>
              </button>
            </div>

            <Button
              csVariant="tertiary"
              csSize="small"
              onClick={handleReplyClick}
            >
              <Icon csMode="inline" noWrapper>
                <FontAwesomeIcon icon={faReply} />
              </Icon>
              Reply
            </Button>
          </div>
        </div>
      </div>

      {replies && replies.length > 0 && (
        <div className="comment__replies">
          {replies.map((reply) => (
            <Comment
              key={reply.id}
              {...reply}
              onReply={onReply}
              onVote={onVote}
            />
          ))}
        </div>
      )}
    </div>
  );
}
