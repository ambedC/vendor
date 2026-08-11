import React from "react";
import { Card, CardHeader, CardBody, CardFooter, Chip } from "@heroui/react";
import { FeaturedSection } from "@/types/ApiResponse";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { formatString } from "@/helpers/validator";
import { Box, ChevronRight } from "lucide-react";

interface SectionCardProps {
  section: FeaturedSection;
}

const getSectionTypeColor = (type: string) => {
  const colorMap: Record<string, { bg: string; text: string; border: string }> =
    {
      newly_added: {
        bg: "bg-blue-50 dark:bg-blue-950/30",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-800",
      },
      featured: {
        bg: "bg-amber-50 dark:bg-amber-950/30",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-800",
      },
      best_seller: {
        bg: "bg-green-50 dark:bg-green-950/30",
        text: "text-green-600 dark:text-green-400",
        border: "border-green-200 dark:border-green-800",
      },
    };
  return colorMap[type] || colorMap.newly_added;
};

const SectionCard: React.FC<SectionCardProps> = ({ section }) => {
  const { t } = useTranslation();
  const typeColors = getSectionTypeColor(section.section_type);

  return (
    <Card
      as={Link}
      href={`/feature-sections/${section.slug}`}
      isPressable
      radius="lg"
      shadow="sm"
      className="group overflow-hidden hover:shadow-xl transition-all duration-300 border border-default-200 hover:border-default-300 bg-content1"
    >
      {/* Decorative top border */}
      <div className={`h-1 w-full ${typeColors.bg}`} />

      <CardHeader className="flex flex-col items-start gap-2 px-4 pt-4 pb-3">
        <div className="flex justify-between items-start w-full gap-2">
          <h3 className="text-base sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
            {section.title}
          </h3>

          {/* Product count badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-default-100 text-default-600 text-xs font-medium shrink-0">
            <Box size={16} />
            <span>{section.products_count}</span>
          </div>
        </div>
      </CardHeader>

      <CardBody className="px-4 py-2">
        <p className="text-sm text-default-500 line-clamp-2 leading-relaxed">
          {section.short_description}
        </p>
      </CardBody>

      <CardFooter className="px-4 pb-4 pt-3 flex justify-between items-center border-t border-default-100">
        <Chip
          size="sm"
          variant="flat"
          className={`${typeColors.bg} ${typeColors.text} border ${typeColors.border} font-medium text-xs capitalize`}
        >
          {formatString(section.section_type || "")}
        </Chip>

        {/* Browse arrow indicator */}
        <div className="flex items-center gap-1.5 text-xs text-default-400 group-hover:text-primary transition-colors">
          <span className="font-medium">{t("browse") || "Browse"}</span>
          <ChevronRight size={18} />
        </div>
      </CardFooter>
    </Card>
  );
};

export default SectionCard;
