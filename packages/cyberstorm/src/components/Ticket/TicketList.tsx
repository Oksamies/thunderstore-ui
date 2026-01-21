import React from "react";

import type { Ticket, TicketStatus } from "@thunderstore/dapper";

import { Link } from "../../newComponents/Link/Link";
import {
  Table,
  TableLabels,
  TableRows,
  TableSort,
} from "../../newComponents/Table/Table";
import { RelativeTime } from "../RelativeTime/RelativeTime";

export interface TicketListProps {
  tickets: Ticket[];
  getTicketUrl: (ticket: Ticket) => string;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  user_replied: "User Replied",
  mod_replied: "Mod Replied",
  resolved: "Resolved",
  closed: "Closed",
};

export function TicketList({ tickets, getTicketUrl }: TicketListProps) {
  const headers: TableLabels = [
    { value: "Status", disableSort: false },
    { value: "Package", disableSort: false },
    { value: "Author", disableSort: false },
    { value: "Last Updated", disableSort: false },
    { value: "Action", disableSort: true },
  ];

  const rows: TableRows = tickets.map((ticket) => [
    {
      value: STATUS_LABELS[ticket.status] || ticket.status,
      sortValue: ticket.status,
    },
    {
      value: ticket.listing?.package_name || "General",
      sortValue: ticket.listing?.package_name || "",
    },
    {
      value: ticket.created_by?.username || "Unknown",
      sortValue: ticket.created_by?.username || "",
    },
    {
      value: <RelativeTime time={ticket.last_updated} />,
      sortValue: ticket.last_updated,
    },
    {
      value: (
        <Link to={getTicketUrl(ticket)} csVariant="primary">
          View
        </Link>
      ),
      sortValue: "view",
    },
  ]);

  return (
    <Table
      headers={headers}
      rows={rows}
      sortByHeader={3} // Sort by Updated by default
      sortDirection={TableSort.DESC}
    />
  );
}
