/* eslint-disable prettier/prettier, linebreak-style */
// @ts-expect-error - testing module might be missing
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTeamPackages } from "./useTeamPackages";
import type { DapperTs } from "@thunderstore/dapper-ts";

describe("useTeamPackages", () =>
  // Lines omitted ... {
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

  it("updates searchPackageName correctly", () => {
    const { result } = renderHook(() =>
      useTeamPackages(mockDapper as unknown as DapperTs, "team1", "community1")
    );

    act(() => {
      result.current.setSearchPackageName("newSearch");
    });
    
    expect(result.current.searchPackageName).toBe("newSearch");
  });

  it("refetches when authorName changes", async () => {
    const mockResults1 = [{ name: "Mod1", namespace: "team1" }];
    const mockResults2 = [{ name: "Mod2", namespace: "team2" }];

    mockDapper.getPackageListings.mockResolvedValueOnce({ results: mockResults1 });

    const { result, rerender } = renderHook(
      ({ author }) => useTeamPackages(mockDapper as unknown as DapperTs, author, "community1"),
      { initialProps: { author: "team1" } }
    );

    // Initial fetch should occur
    await waitFor(() => {
      expect(result.current.teamPackageListings).toEqual(mockResults1);
    });
    
    expect(mockDapper.getPackageListings).toHaveBeenCalledWith(expect.objectContaining({ namespaceId: "team1" }));

    mockDapper.getPackageListings.mockResolvedValueOnce({ results: mockResults2 });

    rerender({ author: "team2" });

    // Second fetch should occur with new author name
    await waitFor(() => {
      expect(result.current.teamPackageListings).toEqual(mockResults2);
    });

    expect(mockDapper.getPackageListings).toHaveBeenCalledWith(expect.objectContaining({ namespaceId: "team2" }));
  });

  it("handles unmount safely (active = false) on success", async () => {
    const mockResults = [{ name: "Mod1", namespace: "team1" }];
    let resolvePromise: (value: any) => void;
    
    // We create a promise we can resolve AFTER unmounting
    mockDapper.getPackageListings.mockImplementation(() => {
      return new Promise((resolve) => {
        resolvePromise = resolve;
      });
    });

    const { result, unmount } = renderHook(() =>
      useTeamPackages(mockDapper as unknown as DapperTs, "team1", "community1")
    );

    // Unmount the component before promise resolves
    unmount();
    
    // Now resolve the promise
    await act(async () => {
      resolvePromise!({ results: mockResults });
    });

    // Make sure states were NOT updated since 'active' became false
    expect(result.current.teamPackageListings).toEqual([]);
    expect(result.current.teamPackages).toEqual([]);
  });

  it("handles unmount safely (active = false) on error", async () => {
    let rejectPromise: (reason: any) => void;
    
    mockDapper.getPackageListings.mockImplementation(() => {
      return new Promise((_, reject) => {
        rejectPromise = reject;
      });
    });

    const { result, unmount } = renderHook(() =>
      useTeamPackages(mockDapper as unknown as DapperTs, "team1", "community1")
    );

    unmount();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      rejectPromise!(new Error("Async Error"));
    });

    expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch team packages", expect.any(Error));
    // States should remain empty, unaffected by trailing catch set states because active is false
    expect(result.current.teamPackageListings).toEqual([]);
    expect(result.current.teamPackages).toEqual([]);
  });
});
