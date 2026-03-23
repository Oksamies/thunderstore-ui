import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IBaseUploadHandle } from "@thunderstore/ts-uploader";

import { UploadDropzone } from "./UploadDropzone";

vi.mock("@thunderstore/cyberstorm", async (importActual) => {
  const actual =
    await importActual<typeof import("@thunderstore/cyberstorm")>();
  return {
    ...actual,
    NewButton: ({ children, onClick, ...props }: any) => (
      <button data-testid="mock-new-button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    NewAlert: ({ children }: any) => (
      <div data-testid="mock-new-alert">{children}</div>
    ),
    NewIcon: ({ children }: any) => (
      <div data-testid="mock-new-icon">{children}</div>
    ),
    classnames: (...args: any[]) => args.filter(Boolean).join(" "),
  };
});

vi.mock("@thunderstore/react-dnd", () => ({
  DnDFileInput: ({ baseState, dragState, onChange, name }: any) => (
    <div data-testid="mock-dnd-file-input">
      {baseState}
      {dragState}
      <input
        data-testid="mock-file-input"
        type="file"
        name={name}
        onChange={(e) => {
          onChange(e.target.files);
        }}
      />
      <button
        data-testid="mock-dnd-trigger-null"
        onClick={() => onChange(null)}
      />
      <button
        data-testid="mock-dnd-trigger-empty"
        onClick={() => onChange({ length: 0 })}
      />
      <button
        data-testid="mock-dnd-trigger-null-item"
        onClick={() => onChange({ length: 1, item: () => null })}
      />
    </div>
  ),
}));

// Mock URL.createObjectURL
globalThis.URL.createObjectURL = vi.fn(() => "mock-url");

