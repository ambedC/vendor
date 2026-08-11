import {
  CheckCircle,
  Users,
  Package,
  Clock,
  Truck,
  DollarSign,
  BarChart3,
  Star,
  Phone,
  Mail,
  Shield,
  Zap,
  ArrowRight,
  Target,
  Award,
  Sparkles,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { Button, Image } from "@heroui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function EnhancedSellerMarketing() {
  const { webSettings } = useSettings();
  const { t } = useTranslation();

  const benefits = [
    {
      icon: <Truck className="w-5 h-5" />,
      title: t(
        "pages.enhancedSellerMarketing.benefits.items.deliveryIntegrations.title"
      ),
      description: t(
        "pages.enhancedSellerMarketing.benefits.items.deliveryIntegrations.desc"
      ),
      metric: t(
        "pages.enhancedSellerMarketing.benefits.items.deliveryIntegrations.metric"
      ),
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      title: t(
        "pages.enhancedSellerMarketing.benefits.items.flexibleOnboarding.title"
      ),
      description: t(
        "pages.enhancedSellerMarketing.benefits.items.flexibleOnboarding.desc"
      ),
      metric: t(
        "pages.enhancedSellerMarketing.benefits.items.flexibleOnboarding.metric"
      ),
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: t(
        "pages.enhancedSellerMarketing.benefits.items.localFulfillment.title"
      ),
      description: t(
        "pages.enhancedSellerMarketing.benefits.items.localFulfillment.desc"
      ),
      metric: t(
        "pages.enhancedSellerMarketing.benefits.items.localFulfillment.metric"
      ),
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: t(
        "pages.enhancedSellerMarketing.benefits.items.businessInsights.title"
      ),
      description: t(
        "pages.enhancedSellerMarketing.benefits.items.businessInsights.desc"
      ),
      metric: t(
        "pages.enhancedSellerMarketing.benefits.items.businessInsights.metric"
      ),
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: t(
        "pages.enhancedSellerMarketing.benefits.items.trustedPayments.title"
      ),
      description: t(
        "pages.enhancedSellerMarketing.benefits.items.trustedPayments.desc"
      ),
      metric: t(
        "pages.enhancedSellerMarketing.benefits.items.trustedPayments.metric"
      ),
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: t(
        "pages.enhancedSellerMarketing.benefits.items.customerReach.title"
      ),
      description: t(
        "pages.enhancedSellerMarketing.benefits.items.customerReach.desc"
      ),
      metric: t(
        "pages.enhancedSellerMarketing.benefits.items.customerReach.metric"
      ),
    },
  ];

  const growthMetrics = [
    {
      label: t("pages.enhancedSellerMarketing.about.metrics.marketingGrowth"),
      value: 85,
      color: "bg-primary",
    },
    {
      label: t(
        "pages.enhancedSellerMarketing.about.metrics.creativityInnovation"
      ),
      value: 90,
      color: "bg-blue-500",
    },
    {
      label: t(
        "pages.enhancedSellerMarketing.about.metrics.businessFinanceMgmt"
      ),
      value: 95,
      color: "bg-purple-500",
    },
  ];

  const steps = [
    {
      step: "1",
      title: t("pages.enhancedSellerMarketing.how.steps.register.title"),
      desc: t("pages.enhancedSellerMarketing.how.steps.register.desc"),
      icon: <Users className="w-5 h-5" />,
    },
    {
      step: "2",
      title: t("pages.enhancedSellerMarketing.how.steps.list.title"),
      desc: t("pages.enhancedSellerMarketing.how.steps.list.desc"),
      icon: <Package className="w-5 h-5" />,
    },
    {
      step: "3",
      title: t("pages.enhancedSellerMarketing.how.steps.start.title"),
      desc: t("pages.enhancedSellerMarketing.how.steps.start.desc"),
      icon: <Truck className="w-5 h-5" />,
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div
        className="
    relative overflow-hidden rounded-md
    bg-[url('/images/seller-banner.png')]
    bg-cover bg-center bg-no-repeat
  "
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black opacity-5 rounded-full -ml-48 -mb-48" />
        <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-14">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-yellow-400 px-3 py-1.5 text-white rounded-full text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                {t("pages.enhancedSellerMarketing.hero.badge")}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white">
                {t("pages.enhancedSellerMarketing.hero.titleMain")}
                <span className="block text-yellow-300 mt-1">
                  {t("pages.enhancedSellerMarketing.hero.titleAccent")}
                </span>
              </h1>

              <p className="text-base text-primary-50 leading-relaxed">
                {t("pages.enhancedSellerMarketing.hero.description")}
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="flat"
                  radius="sm"
                  size="md"
                  className="bg-white text-black font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  endContent={<ArrowRight className="w-4 h-4" />}
                  onPress={() => {
                    const element = document.getElementById("seller-register");
                    const offset = -80;
                    if (element) {
                      const top =
                        element.getBoundingClientRect().top +
                        window.scrollY +
                        offset;
                      window.scrollTo({ top, behavior: "smooth" });
                    }
                  }}
                >
                  {t("pages.enhancedSellerMarketing.hero.registerNow")}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-opacity-10 backdrop-blur-sm border-y border-white border-opacity-20 py-2.5 overflow-hidden">
          <div className="flex gap-8 animate-marquee whitespace-nowrap">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-8 items-center text-white">
                <span className="flex items-center gap-2 text-xs font-medium">
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  {t("pages.enhancedSellerMarketing.marquee.contentMarketing")}
                </span>
                <span className="flex items-center gap-2 text-xs font-medium">
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  {t(
                    "pages.enhancedSellerMarketing.marquee.socialMediaMarketing"
                  )}
                </span>
                <span className="flex items-center gap-2 text-xs font-medium">
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  {t("pages.enhancedSellerMarketing.marquee.seo")}
                </span>
                <span className="flex items-center gap-2 text-xs font-medium">
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  {t("pages.enhancedSellerMarketing.marquee.businessGrowth")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-xs font-semibold">
              <Target className="w-3.5 h-3.5" />
              {t("pages.enhancedSellerMarketing.about.badge")}
            </div>

            <h2 className="text-2xl md:text-3xl font-bold leading-tight">
              {t("pages.enhancedSellerMarketing.about.titleMain")}
              <span className="block text-primary mt-1">
                {t("pages.enhancedSellerMarketing.about.titleAccent")}
              </span>
            </h2>

            <div className="grid grid-cols-2 gap-3 pt-4">
              {/* IMG 1 — slightly up */}
              <div className="bg-linear-to-br from-gray-200 to-gray-300 rounded-lg aspect-square flex items-center justify-center overflow-hidden -mt-4">
                <Image
                  src="/images/Hyperlocal-2.jpg"
                  alt="About Image 1"
                  className="w-full h-full object-cover"
                  removeWrapper
                />
              </div>

              {/* IMG 2 — slightly down */}
              <div className="bg-linear-to-br from-gray-200 to-gray-300 rounded-lg aspect-square flex items-center justify-center overflow-hidden mt-4">
                <Image
                  src="/images/Hyperlocal-1.jpg"
                  alt="About Image 2"
                  className="w-full h-full object-cover"
                  removeWrapper
                />
              </div>
            </div>
          </div>

          <div className="space-y-5 md:mt-10">
            <p className="text-sm leading-relaxed text-foreground/50">
              {t("pages.enhancedSellerMarketing.about.description")}
            </p>

            <div className="space-y-3">
              {growthMetrics.map((metric, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-foreground/50">
                      {metric.label}
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {metric.value}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${metric.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              color="primary"
              variant="solid"
              radius="sm"
              size="md"
              as={Link}
              href="/about-us"
              className="font-semibold shadow-md hover:shadow-lg transition-all max-w-32 flex items-center gap-2 px-5 py-2.5 text-white"
              endContent={<ArrowRight className="w-4 h-4" />}
            >
              {t("pages.enhancedSellerMarketing.about.button")}
            </Button>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-xl text-xs font-semibold mb-3 border border-primary-100">
            <Award className="w-3.5 h-3.5 stroke-2" />
            {t("pages.enhancedSellerMarketing.benefits.badge")}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            {t("pages.enhancedSellerMarketing.benefits.title")}
          </h2>
          <p className="text-sm max-w-2xl mx-auto text-foreground/50">
            {t("pages.enhancedSellerMarketing.benefits.description")}
          </p>
        </div>

        <div className="grid w-full sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((benefit, idx) => (
            <div
              key={idx}
              className="h-full group bg-linear-to-br from-white to-gray-50 rounded-2xl p-5 border border-gray-200 hover:border-primary-400 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-400/20 blur-xl rounded-full group-hover:bg-primary-400/30 transition-all" />
                  <div className="relative w-11 h-11 bg-linear-to-br from-primary to-primary-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-md">
                    {benefit.icon}
                  </div>
                </div>
                <span className="bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-primary-100">
                  {benefit.metric}
                </span>
              </div>
              <h3 className="text-base font-bold mb-1.5 text-gray-900">
                {benefit.title}
              </h3>
              <p className="text-xs text-foreground/50 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {t("pages.enhancedSellerMarketing.how.title")}
            </h2>
            <p className="text-sm text-foreground/50">
              {t("pages.enhancedSellerMarketing.how.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative z-20">
            {steps.map((item, idx) => (
              <div key={idx} className="relative">
                <div className="h-full rounded-2xl p-5 border border-gray-200 hover:border-primary-400 transition-all hover:shadow-xl bg-white flex flex-col">
                  <div className="absolute -top-4 left-5 w-11 h-11 bg-linear-to-br from-primary-600 to-primary-500 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg border-2 border-white">
                    {item.step}
                  </div>

                  <div className="mt-6">
                    <div className="relative mb-3 inline-block">
                      <div className="absolute inset-0 bg-primary-400/20 blur-xl rounded-full" />
                      <div className="relative w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary border border-primary-100">
                        {item.icon}
                      </div>
                    </div>
                    <h3 className="font-bold text-base mb-1.5">{item.title}</h3>
                    <p className="text-xs text-foreground/50 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fulfillment Options */}
      <div className="py-12 px-4 hidden">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden bg-linear-to-r from-primary-600 via-primary-500 to-primary-600 rounded-2xl p-6 md:p-10 text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full -mr-24 -mt-24" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-5 rounded-full -ml-32 -mb-32" />

            <div className="relative text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                {t("pages.enhancedSellerMarketing.fulfillment.title")}
              </h2>
              <p className="text-sm text-primary-50 max-w-3xl mx-auto">
                {t("pages.enhancedSellerMarketing.fulfillment.desc")}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-3 relative">
              {[
                {
                  icon: <CheckCircle className="w-5 h-5 stroke-2" />,
                  title: t(
                    "pages.enhancedSellerMarketing.fulfillment.items.partnerIntegrations.title"
                  ),
                  desc: t(
                    "pages.enhancedSellerMarketing.fulfillment.items.partnerIntegrations.desc"
                  ),
                },
                {
                  icon: <CheckCircle className="w-5 h-5 stroke-2" />,
                  title: t(
                    "pages.enhancedSellerMarketing.fulfillment.items.realtimeTracking.title"
                  ),
                  desc: t(
                    "pages.enhancedSellerMarketing.fulfillment.items.realtimeTracking.desc"
                  ),
                },
                {
                  icon: <CheckCircle className="w-5 h-5 stroke-2" />,
                  title: t(
                    "pages.enhancedSellerMarketing.fulfillment.items.policies.title"
                  ),
                  desc: t(
                    "pages.enhancedSellerMarketing.fulfillment.items.policies.desc"
                  ),
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all"
                >
                  <div className="text-white mb-2">{item.icon}</div>
                  <p className="font-bold mb-0.5 text-sm text-white">
                    {item.title}
                  </p>
                  <p className="text-xs text-primary-100">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-12 px-4 bg-content1">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {t("pages.enhancedSellerMarketing.testimonials.title")}
            </h2>
            <p className="text-sm text-foreground/50">
              {t("pages.enhancedSellerMarketing.testimonials.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: t(
                  "pages.enhancedSellerMarketing.testimonials.items.localSeller.name"
                ),
                business: t(
                  "pages.enhancedSellerMarketing.testimonials.items.localSeller.business"
                ),
                text: t(
                  "pages.enhancedSellerMarketing.testimonials.items.localSeller.text"
                ),
                rating: 5,
              },
              {
                name: t(
                  "pages.enhancedSellerMarketing.testimonials.items.bakeryOwner.name"
                ),
                business: t(
                  "pages.enhancedSellerMarketing.testimonials.items.bakeryOwner.business"
                ),
                text: t(
                  "pages.enhancedSellerMarketing.testimonials.items.bakeryOwner.text"
                ),
                rating: 5,
              },
              {
                name: t(
                  "pages.enhancedSellerMarketing.testimonials.items.electronicsShop.name"
                ),
                business: t(
                  "pages.enhancedSellerMarketing.testimonials.items.electronicsShop.business"
                ),
                text: t(
                  "pages.enhancedSellerMarketing.testimonials.items.electronicsShop.text"
                ),
                rating: 5,
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="h-full bg-linear-to-br from-gray-50 to-white rounded-lg p-5 border-2 border-gray-200 hover:border-primary transition-all hover:shadow-lg flex flex-col justify-between"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-3 italic font-medium text-sm">
                  {testimonial.text}
                </p>
                <div className="flex items-center gap-2.5 pt-3 border-t border-gray-200">
                  <div className="w-9 h-9 bg-linear-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-xs">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {testimonial.business}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden bg-linear-to-r from-primary-600 via-primary-500 to-primary-600 rounded-2xl p-6 md:p-10 text-white text-center shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full -mr-24 -mt-24" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-5 rounded-full -ml-24 -mb-24" />

            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                {t("pages.enhancedSellerMarketing.cta.title")}
              </h2>
              <p className="text-sm text-primary-50 mb-6 max-w-2xl mx-auto">
                {t("pages.enhancedSellerMarketing.cta.desc")}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
                <a
                  href={`tel:${webSettings?.supportNumber}`}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl hover:bg-white/15 transition-all text-sm border border-white/20"
                >
                  <Phone className="w-4 h-4 stroke-2" />
                  <span className="font-medium">
                    {webSettings?.supportNumber}
                  </span>
                </a>
                <a
                  href={`mailto:${webSettings?.supportEmail}`}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl hover:bg-white/15 transition-all text-sm border border-white/20"
                >
                  <Mail className="w-4 h-4 stroke-2" />
                  <span className="font-medium">
                    {webSettings?.supportEmail}
                  </span>
                </a>
              </div>

              <div className="inline-block border-t-2 border-white border-opacity-30 pt-5">
                <h3 className="text-lg font-bold mb-1">
                  {t("pages.enhancedSellerMarketing.cta.registerLabel")}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
