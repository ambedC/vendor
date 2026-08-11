import React from "react";
import { Truck, RotateCcw, Shield, Headphones } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
}

const HomeServiceHighlights: React.FC = () => {
  const { webSettings } = useSettings();

  const features: FeatureItem[] = [
    {
      icon: <Truck className="w-5 h-5 sm:w-7 sm:h-7" />,
      title: webSettings?.shippingFeatureSectionTitle || "Fast Shipping",
      description:
        webSettings?.shippingFeatureSectionDescription ||
        "Quick and reliable delivery to your doorstep.",
      enabled:
        webSettings?.shippingFeatureSection === "true" ||
        !!webSettings?.shippingFeatureSectionTitle,
    },
    {
      icon: <RotateCcw className="w-5 h-5 sm:w-7 sm:h-7" />,
      title: webSettings?.returnFeatureSectionTitle || "Easy Returns",
      description:
        webSettings?.returnFeatureSectionDescription ||
        "Hassle-free returns and refunds.",
      enabled:
        webSettings?.returnFeatureSection === "true" ||
        !!webSettings?.returnFeatureSectionTitle,
    },
    {
      icon: <Shield className="w-5 h-5 sm:w-7 sm:h-7" />,
      title: webSettings?.safetySecurityFeatureSectionTitle || "Safe & Secure",
      description:
        webSettings?.safetySecurityFeatureSectionDescription ||
        "Your data and payments are protected.",
      enabled:
        webSettings?.safetySecurityFeatureSection === "true" ||
        !!webSettings?.safetySecurityFeatureSectionTitle,
    },
    {
      icon: <Headphones className="w-5 h-5 sm:w-7 sm:h-7" />,
      title: webSettings?.supportFeatureSectionTitle || "24/7 Support",
      description:
        webSettings?.supportFeatureSectionDescription ||
        "Always here to help you.",
      enabled:
        webSettings?.supportFeatureSection === "true" ||
        !!webSettings?.supportFeatureSectionTitle,
    },
  ];

  const enabledFeatures = features.filter((f) => f.enabled);
  if (enabledFeatures.length === 0) return null;

  return (
    <section className="py-8 sm:py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 z-30">
            {enabledFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center"
              >
                {/* Icon */}
                <div className="w-10 h-10 sm:w-20 sm:h-20 rounded-full dark:bg-primary-500 dark:text-white  flex items-center justify-center text-primary-500 mb-3 sm:mb-6 shadow-md relative z-10">
                  {feature.icon}
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-xl font-semibold sm:font-bold mb-1 sm:mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-xxs sm:text-sm text-foreground/50 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeServiceHighlights;
