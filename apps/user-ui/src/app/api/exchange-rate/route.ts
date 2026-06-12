import { NextResponse } from 'next/server';

const FALLBACK_RATE = 5.5;

export async function GET() {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=BRL', {
      next: { revalidate: 3600 }, // cache on the server for 1 hour
    });

    if (!res.ok) {
      return NextResponse.json({ rate: FALLBACK_RATE });
    }

    const data = await res.json();
    const rate: number = data?.rates?.BRL ?? FALLBACK_RATE;

    return NextResponse.json({ rate }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  } catch {
    return NextResponse.json({ rate: FALLBACK_RATE });
  }
}
