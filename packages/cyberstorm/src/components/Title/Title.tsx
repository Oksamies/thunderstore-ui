import React from "react";
import styles from "./Title.module.css";

export interface TitleProps {
  text?: string;
  size?: "smaller" | "smallest" | "default";
}

/**
 * Cyberstorm Title component
 */
export const Title: React.FC<TitleProps> = (props) => {
  const { size, text } = props;
  return <div className={`${styles.root} ${getSize(size)}`}>{text}</div>;
};

Title.displayName = "Title";
Title.defaultProps = { text: "" };

const getSize = (scheme: TitleProps["size"] = "default") => {
  return {
    smallest: styles.smallest,
    smaller: styles.smaller,
    default: "",
  }[scheme];
};