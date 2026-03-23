import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PackageSubmissionResult } from "@thunderstore/dapper/types";

import {
  MiniPackageCard,
  SubmissionResult,
  formatBytes,
} from "./SubmissionResult";

afterEach(cleanup);

describe("formatBytes", () => {
  it("returns 0 Bytes for 0", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  it("formats bytes correctly", () => {
    expect(formatBytes(1024)).toBe("1 KiB");
    expect(formatBytes(1048576)).toBe("1 MiB");
  });

  it("handles decimal places properly", () => {
    expect(formatBytes(1500, 1)).toBe("1.5 KiB");
    expect(formatBytes(1500, -1)).toBe("1 KiB");
  });
});

describe("MiniPackageCard", () => {
  it("renders with basic props", () => {
    render(<MiniPackageCard name="TestPkg" author="TestAuthor" />);
    expect(screen.getByText("TestPkg")).toBeInTheDocument();
    expect(screen.getByText("TestAuthor")).toBeInTheDocument();
  });

  it("renders fallback text for missing name/author", () => {
    render(<MiniPackageCard name="" author="" />);
    expect(screen.getByText("Unknown Package")).toBeInTheDocument();
    expect(screen.getByText("Unknown Author")).toBeInTheDocument();
  });

  it("renders icon when iconUrl is provided", () => {
    render(<MiniPackageCard name="Pkg" author="Auth" iconUrl="icon.png" />);
    const img = screen.getByAltText("icon");
    expect(img).toHaveAttribute("src", "icon.png");
  });

  it("renders version and overlay text", () => {
    render(
      <MiniPackageCard
        name="Pkg"
        author="Auth"
        version="1.0.0"
        overlayText="Overlay info"
      />
    );
    expect(screen.getByText("1.0.0")).toBeInTheDocument();
    expect(screen.getByText("Overlay info")).toBeInTheDocument();
  });

  it("handles actions properly", () => {
    const handleAction = vi.fn();
    render(
      <MiniPackageCard
        name="Pkg"
        author="Auth"
        actionText="Click Me"
        onAction={handleAction}
        actionVariant="danger"
      />
    );
    const btn = screen.getByRole("button", { name: "Click Me" });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleAction).toHaveBeenCalled();
  });
  it("renders default primary button when actionVariant is empty", () => {
    render(
      <MiniPackageCard
        name="Test"
        author="Test"
        actionText="Default Action"
        onAction={vi.fn()}
      />
    );
    // Button is rendered and defaults to primary variant
    const btn = screen.getByText("Default Action");
    expect(btn.className).toContain("button--variant--primary");
  });});

describe("SubmissionResult", () => {
  const mockResult: PackageSubmissionResult = {
    submission_id: "test-id",
    package_version: {
      namespace: "test_namespace",
      name: "test_name",
      version_number: "1.0.0",
      full_name: "test_namespace-test_name-1.0.0",
      description: "A test description",
      icon: "test_icon.png",
      dependencies: [],
      download_url: "http://localhost/dl",
      downloads: 0,
      date_created: "2023-01-01T00:00:00Z",
      website_url: "http://localhost",
      is_active: true,
      uuid4: "test-uuid",
    },
    available_communities: [
      {
        community: {
          identifier: "test-game",
          name: "Test Game",
          discord_url: null,
          wiki_url: null,
          require_package_listing_approval: false,
        },
        categories: [
          { name: "Mods", slug: "mods" },
          { name: "Items", slug: "items" },
        ],
        url: "http://localhost/community",
      },
    ],
  };

  it("renders submission status correctly with website URL", () => {
    render(<SubmissionResult submissionStatusResult={mockResult} />);
    expect(screen.getByText("test_name")).toBeInTheDocument();
    expect(screen.getByText("A test description")).toBeInTheDocument();
    expect(screen.getByText("By test_namespace")).toBeInTheDocument();
    expect(screen.getByText("http://localhost")).toBeInTheDocument();
    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(screen.getByText("Test Game")).toBeInTheDocument();
    expect(screen.getByText("Mods")).toBeInTheDocument();
    expect(screen.getByText("Items")).toBeInTheDocument();
    expect(screen.getByText("View listing")).toHaveAttribute(
      "href",
      "/c/test-game/p/test_namespace/test_name/"
    );
  });

  it("renders submission status correctly without website URL", () => {
    const noWebsiteMock = {
      ...mockResult,
      package_version: {
        ...mockResult.package_version,
        website_url: "",
      },
    };
    render(<SubmissionResult submissionStatusResult={noWebsiteMock} />);
    expect(screen.queryByText("http://localhost")).not.toBeInTheDocument();
  });

  it("renders correct pluralization for multiple communities", () => {
    const multiCommunityMock = {
      ...mockResult,
      available_communities: [
        ...mockResult.available_communities,
        {
          community: {
            identifier: "test-game-2",
            name: "Test Game 2",
            discord_url: null,
            wiki_url: null,
            require_package_listing_approval: false,
          },
          categories: [],
          url: "http://localhost/community-2",
        },
      ],
    };
    render(<SubmissionResult submissionStatusResult={multiCommunityMock} />);
    expect(
      screen.getByText(/The package is listed in 2 communities:/)
    ).toBeInTheDocument();
  });
});
