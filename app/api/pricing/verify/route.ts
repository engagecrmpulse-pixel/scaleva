import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { code?: string };
  const ownerCode = process.env.OWNER_PAY_CODE;
  if (!ownerCode || body.code !== ownerCode) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
