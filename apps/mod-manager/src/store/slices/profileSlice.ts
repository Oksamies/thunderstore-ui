import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface ProfileState {
  activeProfile: string | null;
  modList: any[];
  searchQuery: string;
}

const initialState: ProfileState = {
  activeProfile: null,
  modList: [],
  searchQuery: "",
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setActiveProfile: (state, action: PayloadAction<string>) => {
      state.activeProfile = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const { setActiveProfile, setSearchQuery } = profileSlice.actions;
export default profileSlice.reducer;
