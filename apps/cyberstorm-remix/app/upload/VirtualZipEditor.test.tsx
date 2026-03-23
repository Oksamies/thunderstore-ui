import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type VirtualFile, VirtualZipEditor } from "./VirtualZipEditor";

afterEach(cleanup);

// Mock resize observer that cyberstorm components might use
window.ResizeObserver =
  window.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }));

describe("VirtualZipEditor", () => {
  let initialFiles: VirtualFile[];
  const setFilesMock = vi.fn();
  const onReadmeChangeMock = vi.fn();
  const onChangelogChangeMock = vi.fn();

  beforeEach(() => {
    initialFiles = [
      { path: "test.txt", content: new File(["hello"], "test.txt") },
      { path: "folder/", content: null as any },
      { path: "folder/subfolder/", content: null as any },
      { path: "folder/sub.txt", content: new File(["sub"], "sub.txt") },
    ];
    vi.clearAllMocks();
  });

  const renderComponent = (files = initialFiles) => {
    return render(
      <VirtualZipEditor
        files={files}
        setFiles={setFilesMock}
        onReadmeChange={onReadmeChangeMock}
        onChangelogChange={onChangelogChangeMock}
      />
    );
  };

  it("renders correctly", () => {
    renderComponent();
    expect(screen.getByText("test.txt")).toBeInTheDocument();
    expect(screen.getByText("folder/")).toBeInTheDocument();
    expect(screen.getByText("sub.txt")).toBeInTheDocument();
  });

  it("adds a root folder", async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText("New folder name...");
    await user.type(input, "new-folder/");

    const addButton = screen.getByRole("button", { name: "Add" });
    await user.click(addButton);

    await waitFor(() => {
      expect(setFilesMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ path: "new-folder/", content: null }),
        ])
      );
    });
  });

  it("adds a root folder on Enter key", async () => {
    const user = userEvent.setup();
    renderComponent();

    // Type and press Enter
    const input = screen.getByPlaceholderText("New folder name...");
    await user.clear(input);
    await user.type(input, "new-folder2");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(setFilesMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ path: "new-folder2/", content: null }),
        ])
      );
    });
  });

  it("does not add folder if name is empty", async () => {
    const user = userEvent.setup();
    renderComponent();

    const addButton = screen.getByRole("button", { name: "Add" });
    await user.click(addButton);

    expect(setFilesMock).not.toHaveBeenCalled();
  });

  it("adds a subfolder", async () => {
    const user = userEvent.setup();
    renderComponent();

    const addSubfolderBtns = screen.getAllByRole("button", {
      name: "Add Folder Here",
    });
    await user.click(addSubfolderBtns[0]); // Click on `folder/`

    const subfolderInput = screen.getByPlaceholderText(
      "New subfolder in folder/..."
    );
    await user.type(subfolderInput, "sub-folder");

    // Click add button for subfolder
    const addBtn = screen.getAllByText("Add")[0];
    await user.click(addBtn);

    expect(setFilesMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ path: "folder/sub-folder/", content: null }),
      ])
    );
  });

  it("cancels adding a subfolder", async () => {
    const user = userEvent.setup();
    renderComponent();

    const addSubfolderBtns = screen.getAllByRole("button", {
      name: "Add Folder Here",
    });
    await user.click(addSubfolderBtns[0]);

    const subfolderInput = screen.getByPlaceholderText(
      "New subfolder in folder/..."
    );
    await user.type(subfolderInput, "sub-folder");

    const cancelBtns = screen.getAllByRole("button", { name: "Cancel" });
    await user.click(cancelBtns[0]);

    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText("New subfolder in folder/...")
      ).toBeNull()
    );
  });

  it("adds a subfolder via Enter key", async () => {
    const user = userEvent.setup();
    renderComponent();

    const addSubfolderBtns = screen.getAllByRole("button", {
      name: "Add Folder Here",
    });
    await user.click(addSubfolderBtns[0]);

    const subfolderInput = screen.getByPlaceholderText(
      "New subfolder in folder/..."
    );
    await user.type(subfolderInput, "sub-folder2/");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(setFilesMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            path: "folder/sub-folder2/",
            content: null,
          }),
        ])
      );
    });
  });

  it("cancels adding a subfolder via Cancel button", async () => {
    const user = userEvent.setup();
    renderComponent();

    const addSubfolderBtns = screen.getAllByRole("button", {
      name: "Add Folder Here",
    });
    await user.click(addSubfolderBtns[0]);

    const cancelBtn = screen.getAllByText("Cancel")[0];
    await user.click(cancelBtn);

    expect(
      screen.queryByPlaceholderText("New subfolder in folder/...")
    ).toBeNull();
  });

  it("handles adding files", async () => {
    const user = userEvent.setup();
    const { container } = renderComponent();

    const fileContent = "dummy content";
    const file = new File([fileContent], "new-file.txt", {
      type: "text/plain",
    });

    // Mock click for default add file button
    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    await userEvent.upload(fileInput, file);

    expect(setFilesMock).toHaveBeenCalled();
    const setterFn = setFilesMock.mock.calls[0][0];
    const newFilesList = setterFn(initialFiles);
    expect(newFilesList).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "new-file.txt" }),
      ])
    );
  });

  it("handles adding readme and changelog files in root", async () => {
    const user = userEvent.setup();
    const { container } = renderComponent();

    const readmeFile = new File(["readme content"], "rEadMe.md", {
      type: "text/markdown",
    });
    const changelogFile = new File(["changelog content"], "ChangeLog.mD", {
      type: "text/markdown",
    });

    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await userEvent.upload(fileInput, readmeFile);
    await waitFor(() =>
      expect(onReadmeChangeMock).toHaveBeenCalledWith("readme content")
    );

    await userEvent.upload(fileInput, changelogFile);
    await waitFor(() =>
      expect(onChangelogChangeMock).toHaveBeenCalledWith("changelog content")
    );
  });

  it("renames a file", async () => {
    const user = userEvent.setup();
    renderComponent();

    const fileEl = screen.getByText("test.txt").closest("li")!;
    const renameBtn = fileEl.querySelector('button[title="Rename"]')!;
    await user.click(renameBtn);

    const renameInput = screen.getByDisplayValue("test.txt");
    await user.clear(renameInput);
    await user.type(renameInput, "renamed.txt");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      const setterFn = setFilesMock.mock.calls[0][0];
      const newFiles = setterFn(initialFiles);
      expect(newFiles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "renamed.txt" }),
        ])
      );
    });
  });

  it("renames a folder and its children", async () => {
    const user = userEvent.setup();
    renderComponent();

    const folderEl = screen.getByText("folder/").closest("li")!;
    const renameBtn = folderEl.querySelector('button[title="Rename"]')!;
    await user.click(renameBtn); // rename folder/

    const renameInput = screen.getByDisplayValue("folder/");
    await user.clear(renameInput);
    await user.type(renameInput, "new-folder");

    // test onBlur instead of enter
    fireEvent.blur(renameInput);

    const setterFn = setFilesMock.mock.calls[0][0];
    const newFiles = setterFn(initialFiles);

    expect(newFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "new-folder/" }),
        expect.objectContaining({ path: "new-folder/sub.txt" }),
      ])
    );
  });

  it.skip("cancels rename", async () => {
    const user = userEvent.setup();
    renderComponent();

    // Test that the initial file exists before we even touch it
    expect(screen.getByText("test.txt")).toBeInTheDocument();

    const fileEl = screen.getByText("test.txt").closest("li")!;
    const renameBtn = fileEl.querySelector('button[title="Rename"]')!;
    await user.click(renameBtn);

    const renameInput = screen.getByDisplayValue("test.txt");
    await user.clear(renameInput);
    await user.type(renameInput, "abc");

    // Make sure we focus and then press Escape
    renameInput.focus();
    await user.keyboard("{Escape}");

    // wait for the input to be removed, meaning escape successfully cancelled or committed it
    await waitFor(() => {
      expect(screen.queryByDisplayValue("abc")).toBeNull();
    });

    // verify it wasn't committed as abc but reverted to test.txt
    expect(screen.getByText("test.txt")).toBeInTheDocument();
  });

  it("removes a file", async () => {
    const user = userEvent.setup();
    renderComponent();

    const fileEl = screen.getByText("test.txt").closest("li")!;
    const removeBtn = fileEl.querySelector('button[title="Remove"]')!;
    await user.click(removeBtn);

    const setterFn = setFilesMock.mock.calls[0][0];
    const newFiles = setterFn(initialFiles);
    expect(newFiles.some((f: any) => f.path === "test.txt")).toBe(false);
  });

  it("removes a folder and its children", async () => {
    const user = userEvent.setup();
    renderComponent();

    const folderEl = screen.getByText("folder/").closest("li")!;
    const removeBtn = folderEl.querySelector('button[title="Remove"]')!;
    await user.click(removeBtn); // remove folder/

    const setterFn = setFilesMock.mock.calls[0][0];
    const newFiles = setterFn(initialFiles);

    expect(newFiles).toHaveLength(1);
    expect(newFiles[0].path).toBe("test.txt");
  });

  it("handles drag and drop to folder", () => {
    renderComponent();

    const draggableFile = screen.getByText("test.txt").closest("li")!;
    const dropTargetFolder = screen.getByText("folder/").closest("li")!;

    // Drag start
    fireEvent.dragStart(draggableFile);

    // Drop on folder
    fireEvent.dragOver(dropTargetFolder);
    fireEvent.drop(dropTargetFolder);

    const setterFn = setFilesMock.mock.calls[0][0];
    const newFiles = setterFn(initialFiles);

    expect(newFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "folder/test.txt" }),
      ])
    );
  });

  it("ignores invalid drop onto self/children", () => {
    renderComponent();

    const folderEl = screen.getByText("folder/").closest("li")!;

    // Drag folder
    fireEvent.dragStart(folderEl);

    // Drop on self
    fireEvent.drop(folderEl);
    expect(setFilesMock).not.toHaveBeenCalled();

    // Open the folder
    const folderLabel = screen.getByText("folder/");
    fireEvent.click(folderLabel);

    // Drag folder
    fireEvent.dragStart(folderEl);

    // Drop on subfolder path to trigger StartsWith condition
    const subFolderEl = screen.getByText("subfolder/").closest("li")!;
    fireEvent.drop(subFolderEl);

    expect(setFilesMock).not.toHaveBeenCalled();

    // Drag folder
    fireEvent.dragStart(folderEl);

    // Drop on root
    const rootUList = document.querySelector(".virtual-zip-editor__list")!;
    fireEvent.drop(rootUList);

    const setterFn = setFilesMock.mock.calls[0][0];
    const newFiles = setterFn(initialFiles);

    // Should move to root /
    expect(newFiles).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "folder/" })])
    );
  });

  it("can add file directly to a subfolder", async () => {
    const user = userEvent.setup();
    const { container } = renderComponent();

    const addFilesToFolderBtns = screen.getAllByRole("button", {
      name: "Add File Here",
    });
    await user.click(addFilesToFolderBtns[0]); // sets targetParent to "folder/"

    const file = new File(["sub content"], "new-sub-file.txt", {
      type: "text/plain",
    });
    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    await userEvent.upload(fileInput, file);

    const setterFn = setFilesMock.mock.calls[0][0];
    const newFilesList = setterFn(initialFiles);

    expect(newFilesList).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "folder/new-sub-file.txt" }),
      ])
    );
  });

  it("clears target directory properly", async () => {
    const user = userEvent.setup();
    renderComponent();

    const addFilesToFolderBtns = screen.getAllByRole("button", {
      name: "Add File Here",
    });
    await user.click(addFilesToFolderBtns[0]); // Request add file into 'folder/'

    const clearBtn = screen.getByRole("button", { name: "Clear Target" });
    expect(clearBtn).toBeVisible();
    await user.click(clearBtn);

    expect(clearBtn).not.toBeVisible();
  });
});
