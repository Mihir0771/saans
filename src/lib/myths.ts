export interface MythCard {
  id: string;
  verdict: "myth" | "fact" | "nuance";
  claimEn: string;
  claimHi: string;
  realityEn: string;
  realityHi: string;
  source: string;
}

export const MYTH_CARDS: MythCard[] = [
  {
    id: "houseplants",
    verdict: "myth",
    claimEn: "2–3 indoor houseplants clean a bedroom's PM2.5 smog.",
    claimHi: "2–3 इनडोर पौधे कमरे का PM2.5 स्मॉग साफ कर देते हैं।",
    realityEn:
      "Studies show potted plants clean air orders of magnitude slower than even a small HEPA or DIY box filter (hundreds of plants would be needed per room).",
    realityHi:
      "अध्ययन बताते हैं कि गमले के पौधे PM2.5 बहुत धीमे घटाते हैं—एक छोटे फ़िल्टर जितना असर पाने के लिए सैकड़ों पौधे लगेंगे।",
    source: "Cummings & Waring (2019), Journal of Exposure Science & Environmental Epidemiology",
  },
  {
    id: "ozone",
    verdict: "myth",
    claimEn: "Ozone generators or 'ionizer' purifiers safely freshen smoky rooms.",
    claimHi: "ओज़ोन जनरेटर या आयोनाइज़र कमरे की हवा सुरक्षित रूप से ताज़ा करते हैं।",
    realityEn:
      "Ozone is a lung irritant that worsens asthma and forms secondary ultrafine particles indoors. Saans blocks ozone devices by policy.",
    realityHi:
      "ओज़ोन फेफड़ों में जलन पैदा करती है और अस्थमा बढ़ा सकती है। सुरक्षित HEPA या MERV 13 फ़िल्टर का उपयोग करें।",
    source: "U.S. EPA Indoor Air Guide on Ozone Generators",
  },
  {
    id: "incense",
    verdict: "fact",
    claimEn: "Incense sticks (agarbatti) and mosquito coils spike indoor PM2.5.",
    claimHi: "अगरबत्ती और मच्छर कॉइल से घर के अंदर PM2.5 तेजी से बढ़ता है।",
    realityEn:
      "Smouldering sticks release concentrated fine particles indoors; lighting them in a closed winter room can push indoor PM2.5 well past outdoor levels.",
    realityHi:
      "बंद कमरे में अगरबत्ती या कॉइल जलाने से PM2.5 बाहर से भी ज़्यादा हो सकता है। धुआँ कम करें या हवा बाहर निकालें।",
    source: "Peer-reviewed indoor combustion aerosol studies",
  },
  {
    id: "cloth_mask",
    verdict: "myth",
    claimEn: "Any cotton cloth mask or scarf blocks fine winter PM2.5 smog.",
    claimHi: "कोई भी सूती कपड़े का मास्क या दुपट्टा PM2.5 को रोक लेता है।",
    realityEn:
      "Loose cloth stops coarse dust (PM10) but leaks ~75–90% of PM2.5 around edges and through weave. A well-fitted N95/FFP2 is needed for ages 2+.",
    realityHi:
      "ढीला कपड़ा बड़ी धूल रोकता है, लेकिन PM2.5 के ~75–90% हिस्से को नहीं रोक पाता। सही फिटिंग वाला N95/FFP2 मास्क पहनें (2+ वर्ष)।",
    source: "NIOSH / peer-reviewed respirator fit-factor studies",
  },
  {
    id: "open_windows",
    verdict: "nuance",
    claimEn: "Just keep windows open all morning to 'air out' winter smog.",
    claimHi: "ताज़ी हवा के लिए सुबह खिड़कियाँ खुली रखें।",
    realityEn:
      "Cold morning inversions trap peak PM2.5 outdoors (often 7–9 am). Air out only during the cleaner afternoon dip — unless clearing indoor smoke/CO.",
    realityHi:
      "सुबह की ठंडी हवा में स्मॉग ज़मीन के पास रुका रहता है। केवल दोपहर की साफ हवा में 10–20 मिनट हवा बदलें (जब तक अंदर धुआँ न हो)।",
    source: "Indoor mass-balance physics + CAMS diurnal profiles",
  },
  {
    id: "jaggery_steam",
    verdict: "myth",
    claimEn: "Jaggery (gud) or steam inhalation clears PM2.5 from lungs.",
    claimHi: "गुड़ खाने या भाप लेने से फेफड़ों से PM2.5 निकल जाता है।",
    realityEn:
      "Warm drinks or steam may soothe throat dryness, but no food or steam removes inhaled fine particles from lung tissue. Reducing exposure comes first.",
    realityHi:
      "गुड़ या भाप से गले को आराम मिल सकता है, पर ये फेफड़ों से PM2.5 कणों को साफ नहीं करते। धुएँ से बचाव सबसे ज़रूरी है।",
    source: "WHO / clinical respiratory consensus (non-medical summary)",
  },
];
