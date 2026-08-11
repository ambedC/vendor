import { useScreenType } from "@/hooks/useScreenType";
import { trackCategoryView } from "@/lib/analytics";
import { Category } from "@/types/ApiResponse";
import { Card, Image } from "@heroui/react";
import Link from "next/link";
import { FC, memo } from "react";

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: FC<CategoryCardProps> = ({ category }) => {
  const link = category?.parent_slug
    ? `/categories/${category.parent_slug}?subcategory=${category.slug}`
    : `/categories/${category.slug}`;

  const screen = useScreenType();

  return (
    <div className="flex flex-col items-center w-full min-w-0 px-1 py-1 sm:py-2">
      <div className="w-full max-w-full overflow-hidden rounded-[14px] sm:rounded-[18px] bg-gray-100 dark:bg-content1">
        <Card
          className="relative w-full aspect-[4/4.8] sm:aspect-[4/5] border-none bg-transparent"
          shadow="none"
          isPressable={screen !== "mobile"}
          as={Link}
          href={link}
          title={category.title}
          onPress={() =>
            trackCategoryView(category?.id?.toString(), category?.title)
          }
        >
          <div className="absolute top-3 start-3 end-1 sm:top-4 sm:start-4 z-20 text-start pr-1">
            <h2
              title={category.title}
              className="text-[13px] sm:text-[14px] font-bold text-gray-800 dark:text-foreground leading-[1.2] break-words line-clamp-2 max-w-[90%]"
            >
              {category.title}
            </h2>
          </div>
          
          <div className="absolute bottom-0 end-0 w-full h-[70%] flex justify-end items-end z-10">
            <Image
              src={category.image}
              alt={category.title}
              className="max-w-[95%] max-h-[95%] object-contain drop-shadow-md"
              classNames={{
                img: "object-contain block",
              }}
              loading="eager"
              removeWrapper
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default memo(CategoryCard);
