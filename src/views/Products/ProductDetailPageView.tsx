import { FC, useState } from "react";
import { useAdTracking } from "@/hooks/useAdTracking";
import {
  BottomSection,
  CustomProductSections,
  ProductDetailSection,
  ProductImgSection,
  SimilarProductsSection,
} from "@/components/Products/ProductDetailPage";
import { Product, ProductVariant } from "@/types/ApiResponse";
import ProductDetailSectionSkeleton from "@/components/Skeletons/ProductDetailSectionSkeleton";
import { useDisclosure } from "@heroui/react";
import dynamic from "next/dynamic";

const ProductModal = dynamic(() => import("@/components/Modals/ProductModal"), {
  ssr: false,
});

interface ProductPageProps {
  initialProduct: Product;
  initialSimilarProducts: Product[];
  isLoading: boolean;
  isSimilarProductsLoading: boolean;
}

const ProductDetailPageView: FC<ProductPageProps> = ({
  initialProduct,
  initialSimilarProducts,
  isLoading,
  isSimilarProductsLoading,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  // Get initial variant
  const getInitialVariant = () => {
    if (initialProduct?.variants && initialProduct.variants.length > 0) {
      return (
        initialProduct.variants.find((v) => v.is_default) ||
        initialProduct.variants[0]
      );
    }
    return null;
  };

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    getInitialVariant()
  );

  const { elementRef: adImpressionRef } = useAdTracking(initialProduct);

  const mainImage = initialProduct?.main_image || ""; // Main image
  const otherImages = initialProduct?.additional_images || []; // Other Images

  // Collect all variant images
  const variantImages =
    initialProduct?.variants?.map((variant) => variant.image).filter(Boolean) ||
    [];

  // Combine all images: main image, other images, then variant images
  const allImages = [mainImage, ...otherImages, ...variantImages].filter(
    Boolean
  );

  // Calculate the index where variant images start
  const variantImagesStartIndex = [mainImage, ...otherImages].filter(
    Boolean
  ).length;

  const video = initialProduct?.video_link
    ? {
        url: initialProduct.video_link,
        type:
          initialProduct.video_type === "youtube"
            ? ("youtube" as const)
            : initialProduct.video_type === "self_hosted"
              ? ("self_hosted" as const)
              : null,
      }
    : null;

  // Function to handle variant change and switch image
  const handleVariantChange = (variant: ProductVariant) => {
    setSelectedVariant(variant);
  };

  return (
    <div className="w-full h-full flex flex-col gap-2 sm:gap-10">
      <section
        id="productPage-top-section"
        className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-0 sm:gap-10"
      >
        <div className="w-full flex justify-start">
          <ProductImgSection
            allImages={allImages}
            isVertical={false}
            isLoading={isLoading}
            adImpressionRef={adImpressionRef}
            video={video}
            variants={initialProduct?.variants || []}
            selectedVariant={selectedVariant}
            variantImagesStartIndex={variantImagesStartIndex}
          />
        </div>
        <div className="w-full flex justify-end">
          {isLoading ? (
            <ProductDetailSectionSkeleton />
          ) : (
            <ProductDetailSection
              initialProduct={initialProduct}
              onVariantChange={handleVariantChange}
              onOpenModal={onOpen}
            />
          )}
        </div>
      </section>

      <section id="similar-product-section">
        <SimilarProductsSection
          initialSimilarProducts={initialSimilarProducts}
          isLoading={isSimilarProductsLoading}
        />
      </section>

      {initialProduct?.custom_product_sections && (
        <section id="custom-product-sections">
          <CustomProductSections
            sections={initialProduct.custom_product_sections}
          />
        </section>
      )}
      <section id="productPage-bottom-section">
        <BottomSection initialProduct={initialProduct} />
      </section>

      {isOpen && (
        <ProductModal
          isOpen={isOpen}
          onClose={onClose}
          product={initialProduct}
          selectedVariant={selectedVariant}
        />
      )}
    </div>
  );
};

export default ProductDetailPageView;
