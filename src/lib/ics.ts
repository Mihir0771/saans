import type { MemberPlanResult } from "@/engine/plan";
import type { BestWorstWindows, VentilationWindowResult } from "@/engine/windows";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function icsStamp(date: Date, hour: number, minute = 0): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}${m}${d}T${pad2(hour)}${pad2(minute)}00`;
}

function formatEvent(
  now: Date,
  idx: number,
  ev: { startH: number; startM: number; endH: number; endM: number; title: string; desc: string },
): string[] {
  return [
    "BEGIN:VEVENT",
    `UID:saans-${idx}-${now.getTime()}@saans.local`,
    `DTSTAMP:${icsStamp(now, now.getHours(), now.getMinutes())}`,
    `DTSTART:${icsStamp(now, ev.startH, ev.startM)}`,
    `DTEND:${icsStamp(now, ev.endH, ev.endM)}`,
    `SUMMARY:${ev.title}`,
    `DESCRIPTION:${ev.desc}`,
    "END:VEVENT",
  ];
}

export function buildPlanIcs(input: {
  memberName: string;
  cityName: string;
  plan: MemberPlanResult;
  windows: BestWorstWindows;
  ventilation: VentilationWindowResult;
}): string {
  const now = new Date();
  const events = [
    {
      startH: input.windows.worstStartHour,
      startM: 0,
      endH: (input.windows.worstStartHour + 2) % 24,
      endM: 0,
      title: `Saans: Keep windows shut (${input.cityName})`,
      desc: `Peak PM2.5 window (~${input.windows.worstMeanPm25} µg/m³). Use N95 in transit if stepping out.`,
    },
    {
      startH: input.windows.bestStartHour,
      startM: 0,
      endH: (input.windows.bestStartHour + 1) % 24,
      endM: 0,
      title: `Saans: Cleaner outdoor window (${input.memberName})`,
      desc: `Best daily outdoor window (~${input.windows.bestMeanPm25} µg/m³). Target Breath Budget: ${input.plan.plan.ratio.toFixed(1)}× WHO.`,
    },
  ];
  if (input.ventilation.hasWindow && input.ventilation.startHour !== undefined) {
    events.push({
      startH: input.ventilation.startHour,
      startM: 0,
      endH: input.ventilation.startHour,
      endM: input.ventilation.durationMin,
      title: "Saans: 20-min Smart Ventilation Window",
      desc: `Open windows for ${input.ventilation.durationMin} minutes to flush indoor PM2.5.`,
    });
  }
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Saans//BreathBudget//EN",
    ...events.flatMap((e, i) => formatEvent(now, i, e)),
    "END:VCALENDAR",
  ].join("\r\n");
}
