import { useState, useEffect } from "react";
import Confetti from "react-confetti";

export default function ConfettiTrigger() {
  // Initialize directly with window dimensions if available
  const [windowSize, setWindowSize] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  }));

  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const triggerConfetti = () => {
    setShow(true);
    setTimeout(() => setShow(false), 5000);
  };

  return (
    <>
      <button id="confetti-btn" className="hidden" onClick={triggerConfetti} />
      {show && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={400}
          gravity={0.5}
        />
      )}
    </>
  );
}
