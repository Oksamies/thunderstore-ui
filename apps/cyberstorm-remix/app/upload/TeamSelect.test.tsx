import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TeamSelect } from "./TeamSelect";
import { NewSelectSearch } from "@thunderstore/cyberstorm";

// Mock the components from cyberstorm UI library to avoid rendering complex interactable components
vi.mock("@thunderstore/cyberstorm", () => {
  return {
    NewSelectSearch: vi.fn(({ placeholder, options, onChange, value }) => (
      <div data-testid="mock-new-select-search">
        <span data-testid="select-value">{value?.value || ""}</span>
        <button
          data-testid="select-option-a"
          onClick={() => onChange({ value: "TeamAlpha", label: "TeamAlpha" })}
        >
          Select TeamAlpha
        </button>
        <button data-testid="clear-option" onClick={() => onChange(null)}>
          Clear
        </button>
      </div>
    )),
    NewLink: vi.fn(({ children }) => (
      <a data-testid="mock-new-link" href="#">
        {children}
      </a>
    )),
  };
});

describe("TeamSelect", () => {
  const mockUpdateFormFieldState = vi.fn();
  
  const mockAvailableTeams = [
    { name: "TeamAlpha", role: "Owner", member_count: 5 },
    { name: "TeamBeta", role: "Manager", member_count: 2 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with basic props and shows 'Create team' link", () => {
    render(
      <TeamSelect
        availableTeams={mockAvailableTeams}
        authorName=""
        updateFormFieldState={mockUpdateFormFieldState}
      />
    );

    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByTestId("mock-new-link")).toHaveTextContent("Create team");
    expect(screen.getByTestId("select-value")).toHaveTextContent("");
  });

  it("passes correct properties to NewSelectSearch", () => {
    render(
      <TeamSelect
        availableTeams={mockAvailableTeams}
        authorName="TeamBeta"
        updateFormFieldState={mockUpdateFormFieldState}
      />
    );
    
    // Check if the currently selected value is rendered by the mock
    expect(screen.getByTestId("select-value")).toHaveTextContent("TeamBeta");

    // Let's also verify NewSelectSearch was called with mapped options
    expect(NewSelectSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        placeholder: "Select team",
        value: { value: "TeamBeta", label: "TeamBeta" },
        options: [
          { value: "TeamAlpha", label: "TeamAlpha" },
          { value: "TeamBeta", label: "TeamBeta" },
        ],
      }),
      {}
    );
  });

  it("calls updateFormFieldState with the selected team value when an option is chosen", () => {
    render(
      <TeamSelect
        availableTeams={mockAvailableTeams}
        authorName=""
        updateFormFieldState={mockUpdateFormFieldState}
      />
    );

    // Simulate clicking an option in the mocked SelectSearch
    const selectActionBtn = screen.getByTestId("select-option-a");
    fireEvent.click(selectActionBtn);

    expect(mockUpdateFormFieldState).toHaveBeenCalledTimes(1);
    expect(mockUpdateFormFieldState).toHaveBeenCalledWith({
      field: "author_name",
      value: "TeamAlpha",
    });
  });

  it("calls updateFormFieldState with an empty string when the selection is cleared", () => {
    render(
      <TeamSelect
        availableTeams={mockAvailableTeams}
        authorName="TeamAlpha"
        updateFormFieldState={mockUpdateFormFieldState}
      />
    );

    // Simulate clearing the select component
    const clearActionBtn = screen.getByTestId("clear-option");
    fireEvent.click(clearActionBtn);

    expect(mockUpdateFormFieldState).toHaveBeenCalledTimes(1);
    expect(mockUpdateFormFieldState).toHaveBeenCalledWith({
      field: "author_name",
      value: "",
    });
  });
});
