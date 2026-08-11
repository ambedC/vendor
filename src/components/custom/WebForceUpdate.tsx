import { motion, Variants } from "framer-motion";
import Head from "next/head";
import { NextPageWithLayout } from "@/types";

export interface WebForceUpdateProps {
  message: string;
}

const WebForceUpdate: NextPageWithLayout<WebForceUpdateProps> = ({
  message,
}: WebForceUpdateProps) => {
  const headingVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  const subheadingVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.8 } },
  };

  return (
    <>
      <Head>
        <title>Updating HyperLocal</title>
        <meta
          name="description"
          content="We are upgrading your experience with new features and optimizations."
        />
      </Head>

      <div className="dark:bg-slate-950 min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-white">
        {/* Concentric Circles Background */}
        <div className="absolute w-[150vh] h-[150vh] border border-slate-200 dark:border-slate-800 rounded-full opacity-40 animate-pulse pointer-events-none" />
        <div className="absolute w-[120vh] h-[120vh] border border-slate-100 dark:border-slate-900 rounded-full opacity-30 animate-pulse pointer-events-none" />
        <div className="absolute w-[90vh] h-[90vh] border border-slate-50 dark:border-slate-900/50 rounded-full opacity-20 animate-pulse pointer-events-none" />

        <div className="relative z-10 max-w-xl w-full px-6 py-12 text-center">
          {/* Top Floating Icons */}
          <motion.div
            className="flex justify-between max-w-[200px] mx-auto mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <span className="text-3xl animate-bounce text-slate-300">🔧</span>
            <span className="text-3xl animate-bounce [animation-delay:0.5s] text-orange-400">
              ⚡
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-slate-900 dark:text-white"
            variants={headingVariants}
            initial="hidden"
            animate="visible"
          >
            We&apos;ll be back soon!
          </motion.h1>

          <motion.p
            className="mb-10 text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium"
            variants={subheadingVariants}
            initial="hidden"
            animate="visible"
          >
            {message || "We're currently optimizing our platform to provide you with a smoother and more secure experience. Please refresh the page to access the latest enhancements."}
          </motion.p>
        </div>
      </div>
    </>
  );
};

WebForceUpdate.getLayout = (page) => page;

export default WebForceUpdate;
