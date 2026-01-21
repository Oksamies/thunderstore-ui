import {
  getPublicEnvVariables,
  getSessionTools,
} from "cyberstorm/security/publicEnvVariables";
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "react-router";
import { useLoaderData, useNavigation, useSubmit } from "react-router";

import { TicketDetail } from "@thunderstore/cyberstorm/components/Ticket/TicketDetail";
import { DapperTs } from "@thunderstore/dapper-ts";
import { TicketStatus } from "@thunderstore/dapper/types/tickets";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const session = await getSessionTools().getSession(
    request.headers.get("Cookie")
  );
  const dapper = new DapperTs(() => ({
    apiHost: getPublicEnvVariables().CYBERSTORM_API_URL,
    sessionId: session.get("session_id"),
  }));

  const ticket = await dapper.getTicket(params.ticketId!);
  const user = await dapper.getCurrentUser();

  // Basic check if user is moderator for this ticket's community
  // Ideally backend handles this, but for UI "isModerator" flag, we check here
  // Or fetch current user permissions.
  // For now we assume if they can see the ticket via this route and see notes (backend logic), they are mod.
  // But strictly, dapper.getCurrentUser() is needed to pass currentUser prop.

  const isModerator = true; // TODO: Check actual permissions via dapper.getCommunity(ticket.community.identifier) -> check perms
  // Actually, we can check if ticket.notes is present (backend only returns notes to mods)

  const isModByData = ticket.notes !== undefined;

  return { ticket, user, isModerator: isModByData };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const session = await getSessionTools().getSession(
    request.headers.get("Cookie")
  );
  const dapper = new DapperTs(() => ({
    apiHost: getPublicEnvVariables().CYBERSTORM_API_URL,
    sessionId: session.get("session_id"),
  }));

  const formData = await request.formData();
  const intent = formData.get("intent");
  const ticketId = params.ticketId!;

  if (intent === "sendMessage") {
    const content = formData.get("content") as string;
    await dapper.createTicketMessage(ticketId, { content });
  } else if (intent === "sendNote") {
    const content = formData.get("content") as string;
    await dapper.createTicketNote(ticketId, { content });
  } else if (intent === "updateStatus") {
    const status = formData.get("status") as TicketStatus;
    await dapper.updateTicketStatus(ticketId, { status });
  }

  return null;
}

export default function TicketDetailRoute() {
  const { ticket, user, isModerator } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();

  const handleSendMessage = async (content: string) => {
    const formData = new FormData();
    formData.append("intent", "sendMessage");
    formData.append("content", content);
    submit(formData, { method: "post" });
  };

  const handleSendNote = async (content: string) => {
    const formData = new FormData();
    formData.append("intent", "sendNote");
    formData.append("content", content);
    submit(formData, { method: "post" });
  };

  const handleUpdateStatus = async (status: TicketStatus) => {
    const formData = new FormData();
    formData.append("intent", "updateStatus");
    formData.append("status", status);
    submit(formData, { method: "post" });
  };

  // Transform user type
  const ticketUser = user
    ? {
        username: user.username,
        avatar: user.connections.find((c) => c.avatar)?.avatar || undefined,
      }
    : undefined;

  return (
    <div className="w-full p-4">
      <TicketDetail
        ticket={ticket}
        currentUser={ticketUser || { username: "Guest" }}
        isModerator={isModerator}
        onSendMessage={handleSendMessage}
        onSendNote={handleSendNote}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
