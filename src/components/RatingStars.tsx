import { Star } from "lucide-react";

const RatingStars = ({ rating = 0, size = 12, classNames = "" }) => {
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      size={size}
      className={`${classNames} ${
        index < Math.floor(rating)
          ? "fill-yellow-400 text-yellow-400"
          : index < rating
          ? "fill-yellow-200 text-yellow-400"
          : "fill-gray-200 text-gray-200"
      }`}
    />
  ));
};

export default RatingStars;
