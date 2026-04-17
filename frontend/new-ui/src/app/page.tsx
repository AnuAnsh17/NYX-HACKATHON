import { Hero } from "@/components/sections/Hero";
import { ChainViewer } from "@/components/sections/ChainViewer";
import { VerifyPanel } from "@/components/sections/VerifyPanel";
import { EventLog } from "@/components/sections/EventLog";

export default function Home() {
  return (
    <main>
      <Hero />
      <ChainViewer />
      <VerifyPanel />
      <EventLog />
    </main>
  );
}
