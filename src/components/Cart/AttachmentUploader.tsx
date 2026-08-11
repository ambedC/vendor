import { FC, useState, useRef } from "react";
import { Button, Card, CardBody, addToast } from "@heroui/react";
import { Upload, X, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { getFileType as getFileTypeUtil } from "@/helpers/getters";

export interface AttachmentFile {
  file: File;
  preview?: string;
  type: "image" | "pdf" | "docx";
}

interface AttachmentUploaderProps {
  attachment: AttachmentFile[];
  onAttachmentChange: (attachment: AttachmentFile[]) => void;
  maxSizeMB?: number;
}

const AttachmentUploader: FC<AttachmentUploaderProps> = ({
  attachment,
  onAttachmentChange,
  maxSizeMB = 10,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const getFileType = (mimeType: string): "image" | "pdf" | "docx" | null => {
    const fileType = getFileTypeUtil(mimeType);
    // Map document type to docx for compatibility
    if (fileType === "document") return "docx";
    // Only return allowed types for this uploader
    if (["image", "pdf"].includes(fileType)) return fileType as "image" | "pdf";
    return null;
  };

  const validateFile = (file: File): boolean => {
    const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes

    if (file.size > maxSize) {
      addToast({
        title: t("cart.attachments.errors.fileTooLarge.title"),
        description: t("cart.attachments.errors.fileTooLarge.description", {
          fileName: file.name,
          maxSize: maxSizeMB,
          defaultValue: `File "${file.name}" is too large. Maximum size is ${maxSizeMB}MB.`,
        }),
        color: "danger",
      });
      return false;
    }

    const fileType = getFileType(file.type);
    if (!fileType) {
      addToast({
        title: t("cart.attachments.errors.invalidType.title"),
        description: t("cart.attachments.errors.invalidType.description", {
          fileName: file.name,
          defaultValue: `File "${file.name}" has an unsupported format. Only images, PDF, and DOCX files are allowed.`,
        }),
        color: "danger",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const selectedFiles = Array.from(files);
      const validAttachments: AttachmentFile[] = [];

      for (const file of selectedFiles) {
        if (!validateFile(file)) continue;

        const fileType = getFileType(file.type);
        if (!fileType) continue;

        const attachmentFile: AttachmentFile = {
          file,
          type: fileType,
        };

        if (fileType === "image") {
          const reader = new FileReader();
          const preview = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          attachmentFile.preview = preview;
        }

        validAttachments.push(attachmentFile);
      }

      if (validAttachments.length === 0) {
        setUploading(false);
        return;
      }

      onAttachmentChange([...(attachment || []), ...validAttachments]);
      addToast({
        title: t("cart.attachments.uploadSuccess.title"),
        description: t("cart.attachments.uploadSuccess.description", {
          count: validAttachments.length,
          defaultValue: `File added successfully.`,
        }),
        color: "success",
      });
    } catch (error) {
      console.error("Error processing file:", error);
      addToast({
        title: t("cart.attachments.errors.uploadFailed.title"),
        description: t("cart.attachments.errors.uploadFailed.description"),
        color: "danger",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const nextAttachments = (attachment || []).filter(
      (_, idx) => idx !== index,
    );
    onAttachmentChange(nextAttachments);
    addToast({
      title: t("cart.attachments.removeSuccess.title"),
      description: t("cart.attachments.removeSuccess.description"),
      color: "success",
    });
  };

  const renderPreview = (attachment: AttachmentFile) => {
    switch (attachment.type) {
      case "image":
        return (
          <div className="relative w-full h-20 rounded-md overflow-hidden bg-default-100">
            {attachment.preview && (
              <Image
                src={attachment.preview}
                alt={attachment.file.name}
                fill
                className="object-cover"
              />
            )}
          </div>
        );

      case "pdf":
        return (
          <div className="flex items-center justify-center w-full h-20 rounded-md bg-red-50 dark:bg-red-900/20">
            <FileText className="w-8 h-8 text-red-500" />
          </div>
        );

      case "docx":
        return (
          <div className="flex items-center justify-center w-full h-20 rounded-md bg-blue-50 dark:bg-blue-900/20">
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        );

      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="w-full space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex flex-wrap gap-2 items-center">
        <Button
          size="sm"
          variant="flat"
          color="primary"
          startContent={<Upload size={14} />}
          onPress={() => fileInputRef.current?.click()}
          isLoading={uploading}
          isDisabled={uploading}
          className="text-xs"
        >
          {t("cart.attachments.uploadButton", {
            defaultValue: "Upload Attachments",
          })}
        </Button>
        {attachment?.length > 0 && (
          <span className="text-xxs text-foreground/60">
            {t("cart.attachments.count", {
              count: attachment.length,
              defaultValue: `${attachment.length} file(s) uploaded`,
            })}
          </span>
        )}
      </div>

      {attachment && attachment.length > 0 && (
        <div className="grid gap-2">
          {attachment.map((fileItem, index) => (
            <Card key={`${fileItem.file.name}-${index}`} shadow="sm">
              <CardBody className="p-2">
                <div className="flex gap-2">
                  <div className="w-20 shrink-0">{renderPreview(fileItem)}</div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {fileItem.file.name}
                    </p>
                    <p className="text-xxs text-foreground/60">
                      {formatFileSize(fileItem.file.size)}
                    </p>
                  </div>

                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    className="shrink-0"
                    onPress={() => handleRemoveAttachment(index)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xxs text-foreground/50 mt-1">
        {t("cart.attachments.helperText", {
          maxFiles: "multiple",
          maxSize: maxSizeMB,
          defaultValue: `Upload one or more files (image, PDF, or DOCX). Max ${maxSizeMB}MB per file.`,
        })}
      </p>
    </div>
  );
};

export default AttachmentUploader;
