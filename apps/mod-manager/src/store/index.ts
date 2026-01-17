import { configureStore } from "@reduxjs/toolkit";

import downloadReducer from "./slices/downloadSlice";
import errorReducer from "./slices/errorSlice";
import modFilterReducer from "./slices/modFilterSlice";
import modalsReducer from "./slices/modalsSlice";
import profileReducer from "./slices/profileSlice";
import profilesReducer from "./slices/profilesSlice";
import tsModsReducer from "./slices/tsModsSlice";

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    profiles: profilesReducer,
    tsMods: tsModsReducer,
    download: downloadReducer,
    modFilter: modFilterReducer,
    modals: modalsReducer,
    error: errorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore certain action types that might have non-serializable data
        // ignoredActions: ['profile/setActiveProfile'],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
