import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authSlice from "./slices/authSlice";
import cartSlice from "./slices/cartSlice";
import checkoutSlice from "./slices/checkoutSlice";
import offlineCartSlice from "./slices/offlineCartSlice";
import recentlyViewedSlice from "./slices/recentlyViewedSlice";

import searchSlice from "./slices/searchSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "cart", "offlineCart", "recentlyViewed"], // Don't persist search labels to avoid stale ones
};

const rootReducer = combineReducers({
  auth: authSlice,
  cart: cartSlice,
  checkout: checkoutSlice,
  offlineCart: offlineCartSlice,
  recentlyViewed: recentlyViewedSlice,
  search: searchSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
        ignoredPaths: ["register"],
      },
    }),
});

export const persistor = persistStore(store);

export type AppStore = typeof store;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
