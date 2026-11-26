import { describe, expect, it } from 'vitest';
import { retrieveGuidance } from '../guidance-rag';

describe('Guidance RAG - Retrieval and Grounding', () => {
  it('retrieves ICMR advisory for morning walk / exercise during thermal inversion', () => {
    const results = retrieveGuidance('morning walk winter exercise inversion', ['walk', 'inversion']);
    expect(results.length).toBeGreaterThan(0);
    const top = results[0];
    expect(top.agency).toBe('ICMR');
    expect(top.title).toContain('Morning Outdoor Exercise');
  });

  it('retrieves WHO guidelines for general PM2.5 threshold queries', () => {
    const results = retrieveGuidance('WHO PM2.5 threshold limit', ['pm25', 'threshold']);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.agency === 'WHO')).toBe(true);
  });

  it('retrieves EPA / IIT-K study for Corsi-Rosenthal DIY box filter', () => {
    const results = retrieveGuidance('DIY box fan filter budget', ['diy', 'corsi']);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].citation).toContain('EPA');
  });

  it('respects the limit parameter', () => {
    const single = retrieveGuidance('air quality', [], 1);
    const multiple = retrieveGuidance('air quality', [], 3);
    expect(single).toHaveLength(1);
    expect(multiple).toHaveLength(3);
  });

  it('gracefully returns relevant items even with an empty query', () => {
    const results = retrieveGuidance('', [], 2);
    expect(results).toHaveLength(2);
  });
});
