import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";

async function fetchGoogleAvatar(accessToken?: string): Promise<string | ""> {
  try {
    if (!accessToken) return "";
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return "";
    const data = await res.json();
    const url = data?.picture;
    return typeof url === "string" ? url : "";
  } catch {
    return "";
  }
}

async function fetchGithubAvatar(accessToken?: string): Promise<string | ""> {
  try {
    if (!accessToken) return "";
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "krodit-app" },
      cache: "no-store",
    });
    if (!res.ok) return "";
    const data = await res.json();
    const url = data?.avatar_url;
    return typeof url === "string" ? url : "";
  } catch {
    return "";
  }
}

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If already has image, return it
  if (session.user.image) {
    return NextResponse.json({ image: session.user.image });
  }

  // Find latest linked account for the user
  const [acct] = await db
    .select()
    .from(schema.account)
    .where(eq(schema.account.userId, session.user.id))
    .orderBy(desc(schema.account.updatedAt))
    .limit(1);

  if (!acct) {
    console.warn("sync-avatar: no linked account for user", session.user.id);
    return NextResponse.json({ image: "" });
  }

  let imageUrl = "";
  if (acct.providerId === "google") {
    imageUrl = await fetchGoogleAvatar(acct.accessToken ?? undefined);
  } else if (acct.providerId === "github") {
    imageUrl = await fetchGithubAvatar(acct.accessToken ?? undefined);
  } else {
    console.warn("sync-avatar: unknown provider", acct.providerId);
  }

  if (!imageUrl) {
    console.warn("sync-avatar: provider returned no image", { provider: acct.providerId });
    return NextResponse.json({ image: "" });
  }

  // Persist on user
  await db
    .update(schema.user)
    .set({ image: imageUrl })
    .where(eq(schema.user.id, session.user.id));

  return NextResponse.json({ image: imageUrl });
}


