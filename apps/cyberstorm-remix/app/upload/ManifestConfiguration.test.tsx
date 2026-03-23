import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useToast } from "@thunderstore/cyberstorm";

import { ManifestConfiguration } from "./ManifestConfiguration";
import { useDependencySearch } from "./useDependencySearch";

vi.mock("@thunderstore/cyberstorm", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@thunderstore/cyberstorm")>();
  return {
    ...mod,
    useToast: vi.fn(),
  };
});

vi.mock("./useDependencySearch", () => ({
  useDependencySearch: vi.fn(),
}));

describe("ManifestConfiguration", () => {
  afterEach(cleanup);
  const mockSetVersionNumber = vi.fn();
  const mockSetPackageDescription = vi.fn();
  const mockSetDependencies = vi.fn();
  const mockAddToast = vi.fn();

  const mockDapper = {
    getPackageListingDetails: vi.fn(),
  } as any;

  const defaultProps = {
    versionNumber: "1.0.0",
    setVersionNumber: mockSetVersionNumber,
    packageDescription: "A great package",
    setPackageDescription: mockSetPackageDescription,
    dependencies: [],
    setDependencies: mockSetDependencies,
    communityOptions: [{ value: "riskofrain2", label: "Risk of Rain 2" }],
    dapper: mockDapper,
  };

  const mockUseDependencySearch = {
    dependencySourceCommunity: "",
    setDependencySourceCommunity: vi.fn(),
    setDependencySearchQuery: vi.fn(),
    dependencySearchResults: [],
    selectedDependency: null as any,
    setSelectedDependency: vi.fn(),
    isAddingDependency: false,
    setIsAddingDependency: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue({ addToast: mockAddToast });
    (useDependencySearch as any).mockReturnValue(mockUseDependencySearch);
  });

  it("renders correctly with given props", () => {
    render(<ManifestConfiguration {...defaultProps} />);

    expect(screen.getByLabelText("Version Number")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1.0.0")).toBeInTheDocument();

    expect(screen.getByLabelText("Package Description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("A great package")).toBeInTheDocument();

    expect(screen.getByText("Add Dependency")).toBeInTheDocument();
  });

  it("calls setVersionNumber when version input changes", async () => {
    render(<ManifestConfiguration {...defaultProps} />);
    const user = userEvent.setup();
    const versionInput = screen.getByLabelText("Version Number");

    await user.clear(versionInput);
    await user.type(versionInput, "1.0.1");

    expect(mockSetVersionNumber).toHaveBeenCalled();
  });

  it("calls setPackageDescription when description input changes", async () => {
    render(<ManifestConfiguration {...defaultProps} />);
    const user = userEvent.setup();
    const descInput = screen.getByLabelText("Package Description");

    await user.clear(descInput);
    await user.type(descInput, "New desc");

    expect(mockSetPackageDescription).toHaveBeenCalled();
  });

  it("renders existing dependencies and allows removing them", async () => {
    const propsWithDeps = {
      ...defaultProps,
      dependencies: [
        { name: "HookGenPatcher", namespace: "R2API", version: "1.2.3" },
      ],
    };

    render(<ManifestConfiguration {...propsWithDeps} />);
    const user = userEvent.setup();

    expect(screen.getByText("R2API-HookGenPatcher-1.2.3")).toBeInTheDocument();

    const removeButton = screen.getByRole("button", { name: "Remove" });
    await user.click(removeButton);

    expect(mockSetDependencies).toHaveBeenCalledWith([]);
  });

  it("switches to dependency search mode when Add Dependency is clicked", async () => {
    render(<ManifestConfiguration {...defaultProps} />);
    const user = userEvent.setup();

    const addBtn = screen.getByRole("button", { name: "Add Dependency" });
    await user.click(addBtn);

    expect(mockUseDependencySearch.setIsAddingDependency).toHaveBeenCalledWith(
      true
    );
  });

  describe("dependency search mode", () => {
    beforeEach(() => {
      (useDependencySearch as any).mockReturnValue({
        ...mockUseDependencySearch,
        isAddingDependency: true,
        dependencySourceCommunity: "riskofrain2",
        dependencySearchResults: [
          {
            value: "R2API-HookGen",
            label: "R2API-HookGen",
            pkg: { namespace: "R2API", name: "HookGen" },
          },
        ],
        selectedDependency: {
          value: "R2API-HookGen",
          label: "R2API-HookGen",
          pkg: { namespace: "R2API", name: "HookGen" },
        },
      });
    });

    it("fetches package details and adds dependency on confirm", async () => {
      mockDapper.getPackageListingDetails.mockResolvedValueOnce({
        latest_version_number: "2.0.0",
      });

      render(<ManifestConfiguration {...defaultProps} />);
      const user = userEvent.setup();

      const confirmBtn = screen.getByRole("button", { name: "Confirm" });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(mockDapper.getPackageListingDetails).toHaveBeenCalledWith(
          "riskofrain2",
          "R2API",
          "HookGen"
        );
        expect(mockSetDependencies).toHaveBeenCalledWith([
          {
            name: "HookGen",
            namespace: "R2API",
            version: "2.0.0",
          },
        ]);
      });

      expect(
        mockUseDependencySearch.setIsAddingDependency
      ).toHaveBeenCalledWith(false);
      expect(
        mockUseDependencySearch.setSelectedDependency
      ).toHaveBeenCalledWith(null);
      expect(
        mockUseDependencySearch.setDependencySearchQuery
      ).toHaveBeenCalledWith("");
    });

    it("displays a toast on failing to fetch package details", async () => {
      mockDapper.getPackageListingDetails.mockRejectedValueOnce(
        new Error("Network Error")
      );

      render(<ManifestConfiguration {...defaultProps} />);
      const user = userEvent.setup();

      const confirmBtn = screen.getByRole("button", { name: "Confirm" });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            csVariant: "danger",
            children: "Failed to fetch version details for dependency.",
          })
        );
      });
    });

    it("cancels adding a dependency", async () => {
      render(<ManifestConfiguration {...defaultProps} />);
      const user = userEvent.setup();

      const cancelBtn = screen.getByRole("button", { name: "Cancel" });
      await user.click(cancelBtn);

      expect(
        mockUseDependencySearch.setIsAddingDependency
      ).toHaveBeenCalledWith(false);
      expect(
        mockUseDependencySearch.setSelectedDependency
      ).toHaveBeenCalledWith(null);
      expect(
        mockUseDependencySearch.setDependencySearchQuery
      ).toHaveBeenCalledWith("");
    });
  });
});
