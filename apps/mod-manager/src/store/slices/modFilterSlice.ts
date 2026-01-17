import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  categoryFilter: null,
  showDeprecated: false,
};

const modFilterSlice = createSlice({
  name: "modFilter",
  initialState,
  reducers: {
    // Add actual actions later
  },
});

export default modFilterSlice.reducer;
