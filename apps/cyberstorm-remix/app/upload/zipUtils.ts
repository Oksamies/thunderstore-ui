import JSZip from "jszip";

import type { VirtualFile } from "./VirtualZipEditor";

export interface ExtractedPackageContents {
  buffer: ArrayBuffer;
  readme: string;
  changelog: string;
  manifest: {
    version_number?: string;
    website_url?: string;
    name?: string;
    description?: string;
    dependencies?: string[];
  };
  iconPreviewUrl: string | null;
  virtualFiles: VirtualFile[];
}

export async function extractPackageContents(
  zipFile: File
): Promise<ExtractedPackageContents> {
  const buffer = await zipFile.arrayBuffer();
  const zip = new JSZip();
  try {
    await zip.loadAsync(buffer);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Can't find end of central directory")
    ) {
      throw new Error("The imported file is not a ZIP.");
    }
    throw error;
  }

  let readme = "";
  let changelog = "";
  let iconPreviewUrl: string | null = null;
  const manifest: ExtractedPackageContents["manifest"] = {};

  const readmeFile =
    zip.file("README.md") || zip.file("readme.md") || zip.file("README.MD");
  if (readmeFile) {
    readme = await readmeFile.async("text");
  }

  const changelogFile =
    zip.file("CHANGELOG.md") ||
    zip.file("changelog.md") ||
    zip.file("CHANGELOG.MD");
  if (changelogFile) {
    changelog = await changelogFile.async("text");
  }

  const manifestFile = zip.file("manifest.json");
  if (manifestFile) {
    try {
      const manifestRaw = await manifestFile.async("text");
      const manifestJson = JSON.parse(manifestRaw);
      if (manifestJson.version_number) {
        manifest.version_number = manifestJson.version_number;
      }
      if (manifestJson.website_url) {
        manifest.website_url = manifestJson.website_url;
      }
      if (manifestJson.name) {
        manifest.name = manifestJson.name;
      }
      if (manifestJson.description) {
        manifest.description = manifestJson.description;
      }
      if (Array.isArray(manifestJson.dependencies)) {
        manifest.dependencies = manifestJson.dependencies;
      }
    } catch (e) {
      console.error("Failed to parse manifest.json", e);
    }
  }

  const iconFile = zip.file("icon.png");
  if (iconFile) {
    try {
      const iconBlob = await iconFile.async("blob");
      iconPreviewUrl = URL.createObjectURL(iconBlob);
    } catch (e) {
      console.error("Failed to load icon.png", e);
    }
  }

  const virtualFiles: VirtualFile[] = [];
  const skipFiles = ["manifest.json", "icon.png", "readme.md", "changelog.md"];
  const filePromises: Promise<void>[] = [];

  zip.forEach((relativePath: string, file: any) => {
    const isRoot = !relativePath.includes("/");
    const lowerPath = relativePath.toLowerCase();

    // Skip top level special files
    if (isRoot && skipFiles.includes(lowerPath)) {
      return;
    }

    if (file.dir) {
      virtualFiles.push({ path: relativePath, content: null });
    } else {
      const p = file.async("blob").then((blob: Blob) => {
        const fileName = relativePath.split("/").pop() || relativePath;
        const f = new File([blob], fileName);
        virtualFiles.push({ path: relativePath, content: f });
      });
      filePromises.push(p);
    }
  });

  await Promise.all(filePromises);

  return {
    buffer,
    readme,
    changelog,
    manifest,
    iconPreviewUrl,
    virtualFiles,
  };
}

export interface CreatePackageParams {
  virtualFiles: VirtualFile[];
  readmeContent: string;
  changelogContent: string;
  websiteUrl: string;
  newIconFile: File | null;
  packageName: string;
  versionNumber: string;
  packageDescription: string;
  dependencies: { name: string; namespace: string; version: string }[];
  authorName: string;
}

