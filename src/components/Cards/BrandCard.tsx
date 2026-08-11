import { useScreenType } from "@/hooks/useScreenType";
import { Brand } from "@/types/ApiResponse";
import { Card, CardBody, Image } from "@heroui/react";
import Link from "next/link";
import { FC, memo } from "react";

interface BrandCardProps {
  brand: Brand;
}

const BrandCard: FC<BrandCardProps> = ({ brand }) => {
  const screen = useScreenType();

  return (
    <div className="flex flex-col items-center w-full min-w-0">
      {/* Flexible height container instead of aspect-square */}
      <div className="w-full max-w-full overflow-hidden flex items-center justify-center">
        <Card
          className="backdrop-blur-sm w-full h-20 sm:h-full p-0 hover:scale-110 bg-gray-100 dark:bg-content1 transition-transform overflow-hidden flex items-center justify-center"
          shadow="none"
          isPressable={screen !== "mobile"}
          href={`/brands/${brand.slug}`}
          as={Link}
          title={brand.title}
        >
          <CardBody className="flex items-center justify-center p-3 overflow-hidden">
            <Image
              unselectable="off"
              src={brand.logo}
              alt={brand.title}
              className="object-contain max-w-full"
              classNames={{
                img: "rounded-lg max-w-full h-20 object-contain",
              }}
              loading="eager"
            />
          </CardBody>
        </Card>
      </div>

      {/* Fixed height for title to maintain consistency */}
      <div className="h-8 flex items-center w-full min-w-0">
        <h2
          title={brand.title}
          className="text-center truncate w-full text-xs font-medium px-1"
        >
          {brand.title}
        </h2>
      </div>
    </div>
  );
};

export default memo(BrandCard);
