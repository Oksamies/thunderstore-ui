import {
  TicketCreateDTO,
  TicketStatusDTO,
} from "@thunderstore/dapper/types/tickets";
import {
  fetchCreateListingTicket,
  fetchCreateTicketMessage,
  fetchCreateTicketNote,
  fetchGetListingTickets,
  fetchGetTicket,
  fetchGetTickets,
  fetchUpdateTicketStatus,
} from "@thunderstore/thunderstore-api";

import type { DapperTsInterface } from "../index";

export async function getTickets(this: DapperTsInterface) {
  return await fetchGetTickets(this.config());
}

export async function getTicket(this: DapperTsInterface, uuid: string) {
  return await fetchGetTicket(this.config(), uuid);
}

export async function getListingTickets(
  this: DapperTsInterface,
  community: string,
  namespace: string,
  name: string
) {
  return await fetchGetListingTickets(
    this.config(),
    community,
    namespace,
    name
  );
}

export async function createTicketMessage(
  this: DapperTsInterface,
  uuid: string,
  data: TicketCreateDTO
) {
  return await fetchCreateTicketMessage(this.config(), uuid, data.content);
}

export async function createTicketNote(
  this: DapperTsInterface,
  uuid: string,
  data: TicketCreateDTO
) {
  return await fetchCreateTicketNote(this.config(), uuid, data.content);
}

export async function updateTicketStatus(
  this: DapperTsInterface,
  uuid: string,
  data: TicketStatusDTO
) {
  return await fetchUpdateTicketStatus(this.config(), uuid, data.status);
}

export async function createListingTicket(
  this: DapperTsInterface,
  community: string,
  namespace: string,
  name: string,
  data: TicketCreateDTO
) {
  return await fetchCreateListingTicket(
    this.config(),
    community,
    namespace,
    name,
    data.content
  );
}
