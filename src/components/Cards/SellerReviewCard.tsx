import { FC } from "react";
import { Card, CardHeader, CardBody, CardFooter, User } from "@heroui/react";
import RatingStars from "../RatingStars";
import { SellerReview } from "@/types/ApiResponse";

interface SellerReviewCardProps {
  review: SellerReview;
}

const SellerReviewCard: FC<SellerReviewCardProps> = ({ review }) => {
  const getFormattedDate = (date: string) =>
    new Date(date).toLocaleDateString();

  return (
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
          {review.description}
        </p>
      </CardBody>

      <CardFooter className="py-1 w-full justify-end">
        <p className="text-xxs md:text-xs text-foreground/50">
          {getFormattedDate(review.created_at)}
        </p>
      </CardFooter>
    </Card>
  );
};

export default SellerReviewCard;
