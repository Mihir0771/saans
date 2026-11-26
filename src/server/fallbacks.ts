import type { FactSheet, Locale } from "@/engine/schema";

export interface ExplainPayload {
  headline: string;
  summary: string;
  sections: Array<{ title: string; body: string; actionIds: string[] }>;
  tips: Array<{ actionId: string; why: string }>;
  verifiedByEngine: boolean;
  offlineFallback: boolean;
}

function fDisplay(factSheet: FactSheet, key: string, fallback = "—"): string {
  return factSheet.facts[key]?.display ?? fallback;
}

export function buildExplainFallback(
  factSheet: FactSheet,
  eligibleActionIds: string[],
): ExplainPayload {
  const topIds = eligibleActionIds.slice(0, 3);
  const name = fDisplay(factSheet, "member_name", factSheet.locale === "hi" ? "परिवार" : "Family");
  const plan = fDisplay(factSheet, "dose_plan");
  const base = fDisplay(factSheet, "dose_baseline");
  const saved = fDisplay(factSheet, "dose_saved_pct");
  const best = fDisplay(factSheet, "best_window_start");
  const worst = fDisplay(factSheet, "worst_window_start");

  if (factSheet.locale === "hi") {
    return {
      headline: `${name} का आज का श्वास बजट: ${plan}`,
      summary: `सामान्य दिन (${base}) की तुलना में यह योजना खुराक को ${saved} कम कर सकती है। सबसे बेहतर हवा ${best} के आसपास है।`,
      sections: [
        {
          title: "आज क्या करें",
          body: `पीक प्रदूषण (${worst}) के समय खिड़कियाँ बंद रखें और अंदर की हवा साफ़ करने के कदम अपनाएँ।`,
          actionIds: topIds,
        },
      ],
      tips: topIds.map((actionId) => ({ actionId, why: "इंजन गणना के अनुसार कम खर्च में बड़ा असर।" })),
      verifiedByEngine: false,
      offlineFallback: true,
    };
  }

  return {
    headline: `${name}'s Breath Budget today: ${plan}`,
    summary: `With your Saans plan, estimated PM2.5 dose drops by ${saved} from a typical day (${base}). Cleanest outdoor window is near ${best}.`,
    sections: [
      {
        title: "Practical steps for today",
        body: `Keep windows closed around peak smog (${worst}) and focus on bedroom air cleaning plus lower-exposure travel.`,
        actionIds: topIds,
      },
    ],
    tips: topIds.map((actionId) => ({
      actionId,
      why: "High dose reduction for low effort based on today's forecast.",
    })),
    verifiedByEngine: false,
    offlineFallback: true,
  };
}

type Topic =
  "ozone" | "combustion" | "toddler_mask" | "exercise" | "medical" | "offtopic" | "general";

function detectTopic(q: string): Topic {
  if (/ozone|ionizer|ओज़ोन|आयोनाइज़र/i.test(q)) return "ozone";
  const hasCombustion = /angeethi|chulha|charcoal|unvented\s+heater|अंगीठी|चूल्हा/i.test(q);
  const hasSeal = /seal|close|shut|बंद/i.test(q);
  if (hasCombustion && hasSeal) return "combustion";
  if (/(baby|infant|toddler|1-year|under\s*2|शिशु|बच्चे).{0,40}(mask|n95|मास्क)/i.test(q))
    return "toddler_mask";
  if (/(run|jog|marathon|exercise|play\s*outside|दौड़|व्यायाम)/i.test(q)) return "exercise";
  if (/(inhaler|medicine|diagnos|asthma\s*attack|दवा|इलाज)/i.test(q)) return "medical";
  if (/(bitcoin|crypto|cricket|recipe|movie|ignore\s+previous|system\s+prompt)/i.test(q))
    return "offtopic";
  return "general";
}

const STATIC_HI_REPLIES: Partial<Record<Topic, string>> = {
  ozone:
    "ओज़ोन या आयोनाइज़र प्यूरिफ़ायर की सलाह नहीं दी जाती क्योंकि ओज़ोन फेफड़ों को नुकसान पहुँचाती है। सादा HEPA प्यूरिफ़ायर या MERV 13 DIY फ़िल्टर बॉक्स सुरक्षित है।",
  combustion:
    "अंगीठी, चूल्हा या बिना वेंट हीटर जलते समय कमरा कभी बंद न करें—कार्बन मोनोऑक्साइड का गंभीर खतरा होता है। तुरंत हवा आने दें और संभव हो तो इंडक्शन या LPG का उपयोग करें।",
  toddler_mask:
    "दो साल से कम उम्र के बच्चों को कोई भी मास्क नहीं पहनाना चाहिए। इसके बजाय कमरे की हवा फ़िल्टर करें और पीक समय में उन्हें अंदर रखें।",
  medical:
    "सांस कोई चिकित्सकीय सलाह या निदान नहीं देता। अस्थमा या सांस की तकलीफ के लिए कृपया अपने डॉक्टर की कार्य-योजना का पालन करें।",
  offtopic: "मैं केवल घर और शहर की वायु गुणवत्ता, श्वास बजट और सुरक्षित दिनचर्या से जुड़े प्रश्नों में मदद कर सकता हूँ।",
};

const STATIC_EN_REPLIES: Partial<Record<Topic, string>> = {
  ozone:
    "We never recommend ozone generators or ionizers because ozone irritates airways. A plain HEPA purifier or a MERV 13 DIY Corsi-Rosenthal box is safer.",
  combustion:
    "Never seal a room while burning an angeethi, chulha, charcoal, or unvented heater—carbon monoxide can build up fast. Keep ventilation open and switch to cleaner cooking or heating when possible.",
  toddler_mask:
    "Never put a mask on a child under 2 years old. Keep them indoors in a filtered room during peak pollution hours instead.",
  medical:
    "Saans does not provide medical advice or diagnosis. Please follow your doctor's asthma or respiratory action plan and seek medical care if symptoms worsen.",
  offtopic:
    "I can only help with urban air quality, indoor air hacks, commutes, and your family's Breath Budget.",
};

export function buildChatFallback(question: string, factSheet: FactSheet, locale: Locale): string {
  const topic = detectTopic(question);
  const staticMap = locale === "hi" ? STATIC_HI_REPLIES : STATIC_EN_REPLIES;
  const hit = staticMap[topic];
  if (hit) return hit;

  const aqi = fDisplay(factSheet, "aqi_now");
  const pm25 = fDisplay(factSheet, "pm25_now");
  const base = fDisplay(factSheet, "dose_baseline");
  const plan = fDisplay(factSheet, "dose_plan");
  const saved = fDisplay(factSheet, "dose_saved_pct");
  const best = fDisplay(factSheet, "best_window_start");

  if (topic === "exercise") {
    return locale === "hi"
      ? `आज AQI ${aqi} है—खराब हवा में बाहर तेज़ दौड़ या भारी व्यायाम से बचें। सबसे साफ समय ${best} के आसपास है।`
      : `Today's CPCB-scale AQI is ${aqi}. Avoid vigorous outdoor exercise at high pollution; the cleaner window is around ${best}.`;
  }
  return locale === "hi"
    ? `आज PM2.5 ${pm25} है। आपकी योजना से खुराक ${base} से घटकर ${plan} (${saved} बचत) हो सकती है। यह चिकित्सकीय सलाह नहीं है।`
    : `Outdoor PM2.5 is around ${pm25}. Your Saans plan reduces estimated dose from ${base} to ${plan} (${saved} saved), with the cleanest slot near ${best}. Not medical advice.`;
}
