import { useEffect, useRef } from "react";
import { Product } from "@/types/ApiResponse";
import { useSettings } from "@/contexts/SettingsContext";
import { adTrackingService } from "@/services/adTrackingService";

export const useAdTracking = (product: Product | null | undefined) => {
  const { advertisementSettings } = useSettings();
  const elementRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTrackedImpression = useRef(false);
  const lastTrackingKeyRef = useRef<string | null>(null);

  const trackingKey =
    product?.campaign_id && product?.visitor_key
      ? `${product.campaign_id}:${product.visitor_key}`
      : null;

  useEffect(() => {
    if (lastTrackingKeyRef.current !== trackingKey) {
      hasTrackedImpression.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      lastTrackingKeyRef.current = trackingKey;
    }

    if (
      !product?.is_sponsored ||
      !product?.campaign_id ||
      !product?.visitor_key ||
      !advertisementSettings?.featureEnabled ||
      hasTrackedImpression.current
    ) {
      return;
    }

    const visibilityPct = (advertisementSettings.adImpressionVisibilityPct || 50) / 100;
    const visibilityMs = advertisementSettings.adImpressionVisibilityMs || 1000;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= visibilityPct) {
            // Start timer if not already started
            if (!timerRef.current) {
              timerRef.current = setTimeout(() => {
                // Count impression
                adTrackingService.trackImpression({
                  campaign_id: product.campaign_id!,
                  visitor_key: product.visitor_key!,
                  timestamp: new Date().toISOString(),
                });
                hasTrackedImpression.current = true;
                observer.disconnect();
              }, visibilityMs);
            }
          } else {
            // Cancel timer if element becomes less visible than threshold
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
          }
        });
      },
      {
        threshold: [0, visibilityPct, 1], // Added 0 and 1 for better precision
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [product, advertisementSettings, trackingKey]);

  const handleAdClick = () => {
    if (product?.is_sponsored && product?.campaign_id && product?.visitor_key) {
      adTrackingService.trackClick({
        campaign_id: product.campaign_id,
        visitor_key: product.visitor_key,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return { elementRef, handleAdClick };
};
