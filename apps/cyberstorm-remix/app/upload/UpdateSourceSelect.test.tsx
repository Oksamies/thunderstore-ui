import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { UpdateSourceSelect } from "../UpdateSourceSelect";

vi.mock("@thunderstore/cyberstorm", async () => {
  const actual = await vi.importActual("@thunderstore/cyberstorm");
  return {
    ...actual,
    NewSelectSearch: ({
      options,
      onChange,
      value,
      placeholder,
    }: any) => {
      return (
        <select
          data-testid={`mock-select-${placeholder}`}
          onChange={(e) => {
            const selected = options.find((o: any) => o.value === e.target.value);
            if (e.target.value === "") {
              onChange(undefined);
            } else {
              onChange(selected);
            }
          }}
          value={value?.value || ""}
        >
          <option value="">Choose...</option>
          {options.map((opt: any) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    },
  };
});

vi.mock("../SubmissionResult", () => ({
  MiniPackageCard: ({ name, author }: any) => (
    <div data-testid="mini-package-card">
      {name} by {author}
    </div>
  ),
}));

describe("UpdateSourceSelect", () => {
  const defaultProps = {
    intent: "update" as const,
    sourceCommunity: "",
    setSourceCommunity: vi.fn(),
    communityOptions: [
      { value: "com1", label: "Community 1" },
      { value: "com2", label: "Community 2" },
    ],
    searchPackageName: "",
    setSearchPackageName: vi.fn(),
    teamPackages: [
      { value: "pkg1", label: "Package 1" },
      { value: "pkg2", label: "Package 2" },
    ],
    fetchExistingPackage: vi.fn(),
    teamPackageListings: [
      {
        name: "pkg1",
        namespace: "team1",
        description: "Desc 1",
        icon_url: "url1",
      },
    ],
  };

  it("returns null if intent is not 'update'", () => {
    const { container } = render(
      <UpdateSourceSelect {...defaultProps} intent="new" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders correctly with intent 'update'", () => {
    render(<UpdateSourceSelect {...defaultProps} />);
    expect(screen.getByText("Source Community")).toBeInTheDocument();
    expect(screen.getByText("Select Package")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument();
  });

  it("handles sourceCommunity change and clear action", () => {
    const setSourceCommunity = vi.fn();
    const setSearchPackageName = vi.fn();
    render(
      <UpdateSourceSelect
        {...defaultProps}
        sourceCommunity="com1"
        setSourceCommunity={setSourceCommunity}
        setSearchPackageName={setSearchPackageName}
      />
    );

    const select = screen.getByTestId("mock-select-Filter by community...");
    expect(select).toHaveValue("com1");

    // Change value
    fireEvent.change(select, { target: { value: "com2" } });
    expect(setSourceCommunity).toHaveBeenCalledWith("com2");
    expect(setSearchPackageName).toHaveBeenCalledWith("");

    // Clear value
    fireEvent.change(select, { target: { value: "" } });
    expect(setSourceCommunity).toHaveBeenCalledWith("");
  });

  it("handles sourceCommunity invalid missing label fallback", () => {
    // If the label is not found (simulated bad data)
    render(
      <UpdateSourceSelect
        {...defaultProps}
        sourceCommunity="com-missing"
        communityOptions={[]} 
      />
    );
    const select = screen.getByTestId("mock-select-Filter by community...");
    expect(select).toHaveValue("com-missing");
  });

  it("handles searchPackageName change and clear action", () => {
    const setSearchPackageName = vi.fn();
    render(
      <UpdateSourceSelect
        {...defaultProps}
        searchPackageName="pkg1"
        setSearchPackageName={setSearchPackageName}
      />
    );

    const select = screen.getByTestId("mock-select-Select package...");
    expect(select).toHaveValue("pkg1");

    // Change value
    fireEvent.change(select, { target: { value: "pkg2" } });
    expect(setSearchPackageName).toHaveBeenCalledWith("pkg2");

    // Clear value
    fireEvent.change(select, { target: { value: "" } });
    expect(setSearchPackageName).toHaveBeenCalledWith("");
  });

  it("calls fetchExistingPackage on Import button click", () => {
    const fetchExistingPackage = vi.fn();
    render(
      <UpdateSourceSelect
        {...defaultProps}
        fetchExistingPackage={fetchExistingPackage}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    expect(fetchExistingPackage).toHaveBeenCalled();
  });

  it("renders MiniPackageCard when a remote package is selected", () => {
    render(
      <UpdateSourceSelect
        {...defaultProps}
        searchPackageName="pkg1"
      />
    );

    const miniCard = screen.getByTestId("mini-package-card");
    expect(miniCard).toBeInTheDocument();
    expect(miniCard).toHaveTextContent("pkg1 by team1");
  });

  it("does not render MiniPackageCard when searchPackageName does not match", () => {
    render(
      <UpdateSourceSelect
        {...defaultProps}
        searchPackageName="non-existent"
      />
    );

    expect(screen.queryByTestId("mini-package-card")).not.toBeInTheDocument();
  });
});