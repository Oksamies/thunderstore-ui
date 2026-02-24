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
      isDeleted: c.is_deleted,
      voteScore: 0,
      userVote: 0,
      reactions: c.reactions,
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
  const { communityId, namespaceId, packageId } = useParams();

  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<CommentProps[]>([]);
  const [canModerate, setCanModerate] = useState(false);

  const fetchComments = async () => {
    if (!communityId || !namespaceId || !packageId) return;
    try {
      const apiComments = await dapper.getListingComments(
        communityId,
        namespaceId,
        packageId
      );
      setComments(buildCommentTree(apiComments));
    } catch (e) {
      console.error("Failed to fetch comments", e);
    }
  };

  useEffect(() => {
    const checkModeration = async () => {
      if (currentUser?.username && communityId) {
        try {
          const communities = await dapper.getUserModeratedCommunities();
          const isMod = communities.some((c) => c.identifier === communityId);
          setCanModerate(isMod);
        } catch (e) {
          console.error("Failed to check moderation status", e);
        }
      }
    };
    checkModeration();
  }, [currentUser, communityId, dapper]);

  useEffect(() => {
    fetchComments();
  }, [communityId, namespaceId, packageId, dapper]);

  const handleSubmit = async () => {
    console.log("Submitting comment:", commentText);
    console.log(
      !commentText.trim(),
      !currentUser,
      communityId,
      namespaceId,
      packageId
    );
    if (!commentText.trim() || !currentUser) return;
    if (!communityId || !namespaceId || !packageId) return;

    try {
      console.log("Posting comment to API...");
      await dapper.createListingComment(
        communityId,
        namespaceId,
        packageId,
        commentText
      );
      console.log("Comment posted successfully");
      setCommentText("");
      fetchComments();
    } catch (e) {
      console.error("Failed to post comment", e);
    }
  };

  const handleReplySubmit = async (commentId: string, content: string) => {
    if (!communityId || !namespaceId || !packageId) return;
    try {
      await dapper.createListingComment(
        communityId,
        namespaceId,
        packageId,
        content,
        commentId
      );
      fetchComments();
    } catch (e) {
      console.error("Failed to post reply", e);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await dapper.deleteComment(commentId);
      fetchComments();
    } catch (e) {
      console.error("Failed to delete comment", e);
    }
  };

  const handleRestore = async (commentId: string) => {
    try {
      await dapper.restoreComment(commentId);
      fetchComments();
    } catch (e) {
      console.error("Failed to restore comment", e);
    }
  };

  const handleReaction = async (commentId: string, reaction: string) => {
    try {
      if (dapper.reactToComment) {
        await dapper.reactToComment(commentId, reaction);
        fetchComments();
      }
    } catch (e) {
      console.error("Failed to react to comment", e);
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
        {comments.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--cs-color-text-muted)",
              backgroundColor: "var(--cs-color-surface-1)",
              borderRadius: "var(--cs-border-radius-primary)",
            }}
          >
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          comments.map((comment) => (
            <Comment
              key={comment.id}
              {...comment}
              onSubmitReply={handleReplySubmit}
              onReaction={handleReaction}
              onDelete={canModerate ? handleDelete : undefined}
              onRestore={canModerate ? handleRestore : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
