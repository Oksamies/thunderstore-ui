import { PropsWithChildren } from "react";
import styles from "./EmptyState.module.css";
import { classnames } from "../../utils/utils";

interface Props extends PropsWithChildren {
  className?: string;
}

/**
 * Show fallback content for pages where the content should be fetched
 * from the database, but matching content doesn't currently exist. Used
 * e.g. when active filters result in an empty result set.
 */
export function EmptyState(props: Props) {
  const { children, className } = props;

  return <div className={classnames(styles.root, className)}>{children}</div>;
}

EmptyState.displayName = "EmptyState";