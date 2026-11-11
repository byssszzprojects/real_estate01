import type { Metadata, Viewport } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import { Preloader } from "@/components/site/Preloader";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import "./globals.css";

const sans = localFont({
  src: "../public/fonts/Familjen-Grotesk-400-700.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-familjen",
});

const serif = localFont({
  src: [
    {
      path: "../public/fonts/Instrument-Serif-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Instrument-Serif-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-instrument",
});

const title = "ZARA — Contemporary Architecture & Residences";
const description =
  "A quieter way to live. Contemporary residences shaped by architecture, light and material on the Konkan coast.";

export const metadata: Metadata = {
  metadataBase: new URL("https://zarastudio.in"),
  title,
  description,
  applicationName: "ZARA",
  keywords: [
    "contemporary architecture",
    "residences",
    "Goa",
    "architectural homes",
    "design-led property",
  ],
  icons: {
    icon: "/icons/favicon.ico",
  },
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "ZARA",
    images: [
      {
        url: "/images/og.jpg",
        width: 1200,
        height: 630,
        alt: "A contemporary residence at golden hour, framed by trees.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/images/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#EDE6D6",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${serif.variable} motion-pending`}
    >
      <head>
        <link
          rel="preload"
          as="image"
          href="/images/nightSide.webp"
          fetchPriority="high"
        />
        <Script id="zara-preloader-skip" strategy="beforeInteractive">
          {`try{if(sessionStorage.getItem("zara:preloader-seen")==="1"&&new URLSearchParams(location.search).get("preloader")!=="1"){document.documentElement.dataset.preloaderSkip="true"}}catch(e){}`}
        </Script>
      </head>
      <body>
        <Preloader />
        <a
          href="#main"
          className="sr-only z-[100] rounded-full bg-[#ede6d6] px-6 py-3 text-[#2a2725] focus:not-sr-only focus:fixed focus:left-5 focus:top-5"
        >
          Skip to content
        </a>
        {children}
        <SmoothScroll />
        <noscript>
          <style>{`[data-reveal]{opacity:1 !important;transform:none !important}.preloader{display:none !important}.motion-pending .hero-intro{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
      </body>
    </html>
  );
}
