import type { Ticket, TicketStatus } from "@thunderstore/dapper/types";

import { Link } from "../../newComponents/Link/Link";
import {
  Table,
  type TableLabels,
  type TableRows,
  TableSort,
} from "../../newComponents/Table/Table";
import { RelativeTime } from "../RelativeTime/RelativeTime";

export interface TicketListProps {
  tickets: Ticket[];
  showCommunity?: boolean;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  user_replied: "User Replied",
  mod_replied: "Mod Replied",
  resolved: "Resolved",
  closed: "Closed",
};

export function TicketList({
  tickets,
  showCommunity = false,
}: TicketListProps) {
  const headers: TableLabels = [
    { value: "Status", disableSort: false },
    ...(showCommunity ? [{ value: "Community", disableSort: false }] : []),
    { value: "Package", disableSort: false },
    { value: "Author", disableSort: false },
    { value: "Last Updated", disableSort: false },
    { value: "Action", disableSort: true },
  ];

  const rows: TableRows = tickets.map((ticket) => {
    const commonCells = [
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
          <Link
            primitiveType="cyberstormLink"
            linkId="TicketDetail"
            community={ticket.community?.identifier || "unknown"}
            ticket={ticket.uuid}
            csVariant="primary"
          >
            View
          </Link>
        ),
        sortValue: "view",
      },
    ];

    const communityCell = {
      value:
        ticket.community?.name || ticket.community?.identifier || "Unknown",
      sortValue: ticket.community?.identifier || "",
    };

    return [
      {
        value: STATUS_LABELS[ticket.status] || ticket.status,
        sortValue: ticket.status,
      },
      ...(showCommunity ? [communityCell] : []),
      ...commonCells,
    ];
  });

  return (
    <Table
      headers={headers}
      rows={rows}
      sortByHeader={showCommunity ? 4 : 3} // Sort by Updated by default (shifted if community is shown)
      sortDirection={TableSort.DESC}
    />
  );
}
