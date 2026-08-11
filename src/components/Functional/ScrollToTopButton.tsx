import { useState, useEffect, useCallback } from "react";
import { Button } from "@heroui/react";
import { ArrowUp } from "lucide-react";

const SCROLL_OFFSET = 300;

const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isUpperSide, setIsUpperSide] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Use callback to avoid re-creating function
  const toggleVisibility = useCallback(() => {
    requestAnimationFrame(() => {
      setIsVisible(window.scrollY > SCROLL_OFFSET);
    });
  }, []);

  useEffect(() => {
    // Add scroll listener with passive flag for performance
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    toggleVisibility();

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, [toggleVisibility]);

  const scrollToTop = (): void => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== "undefined") {
        const currentScrollY = window.scrollY;

        if (currentScrollY < lastScrollY || currentScrollY < 10) {
          setIsUpperSide(true);
        } else {
          setIsUpperSide(false);
        }

        setLastScrollY(currentScrollY);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", controlNavbar);
      return () => window.removeEventListener("scroll", controlNavbar);
    }
  }, [lastScrollY]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        isUpperSide ? "-translate-y-14 md:translate-y-full" : "translate-y-full"
      }`}
    >
      <Button
        onPress={scrollToTop}
        isIconOnly
        radius="full"
        color="primary"
        className="fixed bottom-6 right-2 sm:right-6 z-50 shadow-lg hover:scale-110 transition-transform"
      >
        <ArrowUp className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default ScrollToTopButton;