describe("UploadDropzone", () => {
  const defaultProps = {
    file: null,
    setFile: vi.fn(),
    iconPreviewUrl: "",
    packageName: "",
    authorName: "",
    versionNumber: "",
    packageDescription: "",
    fileInputRef: { current: document.createElement("input") },
    setReadmeContent: vi.fn(),
    setChangelogContent: vi.fn(),
    setVersionNumber: vi.fn(),
    setPackageName: vi.fn(),
    setPackageDescription: vi.fn(),
    setIconPreviewUrl: vi.fn(),
    setNewIconFile: vi.fn(),
    setOriginalZipBuffer: vi.fn(),
    handle: undefined as unknown as IBaseUploadHandle,
    setHandle: vi.fn(),
    setUsermedia: vi.fn(),
    setIsDone: vi.fn(),
    extractFilesFromZip: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly without a file", () => {
    render(<UploadDropzone {...defaultProps} />);
    expect(
      screen.getByText("Drag and drop your ZIP file here")
    ).toBeInTheDocument();
    expect(screen.getByText("Drag file here")).toBeInTheDocument();
  });

  it("renders correctly with a file and metadata", () => {
    const file = new File(["test data"], "test.zip", {
      type: "application/zip",
    });
    Object.defineProperty(file, "size", { value: 1048576 }); // 1 MB

    render(
      <UploadDropzone
        {...defaultProps}
        file={file}
        iconPreviewUrl="http://localhost/icon.png"
        packageName="TestPackage"
        authorName="TestAuthor"
        versionNumber="1.0.0"
        packageDescription="Test description"
      />
    );

    expect(screen.getByText("TestPackage")).toBeInTheDocument();
    expect(screen.getByText("TestAuthor")).toBeInTheDocument();
    expect(screen.getByText("1.0.0")).toBeInTheDocument();
    expect(screen.getByText("1 MiB")).toBeInTheDocument(); // Output of formatBytes for 1048576
    expect(screen.getByText("Test description")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "icon" })).toHaveAttribute(
      "src",
      "http://localhost/icon.png"
    );
  });

  it("renders fallback text correctly with a file", () => {
    const file = new File([], "empty.zip");
    Object.defineProperty(file, "size", { value: 0 });

    render(<UploadDropzone {...defaultProps} file={file} />);

    expect(screen.getAllByText("empty.zip")[0]).toBeInTheDocument();
    expect(screen.getByText("Unknown Author")).toBeInTheDocument();
    expect(screen.getByText("Unknown Version")).toBeInTheDocument();
    expect(screen.getByText("0 Bytes")).toBeInTheDocument();
  });

  it("handles Change button click", () => {
    const file = new File([], "test.zip");
    const clickSpy = vi.spyOn(defaultProps.fileInputRef.current, "click");

    render(<UploadDropzone {...defaultProps} file={file} />);

    const changeBtn = screen.getByText("Change");
    fireEvent.click(changeBtn);

    expect(clickSpy).toHaveBeenCalled();
  });

  it("handles Remove button click", () => {
    const file = new File([], "test.zip");
    const mockHandle = { abort: vi.fn() } as unknown as IBaseUploadHandle;

    render(
      <UploadDropzone {...defaultProps} file={file} handle={mockHandle} />
    );

    const removeBtn = screen.getByText("Remove");
    fireEvent.click(removeBtn);

    expect(defaultProps.setFile).toHaveBeenCalledWith(null);
    expect(defaultProps.setReadmeContent).toHaveBeenCalledWith("");
    expect(defaultProps.setChangelogContent).toHaveBeenCalledWith("");
    expect(defaultProps.setVersionNumber).toHaveBeenCalledWith("");
    expect(defaultProps.setPackageName).toHaveBeenCalledWith("");
    expect(defaultProps.setPackageDescription).toHaveBeenCalledWith("");
    expect(defaultProps.setIconPreviewUrl).toHaveBeenCalledWith("");
    expect(defaultProps.setNewIconFile).toHaveBeenCalledWith(null);
    expect(defaultProps.setOriginalZipBuffer).toHaveBeenCalledWith(null);
    expect(mockHandle.abort).toHaveBeenCalled();
    expect(defaultProps.setHandle).toHaveBeenCalledWith(undefined);
    expect(defaultProps.setUsermedia).toHaveBeenCalledWith(undefined);
    expect(defaultProps.setIsDone).toHaveBeenCalledWith(false);
  });

  it("handles file drop/change for various file types", async () => {
    render(<UploadDropzone {...defaultProps} />);

    const input = screen.getByTestId("mock-file-input");

    // Mock Files
    const readmeFile = new File(["# Readme"], "README.md");
    const changelogFile = new File(["# Changelog"], "changelog.md");
    const iconFile = new File(["icon"], "icon.png");
    const zipFile = new File(["zip content"], "mod.zip");
    const otherFile = new File(["other..."], "other.txt");

    // Simulate selecting multiple files at once
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(readmeFile);
    dataTransfer.items.add(changelogFile);
    dataTransfer.items.add(iconFile);
    dataTransfer.items.add(zipFile);
    dataTransfer.items.add(otherFile); // Should be ignored if zip is found

    fireEvent.change(input, { target: { files: dataTransfer.files } });

    await waitFor(() => {
      expect(defaultProps.setReadmeContent).toHaveBeenCalledWith("# Readme");
      expect(defaultProps.setChangelogContent).toHaveBeenCalledWith(
        "# Changelog"
      );
      expect(defaultProps.setNewIconFile).toHaveBeenCalledWith(iconFile);
      expect(defaultProps.setIconPreviewUrl).toHaveBeenCalledWith("mock-url");
      expect(defaultProps.setFile).toHaveBeenCalledWith(zipFile);
      expect(defaultProps.extractFilesFromZip).toHaveBeenCalledWith(zipFile);
    });
  });

  it("handles solitary non-zip file as zip if it is the only file", async () => {
    render(<UploadDropzone {...defaultProps} />);

    const input = screen.getByTestId("mock-file-input");
    const otherFile = new File(["other..."], "other.txt");
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(otherFile);

    fireEvent.change(input, { target: { files: dataTransfer.files } });

    await waitFor(() => {
      expect(defaultProps.setFile).toHaveBeenCalledWith(otherFile);
      expect(defaultProps.extractFilesFromZip).toHaveBeenCalledWith(otherFile);
    });
  });

  it("returns early if no files or empty file list provided to onChange", async () => {
    render(<UploadDropzone {...defaultProps} />);

    // Test null
    fireEvent.click(screen.getByTestId("mock-dnd-trigger-null"));

    // Test empty
    fireEvent.click(screen.getByTestId("mock-dnd-trigger-empty"));

    // Test null item
    fireEvent.click(screen.getByTestId("mock-dnd-trigger-null-item"));

    await waitFor(() => {
      expect(defaultProps.setFile).not.toHaveBeenCalled();
      expect(defaultProps.setReadmeContent).not.toHaveBeenCalled();
    });
  });
});
