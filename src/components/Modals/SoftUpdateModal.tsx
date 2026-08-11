import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { HiArrowRight, HiOutlineLightningBolt } from "react-icons/hi";

interface SoftUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  currentVersion: string;
  latestVersion: string;
  updateUrl: string;
}

export const SoftUpdateModal: React.FC<SoftUpdateModalProps> = ({
  isOpen,
  onClose,
  message,
  currentVersion,
  latestVersion,
  updateUrl,
}) => {
  const handleUpdate = () => {
    window.open(updateUrl, "_blank");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      backdrop="blur"
      placement="center"
      className="max-w-md mx-4"
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: 20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        },
      }}
    >
      <ModalContent className="rounded-[2rem] p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-none shadow-2xl">
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-center pb-2">
              <div className="mx-auto bg-primary/10 p-3 rounded-2xl mb-3">
                <HiOutlineLightningBolt className="text-primary text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                New Update Available!
              </h2>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
                <span>v{currentVersion}</span>
                <HiArrowRight className="text-primary/40" />
                <span className="text-primary">v{latestVersion}</span>
              </p>
            </ModalHeader>
            <ModalBody className="pb-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed text-center font-medium">
                  {message || "We've added some exciting new features and improvements for you."}
                </p>
              </div>
            </ModalBody>
            <ModalFooter className="flex flex-col sm:flex-row gap-2 pt-0">
              <Button
                color="primary"
                onPress={handleUpdate}
                className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                endContent={<HiArrowRight />}
              >
                Update Now
              </Button>
              <Button
                variant="light"
                onPress={onClose}
                className="w-full h-12 rounded-xl font-semibold text-slate-500"
              >
                Maybe Later
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
