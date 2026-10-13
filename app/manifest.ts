import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lagun · Bienestar emocional",
    short_name: "Lagun",
    description: "Tu rincón de bienestar emocional. Para cuando lo necesites, sin presión.",
    lang: "es",
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
      { name: "Ayuda urgente", url: "/ayuda" },
      { name: "Hablar con Lagun", url: "/chat" },
      { name: "Jarra de emociones", url: "/jarra" },
    ],
  };
}
