import { classnames } from "@thunderstore/cyberstorm";

import "./IntentSwitcher.css";

export interface IntentSwitcherProps {
  intent: "new" | "update";
  setIntent: (intent: "new" | "update") => void;
  onNewIntent: () => void;
}

/**
 * Component to switch between "New Package" and "Update Package" modes for uploading.
 * Renders stylized blocks that act as clickable tabs for the intent.
 */
export function IntentSwitcher({
  intent,
  setIntent,
  onNewIntent,
}: IntentSwitcherProps) {
  return (
    <div className="intent-switcher__intent-switchers">
      <div
        role="button"
        tabIndex={0}
        className={classnames(
          "intent-switcher__intent-button",
          intent === "new" ? "intent-switcher__intent-button--active" : null
        )}
        onClick={() => {
          setIntent("new");
          onNewIntent();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIntent("new");
            onNewIntent();
          }
        }}
      >
        <h3>New Package</h3>
        <p>Create and upload a brand new package</p>
      </div>
      <div
        role="button"
        tabIndex={0}
        className={classnames(
          "intent-switcher__intent-button",
          intent === "update" ? "intent-switcher__intent-button--active" : null
        )}
        onClick={() => setIntent("update")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIntent("update");
          }
        }}
      >
        <h3>Update Package</h3>
        <p>Fetch an existing package to release a new version</p>
      </div>
    </div>
  );
}
