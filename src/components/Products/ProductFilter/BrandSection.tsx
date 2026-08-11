import {
  Accordion,
  AccordionItem,
  Listbox,
  ListboxItem,
  Image,
  Badge,
  ScrollShadow,
} from "@heroui/react";
import { ChevronLeft } from "lucide-react";
import { FC } from "react";
import { SelectedFilters } from ".";
import { Brand as BrandType } from "@/types/ApiResponse";
import { useTranslation } from "react-i18next";

interface BrandSectionProps {
  brands: BrandType[];
  selectedFilters: SelectedFilters;
  setSelectedFilters: React.Dispatch<React.SetStateAction<SelectedFilters>>;
  isLoading?: boolean;
}

const BrandSection: FC<BrandSectionProps> = ({
  brands,
  selectedFilters,
  setSelectedFilters,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  // Hide entirely when no brands available and not loading
  if (!isLoading && (!brands || brands.length === 0)) return null;

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
          aria-label={t("brand.accordionLabel")}
          title={t("brand.title")}
          subtitle={t("brand.subtitle")}
          indicator={({ isOpen }) => (
            <Badge
              color="primary"
              content={selectedFilters?.brands?.length || undefined}
              className={`transition-transform duration-300 ${selectedFilters?.brands?.length ? "" : "hidden"} ${
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
            className="w-full text-xs rounded-md max-h-[25vh]"
          >
            {isLoading ? (
              <div className="space-y-2 p-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-md bg-default-200 animate-pulse" />
                    <div className="flex-1">
                      <div className="h-3 w-24 rounded bg-default-200 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : brands && brands.length > 0 ? (
              <Listbox
                aria-label={t("brand.selectionAria")}
                selectedKeys={
                  selectedFilters?.brands
                    ? new Set(selectedFilters.brands)
                    : undefined
                }
                selectionMode="multiple"
                variant="flat"
                onSelectionChange={(keys) => {
                  const selectedBrandSlugs = Array.from(keys as Set<string>);
                  setSelectedFilters((prev) => ({
                    ...prev,
                    brands: selectedBrandSlugs,
                  }));
                }}
              >
                {brands.map((brand) => (
                  <ListboxItem
                    key={brand.slug}
                    textValue={brand.title}
                    isDisabled={brand.enabled === false}
                    classNames={{
                      title: "text-xs",
                      base: `px-1 ${brand.enabled === false ? "opacity-50" : ""}`,
                    }}
                    startContent={
                      <Image
                        loading="eager"
                        src={brand.logo}
                        width={20}
                        height={20}
                        alt={brand.title}
                        className="object-contain rounded-sm"
                        classNames={{ wrapper: "w-5 h-5 shrink-0" }}
                      />
                    }
                  >
                    {brand.title}
                  </ListboxItem>
                ))}
              </Listbox>
            ) : (
              <div className="text-center py-2">{t("brand.noBrands")}</div>
            )}
          </ScrollShadow>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default BrandSection;
