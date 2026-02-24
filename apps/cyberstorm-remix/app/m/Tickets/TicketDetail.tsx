import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getPublicEnvVariables,
  getSessionTools,
} from "cyberstorm/security/publicEnvVariables";
import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation, useSubmit } from "react-router";

import {
  Heading,
  NewButton,
  NewIcon,
  TicketDetail,
} from "@thunderstore/cyberstorm";
import { DapperTs } from "@thunderstore/dapper-ts";
import type { TicketMessage, TicketStatus } from "@thunderstore/dapper/types";

import "../Dashboard.css";

export async function loader() {
  return {
    ticket: null,
    user: null,
    isModerator: false,
    messages: [],
  };
}

export async function clientLoader({ params }: LoaderFunctionArgs) {
  const sessionTools = getSessionTools();
  const dapper = new DapperTs(
    () => sessionTools.getConfig(),
    () => sessionTools.clearInvalidSession()
  );

  const ticket = await dapper.getTicket(params.ticketId!);
  const messages = await dapper.getTicketMessages(params.ticketId!);
  const user = await dapper.getCurrentUser();

  const isModerator = true;
  const isModByData = messages.some((m: TicketMessage) => m.is_internal);

  return { ticket, user, isModerator: isModByData, messages };
}

clientLoader.hydrate = true;

export function HydrateFallback() {
  return <div className="w-full p-4">Loading ticket...</div>;
}

export async function action({ request, params }: ActionFunctionArgs) {
  const env = getPublicEnvVariables(["VITE_API_URL"]);
  const sessionId = request.headers
    .get("Cookie")
    ?.match(/sessionid=([^;]+)/)?.[1];
  const dapper = new DapperTs(() => ({
    apiHost: env.VITE_API_URL,
    sessionId: sessionId,
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
  const { ticket, user, isModerator, messages } =
    useLoaderData<typeof clientLoader>();
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
        username: user.username || "Guest",
        avatar: user.connections.find((c) => c.avatar)?.avatar || undefined,
      }
    : undefined;

  return (
    <div className="dashboard-root">
      <div className="flex items-center gap-4 mb-4">
        <NewButton
          primitiveType="cyberstormLink"
          linkId={
            ticket?.community?.identifier
              ? "CommunityModeration"
              : "ModerationDashboard"
          }
          community={ticket?.community?.identifier || ""}
          csSize="small"
          csVariant="secondary"
        >
          <NewIcon csMode="inline" noWrapper>
            <FontAwesomeIcon icon={faArrowLeft} />
          </NewIcon>
          Back to Queue
        </NewButton>
      </div>

      <TicketDetail
        ticket={ticket}
        messages={messages}
        currentUser={ticketUser || { username: "Guest" }}
        isModerator={isModerator}
        onSendMessage={handleSendMessage}
        onSendNote={handleSendNote}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
