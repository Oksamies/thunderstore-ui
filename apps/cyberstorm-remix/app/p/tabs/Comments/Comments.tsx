import { type OutletContextShape } from "app/root";
import { useState } from "react";
import { useOutletContext } from "react-router";

import {
  Comment,
  CommentInput,
  type CommentProps,
} from "@thunderstore/cyberstorm/components/Comment";

// Mock data for now
const MOCK_COMMENTS: CommentProps[] = [
  {
    id: "1",
    author: {
      username: "TestUser",
      avatar: "",
      badges: ["Developer"],
    },
    timestamp: new Date().toISOString(),
    content: "This is a great mod! Thanks for creating it.",
    voteScore: 5,
    userVote: 1,
    replies: [
      {
        id: "2",
        author: {
          username: "ModAuthor",
          avatar: "",
          badges: ["Maintainer"],
        },
        timestamp: new Date().toISOString(),
        content: "Glad you like it!",
        voteScore: 2,
        userVote: 0,
        replies: [],
      },
    ],
  },
  {
    id: "3",
    author: {
      username: "AnotherUser",
      avatar: "",
    },
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    content: "I found a bug in the latest version. Can you check?",
    voteScore: 0,
    userVote: -1,
    replies: [],
  },
];

export default function PackageComments() {
  const context = useOutletContext() as OutletContextShape;
  const { currentUser } = context;
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(MOCK_COMMENTS);

  const handleSubmit = () => {
    if (!commentText.trim() || !currentUser) return;

    const newComment: CommentProps = {
      id: Math.random().toString(),
      author: {
        username: currentUser.username || "Anonymous",
        avatar: currentUser.avatar || "",
      },
      timestamp: new Date().toISOString(),
      content: commentText,
      voteScore: 0,
      userVote: 0,
      replies: [],
    };

    setComments([newComment, ...comments]);
    setCommentText("");
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
          <Comment key={comment.id} {...comment} />
        ))}
      </div>
    </div>
  );
}
