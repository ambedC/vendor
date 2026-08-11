// Name validation function
export const validateName = (name: string): string => {
  if (!name) return "Name is required";
  if (name.trim().length < 2) return "Name must be at least 2 characters long";
  return "";
};

// Email validation function
export const validateEmail = (email: string): string => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) return "Email is required";
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return "";
};

// Password validation function
export const validatePassword = (password: string): string => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters long";
  return "";
};

// Confirm password validation function
export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string => {
  if (!confirmPassword) return "Please confirm your password";
  if (password !== confirmPassword) return "Passwords do not match";
  return "";
};

// Formate

export const formatString = (status: unknown): string => {
  if (typeof status !== "string" || !status.trim()) {
    return "";
  }

  return status
    .replace(/[0-9]/g, "")
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const formatTime = (date: Date) => {
  return date.toLocaleTimeString("en-US", {
    hour12: true,
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatDate = (dateInput: unknown): string => {
  try {
    // Ensure input is string or Date
    const date =
      typeof dateInput === "string" || dateInput instanceof Date
        ? new Date(dateInput)
        : null;

    if (!date || isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateMobile = (mobile: string): string => {
  if (!mobile.trim()) return "Mobile number is required";
  const digitsOnly = mobile.replace(/\D/g, "");
  // Keep validation country-agnostic for login:
  // allow common international local-number lengths.
  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    return "Please enter a valid mobile number";
  }
  return "";
};

export const looksLikeEmail = (value: string): boolean => {
  return value.includes("@") || /[a-zA-Z]/.test(value);
};

export const looksLikeMobile = (value: string): boolean => {
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.length >= 8 && !/[a-zA-Z]/.test(value);
};
