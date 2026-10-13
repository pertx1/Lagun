import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { HelpButton } from "@/components/ui/HelpButton";
import { ServiceWorkerRegister } from "@/components/ui/ServiceWorkerRegister";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Lagun", template: "%s · Lagun" },
  description: "Lagun: tu rincón de bienestar emocional. Para cuando lo necesites, sin presión.",
  applicationName: "Lagun",
  appleWebApp: { capable: true, title: "Lagun", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Aplica el tema antes de pintar para evitar parpadeos. */
const themeScript = `(function(){try{var t=localStorage.getItem('lagun-theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${nunito.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <a href="#main" className="sr-only-focusable fixed left-3 top-3 z-50 rounded-xl bg-primary px-4 py-2 text-on-primary">
          Saltar al contenido
        </a>
        <HelpButton />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
