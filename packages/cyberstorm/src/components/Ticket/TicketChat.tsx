import React from "react";

import {
  TicketMessage,
  TicketNote,
  TicketUser,
} from "@thunderstore/dapper/types/tickets";

import { MetaItem } from "../../newComponents/MetaItem/MetaItem";
import { classnames } from "../../utils/utils";
import { RelativeTime } from "../RelativeTime/RelativeTime";
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
        const isMe = item.data.author?.username === currentUser?.username;

        return (
          <div
            key={item.data.uuid}
            className={classnames(
              "ticket-chat__item",
              isNote ? "ticket-chat__item--note" : undefined,
              isMe ? "ticket-chat__item--me" : undefined
            )}
          >
            <div className="ticket-chat__header">
              <span className="ticket-chat__author">
                {item.data.author?.username || "Unknown"}
              </span>
              {isNote && (
                <span className="ticket-chat__badge">Internal Note</span>
              )}
              <span className="ticket-chat__time">
                <RelativeTime time={item.data.created_at} />
              </span>
            </div>
            <div className="ticket-chat__content">
              {item.data.content.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
