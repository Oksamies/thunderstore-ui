/* eslint-disable prettier/prettier, linebreak-style */
// @ts-expect-error - testing module might be missing
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTeamPackages } from "./useTeamPackages";
import type { DapperTs } from "@thunderstore/dapper-ts";

describe("useTeamPackages", () => {
  let mockDapper: { getPackageListings: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDapper = {
      getPackageListings: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not fetch when params are empty and returns empty arrays", async () => {
    const { result } = renderHook(() =>
      useTeamPackages(mockDapper as unknown as DapperTs, "", "")
    );

    expect(mockDapper.getPackageListings).not.toHaveBeenCalled();
    expect(result.current.teamPackages).toEqual([]);
    expect(result.current.teamPackageListings).toEqual([]);
  });

  it("fetches, stores listings, and properly formats teamPackages when params are present", async () => {
    const mockResults = [
      { name: "FirstMod", namespace: "team1" },
      { name: "SecondMod", namespace: "team1" },
    ];
    
    mockDapper.getPackageListings.mockResolvedValueOnce({
      results: mockResults,
    });

    const { result } = renderHook(() =>
      useTeamPackages(mockDapper as unknown as DapperTs, "team1", "community1")
    );

    // Initial state before promise resolves
    expect(result.current.teamPackages).toEqual([]);
    expect(result.current.teamPackageListings).toEqual([]);

    expect(mockDapper.getPackageListings).toHaveBeenCalledWith({
      kind: "namespace",
      communityId: "community1",
      namespaceId: "team1",
    });

    // Wait for the hook to set the fetched state
    await waitFor(() => {
      // The listings should be saved directly
      expect(result.current.teamPackageListings).toEqual(mockResults);
      // The teamPackages should be accurately formatted
      expect(result.current.teamPackages).toEqual([
        { value: "FirstMod", label: "FirstMod" },
        { value: "SecondMod", label: "SecondMod" },
      ]);
    });
  });

  it("handles errors from dapper gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockDapper.getPackageListings.mockRejectedValueOnce(new Error("API Error"));

    const { result } = renderHook(() =>
      useTeamPackages(mockDapper as unknown as DapperTs, "team1", "community1")
    );

    // Wait for the inner try-catch to resolve the promise rejection state
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch team packages",
        expect.any(Error)
      );
    });

    // State should still be in error fallback defaults (empty lists)
    expect(result.current.teamPackages).toEqual([]);
    expect(result.current.teamPackageListings).toEqual([]);
  });
});
