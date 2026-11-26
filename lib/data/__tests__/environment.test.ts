import { describe, expect, it } from 'vitest';
import { getEnvironmentalSnapshot, INDIAN_CITY_PRESETS } from '../environment';

describe('Environmental Telemetry - Ingestion & Fallback', () => {
  it('contains comprehensive Indian city monitoring presets', () => {
    expect(INDIAN_CITY_PRESETS.length).toBeGreaterThanOrEqual(6);
    const delhi = INDIAN_CITY_PRESETS.find((c) => c.city === 'New Delhi');
    const mumbai = INDIAN_CITY_PRESETS.find((c) => c.city === 'Mumbai');
    expect(delhi).toBeDefined();
    expect(mumbai).toBeDefined();
    expect(delhi!.lat).toBeCloseTo(28.7, 1);
    expect(mumbai!.lat).toBeGreaterThan(18.5);
    expect(mumbai!.lat).toBeLessThan(19.5);
  });

  it('returns valid 24-hour environmental snapshot with safe offline fallback', async () => {
    const snapshot = await getEnvironmentalSnapshot({
      city: 'New Delhi',
      locality: 'Rohini Sector 13',
      lat: 28.7041,
      lon: 77.1025,
    });

    expect(snapshot.city).toBe('New Delhi');
    expect(snapshot.hourlyPm25).toHaveLength(24);
    expect(snapshot.currentPm25).toBeGreaterThan(0);
    expect(snapshot.currentAqi).toBeGreaterThan(0);
    expect(['high', 'moderate', 'low']).toContain(snapshot.inversionRisk);
    expect(snapshot.bestOutdoorWindow.startHour).toBeDefined();
    expect(snapshot.worstOutdoorWindow.startHour).toBeDefined();
    expect(snapshot.bestOutdoorWindow.meanPm25).toBeLessThanOrEqual(
      snapshot.worstOutdoorWindow.meanPm25
    );
  });

  it('correctly associates northern latitude with agricultural stubble burning context', async () => {
    const northSnapshot = await getEnvironmentalSnapshot({
      city: 'New Delhi',
      locality: 'Rohini',
      lat: 28.7041,
      lon: 77.1025,
    });
    const southSnapshot = await getEnvironmentalSnapshot({
      city: 'Mumbai',
      locality: 'Bandra',
      lat: 19.0596,
      lon: 72.8295,
    });

    expect(northSnapshot.stubbleFireCount).toBeGreaterThan(southSnapshot.stubbleFireCount);
  });
});
