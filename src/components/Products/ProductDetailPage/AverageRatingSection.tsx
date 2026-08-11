import React from "react";
import { Card, CardBody, Divider, Progress } from "@heroui/react"; // Replace with the actual Hero UI progress component import if different.
import RatingStars from "@/components/RatingStars";
import { useTranslation } from "react-i18next";

interface AverageRatingSectionProps {
  totalReviews: number;
  averageRating: number;
  ratingsBreakdown: {
    rating: number;
    count: number;
  }[];
}

const AverageRatingSection: React.FC<AverageRatingSectionProps> = ({
  totalReviews,
  averageRating,
  ratingsBreakdown,
}) => {
  const { t } = useTranslation();
  return (
    <Card className="w-full" radius="sm">
      <CardBody className="flex flex-col sm:flex-row gap-4 p-4 px-10">
        {/* Left Section: Average Rating */}
        <div className="flex flex-col items-center justify-center">
          <div aria-label="Average Rating" className="text-center">
            <p className="text-4xl font-bold">{averageRating.toFixed(1)}</p>
          </div>
          <div aria-label="Star Ratings" className="flex justify-center mt-2">
            <RatingStars rating={averageRating} size={20} />
          </div>
          <div aria-label="Total Ratings" className="text-sm mt-2">
            <p>
              {totalReviews} {t("ratings")}
            </p>
          </div>
        </div>

        <Divider orientation="vertical" />

        {/* Right Section: Ratings Breakdown */}
        <div className="flex flex-col gap-2 w-full">
          {ratingsBreakdown.map(({ rating, count }) => (
            <div key={rating} className="flex items-center space-x-4">
              <RatingStars rating={rating} size={20} />
              <Progress
                value={(count / totalReviews) * 100}
                className="grow bg-gray-200 hidden sm:flex"
                aria-label={`Progress for ${rating} stars`}
              />
              <span className="text-sm whitespace-nowrap">
                {count} {t("review")}
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

export default AverageRatingSection;
