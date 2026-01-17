import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mods: [],
  loading: false,
  error: null as string | null,
};

const tsModsSlice = createSlice({
  name: "tsMods",
  initialState,
  reducers: {
    // Add actual actions later
  },
});

export default tsModsSlice.reducer;
