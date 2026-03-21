/* eslint-disable prettier/prettier */
// @ts-expect-error testing-library not strictly found
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUploadActions, type UseUploadActionsProps } from "./useUploadActions";

// --- Mock JSZip --- //
const mockFileAsyncText = vi.fn();
const mockFileAsyncBlob = vi.fn();

const mockZipFileObj = {
  async: vi.fn((type: string) => {
    if (type === "text") return mockFileAsyncText();
    if (type === "blob") return mockFileAsyncBlob();
    return Promise.resolve("mocked");
  }),
};

const mockJSZipLoadAsync = vi.fn();
const mockJSZipGenerateAsync = vi.fn();
const mockJSZipFile = vi.fn();
const mockJSZipFolder = vi.fn();

vi.mock("jszip", () => {
  return {
    default: vi.fn(() => ({
      loadAsync: mockJSZipLoadAsync,
      file: mockJSZipFile,
      folder: mockJSZipFolder,
      generateAsync: mockJSZipGenerateAsync,
    })),
  };
});

// --- Mock ts-uploader --- //
const mockUploadStart = vi.fn();
vi.mock("@thunderstore/ts-uploader", () => {
  return {
    MultipartUpload: vi.fn().mockImplementation(() => ({
      start: mockUploadStart,
      handle: "mock-handle",
    })),
  };
});

// --- Mock globals --- //
const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
global.URL.createObjectURL = mockCreateObjectURL;

