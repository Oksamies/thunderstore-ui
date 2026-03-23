import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useStrongForm } from "cyberstorm/utils/StrongForm/useStrongForm";
import React from "react";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useOutletContext,
} from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Upload from "./upload";
import { clientLoader, loader } from "./upload";

// Mock @thunderstore/cyberstorm components
vi.mock("@thunderstore/cyberstorm", async (importActual) => {
  const actual =
    await importActual<typeof import("@thunderstore/cyberstorm")>();
  return {
    ...actual,
    NewButton: ({ children, onClick, disabled }: any) => (
      <button onClick={onClick} disabled={disabled} data-testid="new-button">
        {children}
      </button>
    ),
    NewIcon: ({ children }: any) => <div>{children}</div>,
    NewSelectSearch: ({
      value,
      onChange,
      placeholder,
      disabled,
      multiple,
    }: any) => (
      <div
        data-testid="select-search"
        data-placeholder={placeholder}
        data-disabled={disabled}
      >
        <button
          data-testid="select-search-trigger"
          onClick={() => {
            if (multiple) {
              onChange([{ value: "riskofrain2", label: "Risk of Rain 2" }]);
            } else {
              onChange({ value: "test", label: "Test" });
            }
          }}
        >
          Select Option
        </button>
      </div>
    ),
    NewSwitch: ({ value, onChange }: any) => (
      <input
        type="checkbox"
        data-testid="new-switch"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    ),
    useToast: vi.fn(() => ({ addToast: vi.fn() })),
  };
});

// Mock react-router
vi.mock("@thunderstore/dapper-ts", async (importActual) => {
  const actual = await importActual<typeof import("@thunderstore/dapper-ts")>();
  return {
    ...actual,
    DapperTs: vi.fn(),
  };
});

vi.mock("react-router", async (importActual) => {
  const actual = await importActual<typeof import("react-router")>();
  return {
    ...actual,
    useLoaderData: vi.fn(),
    useActionData: vi.fn(),
    useNavigation: vi.fn(),
    useOutletContext: vi.fn(),
    Await: ({ children, resolve }: any) => {
      // Very simple Await mock that resolves immediately
      if (typeof children === "function") {
        return children(resolve);
      }
      return children;
    },
  };
});

// Mock cyberstorm utils
vi.mock("cyberstorm/utils/StrongForm/useStrongForm", () => ({
  useStrongForm: vi.fn(() => ({
    submit: vi.fn(),
    submitOutput: undefined,
  })),
}));

vi.mock("cyberstorm/utils/env", () => ({
  getApiHostForSsr: vi.fn(() => "http://localhost"),
}));

vi.mock("cyberstorm/utils/meta", async (importActual) => {
  const actual = await importActual<typeof import("cyberstorm/utils/meta")>();
  return {
    ...actual,
    createSeo: vi.fn(() => ({})),
  };
});

// Mock custom hooks and children elements
vi.mock("./TeamSelect", () => ({
  TeamSelect: ({ updateFormFieldState }: any) => (
    <div data-testid="mock-team-select">
      <button
        onClick={() =>
          updateFormFieldState({ field: "author_name", value: "test-team" })
        }
      >
        Select Team
      </button>
    </div>
  ),
}));

vi.mock("./IntentSwitcher", () => ({
  IntentSwitcher: ({ onNewIntent, setIntent }: any) => (
    <div data-testid="mock-intent-switcher">
      <button onClick={() => setIntent("update")}>Update Intent</button>
      <button onClick={onNewIntent}>Reset Intent</button>
    </div>
  ),
}));

vi.mock("./UpdateSourceSelect", () => ({
  UpdateSourceSelect: () => <div data-testid="mock-update-source" />,
}));
vi.mock("./UploadDropzone", () => ({
  UploadDropzone: ({ setIsDone }: any) => (
    <div data-testid="mock-upload-dropzone">
      <button data-testid="finish-dropzone" onClick={() => setIsDone(true)}>
        Finish Drop
      </button>
    </div>
  ),
}));
vi.mock("./ManifestConfiguration", () => ({
  ManifestConfiguration: () => <div data-testid="mock-manifest" />,
}));
vi.mock("./VirtualZipEditor", () => ({
  VirtualZipEditor: () => <div data-testid="mock-virtual-zip" />,
}));
vi.mock("./MarkdownConfiguration", () => ({
  MarkdownConfiguration: () => <div data-testid="mock-markdown" />,
}));
vi.mock("./SubmissionResult", () => ({
  SubmissionResult: () => <div data-testid="mock-submission-result" />,
}));

vi.mock("./useTeamPackages", () => ({
  useTeamPackages: () => ({
    teamPackages: [],
    teamPackageListings: [],
    searchPackageName: "",
    setSearchPackageName: vi.fn(),
  }),
}));

vi.mock("./useUploadActions", () => ({
  useUploadActions: () => ({
    extractFilesFromZip: vi.fn(),
    fetchExistingPackage: vi.fn(),
    startUpload: vi.fn(),
    retryPolling: vi.fn(),
  }),
}));

