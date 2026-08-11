import React from "react";
import { Button, Tooltip } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineX } from "react-icons/hi";

interface UpdateBannerProps {
  isVisible: boolean;
  onClose: () => void;
  message: string;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({
  isVisible,
  onClose,
  message,
}) => {
  const trimmedMessage = message?.trim();

  if (!trimmedMessage) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-2xl"
        >
          <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2rem] p-3 pl-6 flex items-center justify-between gap-4">
            <div className="flex items-center flex-1 min-w-0">
              <Tooltip content={trimmedMessage} delay={500} closeDelay={0}>
                <p className="text-[14px] text-slate-500 dark:text-slate-400 truncate max-w-[250px] sm:max-w-none cursor-default">
                  {trimmedMessage}
                </p>
              </Tooltip>
            </div>

            <div className="flex items-center gap-2">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                onPress={onClose}
              >
                <HiOutlineX size={18} />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
