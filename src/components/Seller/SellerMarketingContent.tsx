import React from "react";
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
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { Divider } from "@heroui/react";

export default function SellerMarketingContent() {
  const { webSettings } = useSettings();
  const benefits = [
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Free Delivery Network",
      description:
        "We provide trained riders - no need to worry about logistics or delivery costs",
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Zero Setup Cost",
      description:
        "Start selling immediately with no registration fees or hidden charges",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "10-30 Min Delivery",
      description:
        "Hyperlocal delivery ensures your customers get orders super fast",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Business Insights",
      description: "Real-time analytics and sales reports at your fingertips",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Payments",
      description:
        "Fast and secure payment settlements directly to your account",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Growing Customer Base",
      description: "Access thousands of customers in your locality instantly",
    },
  ];

  const stats = [
    { number: "10,000+", label: "Active Sellers" },
    { number: "50,000+", label: "Daily Orders" },
    { number: "100+", label: "Cities" },
    { number: "15 Min", label: "Avg Delivery" },
  ];

  const features = [
    {
      icon: <Package className="w-5 h-5" />,
      text: "No inventory management hassle",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      text: "Grow your revenue by 3x",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      text: "List products in minutes",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      text: "100% secure platform",
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 text-white py-10 md:py-12 px-4 rounded-lg">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="inline-block bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-xs md:text-sm font-semibold mb-3">
                🎉 Join 10,000+ Successful Sellers
              </div>
              <h1 className="text-2xl md:text-4xl font-bold mb-3 leading-tight">
                Grow Your Business with HyperLocal Delivery
              </h1>
              <p className="text-base md:text-lg mb-4 text-blue-50">
                We handle delivery, you handle growth. Start selling in your
                locality within 24 hours!
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1.5 rounded-lg"
                  >
                    <div className="text-green-300">{feature.icon}</div>
                    <span className="text-xs md:text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-6 border border-white/30">
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-2xl font-bold text-yellow-300 mb-1">
                        {stat.number}
                      </div>
                      <div className="text-xs text-blue-100">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats for Mobile */}
      <div className="md:hidden bg-white dark:bg-gray-800 py-4 px-4 rounded-lg mt-4">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                {stat.number}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-10 md:py-12 px-4">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            Why Sellers Choose Us
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
            Focus on selling great products while we handle everything else
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {benefits.map((benefit, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-1"
            >
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white mb-3">
                {benefit.icon}
              </div>
              <h3 className="text-base md:text-lg font-semibold mb-1.5 text-gray-900 dark:text-gray-100">
                {benefit.title}
              </h3>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="py-10 md:py-12 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
            Start Selling in 3 Simple Steps
          </h2>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                step: "1",
                title: "Register & Verify",
                desc: "Fill the registration form below. We'll verify your documents within 24 hours",
                icon: <Users className="w-5 h-5" />,
              },
              {
                step: "2",
                title: "List Your Products",
                desc: "Add your products with images and prices. Our team will help you get started",
                icon: <Package className="w-5 h-5" />,
              },
              {
                step: "3",
                title: "Start Selling",
                desc: "Receive orders and we'll deliver them using our rider network. That's it!",
                icon: <Truck className="w-5 h-5" />,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-md relative border border-gray-200 dark:border-gray-700"
              >
                <div className="absolute -top-3 -left-3 w-10 h-10 bg-linear-to-br from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                  {item.step}
                </div>
                <div className="mt-2">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-base md:text-lg mb-1.5 text-gray-900 dark:text-gray-100">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Special Highlight - No Delivery Worries */}
      <div className="py-10 md:py-12 px-4">
        <div className="max-w-4xl mx-auto bg-linear-to-r from-green-500 to-emerald-600 rounded-xl p-6 md:p-8 text-white text-center shadow-xl">
          <Truck className="w-12 h-12 mx-auto mb-3" />
          <h2 className="text-xl md:text-2xl font-bold mb-3">
            {"🚀 We Provide Riders - You Don't Need Your Own!"}
          </h2>
          <p className="text-sm md:text-base mb-4 text-green-50">
            This is our biggest advantage! No need to hire riders, manage
            delivery logistics, or worry about delivery costs. Our trained
            professional riders will pick up orders from your store and deliver
            them to customers.
          </p>
          <div className="grid md:grid-cols-3 gap-3 text-left">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <CheckCircle className="w-5 h-5 mb-1.5 text-green-200" />
              <p className="font-semibold mb-0.5 text-sm">Free Rider Service</p>
              <p className="text-xs text-green-100">
                No delivery charges for you
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <CheckCircle className="w-5 h-5 mb-1.5 text-green-200" />
              <p className="font-semibold mb-0.5 text-sm">
                Trained Professionals
              </p>
              <p className="text-xs text-green-100">
                Polite & efficient riders
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <CheckCircle className="w-5 h-5 mb-1.5 text-green-200" />
              <p className="font-semibold mb-0.5 text-sm">Real-time Tracking</p>
              <p className="text-xs text-green-100">Monitor every delivery</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonial Section */}
      <div className="py-10 md:py-12 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
            What Our Sellers Say
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                name: "Rajesh Kumar",
                business: "Grocery Store Owner",
                text: "My sales increased by 200% in just 2 months. The rider service is excellent!",
                rating: 5,
              },
              {
                name: "Priya Patel",
                business: "Bakery Owner",
                text: "No more worrying about delivery. I can focus on making great products.",
                rating: 5,
              },
              {
                name: "Mohammed Ali",
                business: "Electronics Shop",
                text: "The payment system is fast and transparent. Highly recommend!",
                rating: 5,
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-md border border-gray-200 dark:border-gray-700"
              >
                <div className="flex gap-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-3 italic text-sm">
                  {testimonial.text}
                </p>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {testimonial.business}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Before Form */}
      <div className="py-10 px-4">
        <div className="max-w-3xl mx-auto text-center bg-linear-to-r from-blue-600 to-purple-600 rounded-xl p-6 md:p-8 text-white shadow-xl">
          <h2 className="text-xl md:text-2xl font-bold mb-3">
            Ready to Start Your Success Story?
          </h2>
          <p className="text-sm md:text-base mb-4 text-blue-50">
            Join thousands of sellers already growing their business with us.
            Fill the form below to get started!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{webSettings?.supportNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>{webSettings?.supportEmail}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider before form */}
      <Divider className="my-6" />

      <h2 className="text-lg md:text-xl mb-6 w-full text-center font-bold text-gray-900 dark:text-gray-100">
        Register Your Business With Us!
      </h2>
    </div>
  );
}