describe("Upload Page Component", () => {
  const mockLoaderData = {
    results: [
      { identifier: "riskofrain2", name: "Risk of Rain 2" },
      { identifier: "valheim", name: "Valheim" },
    ],
  };

  const mockOutletContext = {
    requestConfig: vi.fn(() => ({
      headers: { Authorization: "Bearer test" },
    })),
    currentUser: {
      teams_full: [{ name: "test-team", role: "owner", member_count: 1 }],
    },
    dapper: {
      getCommunityFilters: vi.fn(() =>
        Promise.resolve({
          package_categories: [
            { slug: "cat1", name: "Category 1" },
            { slug: "cat2", name: "Category 2" },
          ],
        })
      ),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useLoaderData as any).mockReturnValue(mockLoaderData);
    (useOutletContext as any).mockReturnValue(mockOutletContext);
    (useNavigation as any).mockReturnValue({ state: "idle" });
    (useActionData as any).mockReturnValue(undefined);

    (useStrongForm as any).mockReturnValue({
      submit: vi.fn(),
      submitOutput: undefined,
    });
  });

  describe("loaders", () => {
    it("tests loader", async () => {
      const { DapperTs } = await import("@thunderstore/dapper-ts");
      const dapperMock = {
        getCommunities: vi.fn().mockResolvedValue({ results: [] }),
      };
      (DapperTs as any).mockImplementation(() => dapperMock);

      const res = await loader();
      expect(res.results).toBeDefined();
      expect(res.seo).toBeDefined();
    });

    it("tests clientLoader", async () => {
      const serverLoaderMock = vi.fn().mockResolvedValue({ results: [] });
      const res = await clientLoader({ serverLoader: serverLoaderMock } as any);
      expect(res.results).toBeDefined();
    });
  });

  it("renders the upload page and default components", () => {
    render(<Upload />);
    expect(screen.getByText("Upload package")).toBeInTheDocument();
  });

  it("handles team selection and displays configuration block", async () => {
    render(<Upload />);

    // Config block should not be visible initially
    expect(
      screen.queryByText("Package Content & Configuration")
    ).not.toBeInTheDocument();

    // Select team
    const teamBtn = screen.getByText("Select Team");
    fireEvent.click(teamBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Package Content & Configuration")
      ).toBeInTheDocument();
      expect(screen.getByText("Listing Details")).toBeInTheDocument();
      expect(screen.getByText("Publish")).toBeInTheDocument();
    });
  });

  it("handles resetting state", async () => {
    render(<Upload />);
    fireEvent.click(screen.getByText("Select Team"));

    await waitFor(() => {
      expect(screen.getByText("Publish")).toBeInTheDocument();
    });

    const resetBtn = screen.getByRole("button", { name: "Reset" });
    fireEvent.click(resetBtn);

    // After reset author name is gone, so the full form resets
    expect(
      screen.queryByText("Package Content & Configuration")
    ).not.toBeInTheDocument();
  });

  it("handles changing target communities (select changes and clear)", async () => {
    render(<Upload />);
    fireEvent.click(screen.getByText("Select Team"));

    await waitFor(() => {
      expect(screen.getByText("Target Communities")).toBeInTheDocument();
    });

    const selects = screen.getAllByTestId("select-search-trigger");
    // Target communities is the first one
    fireEvent.click(selects[0]);

    await waitFor(() => {
      expect(mockOutletContext.dapper.getCommunityFilters).toHaveBeenCalledWith(
        "riskofrain2"
      );
      expect(screen.getByText("Risk of Rain 2 Categories")).toBeInTheDocument();
    });
  });

  it("tests successful file upload publishing flow (auto submit)", async () => {
    const submitMock = vi.fn();
    (useStrongForm as any).mockReturnValue({
      submit: submitMock,
      submitOutput: undefined,
    });

    render(<Upload />);

    // Select team to show form
    fireEvent.click(screen.getByText("Select Team"));

    // Select communities
    await waitFor(() => {
      expect(screen.getByText("Target Communities")).toBeInTheDocument();
    });
    const selects = screen.getAllByTestId("select-search-trigger");
    fireEvent.click(selects[0]);
    await waitFor(() => {
      expect(screen.getByText("Risk of Rain 2 Categories")).toBeInTheDocument();
    });

    await waitFor(() => {
      const publishBtn = screen.getByRole("button", {
        name: "Publish Package",
      });
      expect(publishBtn).not.toBeDisabled();
      fireEvent.click(publishBtn);
    });

    // We simulated startUpload path, but we can't fully mock auto submit inside a single render
    // unless uuid was set. We'll just verify the publish button works.
  });

  it("evaluates strong form callbacks (onSubmitSuccess, onSubmitError)", async () => {
    const { useToast } = await import("@thunderstore/cyberstorm");
    const addToastMock = vi.fn();
    (useToast as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      addToast: addToastMock,
    });

    render(<Upload />);

    // Manually trigger the strong form callbacks captured by mock
    const useStrongFormCalls = (useStrongForm as any).mock.calls;
    const lastCall = useStrongFormCalls[useStrongFormCalls.length - 1][0];

    // Trigger success
    lastCall.onSubmitSuccess();
    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({ csVariant: "info" })
    );

    // Trigger error
    lastCall.onSubmitError(new Error("Test error message"));
    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({ csVariant: "danger" })
    );
  });

  it("evaluates strong form errors rendering", async () => {
    (useStrongForm as any).mockReturnValue({
      submit: vi.fn(),
      submitOutput: {
        form_errors: {
          author_name: ["Field is required"],
          __all__: ["General errors"],
        },
        result: null,
      },
    });

    render(<Upload />);
    fireEvent.click(screen.getByText("Select Team"));

    await waitFor(() => {
      expect(screen.getByText("General errors")).toBeInTheDocument();
      expect(screen.getByText(/Author name/i)).toBeInTheDocument();
      expect(screen.getByText("Field is required")).toBeInTheDocument();
    });
  });

  it("deals with intent switcher", async () => {
    render(<Upload />);
    fireEvent.click(screen.getByText("Select Team"));

    const updateIntentBtn = screen.getByText("Update Intent");
    fireEvent.click(updateIntentBtn);

    const resetIntentBtn = screen.getByText("Reset Intent");
    fireEvent.click(resetIntentBtn);
  });
});
