"use client";

import styles from "./CreateTeamForm.module.css";
import { createTeam } from "@thunderstore/thunderstore-api";
import {
  ApiForm,
  createTeamFormSchema,
} from "@thunderstore/ts-api-react-forms";
import {
  FormSubmitButton,
  FormTextInput,
  useFormToaster,
} from "@thunderstore/cyberstorm-forms";

export function CreateTeamForm() {
  const toaster = useFormToaster({
    successMessage: "Team created",
  });

  return (
    <ApiForm
      {...toaster}
      schema={createTeamFormSchema}
      endpoint={createTeam}
      formProps={{ className: styles.root }}
    >
      <div className={styles.dialog}>
        <div className={styles.dialogText}>
          Enter the name of the team you wish to create. Team names can contain
          the characters a-z A-Z 0-9 _ and must not start or end with an _
        </div>
        <div>
          <FormTextInput
            schema={createTeamFormSchema}
            name={"name"}
            placeholder={"ExampleName"}
          />
        </div>
      </div>
      <div className={styles.footer}>
        <FormSubmitButton />
      </div>
    </ApiForm>
  );
}

CreateTeamForm.displayName = "CreateTeamForm";