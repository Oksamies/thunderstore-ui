import {
  faClock,
  faDownload,
  faThumbsUp,
} from "@fortawesome/free-solid-svg-icons";
import { faSparkles } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dispatch, SetStateAction } from "react";

import styles from "./PackageList.module.css";
import { Select } from "../Select/Select";

interface Props {
  order: PackageOrderOptions;
  setOrder: Dispatch<SetStateAction<PackageOrderOptions>>;
}

export const PackageOrder = (props: Props) => (
  <label className={styles.order}>
    Sort By
    <Select
      options={selectOptions}
      value={props.order}
      onChange={props.setOrder}
    />
  </label>
);

export enum PackageOrderOptions {
  Created = "-datetime_created",
  Downloaded = "-downloads",
  Rated = "-rating_score",
  Updated = "-datetime_updated",
}

const selectOptions = [
  {
    value: PackageOrderOptions.Updated,
    label: "Last updated",
    leftIcon: <FontAwesomeIcon icon={faClock} />,
  },
  {
    value: PackageOrderOptions.Created,
    label: "Newest",
    leftIcon: <FontAwesomeIcon icon={faSparkles} />,
  },
  {
    value: PackageOrderOptions.Downloaded,
    label: "Most downloaded",
    leftIcon: <FontAwesomeIcon icon={faDownload} />,
  },
  {
    value: PackageOrderOptions.Rated,
    label: "Top rated",
    leftIcon: <FontAwesomeIcon icon={faThumbsUp} />,
  },
];

PackageOrder.displayName = "PackageOrder";