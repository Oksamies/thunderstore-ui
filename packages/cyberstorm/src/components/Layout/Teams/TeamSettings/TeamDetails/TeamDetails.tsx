import { useDapper } from "@thunderstore/dapper";
import { usePromise } from "@thunderstore/use-promise";
import styles from "./TeamDetails.module.css";
import { SettingItem } from "../../../../SettingItem/SettingItem";
import { TextInput } from "../../../../TextInput/TextInput";
import * as Button from "../../../../Button/";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/pro-light-svg-icons";
import { useState } from "react";

interface Props {
  teamName: string;
}

export function TeamDetails(props: Props) {
  const { teamName } = props;

  const dapper = useDapper();
  const team = usePromise(dapper.getTeamDetails, [teamName]);

  const [donationLink, setDonationLink] = useState(team.donation_link ?? "");

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <SettingItem
          title="Team donation link"
          content={
            <div className={styles.donationLink}>
              <div className={styles.donationLinkLabel}>URL</div>
              <div className={styles.donationLinkActions}>
                <div className={styles.donationLinkTextInput}>
                  <TextInput
                    placeHolder="https://"
                    setValue={setDonationLink}
                    value={donationLink}
                  />
                </div>
                <Button.Root
                  paddingSize="mediumSquare"
                  colorScheme="transparentDanger"
                >
                  <Button.ButtonIcon>
                    <FontAwesomeIcon icon={faXmark} />
                  </Button.ButtonIcon>
                </Button.Root>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );

  /*
  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <SettingItem
          title="Team Avatar"
          description="Instructions for uploading a picture"
          content={
            <div className={styles.avatarContent}>
              <ModIcon src={teamData.imageSource} />
              <div>
                <Button.Root><Button.ButtonLabel>Upload picture</Button.ButtonLabel></Button.Root>
              </div>
            </div>
          }
        />
      </div>

      <div className={styles.line} />

      <div className={styles.section}>
        <SettingItem
          title="Profile Summary"
          description="A short description shown in header and profile cards"
          content={<TextInput placeHolder={teamData.description} />}
        />
        <SettingItem
          title="Abut Us"
          description="A more comprehensive description shown on the profile page"
          content={<TextInput placeHolder={teamData.about} />}
        />

        <div className={styles.line} />

        <div className={styles.section}>
          <SettingItem title="Social Links" content={teamData.name} />
        </div>

        <div className={styles.line} />

        <div className={styles.section}>
          <SettingItem
            title="Team donation link"
            content={<TextInput placeHolder="https://" />}
          />
        </div>
      </div>
    </div>
  );
  */
}

TeamDetails.displayName = "TeamDetails";