/**
 * Webhook Route Handler
 * POST /api/webhooks
 * 
 * Handles incoming webhooks from various services
 * Use this endpoint with ngrok for local development:
 * https://your-ngrok-url.ngrok.io/api/webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  verifyWebhookSignature,
  extractWebhookEventType,
  extractWebhookData,
  logWebhookEvent,
} from "@/lib/webhook-utils";

/**
 * Webhook Event Types
 */
type WebhookEvent = {
  type: string;
  data: any;
  timestamp?: string;
  source?: string;
};

/**
 * Process webhook event
 * Handle different event types here
 */
async function processWebhookEvent(event: WebhookEvent): Promise<void> {
  console.log(`Processing webhook event: ${event.type}`, {
    type: event.type,
    source: event.source,
    timestamp: event.timestamp || new Date().toISOString(),
  });

  // Handle different event types
  switch (event.type) {
    case "subscription.created":
    case "subscription.updated":
      // Handle subscription events
      console.log("Subscription event:", event.data);
      // TODO: Update subscription in database
      break;

    case "payment.succeeded":
    case "payment.failed":
      // Handle payment events
      console.log("Payment event:", event.data);
      // TODO: Update payment status in database
      break;

    case "invoice.paid":
    case "invoice.payment_failed":
      // Handle invoice events
      console.log("Invoice event:", event.data);
      // TODO: Update invoice status in database
      break;

    default:
      console.log("Unknown webhook event type:", event.type);
  }
}

/**
 * POST /api/webhooks
 * Main webhook endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const contentType = headersList.get("content-type") || "";
    const signature = headersList.get("x-webhook-signature") || 
                     headersList.get("x-signature") ||
                     headersList.get("stripe-signature") || 
                     "";
    const webhookSource = headersList.get("x-webhook-source") || "unknown";

    // Get webhook secret from environment variables
    // You can have different secrets for different providers
    const webhookSecret = process.env.WEBHOOK_SECRET || 
                         process.env.STRIPE_WEBHOOK_SECRET || 
                         "";

    // Read raw body for signature verification
    const rawBody = await request.text();
    
    // SECURITY: Verify signature BEFORE parsing payload to prevent processing untrusted data
    if (webhookSecret && signature) {
      // Determine provider from headers or default to generic HMAC
      let provider: "stripe" | "generic" | "hmac" = "hmac";
      if (webhookSource.includes("stripe")) {
        provider = "stripe";
      } else if (webhookSource.includes("polar")) {
        provider = "hmac"; // Polar uses HMAC SHA256
      }

      // For Polar, signature includes timestamp
      const timestamp = headersList.get("x-polar-timestamp") || "";
      const payloadToVerify = timestamp && webhookSource.includes("polar") 
        ? `${timestamp}.${rawBody}` 
        : rawBody;

      const isValid = verifyWebhookSignature(
        payloadToVerify,
        signature,
        webhookSecret,
        provider
      );
      if (!isValid) {
        console.error("Invalid webhook signature");
        logWebhookEvent("signature_verification_failed", webhookSource, {}, false);
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    } else if (process.env.NODE_ENV === "production" && !signature) {
      // Require signature in production
      console.error("Missing webhook signature in production");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    // Parse webhook payload only after signature verification
    let payload: any;
    try {
      if (contentType.includes("application/json")) {
        payload = JSON.parse(rawBody);
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        // Handle form-encoded data
        const params = new URLSearchParams(rawBody);
        payload = Object.fromEntries(params);
      } else {
        payload = { raw: rawBody };
      }
    } catch (error) {
      console.error("Error parsing webhook payload:", error);
      return NextResponse.json(
        { error: "Invalid payload format" },
        { status: 400 }
      );
    }

    // Extract event information using utility functions
    const event: WebhookEvent = {
      type: extractWebhookEventType(payload),
      data: extractWebhookData(payload),
      timestamp: payload.timestamp || new Date().toISOString(),
      source: webhookSource,
    };

    // Log the webhook event
    logWebhookEvent(event.type, webhookSource, event.data, true);

    // Process the webhook event asynchronously
    // Don't await to respond quickly to the webhook provider
    processWebhookEvent(event).catch((error) => {
      console.error("Error processing webhook event:", error);
      logWebhookEvent(event.type, webhookSource, { error: error.message }, false);
      // TODO: Add error logging/alerting here
    });

    // Respond quickly to acknowledge receipt
    return NextResponse.json(
      { 
        success: true, 
        received: true,
        event: event.type,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { 
        error: "Webhook processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    message: "Webhook endpoint is active",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}

