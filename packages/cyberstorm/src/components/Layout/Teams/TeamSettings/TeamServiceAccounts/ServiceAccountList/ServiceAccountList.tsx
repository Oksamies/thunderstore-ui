import styles from "./ServiceAccountList.module.css";
import { ServiceAccountListItem } from "./ServiceAccountListItem";
import { ServiceAccount } from "../../../../../../schema";

export interface ServiceAccountListProps {
  serviceAccountData?: ServiceAccount[];
}

export function ServiceAccountList(props: ServiceAccountListProps) {
  const { serviceAccountData = [] } = props;

  const mappedServiceAccountList = serviceAccountData?.map(
    (serviceAccount: ServiceAccount, index: number) => {
      return (
        <div key={index}>
          <ServiceAccountListItem
            serviceAccountName={serviceAccount.name}
            lastUsed={serviceAccount.lastUsed}
          />
        </div>
      );
    }
  );

  return <div className={styles.root}>{mappedServiceAccountList}</div>;
}

ServiceAccountList.displayName = "ServiceAccountList";