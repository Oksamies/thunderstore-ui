import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface ProfilesState {
  profileList: string[];
}

const initialState: ProfilesState = {
  profileList: ["Default"],
};

const profilesSlice = createSlice({
  name: "profiles",
  initialState,
  reducers: {
    addProfile: (state, action: PayloadAction<string>) => {
      state.profileList.push(action.payload);
    },
  },
});

export const { addProfile } = profilesSlice.actions;
export default profilesSlice.reducer;
