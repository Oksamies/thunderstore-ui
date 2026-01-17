import ZipProvider from "../ZipProvider";

export default class ElectronZipProvider extends ZipProvider {
  public async extractAllTo(
    zipPath: string,
    outputFolder: string
  ): Promise<void> {
    const success = await window.electronAPI.extractZip(zipPath, outputFolder);
    if (!success) {
      throw new Error(`Failed to extract zip: ${zipPath}`);
    }
  }
}
