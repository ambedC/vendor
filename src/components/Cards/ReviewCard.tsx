import { FC, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  User,
  Image,
} from "@heroui/react";
import RatingStars from "../RatingStars";
import { Review } from "@/types/ApiResponse";
import Lightbox from "yet-another-react-lightbox";

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: FC<ReviewCardProps> = ({ review }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const getFormattedDate = (date: string) =>
    new Date(date).toLocaleDateString();

  return (
    <>
      <Card shadow="sm" radius="sm" as={"div"}>
        <CardHeader className="justify-between">
          <User
            classNames={{ name: "text-xs md:text-sm" }}
            avatarProps={{ src: "", className: "w-6 h-6 md:w-8 md:h-8" }}
            name={review.user.name}
          />
          <div className="flex gap-1 items-center">
            <RatingStars
              rating={review.rating}
              size={16}
              classNames="h-3 w-3 md:w-4 md:h-4"
            />
            <p className="text-xxs md:text-xs">{`(${review.rating})`}</p>
          </div>
        </CardHeader>

        <CardBody className="pt-0">
          <h4 className="text-sm font-medium mb-1">{review.title}</h4>
          <p className="text-xs md:text-sm text-foreground/80">
            {review.comment}
          </p>

          {review.review_images?.length > 0 && (
            <div className="flex space-x-2 mt-2" onClick={() => {}}>
              {review.review_images.map((image, idx) => (
                <div key={idx}>
                  <Image
                    key={idx}
                    src={image}
                    loading="lazy"
                    alt={`Review Image ${idx + 1}`}
                    onClick={() => setLightboxIndex(idx)}
                    className="w-12 h-12 rounded object-cover cursor-pointer"
                  />
                </div>
              ))}
            </div>
          )}
        </CardBody>

        <CardFooter className="py-1 w-full justify-end">
          <p className="text-xxs md:text-xs text-foreground/50">
            {getFormattedDate(review.created_at)}
          </p>
        </CardFooter>
      </Card>
      {review.review_images && lightboxIndex !== null && (
        <Lightbox
          open={lightboxIndex !== null}
          index={lightboxIndex}
          close={() => setLightboxIndex(null)}
          slides={review.review_images.map((src) => ({ src }))}
        />
      )}
    </>
  );
};

export default ReviewCard;
