import { useEffect, useState } from "react";

type ScreenType = "mobile" | "tablet" | "desktop" | "desktop-4k";

const getScreenType = (): ScreenType => {
  if (typeof window === "undefined") return "desktop";

  const width = window.innerWidth;

  if (width >= 2560) return "desktop-4k";
  if (width >= 1024) return "desktop";
  if (width >= 768) return "tablet";
  return "mobile";
};

export const useScreenType = () => {
  const [screen, setScreen] = useState<ScreenType>(getScreenType());

  useEffect(() => {
    const onResize = () => setScreen(getScreenType());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return screen;
};
