import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Proxy for World Bank GDP growth indicator
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const indicator = searchParams.get('indicator') || 'NY.GDP.MKTP.KD.ZG';
  const year = searchParams.get('year') || '2022';

  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&per_page=300&mrv=1&date=${year}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GlobalInstabilityMonitor/1.0',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `World Bank economic API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch economic data', details: String(error) },
      { status: 503 }
    );
  }
}