describe("useUploadActions", () => {
  const mockDapper = {
    getPackageVersions: vi.fn(),
    getPackageSubmissionStatus: vi.fn(),
  };

  const mockToast = {
    addToast: vi.fn(),
    clearToasts: vi.fn(),
  };

  const setOriginalZipBuffer = vi.fn();
  const setVersionNumber = vi.fn();
  const setPackageName = vi.fn();
  const setPackageDescription = vi.fn();
  const setIconPreviewUrl = vi.fn();
  const setReadmeContent = vi.fn();
  const setChangelogContent = vi.fn();
  const setFile = vi.fn();
  const setHandle = vi.fn();
  const setUsermedia = vi.fn();
  const setIsDone = vi.fn();
  const setSubmissionStatus = vi.fn();

  const requestConfig = vi.fn(() => ({ apiHost: "http://localhost:8000" }));

  const defaultProps = {
    dapper: mockDapper,
    toast: mockToast,
    requestConfig,
    setOriginalZipBuffer,
    setVersionNumber,
    setPackageName,
    setPackageDescription,
    setIconPreviewUrl,
    setReadmeContent,
    setChangelogContent,
    setFile,
    formInputs: { author_name: "MockAuthor" },
    searchPackageName: "MockPackage",
    intent: "update",
    file: null,
    originalZipBuffer: null,
    virtualFiles: [],
    readmeContent: "",
    changelogContent: "",
    newIconFile: null,
    packageName: "",
    versionNumber: "",
    packageDescription: "",
    dependencies: [],
    setHandle,
    setUsermedia,
    setIsDone,
    submissionStatus: undefined,
    setSubmissionStatus,
  } as unknown as UseUploadActionsProps;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractFilesFromZip", () => {
    it("should successfully extract files and update state hooks", async () => {
      mockJSZipLoadAsync.mockResolvedValueOnce(undefined);
      mockJSZipFile.mockImplementation((name: string) => {
        if (
          name === "README.md" ||
          name === "CHANGELOG.md" ||
          name === "manifest.json" ||
          name === "icon.png"
        ) {
          return mockZipFileObj;
        }
        return null;
      });

      mockFileAsyncText.mockImplementationOnce(() =>
        Promise.resolve("# Readme")
      );
      mockFileAsyncText.mockImplementationOnce(() =>
        Promise.resolve("# Changelog")
      );
      mockFileAsyncText.mockImplementationOnce(() =>
        Promise.resolve(
          JSON.stringify({
            name: "TestPack",
            version_number: "2.0.0",
            description: "Test Desc",
          })
        )
      );
      mockFileAsyncBlob.mockImplementationOnce(() =>
        Promise.resolve(new Blob())
      );

      const { result } = renderHook(() => useUploadActions(defaultProps));

      const mockFile = new File(["dummy"], "test.zip", {
        type: "application/zip",
      });
      await act(async () => {
        await result.current.extractFilesFromZip(mockFile);
      });

      expect(setOriginalZipBuffer).toHaveBeenCalled();
      expect(mockJSZipLoadAsync).toHaveBeenCalled();
      expect(setReadmeContent).toHaveBeenCalledWith("# Readme");
      expect(setChangelogContent).toHaveBeenCalledWith("# Changelog");
      expect(setPackageName).toHaveBeenCalledWith("TestPack");
      expect(setVersionNumber).toHaveBeenCalledWith("2.0.0");
      expect(setPackageDescription).toHaveBeenCalledWith("Test Desc");
      expect(setIconPreviewUrl).toHaveBeenCalledWith("blob:mock-url");
    });

    it("should handle error parsing manifest.json and icon.png safely without failing total extraction", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockJSZipLoadAsync.mockResolvedValueOnce(undefined);

      mockJSZipFile.mockImplementation((name: string) => {
        if (name === "manifest.json" || name === "icon.png")
          return mockZipFileObj;
        return null;
      });

      mockFileAsyncText.mockImplementationOnce(() =>
        Promise.resolve("{ invalid json }")
      );
      mockFileAsyncBlob.mockRejectedValueOnce(new Error("icon error"));

      const { result } = renderHook(() => useUploadActions(defaultProps));
      const mockFile = new File(["dummy"], "test.zip", {
        type: "application/zip",
      });

      await act(async () => {
        await result.current.extractFilesFromZip(mockFile);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to parse manifest.json",
        expect.any(Error)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to load icon.png",
        expect.any(Error)
      );
      expect(mockToast.addToast).not.toHaveBeenCalledWith(
        expect.objectContaining({ csVariant: "danger" })
      );

      consoleSpy.mockRestore();
    });

    it("should handle ZIP parsing payload errors and show danger toast", async () => {
      mockJSZipLoadAsync.mockRejectedValueOnce(new Error("Corrupt ZIP format"));

      const { result } = renderHook(() => useUploadActions(defaultProps));
      const mockFile = new File(["dummy"], "test.zip", {
        type: "application/zip",
      });

      await act(async () => {
        await result.current.extractFilesFromZip(mockFile);
      });

      expect(mockToast.addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          csVariant: "danger",
          children: "Corrupt ZIP format",
        })
      );
    });
  });

  describe("fetchExistingPackage", () => {
    it("should show warning toast if author name or package name are missing", async () => {
      const props = { ...defaultProps, formInputs: {}, searchPackageName: "" };
      const { result } = renderHook(() => useUploadActions(props as unknown as UseUploadActionsProps));

      await act(async () => {
        await result.current.fetchExistingPackage();
      });

      expect(mockToast.addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          csVariant: "warning",
          children: "Select a team and enter a package name first.",
        })
      );
    });

    it("should handle error if no versions exist", async () => {
      mockDapper.getPackageVersions.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useUploadActions(defaultProps));

      await act(async () => {
        await result.current.fetchExistingPackage();
      });

      expect(mockToast.addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          csVariant: "danger",
          children: "No versions found for this package",
        })
      );
    });

    it("should fetch versions, download blob, and start extraction", async () => {
      mockDapper.getPackageVersions.mockResolvedValueOnce([
        { version_number: "1.0.0", download_url: "http://localhost:8000/mock.download.url" },
      ]);

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(["mock-blob-content"])),
      });

      const { result } = renderHook(() => useUploadActions(defaultProps));

      await act(async () => {
        await result.current.fetchExistingPackage();
      });

      expect(mockToast.addToast).toHaveBeenCalledWith(
        expect.objectContaining({ children: "Fetching package details..." })
      );
      expect(global.fetch).toHaveBeenCalledWith("http://localhost:8000/mock.download.url");
      expect(setFile).toHaveBeenCalled();
      expect(mockToast.addToast).toHaveBeenCalledWith(
        expect.objectContaining({ csVariant: "success" })
      );
    });
  });

  describe("startUpload", () => {
    it("should halt with error if repackaging intent misses file selection", async () => {
      const { result } = renderHook(() => useUploadActions(defaultProps));

      await act(async () => {
        await result.current.startUpload();
      });

      expect(mockToast.addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          csVariant: "danger",
          children: "No package selected.",
        })
      );
    });

    it("should upload new package and build from scratch if intent='new' and no base file/buffer", async () => {
      const props = {
        ...defaultProps,
        intent: "new",
        file: null,
        originalZipBuffer: null,
        readmeContent: "test",
        virtualFiles: [{ path: "test.dll", content: "data" }],
      };

      mockJSZipGenerateAsync.mockResolvedValueOnce(new Blob(["compiled"]));
      mockUploadStart.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useUploadActions(props as unknown as UseUploadActionsProps));

      await act(async () => {
        await result.current.startUpload();
      });

      expect(mockJSZipGenerateAsync).toHaveBeenCalledWith({ type: "blob" });
      expect(setHandle).toHaveBeenCalled();
      expect(mockUploadStart).toHaveBeenCalled();
      expect(setUsermedia).toHaveBeenCalledWith("mock-handle");
      expect(setIsDone).toHaveBeenCalledWith(true);
    });

    it("should handle error if API host is not configured properly", async () => {
      const props = {
        ...defaultProps,
        intent: "new",
        file: null,
        originalZipBuffer: null,
        requestConfig: vi.fn(() => ({})),
      };
      mockJSZipGenerateAsync.mockResolvedValueOnce(new Blob(["compiled"]));

      const { result } = renderHook(() => useUploadActions(props as unknown as UseUploadActionsProps));

      await act(async () => {
        await result.current.startUpload();
      });

      expect(mockToast.addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          csVariant: "danger",
          children: "API host is not configured",
        })
      );
    });

    it("should correctly handle upload failure during dispatch", async () => {
      const props = {
        ...defaultProps,
        intent: "new",
        file: null,
        originalZipBuffer: null,
      };
      mockJSZipGenerateAsync.mockResolvedValueOnce(new Blob(["compiled"]));
      mockUploadStart.mockRejectedValueOnce(
        new Error("Multipart processing error")
      );

      const { result } = renderHook(() => useUploadActions(props as unknown as UseUploadActionsProps));

      await act(async () => {
        await result.current.startUpload();
      });

      expect(mockToast.addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          csVariant: "danger",
          children: "Multipart processing error",
        })
      );
      expect(setHandle).toHaveBeenCalledWith(undefined);
    });
  });

  describe("pollSubmission & retryPolling", () => {
    it("should ask dapper to get submission status and return it", async () => {
      mockDapper.getPackageSubmissionStatus.mockResolvedValueOnce({
        id: "sub-123",
        status: "COMPLETED",
        result: {
          package_version: { full_name: "Mock-Pkg-1.0.0" },
          available_communities: [{ community: { name: "test-com" } }],
        },
      });

      const { result } = renderHook(() => useUploadActions(defaultProps));

      let status;
      await act(async () => {
        status = await result.current.pollSubmission("sub-123", true);
      });

      expect(mockDapper.getPackageSubmissionStatus).toHaveBeenCalledWith(
        "sub-123"
      );
      expect(status).toHaveProperty("status", "COMPLETED");
    });
  });
});
