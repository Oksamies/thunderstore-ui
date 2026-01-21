export interface TicketUser {
  username: string;
  email?: string;
  avatar?: string;
}

export type TicketStatus =
  | "open"
  | "user_replied"
  | "mod_replied"
  | "resolved"
  | "closed";

export interface TicketMessage {
  uuid: string;
  author?: TicketUser;
  content: string;
  created_at: string;
}

export interface TicketNote {
  uuid: string;
  author?: TicketUser;
  content: string;
  created_at: string;
}

export interface Ticket {
  uuid: string;
  listing?: {
    package_name: string;
    namespace: string;
    community: string;
  };
  community?: {
    identifier: string;
    name: string;
  };
  team?: {
    name: string;
  };
  status: TicketStatus;
  created_by?: TicketUser;
  created_at: string;
  last_updated: string;
  messages: TicketMessage[];
  notes?: TicketNote[];
}

export interface TicketCreateDTO {
  content: string;
}

export interface TicketStatusDTO {
  status: TicketStatus;
}
