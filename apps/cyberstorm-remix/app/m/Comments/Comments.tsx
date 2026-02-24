import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { Heading, NewButton, NewIcon } from "@thunderstore/cyberstorm";

import "../Dashboard.css";

export async function loader({ params }: LoaderFunctionArgs) {
  return { communityId: params.communityId };
}

export default function Comments() {
  const { communityId } = useLoaderData<typeof loader>();

  return (
    <div className="dashboard-root">
      <div className="dashboard-header">
        <div className="flex items-center gap-4">
          <NewButton
            primitiveType="cyberstormLink"
            linkId="CommunityModeration"
            community={communityId}
            csSize="small"
            csVariant="secondary"
          >
            <NewIcon csMode="inline" noWrapper>
              <FontAwesomeIcon icon={faArrowLeft} />
            </NewIcon>
            Back to Dashboard
          </NewButton>
        </div>
        <Heading csLevel="1">Comments Queue: {communityId}</Heading>
        <p className="dashboard-header__description">
          Comment moderation is coming soon.
        </p>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-empty-state">
          <p>This feature is not yet implemented.</p>
        </div>
      </div>
    </div>
  );
}
