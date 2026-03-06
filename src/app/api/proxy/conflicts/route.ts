import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Proxy for UCDP (Uppsala Conflict Data Program) API
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || '2023';
  const pageSize = searchParams.get('pagesize') || '1000';

  const url = `https://ucdpapi.pcr.uu.se/api/gedevents/${year}?pagesize=${pageSize}&page=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GlobalInstabilityMonitor/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      // Return empty dataset if UCDP is unavailable — frontend uses fallback data
      return NextResponse.json(
        { Result: [], TotalCount: 0, error: `UCDP API error: ${response.status}` },
        {
          status: 200,
          headers: { 'Cache-Control': 'public, s-maxage=3600' }
        }
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
      { Result: [], TotalCount: 0, error: String(error) },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, s-maxage=1800' }
      }
    );
  }
}
