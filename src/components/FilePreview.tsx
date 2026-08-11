import {
  Card,
  CardBody,
  Chip,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Tooltip,
} from "@heroui/react";
import {
  ExternalLink,
  Eye,
  File,
  FileImage,
  FileText,
  FileVideo,
} from "lucide-react";
import React, { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import Lightbox from "yet-another-react-lightbox";
import { getFileType } from "@/helpers/getters";

interface FilePreviewProps {
  attachments: string[];
}

const FilePreview: FC<FilePreviewProps> = ({ attachments }) => {
  const { t } = useTranslation();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [iframePreview, setIframePreview] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "image":
        return <FileImage className="w-4 h-4" />;
      case "video":
        return <FileVideo className="w-4 h-4" />;
      case "pdf":
      case "document":
        return <FileText className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const getFileName = (url: string): string => {
    const parts = url.split("/");
    return parts[parts.length - 1] || "File";
  };

  const imageAttachments = attachments.filter(
    (url) => getFileType(url) === "image"
  );

  const canPreviewInIframe = (fileType: string): boolean => {
    return ["pdf", "video", "document"].includes(fileType);
  };

  const getPreviewUrl = (url: string, fileType: string): string => {
    // For Office documents, use Google Docs Viewer or Office Online
    if (fileType === "document") {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }
    return url;
  };

  const handleImageClick = (url: string) => {
    const index = imageAttachments.indexOf(url);
    if (index !== -1) {
      setCurrentImageIndex(index);
      setLightboxOpen(true);
    }
  };

  const handlePreviewClick = (
    url: string,
    fileType: string,
    fileName: string
  ) => {
    console.log("Hello", fileType);
    if (fileType === "image") {
      handleImageClick(url);
    } else if (canPreviewInIframe(fileType)) {
      setIframePreview({ url, type: fileType, name: fileName });
    }
  };

  return (
    <>
      <div className="mt-2 space-y-1.5 w-full">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {t("attachments")} ({attachments.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {attachments.map((url, index) => {
            const fileType = getFileType(url);
            const fileName = getFileName(url);

            return (
              <Card
                key={index}
                shadow="sm"
                radius="sm"
                isPressable
                onClick={() => handlePreviewClick(url, fileType, fileName)}
                className="w-fit hover:shadow-md transition-shadow"
                as={"div"}
              >
                <CardBody className="p-1.5 flex flex-row items-center gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {fileType === "image" ? (
                      <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                        <Image
                          removeWrapper
                          radius="none"
                          src={url}
                          alt={fileName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        {getFileIcon(fileType)}
                      </div>
                    )}

                    <div className="flex flex-col min-w-0 max-w-48">
                      <Tooltip content={fileName}>
                        <p className="text-xs font-medium truncate">
                          {fileName}
                        </p>
                      </Tooltip>
                      <Chip
                        size="sm"
                        variant="flat"
                        className="w-fit h-4"
                        classNames={{
                          content: "text-[10px] uppercase px-1 py-0",
                        }}
                      >
                        {fileType}
                      </Chip>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {(fileType === "image" || canPreviewInIframe(fileType)) && (
                      <Tooltip content={t("preview") || "Preview"}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewClick(url, fileType, fileName);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          aria-label="Preview"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </button>
                      </Tooltip>
                    )}

                    <Tooltip content={t("openInNewTab") || "Open in new tab"}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        aria-label="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                      </a>
                    </Tooltip>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      {imageAttachments.length > 0 && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={imageAttachments.map((url) => ({ src: url }))}
          index={currentImageIndex}
        />
      )}

      {/* Iframe Preview Modal */}
      {iframePreview && (
        <Modal
          isOpen={!!iframePreview}
          onClose={() => setIframePreview(null)}
          size="5xl"
          scrollBehavior="inside"
          classNames={{
            base: "max-h-[90vh]",
            body: "p-0",
          }}
        >
          <ModalContent>
            <ModalHeader className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-3 py-2.5">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getFileIcon(iframePreview.type)}
                <Tooltip content={iframePreview.name}>
                  <p className="text-sm font-medium truncate">
                    {iframePreview.name}
                  </p>
                </Tooltip>
                <Chip size="sm" variant="flat" className="h-5 text-xs">
                  {iframePreview.type}
                </Chip>
              </div>
            </ModalHeader>
            <ModalBody>
              {iframePreview.type === "video" ? (
                <video
                  controls
                  className="w-full h-[75vh]"
                  src={iframePreview.url}
                >
                  Your browser does not support the video tag.
                </video>
              ) : iframePreview.type === "pdf" ? (
                <div className="w-full h-[75vh] relative">
                  <object
                    data={`${iframePreview.url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                    type="application/pdf"
                    className="w-full h-full"
                  >
                    <iframe
                      src={`${iframePreview.url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                      className="w-full h-full border-0"
                      title={iframePreview.name}
                    >
                      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                        <FileText className="w-16 h-16 text-gray-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Unable to display PDF in browser.
                        </p>
                        <a
                          href={iframePreview.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open PDF in New Tab
                        </a>
                      </div>
                    </iframe>
                  </object>
                </div>
              ) : (
                <iframe
                  src={getPreviewUrl(iframePreview.url, iframePreview.type)}
                  className="w-full h-[75vh] border-0"
                  title={iframePreview.name}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default FilePreview;
