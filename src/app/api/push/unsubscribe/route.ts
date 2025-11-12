import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint } = body || {};
    if (!endpoint) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await db
      .update(pushSubscriptions)
      .set({ isActive: false })
      .where(and(eq(pushSubscriptions.userId, session.user.id), eq(pushSubscriptions.endpoint, endpoint)));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/api/push/unsubscribe error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
