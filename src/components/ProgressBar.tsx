// components/ProgressBar.tsx
import { FC, useEffect } from "react";
import Router from "next/router";
import NProgress from "nprogress";

const ProgressBar: FC = () => {
  useEffect(() => {
    const handleStart = () => NProgress.start();
    const handleStop = () => NProgress.done();

    Router.events.on("routeChangeStart", handleStart);
    Router.events.on("routeChangeComplete", handleStop);
    Router.events.on("routeChangeError", handleStop);

    return () => {
      Router.events.off("routeChangeStart", handleStart);
      Router.events.off("routeChangeComplete", handleStop);
      Router.events.off("routeChangeError", handleStop);
    };
  }, []);

  NProgress.configure({
    easing: "ease",
    speed: 500,
    showSpinner: false,
  });

  return null;
};

export default ProgressBar;
