import { AdEvent } from "@/types/ApiResponse";
import { trackBulkClicks, trackBulkImpressions } from "@/routes/api";

const STORAGE_KEYS = {
  IMPRESSIONS: "ad_impressions_queue",
  CLICKS: "ad_clicks_queue",
};

class AdTrackingService {
  private impressionQueue: AdEvent[] = [];
  private clickQueue: AdEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  public init() {
    if (this.isInitialized || typeof window === "undefined") return;
    this.loadFromStorage();
    // Schedule flush if there are pending items from storage
    if (this.impressionQueue.length > 0 || this.clickQueue.length > 0) {
      this.scheduleFlush();
    }
    this.isInitialized = true;
  }

  private loadFromStorage() {
    try {
      const storedImpressions = localStorage.getItem(STORAGE_KEYS.IMPRESSIONS);
      const storedClicks = localStorage.getItem(STORAGE_KEYS.CLICKS);

      if (storedImpressions)
        this.impressionQueue = JSON.parse(storedImpressions);
      if (storedClicks) this.clickQueue = JSON.parse(storedClicks);
    } catch (error) {
      console.error("Error loading ad tracking from storage", error);
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        STORAGE_KEYS.IMPRESSIONS,
        JSON.stringify(this.impressionQueue),
      );
      localStorage.setItem(
        STORAGE_KEYS.CLICKS,
        JSON.stringify(this.clickQueue),
      );
    } catch (error) {
      console.error("Error saving ad tracking to storage", error);
    }
  }

  public trackImpression(event: AdEvent) {
    this.init(); // Ensure initialized
    // Deduplicate: only one impression per campaign per session in memory
    const exists = this.impressionQueue.some(
      (e) =>
        e.campaign_id === event.campaign_id &&
        e.visitor_key === event.visitor_key,
    );

    if (!exists) {
      this.impressionQueue.push(event);
      this.saveToStorage();
      
      // Schedule a flush if not already scheduled
      this.scheduleFlush();

      // Fallback: Flush immediately if queue gets very large (e.g. 500)
      if (this.impressionQueue.length >= 500) {
        this.flushImpressions();
      }
    }
  }

  public trackClick(event: AdEvent) {
    this.init(); // Ensure initialized
    this.clickQueue.push(event);
    this.saveToStorage();
    // Flush immediately for clicks to ensure they are tracked before navigation/refresh
    this.flushClicks();
  }

  private async flushImpressions() {
    if (this.impressionQueue.length === 0) return;

    // Send in batches of 500
    const events = this.impressionQueue.slice(0, 500);
    const res = await trackBulkImpressions(events);

    if (res.success) {
      this.impressionQueue = this.impressionQueue.slice(events.length);
      this.saveToStorage();
      
      // If there are still more impressions, schedule another flush soon
      if (this.impressionQueue.length > 0) {
        setTimeout(() => this.flushImpressions(), 1000);
      }
    }
  }

  private async flushClicks() {
    if (this.clickQueue.length === 0) return;

    const events = this.clickQueue.slice(0, 100);
    const res = await trackBulkClicks(events);

    if (res.success) {
      this.clickQueue = this.clickQueue.slice(events.length);
      this.saveToStorage();
    }
  }

  private scheduleFlush() {
    if (this.flushTimer || typeof window === "undefined") return;

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flushImpressions();
      this.flushClicks();
      
      // If there are still items (e.g. more than one batch or new items added), schedule next
      if (this.impressionQueue.length > 0 || this.clickQueue.length > 0) {
        this.scheduleFlush();
      }
    }, 60000); // 1 minute interval
  }

  public stopFlushTimer() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

export const adTrackingService = new AdTrackingService();
