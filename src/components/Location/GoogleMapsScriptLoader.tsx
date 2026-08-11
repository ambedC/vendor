import Script from "next/script";
import type { Settings } from "@/types/ApiResponse";
import { getWebSettings } from "@/helpers/getters";

type Props = {
  settings: Settings | null;
};

export default function GoogleMapsHeadScript({ settings }: Props) {
  const webSettings = getWebSettings(settings as Settings);

  const googleMapKey = webSettings?.googleMapKey;

  if (!googleMapKey) return null;
  // Check if already loaded
  if (typeof window !== "undefined" && window.google && window.google.maps) {
    return null;
  }

  const scriptContent = `
    (function() {
      // Check if already loaded
      if (window.google && window.google.maps) {
        return;
      }
      
      // Mark as loading
      window.googleMapsLoading = true;
      
      (g => {
        var h, a, k, p = "The Google Maps JavaScript API", c = "google", 
            l = "importLibrary", q = "__ib__", m = document, b = window;
        b = b[c] || (b[c] = {});
        var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, 
            u = () => h || (h = new Promise(async (f, n) => {
              await (a = m.createElement("script"));
              e.set("libraries", [...r] + "");
              for (k in g) e.set(
                k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), 
                g[k]
              );
              e.set("callback", c + ".maps." + q);
              a.src = \`https://maps.\${c}apis.com/maps/api/js?\` + e;
              d[q] = f;
              a.onerror = () => h = n(Error(p + " could not load."));
              a.nonce = m.querySelector("script[nonce]")?.nonce || "";
              m.head.append(a);
            }));
        d[l] ? console.warn(p + " only loads once. Ignoring:", g) 
             : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n));
      })({
        key: "${googleMapKey}",
        v: "weekly"
      });
    })();
  `;

  return (
    <Script
      id="google-maps-dynamic-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  );
}
