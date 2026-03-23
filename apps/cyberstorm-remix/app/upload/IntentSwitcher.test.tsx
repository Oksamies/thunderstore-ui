import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IntentSwitcher } from "./IntentSwitcher";

describe("IntentSwitcher", () => {
  afterEach(cleanup);
  it("renders correctly with 'new' intent active", () => {
    render(
      <IntentSwitcher intent="new" setIntent={vi.fn()} onNewIntent={vi.fn()} />
    );
    const newButton = screen.getByText("New Package").parentElement;
    const updateButton = screen.getByText("Update Package").parentElement;

    expect(newButton?.className).toContain(
      "intent-switcher__intent-button--active"
    );
    expect(updateButton?.className).not.toContain(
      "intent-switcher__intent-button--active"
    );
  });

  it("renders correctly with 'update' intent active", () => {
    render(
      <IntentSwitcher
        intent="update"
        setIntent={vi.fn()}
        onNewIntent={vi.fn()}
      />
    );
    const newButton = screen.getByText("New Package").parentElement;
    const updateButton = screen.getByText("Update Package").parentElement;

    expect(newButton?.className).not.toContain(
      "intent-switcher__intent-button--active"
    );
    expect(updateButton?.className).toContain(
      "intent-switcher__intent-button--active"
    );
  });

  it("calls setIntent and onNewIntent when 'New Package' is clicked", () => {
    const setIntent = vi.fn();
    const onNewIntent = vi.fn();
    render(
      <IntentSwitcher
        intent="update"
        setIntent={setIntent}
        onNewIntent={onNewIntent}
      />
    );

    const newButton = screen.getByText("New Package").parentElement!;
    fireEvent.click(newButton);

    expect(setIntent).toHaveBeenCalledWith("new");
    expect(onNewIntent).toHaveBeenCalled();
  });

  it("calls setIntent when 'Update Package' is clicked", () => {
    const setIntent = vi.fn();
    const onNewIntent = vi.fn();
    render(
      <IntentSwitcher
        intent="new"
        setIntent={setIntent}
        onNewIntent={onNewIntent}
      />
    );

    const updateButton = screen.getByText("Update Package").parentElement!;
    fireEvent.click(updateButton);

    expect(setIntent).toHaveBeenCalledWith("update");
    expect(onNewIntent).not.toHaveBeenCalled();
  });

  it("handles keyboard events correctly for 'New Package'", () => {
    const setIntent = vi.fn();
    const onNewIntent = vi.fn();
    render(
      <IntentSwitcher
        intent="update"
        setIntent={setIntent}
        onNewIntent={onNewIntent}
      />
    );

    const newButton = screen.getByText("New Package").parentElement!;
    fireEvent.keyDown(newButton, { key: "Enter" });

    expect(setIntent).toHaveBeenCalledWith("new");
    expect(onNewIntent).toHaveBeenCalled();

    fireEvent.keyDown(newButton, { key: "Escape" });
    expect(setIntent).toHaveBeenCalledTimes(1);
  });

  it("handles keyboard events correctly for 'Update Package'", () => {
    const setIntent = vi.fn();
    const onNewIntent = vi.fn();
    render(
      <IntentSwitcher
        intent="new"
        setIntent={setIntent}
        onNewIntent={onNewIntent}
      />
    );

    const updateButton = screen.getByText("Update Package").parentElement!;
    fireEvent.keyDown(updateButton, { key: " " });

    expect(setIntent).toHaveBeenCalledWith("update");
    expect(onNewIntent).not.toHaveBeenCalled();
  });
});
