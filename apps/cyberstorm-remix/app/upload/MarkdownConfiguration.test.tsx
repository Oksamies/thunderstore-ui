import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownConfiguration } from "./MarkdownConfiguration";

vi.mock("~/commonComponents/MarkdownEditor/MarkdownEditor", () => ({
  MarkdownEditor: ({ value, onChange, placeholder }: any) => (
    <textarea
      data-testid="mock-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

describe("MarkdownConfiguration", () => {
  it("renders both editors with correct headers and initial values", () => {
    render(
      <MarkdownConfiguration
        readmeContent="Initial README"
        setReadmeContent={vi.fn()}
        changelogContent="Initial CHANGELOG"
        setChangelogContent={vi.fn()}
      />
    );

    expect(screen.getByText("README.md")).toBeInTheDocument();
    expect(screen.getByText("CHANGELOG.md")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("README.md content")).toHaveValue(
      "Initial README"
    );
    expect(screen.getByPlaceholderText("CHANGELOG.md content")).toHaveValue(
      "Initial CHANGELOG"
    );
  });

  it("calls setReadmeContent when the README editor is typed in", async () => {
    const user = userEvent.setup();
    const setReadmeContent = vi.fn();

    render(
      <MarkdownConfiguration
        readmeContent=""
        setReadmeContent={setReadmeContent}
        changelogContent=""
        setChangelogContent={vi.fn()}
      />
    );

    const readmeInput = screen.getByPlaceholderText("README.md content");
    await user.type(readmeInput, "A");

    expect(setReadmeContent).toHaveBeenCalledWith("A");
  });

  it("calls setChangelogContent when the CHANGELOG editor is typed in", async () => {
    const user = userEvent.setup();
    const setChangelogContent = vi.fn();

    render(
      <MarkdownConfiguration
        readmeContent=""
        setReadmeContent={vi.fn()}
        changelogContent=""
        setChangelogContent={setChangelogContent}
      />
    );

    const changelogInput = screen.getByPlaceholderText("CHANGELOG.md content");
    await user.type(changelogInput, "B");

    expect(setChangelogContent).toHaveBeenCalledWith("B");
  });
});
