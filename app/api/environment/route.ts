import { NextResponse } from 'next/server';
import { getEnvironmentalSnapshot } from '@/lib/data/environment';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || 'New Delhi';
    const locality = searchParams.get('locality') || 'Rohini Sector 13';
    const lat = Number(searchParams.get('lat') ?? 28.7041);
    const lon = Number(searchParams.get('lon') ?? 77.1025);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    const snapshot = await getEnvironmentalSnapshot({
      city,
      locality,
      lat,
      lon,
    });
    return NextResponse.json(snapshot);
  } catch {
    return NextResponse.json(
      { error: 'Failed to load environmental snapshot' },
      { status: 500 }
    );
  }
}
