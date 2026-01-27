import React from "react";

import {
  TicketMessage,
  TicketNote,
  TicketUser,
} from "@thunderstore/dapper/types/tickets";

import { Comment } from "../Comment";
import "./Ticket.css";

// Helper to sort messages and notes
type TimelineItem =
  | { type: "message"; data: TicketMessage }
  | { type: "note"; data: TicketNote };

export interface TicketChatProps {
  messages: TicketMessage[];
  notes?: TicketNote[];
  currentUser?: TicketUser;
}

export function TicketChat({
  messages,
  notes = [],
  currentUser,
}: TicketChatProps) {
  const timeline: TimelineItem[] = [
    ...messages.map((m) => ({ type: "message" as const, data: m })),
    ...notes.map((n) => ({ type: "note" as const, data: n })),
  ].sort(
    (a, b) =>
      new Date(a.data.created_at).getTime() -
      new Date(b.data.created_at).getTime()
  );

  return (
    <div className="ticket-chat">
      {timeline.map((item) => {
        const isNote = item.type === "note";
        // const isMe = item.data.author?.username === currentUser?.username; // Comment handles actions, logic for "me" highlighting maybe not needed or different

        return (
          <Comment
            key={item.data.uuid}
            id={item.data.uuid}
            rootClasses={
              isNote ? "ticket-chat__item--note" : "ticket-chat__item--message"
            }
            author={{
              username: item.data.author?.username || "Unknown",
              avatar: item.data.author?.avatar, // Assuming avatar is available on TicketUser
              badges: isNote ? ["Internal Note"] : undefined,
            }}
            timestamp={item.data.created_at}
            content={item.data.content}
            voteScore={0} // Logic for votes not in TicketMessage yet
            userVote={0}
            // onReply and onVote not implemented for Tickets yet
          />
        );
      })}
    </div>
  );
}
