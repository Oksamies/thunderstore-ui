import React, { useState } from "react";

import {
  Ticket,
  TicketStatus,
  TicketUser,
} from "@thunderstore/dapper/types/tickets";

import { TextAreaInput } from "../../components/TextAreaInput/TextAreaInput";
import { Alert } from "../../newComponents/Alert/Alert";
import { Button } from "../../newComponents/Button/Button";
import { Heading } from "../../newComponents/Heading/Heading";
import { Select } from "../../newComponents/Select/Select";
import "./Ticket.css";
import { TicketChat } from "./TicketChat";

export interface TicketDetailProps {
  ticket: Ticket;
  currentUser: TicketUser;
  isModerator: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onSendNote?: (content: string) => Promise<void>;
  onUpdateStatus?: (status: TicketStatus) => Promise<void>;
}

export function TicketDetail({
  ticket,
  currentUser,
  isModerator,
  onSendMessage,
  onSendNote,
  onUpdateStatus,
}: TicketDetailProps) {
  const [messageContent, setMessageContent] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"message" | "note">("message");

  const handleSendMessage = async () => {
    if (!messageContent.trim()) return;
    setIsSubmitting(true);
    try {
      await onSendMessage(messageContent);
      setMessageContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendNote = async () => {
    if (!noteContent.trim() || !onSendNote) return;
    setIsSubmitting(true);
    try {
      await onSendNote(noteContent);
      setNoteContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: "open", label: "Open" },
    { value: "user_replied", label: "User Replied" },
    { value: "mod_replied", label: "Mod Replied" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  return (
    <div className="ticket-detail">
      <div className="ticket-detail__header">
        <Heading size="h2" weight="bold">
          Ticket #{ticket.uuid.slice(0, 8)}
        </Heading>
        <div className="ticket-detail__meta">
          <span>Status:</span>
          {isModerator && onUpdateStatus ? (
            <Select
              options={statusOptions}
              value={ticket.status}
              onChange={(val) => onUpdateStatus(val as TicketStatus)}
              disabled={isSubmitting}
            />
          ) : (
            <span className={`ticket-status ticket-status--${ticket.status}`}>
              {ticket.status.replace("_", " ").toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <div className="ticket-detail__context">
        <Heading size="h4" weight="bold">
          Context
        </Heading>
        <p>Package: {ticket.listing?.package_name || "N/A"}</p>
        <p>Community: {ticket.community?.name || "N/A"}</p>
        <p>Team: {ticket.team?.name || "N/A"}</p>
      </div>

      <div className="ticket-detail__chat">
        <TicketChat
          messages={ticket.messages}
          notes={isModerator ? ticket.notes : []}
          currentUser={currentUser}
        />
      </div>

      <div className="ticket-detail__compose">
        {isModerator && (
          <div className="ticket-detail__tabs">
            <Button
              onClick={() => setActiveTab("message")}
              csVariant={activeTab === "message" ? "primary" : "secondary"}
            >
              Reply to User
            </Button>
            <Button
              onClick={() => setActiveTab("note")}
              csVariant={activeTab === "note" ? "warning" : "secondary"}
            >
              Internal Note
            </Button>
          </div>
        )}

        {activeTab === "message" ? (
          <div className="ticket-compose-area">
            <TextAreaInput
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Write a reply..."
              disabled={isSubmitting}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSubmitting || !messageContent.trim()}
              csVariant="primary"
            >
              Send Reply
            </Button>
          </div>
        ) : (
          <div className="ticket-compose-area ticket-compose-area--note">
            <Alert csVariant="warning">
              This note is only visible to other moderators.
            </Alert>
            <TextAreaInput
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Internal note..."
              disabled={isSubmitting}
            />
            <Button
              onClick={handleSendNote}
              disabled={isSubmitting || !noteContent.trim()}
              csVariant="warning"
            >
              Add Note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
