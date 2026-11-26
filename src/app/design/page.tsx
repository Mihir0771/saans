import Link from "next/link";
import { AQIChip } from "@/components/ui/AQIChip";
import { BreathGauge } from "@/components/ui/BreathGauge";
import { Banner, Button, Card, StatTile } from "@/components/ui/Primitives";
import type { CpcbBand } from "@/engine/schema";

const BANDS: Array<{ band: CpcbBand; sample: number }> = [
  { band: "good", sample: 32 },
  { band: "sat", sample: 78 },
  { band: "mod", sample: 155 },
  { band: "poor", sample: 245 },
  { band: "vpoor", sample: 342 },
  { band: "severe", sample: 440 },
];

function ShowcaseCards() {
  return (
    <>
      <Card>
        <h2 className="mb-3 text-lg font-bold text-ink">Buttons & Stats</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary">Primary Action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost Link</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatTile value="14.2×" label="typical day" />
          <StatTile value="5.1×" label="with plan" />
          <StatTile value="−64%" label="inhaled PM2.5" tone="save" />
        </div>
      </Card>
      <Card>
        <h2 className="mb-3 text-lg font-bold text-ink">
          CPCB AQI Chips (6 bands + unique shapes)
        </h2>
        <div className="flex flex-wrap gap-2">
          {BANDS.map((b) => (
            <AQIChip key={b.band} aqi={b.sample} band={b.band} locale="en" />
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="mb-2 text-lg font-bold text-ink">Breath Budget Gauge</h2>
        <BreathGauge
          memberName="Aarav"
          typicalRatio={14.2}
          planRatio={5.1}
          savedPct={64}
          locale="en"
        />
      </Card>
    </>
  );
}

export default function DesignShowcasePage() {
  return (
    <main id="main-content" className="mx-auto grid max-w-3xl gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">Saans Design System Showcase</h1>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center px-3 font-bold text-brand-ink underline"
        >
          Back to app
        </Link>
      </div>
      <Banner
        label="Demo."
        text="Visual regression reference for all locked tokens and components."
      />
      <ShowcaseCards />
    </main>
  );
}
