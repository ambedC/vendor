import { FC } from "react";
import { SelectedFilters } from ".";
import {
  Accordion,
  AccordionItem,
  Badge,
  Checkbox,
  ScrollShadow,
} from "@heroui/react";
import { Category } from "@/types/ApiResponse";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CategorySectionProps {
  categories: Category[];
  selectedFilters: SelectedFilters;
  setSelectedFilters: React.Dispatch<React.SetStateAction<SelectedFilters>>;
  isLoading?: boolean;
}

const CategorySection: FC<CategorySectionProps> = ({
  categories,
  selectedFilters,
  setSelectedFilters,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  // Hide entirely when no categories available and not loading
  if (!isLoading && (!categories || categories.length === 0)) return null;

  const handleCategoryChange = (categorySlug: string) => {
    setSelectedFilters((prev) => {
      const categories = prev.categories.includes(categorySlug)
        ? prev.categories.filter((slug) => slug !== categorySlug)
        : [...prev.categories, categorySlug];
      return { ...prev, categories };
    });
  };

  return (
    <div className="w-full overflow-x-hidden">
      <Accordion
        variant="light"
        itemClasses={{
          base: "overflow-hidden !important",
          title: "text-xs",
          subtitle: "text-[10px] pl-1 text-foreground/50",
          content: "text-xs p-0",
          trigger: "h-10",
          indicator: "pr-2",
        }}
        defaultExpandedKeys={["1"]}
      >
        <AccordionItem
          key="1"
          aria-label={t("category.accordionLabel")}
          title={t("category.title")}
          subtitle={t("category.subtitle")}
          indicator={({ isOpen }) => (
            <Badge
              color="primary"
              content={selectedFilters?.categories?.length || undefined}
              className={`transition-transform duration-300 ${selectedFilters?.categories?.length ? "" : "hidden"} ${
                isOpen ? "rotate-90" : "rotate-0"
              }`}
              classNames={{
                badge: "text-xs",
              }}
            >
              <ChevronLeft size={20} />
            </Badge>
          )}
        >
          <ScrollShadow
            hideScrollBar
            className="flex flex-col gap-2 p-2 max-h-[25vh]"
          >
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-md bg-default-200 animate-pulse" />
                    <div className="flex-1">
                      <div className="h-3 w-24 rounded bg-default-200 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : categories && categories.length > 0 ? (
              categories.map((category) => (
                <Checkbox
                  key={category.id}
                  isSelected={selectedFilters?.categories?.includes(
                    category.slug,
                  )}
                  isDisabled={category.enabled === false}
                  onChange={() => handleCategoryChange(category.slug)}
                  className="text-xs"
                  classNames={{
                    label: `text-xs ${category.enabled === false ? "opacity-50" : ""}`,
                    wrapper: "w-4 h-4",
                  }}
                >
                  {category.title}
                </Checkbox>
              ))
            ) : (
              <div className="text-center py-2">
                {t("category.noCategories")}
              </div>
            )}
          </ScrollShadow>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default CategorySection;
