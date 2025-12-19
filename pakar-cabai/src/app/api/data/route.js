// src/app/api/data/route.js
import { getKnowledgeBase } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await getKnowledgeBase();
    // Cache control agar tidak membebani database (revalidate tiap 1 jam)
    return NextResponse.json(data, { status: 200, headers: { 'Cache-Control': 's-maxage=3600' } });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}