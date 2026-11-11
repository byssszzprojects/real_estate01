import { Collage } from "@/components/sections/Collage";
import { FullView } from "@/components/sections/FullView";
import { FogTransition } from "@/components/sections/FogTransition";
import { IntroSequence } from "@/components/sections/IntroSequence";
import { FullViewStudy } from "@/components/sections/FullViewStudy";
import { Quiet } from "@/components/sections/Quiet";
import { Stay } from "@/components/sections/Stay";
import { StepInside } from "@/components/sections/StepInside";
import { Study } from "@/components/sections/Study";
import { Tour } from "@/components/sections/Tour";
import { MotionSystem } from "@/components/site/MotionSystem";
import { RevealObserver } from "@/components/site/RevealObserver";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "ZARA",
  description:
    "A design-led residential studio on the Konkan coast: sales, leasing, private viewings and property care.",
  url: "https://zarastudio.in",
  areaServed: "Goa, India",
  address: {
    "@type": "PostalAddress",
    streetAddress: "12 Badem Road, Assagao",
    addressLocality: "Assagao",
    addressRegion: "Goa",
    postalCode: "403507",
    addressCountry: "IN",
  },
  email: "hello@zarastudio.in",
  telephone: "+91 98201 47386",
  openingHours: "Mo-Sa 09:00-18:00",
};

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <IntroSequence />
        <Collage />
        <FullView />
        <FullViewStudy />
        <FogTransition />
        <Study />
        <Quiet />
        <Stay />
        <Tour />
        <StepInside />
      </main>

      <SiteFooter />
      <RevealObserver />
      <MotionSystem />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
