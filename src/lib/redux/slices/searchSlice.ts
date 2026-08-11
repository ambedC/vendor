import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SearchState {
  currentSearchLabels: string[] | null;
}

const initialState: SearchState = {
  currentSearchLabels: null,
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setSearchLabels: (state, action: PayloadAction<string[] | null>) => {
      state.currentSearchLabels = action.payload;
    },
    resetSearchLabels: (state) => {
      state.currentSearchLabels = null;
    },
  },
});

export const { setSearchLabels, resetSearchLabels } = searchSlice.actions;
export default searchSlice.reducer;
