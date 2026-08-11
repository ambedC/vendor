import { FC, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import clsx from "clsx";

interface ThemeSwitchProps {
  className?: string;
  variant?: "icon" | "switch"; // New prop to choose between desktop icon and mobile switch
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({
  className,
  variant = "icon",
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const id = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  if (!isMounted) {
    return variant === "switch" ? (
      <div className="w-14 h-8" />
    ) : (
      <div className="w-6 h-6" />
    );
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Switch variant for mobile
  if (variant === "switch") {
    const isLight = theme === "light";

    return (
      <button
        onClick={toggleTheme}
        aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
        className={clsx(
          "relative inline-flex items-center h-8 w-14 rounded-full transition-colors duration-300",
          isLight ? "bg-gray-300" : "bg-blue-600",
          className
        )}
      >
        <span
          className={clsx(
            "inline-flex items-center justify-center h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-300",
            isLight ? "translate-x-1" : "translate-x-7"
          )}
        >
          {isLight ? (
            <Sun className="w-4 h-4 text-yellow-500" />
          ) : (
            <Moon className="w-4 h-4 text-blue-600" />
          )}
        </span>
      </button>
    );
  }

  // Icon variant for desktop (original design)
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className={clsx(
        "flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:opacity-80 cursor-pointer",
        className
      )}
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 text-foreground/50" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-400" />
      )}
    </button>
  );
};
