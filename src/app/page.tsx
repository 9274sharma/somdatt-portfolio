import { PageSurface } from "@/components/layout/PageSurface";
import { HeroSection } from "@/components/sections/HeroSection";
import { SelectedWorkSection } from "@/components/sections/SelectedWorkSection";
import { AboutIntroSection } from "@/components/sections/AboutIntroSection";

export default function Home() {
  return (
    <PageSurface>
      <div className="page-shell relative space-y-16 pb-24 pt-12 md:space-y-24 md:pt-16">
        <HeroSection />
        <SelectedWorkSection />
        <AboutIntroSection />
      </div>
    </PageSurface>
  );
}

