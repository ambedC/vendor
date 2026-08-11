import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody, Button, Image } from "@heroui/react";
import { ShoppingBag, Truck } from "lucide-react";
import { useRouter } from "next/router";

const DeliveryBanner: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <section id="delivery-banner" className="my-7">
      <div className="w-full relative overflow-visible">
        <Card className="relative overflow-visible bg-linear-to-br from-primary to-primary-600 rtl:bg-linear-to-bl shadow-2xl border-none">
          <CardBody className="relative z-10 p-0 overflow-visible">
            {/* GRID */}
            <div className="grid grid-cols-12 min-h-[220px] relative lg:rtl:grid-flow-col-dense">
              {/* ================= CONTENT ================= */}
              <div
                className="
                  col-span-12 lg:col-span-7
                  p-4 lg:p-10
                  flex flex-col justify-center
                  space-y-5
                  text-left rtl:text-right
                  max-w-full
                  rtl:lg:max-w-[85%]
                "
              >
                {/* Header */}
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm rtl:scale-90">
                    <Truck className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-white/90">
                    {t("home.delivery.header")}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                  {t("home.delivery.title")}
                  <span className="mx-2 bg-linear-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent inline-block">
                    {t("home.delivery.highlight")}
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-lg text-white/90 font-medium">
                  {t("home.delivery.subtitle")}
                </p>

                {/* CTA */}
                <Button
                  radius="full"
                  onPress={() => router.push("/brands")}
                  startContent={
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                  }
                  className="
                    font-semibold bg-white text-black/80
                    px-6 py-3 sm:px-8 sm:py-6
                    sm:text-lg
                    shadow-lg hover:shadow-xl
                    hover:scale-105 transition-all
                    self-start
                  "
                >
                  {t("home.delivery.button")}
                </Button>

                {/* FEATURES */}
                <div className="flex flex-wrap gap-6 pt-3">
                  <div className="flex items-center gap-2  text-white/80">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-xxs sm:text-sm">
                      {t("home.delivery.features.tracking")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2  text-white/80">
                    <span className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span className="text-xxs sm:text-sm">
                      {t("home.delivery.features.packaging")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-white/80">
                    <span className="w-2 h-2 bg-purple-400 rounded-full" />
                    <span className="text-xxs sm:text-sm">
                      {t("home.delivery.features.contact_free")}
                    </span>
                  </div>
                </div>
              </div>

              {/* ================= IMAGE ================= */}
              <div
                className="
                  col-span-12 lg:col-span-5
                  relative flex items-center
                  justify-center
                  lg:justify-end
                 
                "
              >
                <div
                  className="
                    relative z-20
                    lg:absolute
                     lg:-top-6
                    lg:rtl:-left-4
                  "
                >
                  {/* Glow */}
                  <div className="absolute inset-0 bg-linear-to-br from-yellow-400/30 to-orange-400/30 rounded-full blur-2xl scale-110" />

                  {/* Image */}
                  <Image
                    src="/images/delivery-boy-blue.png"
                    alt="Delivery person"
                    radius="lg"
                    className="relative z-10 w-56 h-60 sm:w-72 sm:h-80 lg:w-80 lg:h-96 object-cover drop-shadow-2xl"
                    classNames={{
                      img: "hover:scale-105 transition-transform duration-500 rtl:-scale-x-100 rtl:hover:-scale-x-105",
                    }}
                  />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
};

export default DeliveryBanner;
