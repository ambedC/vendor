import { FC, useState, useRef, memo, useEffect, RefObject } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import { Navigation, Pagination, Mousewheel } from "swiper/modules";
import { Image } from "@heroui/react";
import ProductImgSectionSkeleton from "@/components/Skeletons/ProductImgSectionSkeleton";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import { ProductVariant } from "@/types/ApiResponse";

interface ProductImgSectionProps {
  allImages: string[];
  isVertical: boolean;
  isLoading: boolean;
  /** Root node for sponsored ad impression visibility (keeps same element across loading/content swap) */
  adImpressionRef?: RefObject<HTMLDivElement | null>;
  video?: {
    url?: string | null;
    type?: "self_hosted" | "youtube" | null;
  } | null;
  variants?: ProductVariant[];
  selectedVariant?: ProductVariant | null;
  variantImagesStartIndex?: number;
}

const ProductImgSection: FC<ProductImgSectionProps> = memo(
  ({
    allImages,
    isVertical,
    isLoading,
    adImpressionRef,
    video,
    variants = [],
    selectedVariant = null,
    variantImagesStartIndex = 0,
  }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const mainSwiperRef = useRef<SwiperType | null>(null);
    const thumbnailSwiperRef = useRef<SwiperType | null>(null);
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
    const [isHover, setIsHover] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    // Switch to variant's image when variant changes
    useEffect(() => {
      if (selectedVariant && variants.length > 0) {
        const variantIndex = variants.findIndex(
          (v) => v.id === selectedVariant.id
        );
        if (variantIndex !== -1) {
          const imageIndex = variantImagesStartIndex + variantIndex;
          if (imageIndex < allImages.length) {
            // Only update swiper slides, activeIndex will be updated by onSlideChange
            mainSwiperRef.current?.slideTo(imageIndex);
            thumbnailSwiperRef.current?.slideTo(imageIndex);
          }
        }
      }
    }, [selectedVariant, variants, variantImagesStartIndex, allImages.length]);

    // Helper to pull YouTube ID and thumbnail
    const getYouTubeId = (url?: string | null) => {
      if (!url) return null;
      try {
        const u = new URL(url);
        if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
        if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
      } catch {
        // fallback simple regex
        const m = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
        return m ? m[1] : null;
      }
      return null;
    };

    const youTubeId = getYouTubeId(video?.url ?? null);
    const hasVideo = Boolean(video?.url);

    const showBottomSection = allImages.length > 1 || hasVideo;

    return (
      <div ref={adImpressionRef} className="w-full h-full min-h-0">
        {isLoading ? (
          <ProductImgSectionSkeleton isVertical={isVertical} />
        ) : (
      <div
        className={`w-full h-full flex gap-4 ${isVertical ? "" : "flex-col"}`}
      >
        <div
          className={`w-full cursor-zoom-in ${isVertical ? "order-2" : "order-1"} relative`}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setZoomPosition({ x, y });
          }}
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
        >
          {/* Swiper for Main Image */}
          <Swiper
            spaceBetween={10}
            slidesPerView={1}
            onSlideChange={(swiper) => {
              setActiveIndex(swiper.activeIndex);
              thumbnailSwiperRef.current?.slideTo(swiper.activeIndex);
            }}
            onSwiper={(swiper) => (mainSwiperRef.current = swiper)}
            modules={[Navigation, Pagination, Mousewheel]}
            className="mb-4"
            mousewheel
          >
            {allImages.map((image, index) => (
              <SwiperSlide key={index}>
                <div className="h-[40vh] md:h-[60vh] w-full flex justify-center items-center bg-gray-100 dark:bg-gray-950 rounded-lg overflow-hidden">
                  <Image
                    src={image}
                    alt={`Main Image ${index + 1}`}
                    radius="none"
                    className="w-full h-[40vh] md:h-[60vh] object-contain"
                    onClick={() => setLightboxIndex(index)}
                  />
                </div>
              </SwiperSlide>
            ))}

            {/* Video Slide (appended as last slide) */}
            {hasVideo && (
              <SwiperSlide key="video">
                <div className="h-[40vh] md:h-[60vh] w-full flex justify-center items-center bg-black rounded-lg overflow-hidden">
                  {video?.type === "youtube" && youTubeId ? (
                    <iframe
                      title="product-video"
                      src={`https://www.youtube.com/embed/${youTubeId}?rel=0&showinfo=0`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-[40vh] md:h-[60vh]"
                    />
                  ) : (
                    <video
                      controls
                      src={video?.url ?? undefined}
                      className="w-full h-[40vh] md:h-[60vh] object-contain bg-black"
                    />
                  )}
                </div>
              </SwiperSlide>
            )}
          </Swiper>

          {/* Zoom Window Outside the Main Image */}
          {isHover && activeIndex < allImages.length && (
            <div
              className="absolute top-0 -end-[10vw] md:-end-[20vw] w-[20vw] h-[20vw] border border-gray-300 rounded-lg overflow-hidden bg-gray-100 dark:border-default-200 dark:bg-gray-950 z-50"
              style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
            >
              <Image
                disableSkeleton
                disableAnimation
                removeWrapper
                src={allImages[activeIndex]}
                alt={`Zoomed Image ${activeIndex + 1}`}
                className="absolute w-full h-full object-contain"
                style={{
                  transform: `translate(-${zoomPosition.x}%, -${zoomPosition.y}%) scale(2)`,
                  transformOrigin: "top left",
                }}
              />
            </div>
          )}
        </div>

        <div
          className={`w-full cursor-grab ${isVertical ? "order-1" : "order-2"}`}
        >
          {/* Swiper for Thumbnails */}
          {showBottomSection && (
            <Swiper
              direction={isVertical ? "vertical" : "horizontal"}
              spaceBetween={10}
              onSwiper={(swiper) => (thumbnailSwiperRef.current = swiper)}
              modules={[Mousewheel]}
              mousewheel
              className={`my-swiper ${
                isVertical ? "h-[40vh] md:h-[60vh] w-28" : ""
              }`}
              breakpoints={{
                320: { slidesPerView: 3.5 },
                768: {
                  slidesPerView: 7.5,
                },
                1024: {
                  slidesPerView: isVertical ? 4.5 : 7.5,
                },
              }}
            >
              {allImages.map((image, index) => (
                <SwiperSlide
                  key={index}
                  onClick={() => {
                    setActiveIndex(index);
                    mainSwiperRef.current?.slideTo(index); // Update the main Swiper
                  }}
                >
                  <div
                    className={`h-16 ${
                      isVertical ? "md:h-28" : "md:h-20"
                    } w-full object-contain rounded-lg flex justify-center items-center bg-gray-100 dark:bg-gray-950 active:scale-95 transition-transform duration-100 dark:border-default-100 ${
                      activeIndex === index
                        ? "border-primary dark:border-default-400"
                        : "border-gray-300"
                    } border`}
                  >
                    <Image
                      loading="eager"
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full max-h-14 md:max-w-24 rounded-lg object-contain"
                    />
                  </div>
                </SwiperSlide>
              ))}

              {/* Video thumbnail */}
              {hasVideo && (
                <SwiperSlide
                  key="video-thumb"
                  onClick={() => {
                    const targetIndex = allImages.length; // last slide index
                    setActiveIndex(targetIndex);
                    mainSwiperRef.current?.slideTo(targetIndex);
                  }}
                >
                  <div
                    className={`h-16 ${
                      isVertical ? "md:h-28" : "md:h-20"
                    } w-full rounded-lg flex justify-center items-center bg-gray-900 dark:bg-gray-950 relative active:scale-95 transition-transform duration-100 border ${
                      activeIndex === allImages.length
                        ? "border-primary dark:border-default-400"
                        : "border-gray-300 dark:border-default-100"
                    }`}
                  >
                    {/* Use YouTube thumbnail when possible */}
                    {video?.type === "youtube" && youTubeId ? (
                      <Image
                        loading="lazy"
                        src={`https://img.youtube.com/vi/${youTubeId}/hqdefault.jpg`}
                        alt="video thumbnail"
                        className="w-full h-full max-h-14 md:max-w-24 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        Video
                      </div>
                    )}

                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.6)" />
                        <path d="M10 8L16 12L10 16V8Z" fill="#fff" />
                      </svg>
                    </div>
                  </div>
                </SwiperSlide>
              )}
            </Swiper>
          )}
        </div>
        {allImages.length > 0 && lightboxIndex !== null && (
          <Lightbox
            open={lightboxIndex !== null}
            index={lightboxIndex}
            plugins={[Thumbnails]}
            close={() => setLightboxIndex(null)}
            slides={allImages.map((src) => ({ src }))}
            thumbnails={{
              position: "bottom",
              width: 100,
              height: 70,
              borderRadius: 6,
              gap: 8,
            }}
          />
        )}
      </div>
        )}
      </div>
    );
  }
);

ProductImgSection.displayName = "ProductImgSection";

export default ProductImgSection;
