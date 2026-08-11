// lib/cookies.ts

// Define the shape of cookie options
interface CookieOptions {
  expires?: number; // Number of days
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  path?: string;
}

// Set a cookie with the given name, value, and options
export function setCookie<T>(
  name: string,
  value: T,
  options: CookieOptions = {}
): void {
  if (typeof document === "undefined") return;

  const defaultOptions: CookieOptions = {
    expires: 365,
    secure:
      typeof window !== "undefined" && window.location.protocol === "https:",
    sameSite: "lax",
    path: "/",
  };

  const { expires, ...rest } = { ...defaultOptions, ...options };

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(
    JSON.stringify(value)
  )}`;

  if (expires) {
    const date = new Date();
    date.setDate(date.getDate() + expires);
    cookieString += `; expires=${date.toUTCString()}`;
  }

  Object.entries(rest).forEach(([key, val]) => {
    cookieString += `; ${key}${val ? `=${val}` : ""}`;
  });

  document.cookie = cookieString;
}

// Get a cookie by name, with type inference
export function getCookie<T>(name: string): T | null {
  // If running on the server, return null — there is no document.cookie
  if (typeof document === "undefined") return null;

  const cookies = document.cookie
    .split(";")
    .reduce((acc: { [key: string]: string }, cookie: string) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    }, {});
  try {
    return cookies[name] ? JSON.parse(decodeURIComponent(cookies[name])) : null;
  } catch {
    return null;
  }
}

// Delete a cookie by name
export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(
    name
  )}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}
