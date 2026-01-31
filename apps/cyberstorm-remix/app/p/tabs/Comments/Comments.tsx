import { type OutletContextShape } from "app/root";
import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router";

import {
  Comment,
  CommentInput,
  type CommentProps,
} from "@thunderstore/cyberstorm";
import { type Comment as ApiComment } from "@thunderstore/dapper/types";

function buildCommentTree(flatComments: ApiComment[]): CommentProps[] {
  const commentMap = new Map<string, CommentProps>();
  const roots: CommentProps[] = [];

  flatComments.forEach((c) => {
    commentMap.set(c.uuid, {
      id: c.uuid,
      author: {
        username: c.author.username,
        avatar: c.author.avatar || "",
        badges: [],
      },
      timestamp: c.datetime_created,
      content: c.body,
      voteScore: 0,
      userVote: 0,
      replies: [],
    });
  });

  flatComments.forEach((c) => {
    const node = commentMap.get(c.uuid)!;
    if (c.parent) {
      const parent = commentMap.get(c.parent);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  roots.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const sortReplies = (node: CommentProps) => {
    if (node.replies && node.replies.length > 0) {
      node.replies.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      node.replies.forEach(sortReplies);
    }
  };
  roots.forEach(sortReplies);

  return roots;
}

export default function PackageComments() {
  const context = useOutletContext() as OutletContextShape;
  const { currentUser, dapper } = context;
  const { communityId, namespaceId, packageName } = useParams();

  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<CommentProps[]>([]);

  const fetchComments = async () => {
    if (!communityId || !namespaceId || !packageName) return;
    try {
      const apiComments = await dapper.getListingComments(
        communityId,
        namespaceId,
        packageName
      );
      setComments(buildCommentTree(apiComments));
    } catch (e) {
      console.error("Failed to fetch comments", e);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [communityId, namespaceId, packageName, dapper]);

  const handleSubmit = async () => {
    if (!commentText.trim() || !currentUser) return;
    if (!communityId || !namespaceId || !packageName) return;

    try {
      await dapper.createListingComment(
        communityId,
        namespaceId,
        packageName,
        commentText
      );
      setCommentText("");
      fetchComments();
    } catch (e) {
      console.error("Failed to post comment", e);
    }
  };

  const handleReplySubmit = async (commentId: string, content: string) => {
    if (!communityId || !namespaceId || !packageName) return;
    try {
      await dapper.createListingComment(
        communityId,
        namespaceId,
        packageName,
        content,
        commentId
      );
      fetchComments();
    } catch (e) {
      console.error("Failed to post reply", e);
    }
  };

  return (
    <div
      style={{
        padding: "0 0 2rem 0",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      {currentUser?.username ? (
        <CommentInput
          value={commentText}
          onChange={setCommentText}
          onSubmit={handleSubmit}
        />
      ) : (
        <div
          style={{
            padding: "1rem",
            textAlign: "center",
            backgroundColor: "var(--cs-color-surface-1)",
            borderRadius: "var(--cs-border-radius-primary)",
          }}
        >
          Please log in to leave a comment.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {comments.map((comment) => (
          <Comment
            key={comment.id}
            {...comment}
            onSubmitReply={handleReplySubmit}
          />
        ))}
      </div>
    </div>
  );
}
