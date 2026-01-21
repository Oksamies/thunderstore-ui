import { apiFetch } from "../apiFetch";
import { RequestConfig } from "../index";
import {
  TicketStatus,
  ticketCreateSchema,
  ticketMessageSchema,
  ticketNoteSchema,
  ticketSchema,
  ticketStatusUpdateSchema,
} from "../schemas/tickets";

export const fetchCreateTicketMessage = async (
  config: RequestConfig,
  uuid: string,
  content: string
) => {
  return apiFetch({
    args: {
      config: () => config,
      path: `/api/cyberstorm/tickets/${uuid}/messages/`,
      useSession: true,
      bodyRaw: { content },
    },
    requestSchema: ticketCreateSchema,
    queryParamsSchema: undefined,
    responseSchema: ticketMessageSchema,
  });
};

export const fetchCreateTicketNote = async (
  config: RequestConfig,
  uuid: string,
  content: string
) => {
  return apiFetch({
    args: {
      config: () => config,
      path: `/api/cyberstorm/tickets/${uuid}/notes/`,
      useSession: true,
      bodyRaw: { content },
    },
    requestSchema: ticketCreateSchema,
    queryParamsSchema: undefined,
    responseSchema: ticketNoteSchema,
  });
};

export const fetchUpdateTicketStatus = async (
  config: RequestConfig,
  uuid: string,
  status: TicketStatus
) => {
  return apiFetch({
    args: {
      config: () => config,
      path: `/api/cyberstorm/tickets/${uuid}/status/`,
      useSession: true,
      bodyRaw: { status },
    },
    requestSchema: ticketStatusUpdateSchema,
    queryParamsSchema: undefined,
    responseSchema: ticketSchema,
  });
};

export const fetchCreateListingTicket = async (
  config: RequestConfig,
  communityId: string,
  namespaceId: string,
  packageName: string,
  content: string
) => {
  return apiFetch({
    args: {
      config: () => config,
      path: `/api/cyberstorm/listing/${communityId}/${namespaceId}/${packageName}/tickets/`,
      useSession: true,
      bodyRaw: { content },
    },
    requestSchema: ticketCreateSchema,
    queryParamsSchema: undefined,
    responseSchema: ticketSchema,
  });
};
