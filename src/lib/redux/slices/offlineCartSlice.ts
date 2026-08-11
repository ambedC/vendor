import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type OfflineCartItem = {
  id: string;
  name: string;
  image?: string;
  slug?: string;
  price: number;
  quantity: number;
  storeName?: string;
  storeSlug?: string;
  minQuantity: number;
  maxQuantity: number;
  stepSize: number;
  stock: number;
  product_variant_id: number;
  store_id: number;
  addons?: {
    addon_group_id: number;
    addon_item_id: number;
    title: string;
    price: number;
  }[];
};

export type OfflineCartState = {
  items: OfflineCartItem[];
  subtotal: number;
  totalQuantity: number;
};

const initialState: OfflineCartState = {
  items: [],
  subtotal: 0,
  totalQuantity: 0,
};

const recalculateSummary = (items: OfflineCartItem[]) => {
  const summary = items.reduce(
    (acc, item) => {
      const addonTotal = (item.addons || []).reduce(
        (sum, addon) => sum + (addon.price || 0),
        0
      );
      acc.subtotal += (item.price + addonTotal) * item.quantity;
      acc.totalQuantity += item.quantity;
      return acc;
    },
    { subtotal: 0, totalQuantity: 0 }
  );

  return summary;
};

const clampQuantity = (item: OfflineCartItem, desiredQuantity: number) => {
  const minQuantity = item.minQuantity || 1;
  const stepSize = item.stepSize || 1;
  const maxQuantity = item.maxQuantity || Number.MAX_SAFE_INTEGER;
  const stock = item.stock || Number.MAX_SAFE_INTEGER;

  let qty = Math.max(
    minQuantity,
    Math.min(desiredQuantity, maxQuantity, stock)
  );

  if (stepSize > 1) {
    const remainder = qty % stepSize;
    if (remainder !== 0) {
      qty = qty - remainder;
      if (qty < stepSize) {
        qty = stepSize;
      }
    }
  } else {
    const remainder = (qty - minQuantity) % stepSize;
    if (remainder !== 0) {
      qty = qty - remainder;
      if (qty < minQuantity) {
        qty = minQuantity;
      }
    }
  }

  return qty;
};

const normalizeItem = (item: OfflineCartItem) => {
  const normalizedQuantity = clampQuantity(item, item.quantity);
  return {
    ...item,
    quantity: normalizedQuantity,
  };
};

const offlineCartSlice = createSlice({
  name: "offlineCart",
  initialState,
  reducers: {
    hydrateOfflineCart: (
      state,
      action: PayloadAction<OfflineCartItem[] | undefined>
    ) => {
      state.items = action.payload || [];
      const summary = recalculateSummary(state.items);
      state.subtotal = summary.subtotal;
      state.totalQuantity = summary.totalQuantity;
    },
    setOfflineCart: (state, action: PayloadAction<OfflineCartItem[]>) => {
      state.items = action.payload;
      const summary = recalculateSummary(state.items);
      state.subtotal = summary.subtotal;
      state.totalQuantity = summary.totalQuantity;
    },
    addOfflineCartItem: (state, action: PayloadAction<OfflineCartItem>) => {
      const normalizedPayload = normalizeItem(action.payload);
      const existingIndex = state.items.findIndex(
        (item) => item.id === normalizedPayload.id
      );

      if (existingIndex >= 0) {
        const existingItem = state.items[existingIndex];
        const mergedItem = {
          ...existingItem,
          ...normalizedPayload,
        };
        mergedItem.quantity = clampQuantity(
          mergedItem,
          existingItem.quantity + normalizedPayload.quantity
        );
        state.items[existingIndex] = mergedItem;
      } else {
        state.items.push(normalizedPayload);
      }

      const summary = recalculateSummary(state.items);
      state.subtotal = summary.subtotal;
      state.totalQuantity = summary.totalQuantity;
    },
    updateOfflineCartItemQuantity: (
      state,
      action: PayloadAction<{
        id: string;
        quantity: number;
        stepSize?: number;
        minQuantity?: number;
        maxQuantity?: number;
        stock?: number;
      }>
    ) => {
      const targetItem = state.items.find(
        (item) => item.id === action.payload.id
      );

      if (targetItem) {
        if (action.payload.stepSize !== undefined)
          targetItem.stepSize = action.payload.stepSize;
        if (action.payload.minQuantity !== undefined)
          targetItem.minQuantity = action.payload.minQuantity;
        if (action.payload.maxQuantity !== undefined)
          targetItem.maxQuantity = action.payload.maxQuantity;
        if (action.payload.stock !== undefined)
          targetItem.stock = action.payload.stock;

        targetItem.quantity = clampQuantity(
          targetItem,
          action.payload.quantity
        );
        const summary = recalculateSummary(state.items);
        state.subtotal = summary.subtotal;
        state.totalQuantity = summary.totalQuantity;
      }
    },
    removeOfflineCartItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      const summary = recalculateSummary(state.items);
      state.subtotal = summary.subtotal;
      state.totalQuantity = summary.totalQuantity;
    },
    updateOfflineCartItem: (
      state,
      action: PayloadAction<{
        id: string; // old id
        newItem: OfflineCartItem;
      }>
    ) => {
      const existingIndex = state.items.findIndex(
        (item) => item.id === action.payload.id
      );

      if (existingIndex >= 0) {
        // If the ID changed (due to different addons), we need to check if we should merge or replace
        const nextId = action.payload.newItem.id;
        if (nextId !== action.payload.id) {
          // Check if an item with nextId already exists
          const nextIndex = state.items.findIndex((item) => item.id === nextId);
          if (nextIndex >= 0 && nextIndex !== existingIndex) {
            // Merge into existing item
            state.items[nextIndex].quantity += action.payload.newItem.quantity;
            state.items.splice(existingIndex, 1);
          } else {
            // Just update the item at existing index
            state.items[existingIndex] = action.payload.newItem;
          }
        } else {
          // IDs match, just update
          state.items[existingIndex] = action.payload.newItem;
        }

        const summary = recalculateSummary(state.items);
        state.subtotal = summary.subtotal;
        state.totalQuantity = summary.totalQuantity;
      }
    },
    clearOfflineCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.totalQuantity = 0;
    },
  },
});

export const {
  hydrateOfflineCart,
  setOfflineCart,
  addOfflineCartItem,
  updateOfflineCartItemQuantity,
  removeOfflineCartItem,
  updateOfflineCartItem,
  clearOfflineCart,
} = offlineCartSlice.actions;

export default offlineCartSlice.reducer;
