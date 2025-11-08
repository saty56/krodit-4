/**
 * API Route for Reminders
 * GET /api/reminders - Get reminders for the authenticated user
 * This can be called by a cron job or scheduled task
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserReminders } from "@/lib/reminder-service";

/**
 * GET /api/reminders
 * Returns reminders for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const reminders = await getUserReminders(session.user.id);

    return NextResponse.json({
      success: true,
      reminders,
      count: reminders.length,
    });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

