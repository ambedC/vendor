import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product } from "@/types/ApiResponse";

interface RecentlyViewedState {
  products: Product[];
}

const MAX_PRODUCTS = 20;

const initialState: RecentlyViewedState = {
  products: [],
};

const recentlyViewedSlice = createSlice({
  name: "recentlyViewed",
  initialState,
  reducers: {
    addRecentlyViewed: (state, action: PayloadAction<Product>) => {
      const product = action.payload;

      // Remove if already exists (to move to front)
      state.products = state.products.filter((p) => p.id !== product.id);

      // Add to front
      state.products.unshift(product);

      // Keep only MAX_PRODUCTS
      if (state.products.length > MAX_PRODUCTS) {
        state.products = state.products.slice(0, MAX_PRODUCTS);
      }
    },
    clearRecentlyViewed: (state) => {
      state.products = [];
    },
  },
});

export const { addRecentlyViewed, clearRecentlyViewed } =
  recentlyViewedSlice.actions;

export default recentlyViewedSlice.reducer;
