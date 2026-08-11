import { AxiosInstance } from "axios";

/**
 * API MOCK MODE — All outgoing requests are blocked.
 *
 * Every API function in api.ts already has a catch block that returns
 * fallback/mock data (with success: true), so the UI will render
 * gracefully with empty state instead of crashing or waiting for
 * a network timeout.
 *
 * To re-enable real API calls, restore the original interceptor.ts
 * from version control.
 */
export const setupInterceptors = (instance: AxiosInstance): void => {
  // Request Interceptor — block all outgoing requests immediately
  instance.interceptors.request.use(
    () => {
      // Reject instantly so the catch block in each API function fires
      return Promise.reject(new Error("[MOCK MODE] API calls are disabled."));
    },
  );
};

