import { FC, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Chip,
  Image,
} from "@heroui/react";
import RatingStars from "../RatingStars";
import { getFormattedDate } from "@/helpers/getters";
import { Star } from "lucide-react";
import RatingModal from "@/components/Modals/RatingModal";
import { useTranslation } from "react-i18next";

// Import lightbox
import Lightbox from "yet-another-react-lightbox";

interface UserReview {
  id?: string | number;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
  review_images?: string[];
}

interface OrderItemReviewCardProps {
  userReview: UserReview | null;
}

const OrderItemReviewCard: FC<OrderItemReviewCardProps> = ({ userReview }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { t } = useTranslation();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();

  if (!userReview) return null;

  return (
    <>
      {/* Trigger Button */}
      <Chip
        as={Button}
        onPress={onOpen}
        size="sm"
        color="success"
        variant="flat"
        radius="sm"
        className="cursor-pointer"
        classNames={{ content: "text-xs" }}
        startContent={<Star size={12} className="fill-current" />}
      >
        {t("view_review")}
      </Chip>

      {/* Review Modal */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="sm"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {t("your_review")}
            {userReview.user && (
              <span className="text-xs text-foreground/60">
                {t("by")} {userReview.user.name}
              </span>
            )}
          </ModalHeader>
          <ModalBody>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md flex flex-col gap-2">
              {/* Rating */}
              <div className="flex items-center gap-2 mb-2">
                <RatingStars rating={Number(userReview.rating)} size={14} />
                <span className="text-xs font-medium">
                  {userReview.rating}/5
                </span>
              </div>

              {/* Title & Comment */}
              <div className="text-sm font-semibold">{userReview.title}</div>
              <div className="text-sm text-foreground/60">
                {userReview.comment}
              </div>

              {/* Images */}
              {userReview.review_images &&
                userReview.review_images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                    {userReview.review_images.map((img, idx) => (
                      <Image
                        key={idx}
                        src={img}
                        alt={`review-img-${idx}`}
                        className="w-full h-20 object-cover rounded-md cursor-pointer"
                        onClick={() => setLightboxIndex(idx)}
                      />
                    ))}
                  </div>
                )}

              {/* Date */}
              <div className="text-xxs text-foreground/50 mt-2">
                {t("reviewed_on", {
                  date: getFormattedDate(userReview.created_at),
                })}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => {
                // close the viewer modal, then open edit modal
                onOpenChange();
                onEditOpen();
              }}
            >
              {t("edit_review")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Rating Modal */}
      <RatingModal
        isOpen={isEditOpen}
        onClose={() => {
          onEditClose();
        }}
        type="product"
        existingReview={{
          id: userReview.id,
          rating: userReview.rating,
          title: userReview.title,
          comment: userReview.comment,
          review_images: userReview.review_images || [],
        }}
      />

      {/* Lightbox*/}
      {userReview.review_images && lightboxIndex !== null && (
        <Lightbox
          open={lightboxIndex !== null}
          index={lightboxIndex}
          close={() => setLightboxIndex(null)}
          slides={userReview.review_images.map((src) => ({ src }))}
        />
      )}
    </>
  );
};

export default OrderItemReviewCard;
