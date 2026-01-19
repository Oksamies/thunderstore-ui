import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { PackageListing } from "@thunderstore/dapper/types";

import GameManager from "../../model/GameManager";
import Profile from "../../model/Profile";
import ThunderstoreCombo from "../../model/ThunderstoreCombo";
import ThunderstoreMod from "../../model/ThunderstoreMod";
import VersionNumber from "../../model/VersionNumber";
import { dapper } from "../../services/DapperService";
import ModInstallerService from "../../services/ModInstallerService";

// We might need a singleton Dapper or use the hook in component

// Define state shape
export interface DownloadProgress {
  status:
    | "pending"
    | "fetching-details"
    | "installing"
    | "completed"
    | "failed";
  progress: number; // 0-100
  message: string;
  error?: string;
  modName?: string;
  author?: string;
  iconUrl?: string;
  version?: string;
}

export interface DownloadState {
  // Map of "namespace-name" -> DownloadProgress
  downloads: Record<string, DownloadProgress>;
  // Queue of identifiers to process (if we were strictly serial, but we can rely on thunks for now)
  queue: string[];
}

const initialState: DownloadState = {
  downloads: {},
  queue: [],
};

// Async thunk to handle the full download flow
export const downloadAndInstallMod = createAsyncThunk(
  "download/install",
  async (listing: PackageListing, { dispatch, rejectWithValue }) => {
    const modId = `${listing.namespace}-${listing.name}`;

    try {
      // 1. Fetch Details
      dispatch(
        updateDownloadStatus({
          modId,
          status: "fetching-details",
          message: "Fetching metadata...",
        })
      );

      const details = await dapper.getPackageListingDetails(
        listing.community_identifier,
        listing.namespace,
        listing.name
      );

      // 2. Map to ThunderstoreMod
      const mod = new ThunderstoreMod();
      mod.setName(details.name);
      mod.setFullName(`${details.namespace}-${details.name}`);
      mod.setOwner(details.namespace);
      mod.setPackageUrl(details.website_url || "");
      mod.setDateCreated(details.datetime_created);
      mod.setDateUpdated(details.last_updated);
      mod.setRating(details.rating_count);
      mod.setDownloadCount(details.download_count);
      mod.setDescription(details.description);
      mod.setIcon(details.icon_url || "");
      mod.setLatestVersion(details.latest_version_number);
      mod.setVersionNumber(new VersionNumber(details.latest_version_number));
      mod.setDownloadUrl(details.download_url);

      // 3. Prepare Combo
      const combo = new ThunderstoreCombo();
      combo.setMod(mod);
      combo.setVersion(mod);

      const profile = Profile.getActiveAsImmutableProfile();

      // 4. Install
      dispatch(
        updateDownloadStatus({
          modId,
          status: "installing",
          message: "Starting install...",
        })
      );

      // Custom progress callback that dispatches updates
      const progressCallback = (msg: string) => {
        dispatch(
          updateDownloadStatus({ modId, status: "installing", message: msg })
        );
      };

      const result = await ModInstallerService.install(
        combo,
        profile,
        progressCallback
      );

      if (result) {
        // R2Error returned
        throw new Error(result.message);
      }

      return modId;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

const downloadSlice = createSlice({
  name: "download",
  initialState,
  reducers: {
    updateDownloadStatus: (
      state,
      action: PayloadAction<{
        modId: string;
        status: DownloadProgress["status"];
        message: string;
      }>
    ) => {
      const { modId, status, message } = action.payload;
      if (!state.downloads[modId]) {
        state.downloads[modId] = {
          status: "pending",
          progress: 0,
          message: "",
        };
      }
      state.downloads[modId].status = status;
      state.downloads[modId].message = message;
      // We aren't calculating numeric progress yet, but we could if installer provided bytes
    },
    clearDownload: (state, action: PayloadAction<string>) => {
      delete state.downloads[action.payload];
    },
    clearFinishedDownloads: (state) => {
      Object.keys(state.downloads).forEach((key) => {
        const dl = state.downloads[key];
        if (dl.status === "completed" || dl.status === "failed") {
          delete state.downloads[key];
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(downloadAndInstallMod.pending, (state, action) => {
        const listing = action.meta.arg;
        const modId = `${listing.namespace}-${listing.name}`;
        state.downloads[modId] = {
          status: "pending",
          progress: 0,
          message: "Queued",
          modName: listing.name,
          author: listing.namespace,
          iconUrl: listing.icon_url,
          version: listing.latest_version_number,
        };
        if (!state.queue.includes(modId)) {
          state.queue.push(modId);
        }
      })
      .addCase(downloadAndInstallMod.fulfilled, (state, action) => {
        const modId = action.payload as string;
        if (state.downloads[modId]) {
          state.downloads[modId].status = "completed";
          state.downloads[modId].message = "Installed successfully";
          state.downloads[modId].progress = 100;
        }
        state.queue = state.queue.filter((id) => id !== modId);
      })
      .addCase(downloadAndInstallMod.rejected, (state, action) => {
        const modId = `${action.meta.arg.namespace}-${action.meta.arg.name}`;
        if (state.downloads[modId]) {
          state.downloads[modId].status = "failed";
          state.downloads[modId].message =
            (action.payload as string) || "Unknown error";
          state.downloads[modId].error = action.payload as string;
        }
        state.queue = state.queue.filter((id) => id !== modId);
      });
  },
});

export const { updateDownloadStatus, clearDownload, clearFinishedDownloads } =
  downloadSlice.actions;
export default downloadSlice.reducer;
