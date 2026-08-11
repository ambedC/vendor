import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CartResponse } from "@/types/ApiResponse";

interface CartState {
  cartData: CartResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CartState = {
  cartData: null,
  isLoading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartData: (state, action: PayloadAction<CartResponse>) => {
      state.cartData = action.payload;
      state.error = null;
    },
    setCartLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearCart: (state) => {
      state.cartData = null;
      state.error = null;
    },
  },
});

export const { setCartData, setCartLoading, setError, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
