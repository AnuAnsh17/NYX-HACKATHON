import { Hero }         from "@/components/sections/Hero";
import { HowItWorks }   from "@/components/sections/HowItWorks";
import { ChainViewer }  from "@/components/sections/ChainViewer";
import { VerifyPanel }  from "@/components/sections/VerifyPanel";
import { EventLog }     from "@/components/sections/EventLog";
import { OfflineBanner } from "@/components/layout/OfflineBanner";

export default function Home() {
  return (
    <main>
      <OfflineBanner />
      <Hero />
      <HowItWorks />
      <ChainViewer />
      <VerifyPanel />
      <EventLog />
    </main>
  );
}