export async function createNewPackageZip(
  params: CreatePackageParams
): Promise<File> {
  const {
    virtualFiles,
    readmeContent,
    changelogContent,
    newIconFile,
    packageName,
    websiteUrl,
    versionNumber,
    packageDescription,
    dependencies,
    authorName,
  } = params;

  const createZip = new JSZip();
  virtualFiles.forEach((vf) => {
    if (vf.content) {
      createZip.file(vf.path, vf.content);
    } else {
      createZip.folder(vf.path);
    }
  });

  if (readmeContent) createZip.file("README.md", readmeContent);
  if (changelogContent) createZip.file("CHANGELOG.md", changelogContent);
  if (newIconFile) {
    const iconBuffer = await newIconFile.arrayBuffer();
    createZip.file("icon.png", iconBuffer);
  }

  const manifestObj: Record<string, unknown> = {};
  manifestObj["name"] = packageName || authorName || "NewPackage";
  manifestObj["version_number"] = versionNumber || "1.0.0";
  manifestObj["website_url"] = websiteUrl || "";
  manifestObj["description"] = packageDescription || "";

  const depStrings = dependencies.map(
    (dep) => `${dep.namespace}-${dep.name}-${dep.version}`
  );
  manifestObj["dependencies"] = depStrings;

  createZip.file("manifest.json", JSON.stringify(manifestObj, null, 2));

  const compiledBlob = await createZip.generateAsync({ type: "blob" });
  const zipName =
    authorName && manifestObj.name && manifestObj.version_number
      ? `${authorName}-${manifestObj.name}-${manifestObj.version_number}.zip`
      : "package.zip";

  return new File([compiledBlob], zipName, {
    type: "application/zip",
  });
}

export interface RepackageParams {
  originalZipBuffer: ArrayBuffer;
  virtualFiles: VirtualFile[];
  readmeContent: string;
  changelogContent: string;
  newIconFile: File | null;
  packageName: string;
  versionNumber: string;
  websiteUrl: string;
  packageDescription: string;
  dependencies: { name: string; namespace: string; version: string }[];
  authorName: string;
  originalFileName: string;
}

export async function repackageExistingZip(
  params: RepackageParams
): Promise<File> {
  const {
    originalZipBuffer,
    virtualFiles,
    readmeContent,
    changelogContent,
    newIconFile,
    packageName,
    websiteUrl,
    versionNumber,
    packageDescription,
    dependencies,
    authorName,
    originalFileName,
  } = params;

  const zip = new JSZip();
  await zip.loadAsync(originalZipBuffer);

  if (readmeContent) zip.file("README.md", readmeContent);
  if (changelogContent) zip.file("CHANGELOG.md", changelogContent);

  virtualFiles.forEach((vf) => {
    if (vf.content) {
      zip.file(vf.path, vf.content);
    } else {
      zip.folder(vf.path);
    }
  });

  const manifestFile = zip.file("manifest.json");
  if (manifestFile) {
    try {
      const manifestRaw = await manifestFile.async("text");
      const manifestJson = JSON.parse(manifestRaw);
      if (versionNumber) {
        manifestJson.version_number = versionNumber;
      }
      if (websiteUrl) {
        manifestJson.website_url = websiteUrl;
      }
      if (packageName) {
        manifestJson.name = packageName;
      }
      if (packageDescription) {
        manifestJson.description = packageDescription;
      }
      const depStrings = dependencies.map(
        (dep) => `${dep.namespace}-${dep.name}-${dep.version}`
      );
      manifestJson.dependencies = [
        ...new Set([
          ...((manifestJson.dependencies as string[]) || []),
          ...depStrings,
        ]),
      ];

      zip.file("manifest.json", JSON.stringify(manifestJson, null, 2));
    } catch (e) {
      console.error("Failed to parse/update manifest.json", e);
    }
  }

  if (newIconFile) {
    const iconBuffer = await newIconFile.arrayBuffer();
    zip.file("icon.png", iconBuffer);
  }

  const repackagedBlob = await zip.generateAsync({ type: "blob" });
  const zipName =
    authorName && packageName && versionNumber
      ? `${authorName}-${packageName}-${versionNumber}.zip`
      : originalFileName || "package.zip";

  return new File([repackagedBlob], zipName, {
    type: "application/zip",
  });
}
