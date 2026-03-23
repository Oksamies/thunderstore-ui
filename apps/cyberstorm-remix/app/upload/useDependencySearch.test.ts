/* eslint-disable prettier/prettier, linebreak-style */
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { useDependencySearch } from "./useDependencySearch";
import { type PackageListing } from "@thunderstore/dapper/types";
import { DapperTs } from "@thunderstore/dapper-ts";

describe("useDependencySearch", () => {
  let mockDapper: DapperTs;

  const mockPackageListing: PackageListing = {
    namespace: "TestNamespace",
    name: "TestPackage",
    icon_url: "http://localhost/icon.png",
    is_deprecated: false,
    is_pinned: false,
    last_updated: "2024-01-01T00:00:00Z",
    categories: [],
    size: 1024,
    description: "A test package",
    community_identifier: "test-community",
    download_count: 0,
    is_nsfw: false,
    rating_count: 0,
  };

  beforeEach(() => {
    mockDapper = {
      getPackageListings: vi.fn(),
    } as unknown as DapperTs;

    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("should initialize with default states", () => {
    const { result } = renderHook(() => useDependencySearch(mockDapper));

    expect(result.current.dependencySourceCommunity).toBe("");
    expect(result.current.dependencySearchQuery).toBe("");
    expect(result.current.dependencySearchResults).toEqual([]);
    expect(result.current.selectedDependency).toBeNull();
    expect(result.current.isAddingDependency).toBe(false);
  });

  it("should not call getPackageListings if dependencySourceCommunity is empty", async () => {
    renderHook(() => useDependencySearch(mockDapper));

    vi.advanceTimersByTime(300);

    expect(mockDapper.getPackageListings).not.toHaveBeenCalled();
  });

  it("should call getPackageListings when dependencySourceCommunity is set", async () => {
    (mockDapper.getPackageListings as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      results: [mockPackageListing],
    });

    const { result } = renderHook(() => useDependencySearch(mockDapper));

    act(() => {
      result.current.setDependencySourceCommunity("test-community");
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockDapper.getPackageListings).toHaveBeenCalledWith(
        { kind: "community", communityId: "test-community" },
        undefined,
        1,
        undefined
      );
    });

    await waitFor(() => {
      expect(result.current.dependencySearchResults).toEqual([
        {
          value: "TestNamespace-TestPackage",
          label: "TestPackage by TestNamespace",
          pkg: mockPackageListing,
        },
      ]);
    });
  });

  it("should debounce dependencySearchQuery and call api", async () => {
    (mockDapper.getPackageListings as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      results: [mockPackageListing],
    });

    const { result } = renderHook(() => useDependencySearch(mockDapper));

    act(() => {
      result.current.setDependencySourceCommunity("test-community");
      result.current.setDependencySearchQuery("te");
    });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Initial call without search queue
    await waitFor(() => {
      expect(mockDapper.getPackageListings).toHaveBeenCalledWith(
        { kind: "community", communityId: "test-community" },
        undefined,
        1,
        "te"
      );
    });

    act(() => {
      result.current.setDependencySearchQuery("test search");
    });

    // Advance by less than debounce time
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // It was called twice before (initial + 'te'), not again yet for 'test search'
    expect(mockDapper.getPackageListings).toHaveBeenCalledTimes(2);

    // Advance by the rest of debounce time
    act(() => {
      vi.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockDapper.getPackageListings).toHaveBeenCalledWith(
        { kind: "community", communityId: "test-community" },
        undefined,
        1,
        "test search"
      );
    });
  });

  it("should handle API errors gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (mockDapper.getPackageListings as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network Error"));

    const { result } = renderHook(() => useDependencySearch(mockDapper));

    // Force an existing state to verify it gets cleared
    act(() => {
      result.current.setDependencySourceCommunity("test-community");
    });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockDapper.getPackageListings).toHaveBeenCalled();
      expect(result.current.dependencySearchResults).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it("should handle unmount during API call gracefully", async () => {
    let mockResolve: any;
    const promise = new Promise((resolve) => {
      mockResolve = resolve;
    });
    // Add dummy catch properly if it were to reject, though not needed here, good practice.
    promise.catch(() => {});
    
    (mockDapper.getPackageListings as unknown as ReturnType<typeof vi.fn>).mockReturnValue(promise);

    const { result, unmount } = renderHook(() => useDependencySearch(mockDapper));

    act(() => {
      result.current.setDependencySourceCommunity("test-community");
    });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Unmount before promise resolves
    unmount();
    
    // Resolve it after unmount
    await act(async () => {
      mockResolve({ results: [mockPackageListing] });
    });
    
    expect(result.current.dependencySearchResults).toEqual([]);
  });

  it("should handle unmount during API error gracefully", async () => {
    let mockReject: any;
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const promise = new Promise((_, reject) => {
      mockReject = reject;
    });
    // Add dummy catch so Node doesn't terminate on unhandled rejection
    promise.catch(() => {});
    
    (mockDapper.getPackageListings as unknown as ReturnType<typeof vi.fn>).mockReturnValue(promise);

    const { result, unmount } = renderHook(() => useDependencySearch(mockDapper));

    act(() => {
      result.current.setDependencySourceCommunity("test-community");
    });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Unmount before promise rejects
    unmount();
    
    // Reject it after unmount
    await act(async () => {
      // Catch unhandled rejection just in case test runner complains
      try {
        mockReject(new Error("Network error"));
      } catch {}
    });
    
    expect(result.current.dependencySearchResults).toEqual([]);
    consoleErrorSpy.mockRestore();
  });

  it("should handle unmount when there is no community selected", () => {
    const { result, unmount } = renderHook(() => useDependencySearch(mockDapper));
    unmount();
    expect(result.current.dependencySearchResults).toEqual([]);
  });

  it("should allow setting selected dependency and isAddingDependency statuses", () => {
    const { result } = renderHook(() => useDependencySearch(mockDapper));

    act(() => {
      result.current.setSelectedDependency({
        value: "TestNamespace-TestPackage",
        label: "TestPackage by TestNamespace",
        pkg: mockPackageListing,
      });
      result.current.setIsAddingDependency(true);
    });

    expect(result.current.selectedDependency).toEqual({
      value: "TestNamespace-TestPackage",
      label: "TestPackage by TestNamespace",
      pkg: mockPackageListing,
    });
    expect(result.current.isAddingDependency).toBe(true);
  });
});
