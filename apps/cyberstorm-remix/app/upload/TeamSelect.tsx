import { NewLink, NewSelectSearch } from "@thunderstore/cyberstorm";

interface TeamSelectProps {
  availableTeams: { name: string; role: string; member_count: number }[];
  authorName: string;
  updateFormFieldState: (action: {
    field: "author_name";
    value: string;
  }) => void;
}

export function TeamSelect({
  availableTeams,
  authorName,
  updateFormFieldState,
}: TeamSelectProps) {
  return (
    <>
      <div className="container container--x container--full upload__row">
        <div className="upload__meta">
          <p className="upload__title">Team</p>
          <p className="upload__description">
            Select the team you want your package to be associated with.
          </p>
        </div>
        <div className="upload__content">
          <NewSelectSearch
            placeholder="Select team"
            options={availableTeams?.map((team) => ({
              value: team.name,
              label: team.name,
            }))}
            onChange={(val) => {
              if (val) {
                updateFormFieldState({
                  field: "author_name",
                  value: val.value,
                });
              } else {
                updateFormFieldState({
                  field: "author_name",
                  value: "",
                });
              }
            }}
            value={
              authorName
                ? {
                    value: authorName,
                    label: authorName,
                  }
                : undefined
            }
          />
          <span className="upload__no-teams">
            <p className="upload__no-teams-text">No teams available?</p>
            <NewLink
              key="create-team-link"
              primitiveType="cyberstormLink"
              linkId="Teams"
              csVariant="cyber"
              rootClasses="community__item"
            >
              <span>Create team</span>
            </NewLink>
          </span>
        </div>
      </div>
      <div className="upload__divider" />
    </>
  );
}
