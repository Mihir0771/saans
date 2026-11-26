import type { Locale } from "@/engine/schema";

export interface WalkthroughScene {
  id: string;
  image: string;
  durationSec: number;
  focusX: number;
  focusY: number;
  focusW: number;
  focusH: number;
  titleEn: string;
  titleHi: string;
  captionEn: string;
  captionHi: string;
}

export const WALKTHROUGH_SCENES: WalkthroughScene[] = [
  {
    id: "today",
    image: "/tour/today.jpg",
    durationSec: 8,
    focusX: 0.24,
    focusY: 0.36,
    focusW: 0.24,
    focusH: 0.28,
    titleEn: "1. Why AQI 340 Fails Families — & The Breath Budget",
    titleHi: "1. सिर्फ़ AQI काफ़ी क्यों नहीं — और आपका श्वास बजट",
    captionEn:
      "Headline AQI ignores who is breathing the air. Saans compares each family member's 24-hour PM2.5 dose to the WHO 1× guideline and lets you click any hour on the forecast strip.",
    captionHi:
      "सामान्य AQI यह नहीं बताता कि घर के हर सदस्य पर क्या असर है। सांस बच्चे, बुज़ुर्ग और यात्री की 24-घंटे की खुराक को WHO 1× सीमा से तुलना करके दिखाता है।",
  },
  {
    id: "plan",
    image: "/tour/plan.jpg",
    durationSec: 8,
    focusX: 0.45,
    focusY: 0.45,
    focusW: 0.46,
    focusH: 0.36,
    titleEn: "2. Plan: Your Day Two Ways & Shapley Waterfall",
    titleHi: "2. योजना: दो रास्ते और हर कदम की सटीक बचत",
    captionEn:
      "Drag across the cumulative dose curve to compare a typical day vs your Saans plan. Toggle any action on or off to see exact dose drops, rupee costs, and export to your calendar.",
    captionHi:
      "ग्राफ़ पर ड्रैग करके सामान्य दिन बनाम सांस योजना देखें। किसी भी उपाय को चालू या बंद करें और तुरंत बचत, खर्च और .ics कैलेंडर देखें।",
  },
  {
    id: "lab",
    image: "/tour/lab.jpg",
    durationSec: 8,
    focusX: 0.28,
    focusY: 0.42,
    focusW: 0.42,
    focusH: 0.35,
    titleEn: "3. Home Air Lab, CR Box & Snap-and-Confirm",
    titleHi: "3. होम एयर लैब, DIY फ़िल्टर और लेबल स्कैन",
    captionEn:
      "Simulate room size, window seal, and purifier CADR with low–high physics bands, find your 20-minute airing window, build a ₹1,500–2,800 CR Box, or scan a purifier label.",
    captionHi:
      "कमरे का आकार, सील और प्यूरिफ़ायर CADR सिमुलेट करें, हवा बदलने का सबसे साफ 20-मिनट समय जानें, या लेबल की फ़ोटो स्कैन करें।",
  },
  {
    id: "ask",
    image: "/tour/ask.jpg",
    durationSec: 8,
    focusX: 0.36,
    focusY: 0.38,
    focusW: 0.46,
    focusH: 0.3,
    titleEn: "4. Engine Computes, Gemini Narrates, Server Verifies",
    titleHi: "4. इंजन गणना करे, Gemini समझाए, सर्वर जाँचे",
    captionEn:
      "Gemini writes calm answers in English or Hindi using {{fact:id}} slots only. A server guard blocks hallucinated numbers, ozone purifiers, unvented-combustion sealing, and under-2 masks.",
    captionHi:
      "Gemini केवल {{fact:id}} स्लॉट से हिंदी/अंग्रेज़ी में जवाब लिखता है। सर्वर गार्ड गलत संख्याओं और असुरक्षित सलाह को कोड स्तर पर रोकता है।",
  },
  {
    id: "ahmedabad",
    image: "/tour/ahm.jpg",
    durationSec: 8,
    focusX: 0.25,
    focusY: 0.62,
    focusW: 0.38,
    focusH: 0.24,
    titleEn: "5. Multi-City Live Data, Ahmedabad Demo & Your Own Key",
    titleHi: "5. दिल्ली, अहमदाबाद, लाइव मौसम और आपकी अपनी कुंजी",
    captionEn:
      "Switch between Delhi, Ahmedabad, or any city via live Open-Meteo CAMS air & weather data, calibrate with your monitor, and test with your own Gemini API key in Setup.",
    captionHi:
      "दिल्ली, अहमदाबाद या अपने शहर का लाइव Open-Meteo डेटा देखें, अपने मॉनिटर से मिलाएँ, और सेटअप में अपनी Gemini कुंजी से लाइव टेस्ट करें।",
  },
  {
    id: "community",
    image: "/tour/community.jpg",
    durationSec: 8,
    focusX: 0.66,
    focusY: 0.48,
    focusW: 0.3,
    focusH: 0.4,
    titleEn: "6. School & RWA Community Kit + Proof Transparency",
    titleHi: "6. स्कूल व RWA समुदाय किट और पूर्ण पारदर्शिता",
    captionEn:
      "Generate hour-by-hour Go/No-Go schedules for schools, offices, and housing societies, copy WhatsApp advisories in 1 click, and inspect every WHO/CPCB/EPA citation in Proof.",
    captionHi:
      "स्कूलों, दफ़्तरों और सोसायटियों के लिए घंटे-वार सलाह, 1-क्लिक व्हाट्सऐप संदेश और Proof टैब में हर वैज्ञानिक स्रोत की पारदर्शिता।",
  },
];

export const TOTAL_WALKTHROUGH_SEC = WALKTHROUGH_SCENES.reduce((s, c) => s + c.durationSec, 0);

export function sceneAtTime(sec: number): {
  scene: WalkthroughScene;
  index: number;
  localSec: number;
  progress: number;
} {
  let elapsed = 0;
  for (let i = 0; i < WALKTHROUGH_SCENES.length; i += 1) {
    const scene = WALKTHROUGH_SCENES[i];
    if (!scene) continue;
    if (sec < elapsed + scene.durationSec || i === WALKTHROUGH_SCENES.length - 1) {
      const localSec = Math.max(0, Math.min(scene.durationSec, sec - elapsed));
      return {
        scene,
        index: i,
        localSec,
        progress: localSec / scene.durationSec,
      };
    }
    elapsed += scene.durationSec;
  }
  const first = WALKTHROUGH_SCENES[0] as WalkthroughScene;
  return { scene: first, index: 0, localSec: 0, progress: 0 };
}

export function sceneStartTime(index: number): number {
  let sum = 0;
  for (let i = 0; i < index && i < WALKTHROUGH_SCENES.length; i += 1) {
    sum += WALKTHROUGH_SCENES[i]?.durationSec ?? 0;
  }
  return sum;
}

export function sceneTitle(scene: WalkthroughScene, locale: Locale): string {
  return locale === "hi" ? scene.titleHi : scene.titleEn;
}

export function sceneCaption(scene: WalkthroughScene, locale: Locale): string {
  return locale === "hi" ? scene.captionHi : scene.captionEn;
}
