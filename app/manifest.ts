import type { MetadataRoute } from "next";
import { getI18n } from "@/lib/i18n/server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { t, locale } = await getI18n();
  return {
    name: "Lagun",
    short_name: "Lagun",
    description: t.meta.description,
    lang: locale,
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#14B8A6",
    categories: ["health", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcuts: [
      { name: t.meta.titles.help, url: "/ayuda" },
      { name: t.meta.titles.chat, url: "/chat" },
      { name: t.meta.titles.jar, url: "/jarra" },
    ],
  };
}
