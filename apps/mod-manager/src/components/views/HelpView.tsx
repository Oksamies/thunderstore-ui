import React, { useEffect, useRef, useState } from "react";

import LoggerProvider from "../../providers/LoggerProvider";
import "./HelpView.css";

const HelpView: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial load
    setLogs(LoggerProvider.instance.getLogs());

    // Poll for updates
    const interval = setInterval(() => {
      const newLogs = LoggerProvider.instance.getLogs();
      setLogs((prev) => {
        if (prev.length !== newLogs.length) {
          return [...newLogs];
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(logs.join("\n"));
      // Could show a toast here, using simple alert for now
      alert("Logs copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy logs:", err);
    }
  };

  return (
    <div className="help-view">
      <div className="help-view__header">
        <div>
          <h2 className="help-view__title">Help & Debugging</h2>
          <p className="help-view__subtitle">
            View runtime logs and export them for support.
          </p>
        </div>
        <button onClick={copyToClipboard} className="help-view__copy-btn">
          <svg
            className="help-view__icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
          Copy Logs
        </button>
      </div>

      <div className="help-view__logs-container">
        <div className="help-view__logs-header">
          <span>TERMINAL OUTPUT</span>
          <span>{logs.length} Lines</span>
        </div>
        <div ref={logContainerRef} className="help-view__logs">
          {logs.length > 0 ? (
            logs.map((line, index) => (
              <div key={index} className="help-view__log-line">
                <span className="help-view__line-number">
                  {(index + 1).toString().padStart(3, "0")}
                </span>
                {line}
              </div>
            ))
          ) : (
            <div className="help-view__empty">Waiting for logs...</div>
          )}
        </div>
      </div>

      <div className="help-view__footer">
        Logs are automatically saved to your configured Data Directory.
      </div>
    </div>
  );
};

export default HelpView;
