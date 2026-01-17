import axios, { AxiosError, AxiosResponse } from "axios";

export class ProfileApiClient {
  private static readonly BASE_URL =
    "https://thunderstore.io/api/experimental/legacyprofile";

  public static async createProfile(payload: string): Promise<string> {
    try {
      const response = await axios.post<{ key: string }>(
        `${this.BASE_URL}/create/`,
        payload,
        {
          headers: { "Content-Type": "application/octet-stream" },
        }
      );
      return response.data.key;
    } catch (e) {
      this.handleError(e, "Failed to upload profile");
      throw e;
    }
  }

  public static async getProfile(code: string): Promise<string> {
    try {
      const response = await axios.get<string>(`${this.BASE_URL}/get/${code}/`);
      return response.data;
    } catch (e) {
      this.handleError(e, "Failed to download profile");
      throw e;
    }
  }

  private static handleError(e: any, title: string) {
    if (axios.isAxiosError(e)) {
      const axiosError = e as AxiosError<{ detail?: string }>;
      if (axiosError.response?.status === 429) {
        throw new Error("Rate limited: Too many attempts. Please wait.");
      } else if (axiosError.response?.status === 404) {
        throw new Error("Profile code not found or expired.");
      } else {
        throw new Error(`${title}: ${axiosError.message}`);
      }
    }
    throw e;
  }
}
