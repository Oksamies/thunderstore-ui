import type { TicketMessage, TicketUser } from "@thunderstore/dapper/types";

import { Comment } from "../../components/Comment/Comment";
import "./Ticket.css";

export interface TicketChatProps {
  messages: TicketMessage[];
  currentUser: TicketUser;
}

export function TicketChat({ messages }: TicketChatProps) {
  // Merge messages and notes into a single timeline sorted by date
  // We attach a type discriminator to handle rendering differences
  const timeline = [...messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="ticket-chat">
      {timeline.map((item) => {
        const isNote = item.is_internal;

        return (
          <Comment
            key={item.uuid}
            id={item.uuid}
            rootClasses={
              isNote ? "ticket-chat__item--note" : "ticket-chat__item--message"
            }
            author={{
              username: item.author?.username || "Unknown",
              avatar: item.author?.avatar || "",
              badges: isNote ? ["Internal Note"] : undefined,
            }}
            timestamp={item.created_at}
            content={item.content}
            voteScore={0}
            userVote={0}
          />
        );
      })}
    </div>
  );
}
