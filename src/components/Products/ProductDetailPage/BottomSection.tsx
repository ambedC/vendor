import { Product } from "@/types/ApiResponse";
import { Tab, Tabs } from "@heroui/react";
import { FileText, Star, HelpCircle, Store } from "lucide-react";
import { FC } from "react";
import ProductReviewsSection from "./ProductReviewsSection";
import ProductFaqSection from "./ProductFaqSection";
import AdditionalDetailSection from "./AdditionalDetailSection";
import SoldBySection from "./SoldBySection";
import SellerReviewSection from "./SellerReviewSection";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";

interface BottomSectionProps {
  initialProduct: Product;
}

const BottomSection: FC<BottomSectionProps> = ({ initialProduct }) => {
  const { t } = useTranslation();
  const { isSingleVendor } = useSettings();
  return (
    <div className="flex w-full flex-col">
      <Tabs
        aria-label="Options"
        color="default"
        variant="solid"
        classNames={{
          tabList: "w-full p-2",
        }}
      >
        <Tab
          key="details"
          title={
            <div className="flex items-center space-x-2">
              <FileText size={20} />
              <span>{t("details")}</span>
            </div>
          }
        >
          <AdditionalDetailSection initialProduct={initialProduct} />
        </Tab>
        <Tab
          key="reviews"
          title={
            <div className="flex items-center space-x-2">
              <Star size={20} />
              <span>{t("reviews")}</span>
            </div>
          }
        >
          <ProductReviewsSection productSlug={initialProduct?.slug} />
        </Tab>
        <Tab
          key="faqs"
          title={
            <div className="flex items-center space-x-2">
              <HelpCircle size={20} />
              <span>{t("faqs")}</span>
            </div>
          }
        >
          <ProductFaqSection productSlug={initialProduct?.slug} />
        </Tab>
        {!isSingleVendor && (
          <Tab
            key="soldby"
            title={
              <div className="flex items-center space-x-2">
                <Store size={20} />
                <span>{t("soldBy")}</span>
              </div>
            }
          >
            <div className="flex flex-col gap-4">
              <SoldBySection product={initialProduct} />

              <SellerReviewSection product={initialProduct} />
            </div>
          </Tab>
        )}
      </Tabs>
    </div>
  );
};

export default BottomSection;
