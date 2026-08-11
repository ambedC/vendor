import { Lexend_Deca } from "next/font/google";

export const fontSans = Lexend_Deca({
  subsets: ["latin"],
  weight: ["300", "400"], // 👈 lighter than default
  variable: "--font-sans",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
  adjustFontFallback: true,
});

export const fontMono = Lexend_Deca({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-mono",
  display: "swap",
  preload: true,
  fallback: ["Courier New", "monospace"],
  adjustFontFallback: true,
});
