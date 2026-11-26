export interface GuidanceCitation {
  id: string;
  agency: 'WHO' | 'CPCB' | 'ICMR' | 'EPA';
  citation: string;
  title: string;
  summary: string;
  tags: string[];
}

const GUIDANCE_CORPUS: GuidanceCitation[] = [
  {
    id: 'who-aqg-2021',
    agency: 'WHO',
    citation: 'WHO Global Air Quality Guidelines (2021)',
    title: '24-hour PM2.5 Threshold (15 µg/m³)',
    summary:
      'WHO recommends keeping 24-hour average PM2.5 below 15 µg/m³. Vulnerable groups (children, elderly, asthma/cardiopulmonary patients) experience acute risk even during short morning spikes.',
    tags: ['pm25', 'threshold', 'asthma', 'elderly', 'child', 'walk'],
  },
  {
    id: 'icmr-morning-inversion',
    agency: 'ICMR',
    citation: 'ICMR / NCDC Air Pollution Health Advisory',
    title: 'Avoid Early Morning Outdoor Exercise During Winter Smog',
    summary:
      'During winter thermal inversion (05:30–09:30), cold air traps pollutants near breathing height. Vigorous walking increases minute ventilation 2–3x; shift outdoor activity to afternoon sun hours (13:00–16:00).',
    tags: ['walk', 'morning', 'inversion', 'exercise', 'asthma', 'elderly'],
  },
  {
    id: 'cpcb-grap-indoor',
    agency: 'CPCB',
    citation: 'CPCB GRAP Stage III–IV Citizen Advisory',
    title: 'Seal Road-Facing Windows & Run Filtration During Peak Hours',
    summary:
      'Keep road-facing windows closed during morning and evening traffic peaks. Use HEPA filtration or DIY box-fan filters in sleeping rooms, and wet-mop floors instead of dry sweeping.',
    tags: ['indoor', 'windows', 'purifier', 'diy', 'dust', 'mopping'],
  },
  {
    id: 'icmr-cooking-iap',
    agency: 'ICMR',
    citation: 'ICMR Household Air Pollution Guidance',
    title: 'Clean Cooking & Cross-Ventilation',
    summary:
      'Solid biomass/chulha cooking can spike indoor PM2.5 above 300 µg/m³. Transitioning to LPG/PNG/induction, using an exhaust chimney, or cooking near an open leeward window sharply cuts women and children’s exposure.',
    tags: ['cooking', 'biomass', 'chulha', 'lpg', 'chimney', 'equity'],
  },
  {
    id: 'epa-corsi-rosenthal',
    agency: 'EPA',
    citation: 'US EPA / IIT-Kanpur DIY Filtration Studies',
    title: 'Corsi-Rosenthal Box & N95 Respirator Fit',
    summary:
      'A DIY box-fan with MERV-13 filters achieves ~200+ m³/h CADR at a fraction of commercial purifier cost. For unavoidable two-wheeler/bus commutes, a well-fitted N95/FFP2 respirator reduces inhaled PM2.5 by ~80%.',
    tags: ['diy', 'corsi', 'mask', 'n95', 'commute', 'two_wheeler', 'budget'],
  },
];

/**
 * Retrieves the top grounded public-health citations matching the query/tags.
 */
export function retrieveGuidance(
  query: string,
  tags: string[] = [],
  limit = 2
): GuidanceCitation[] {
  const tokens = `${query} ${tags.join(' ')}`
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter(Boolean);

  const scored = GUIDANCE_CORPUS.map((doc) => {
    const haystack = `${doc.title} ${doc.summary} ${doc.tags.join(' ')}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (doc.tags.includes(token)) score += 3;
      else if (haystack.includes(token)) score += 1;
    }
    return { doc, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.doc);
}
