import { z } from "zod";

import { apiFetch } from "../apiFetch";
import { RequestConfig } from "../index";
import { ticketSchema } from "../schemas/tickets";

export const fetchGetTickets = async (config: RequestConfig) => {
  return apiFetch({
    args: {
      config: () => config,
      path: "/api/cyberstorm/tickets/",
      useSession: true,
    },
    requestSchema: undefined,
    queryParamsSchema: undefined,
    responseSchema: z.array(ticketSchema),
  });
};

export const fetchGetTicket = async (config: RequestConfig, uuid: string) => {
  return apiFetch({
    args: {
      config: () => config,
      path: `/api/cyberstorm/tickets/${uuid}/`,
      useSession: true,
    },
    requestSchema: undefined,
    queryParamsSchema: undefined,
    responseSchema: ticketSchema,
  });
};

export const fetchGetListingTickets = async (
  config: RequestConfig,
  communityId: string,
  namespaceId: string,
  packageName: string
) => {
  return apiFetch({
    args: {
      config: () => config,
      path: `/api/cyberstorm/listing/${communityId}/${namespaceId}/${packageName}/tickets/`,
      useSession: true,
    },
    requestSchema: undefined,
    queryParamsSchema: undefined,
    responseSchema: z.array(ticketSchema),
  });
};
