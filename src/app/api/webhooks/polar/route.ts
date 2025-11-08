/**
 * Polar Webhook Handler
 * POST /api/webhooks/polar
 * 
 * Handles Polar webhook events
 * Configure in Polar Dashboard:
 * https://polar.sh/settings/webhooks
 * 
 * For local testing with ngrok:
 * https://your-ngrok-url.ngrok.io/api/webhooks/polar
 * 
 * Polar Webhook Events:
 * - subscription.created
 * - subscription.updated
 * - subscription.canceled
 * - checkout.created
 * - payment.created
 * - product.created
 * - product.updated
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyHMACSignature, logWebhookEvent } from "@/lib/webhook-utils";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Polar Webhook Event Types
 */
type PolarEventType =
  | "subscription.created"
  | "subscription.updated"
  | "subscription.canceled"
  | "checkout.created"
  | "payment.created"
  | "product.created"
  | "product.updated";

type PolarWebhookEvent = {
  type: PolarEventType;
  data: any;
};

/**
 * Handle Polar subscription events
 */
async function handlePolarSubscriptionEvent(
  event: PolarWebhookEvent,
  subscriptionData: any
): Promise<void> {
  const { type } = event;
  const subscriptionId = subscriptionData.id;
  const customerId = subscriptionData.customer_id;
  const productId = subscriptionData.product_id;
  const status = subscriptionData.status; // active, canceled, past_due, etc.

  console.log(`Processing Polar subscription event: ${type}`, {
    subscriptionId,
    customerId,
    productId,
    status,
  });

  // TODO: Map Polar subscription to your database
  // This is a placeholder - adjust based on your schema
  switch (type) {
    case "subscription.created":
      // New subscription created
      console.log("New Polar subscription created:", subscriptionId);
      // TODO: Create subscription in your database
      // Example:
      // await db.insert(subscriptions).values({
      //   externalId: subscriptionId,
      //   userId: customerId, // Map Polar customer to your user
      //   status: status,
      //   // ... other fields
      // });
      break;

    case "subscription.updated":
      // Subscription updated (status change, plan change, etc.)
      console.log("Polar subscription updated:", subscriptionId);
      // TODO: Update subscription in your database
      // Example:
      // await db.update(subscriptions)
      //   .set({ status: status })
      //   .where(eq(subscriptions.externalId, subscriptionId));
      break;

    case "subscription.canceled":
      // Subscription canceled
      console.log("Polar subscription canceled:", subscriptionId);
      // TODO: Update subscription status to canceled
      // Example:
      // await db.update(subscriptions)
      //   .set({ status: "canceled", isActive: false })
      //   .where(eq(subscriptions.externalId, subscriptionId));
      break;
  }
}

/**
 * Handle Polar checkout events
 */
async function handlePolarCheckoutEvent(
  event: PolarWebhookEvent,
  checkoutData: any
): Promise<void> {
  const { type } = event;
  const checkoutId = checkoutData.id;
  const customerId = checkoutData.customer_id;
  const productId = checkoutData.product_id;

  console.log(`Processing Polar checkout event: ${type}`, {
    checkoutId,
    customerId,
    productId,
  });

  switch (type) {
    case "checkout.created":
      // Checkout session created
      console.log("Polar checkout created:", checkoutId);
      // TODO: Track checkout creation
      break;
  }
}

/**
 * Handle Polar payment events
 */
async function handlePolarPaymentEvent(
  event: PolarWebhookEvent,
  paymentData: any
): Promise<void> {
  const { type } = event;
  const paymentId = paymentData.id;
  const amount = paymentData.amount;
  const currency = paymentData.currency;
  const status = paymentData.status;

  console.log(`Processing Polar payment event: ${type}`, {
    paymentId,
    amount,
    currency,
    status,
  });

  switch (type) {
    case "payment.created":
      // Payment created
      console.log("Polar payment created:", paymentId);
      // TODO: Track payment in your database
      break;
  }
}

/**
 * Handle Polar product events
 */
async function handlePolarProductEvent(
  event: PolarWebhookEvent,
  productData: any
): Promise<void> {
  const { type } = event;
  const productId = productData.id;
  const name = productData.name;

  console.log(`Processing Polar product event: ${type}`, {
    productId,
    name,
  });

  switch (type) {
    case "product.created":
      console.log("Polar product created:", productId);
      // TODO: Sync product to your database
      break;

    case "product.updated":
      console.log("Polar product updated:", productId);
      // TODO: Update product in your database
      break;
  }
}

/**
 * Process Polar webhook event
 */
async function processPolarEvent(event: PolarWebhookEvent): Promise<void> {
  const { type, data } = event;

  logWebhookEvent(type, "polar", data, true);

  // Route to appropriate handler based on event type
  if (type.startsWith("subscription.")) {
    await handlePolarSubscriptionEvent(event, data);
  } else if (type.startsWith("checkout.")) {
    await handlePolarCheckoutEvent(event, data);
  } else if (type.startsWith("payment.")) {
    await handlePolarPaymentEvent(event, data);
  } else if (type.startsWith("product.")) {
    await handlePolarProductEvent(event, data);
  } else {
    console.log("Unhandled Polar event type:", type);
  }
}

/**
 * POST /api/webhooks/polar
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const signature = headersList.get("x-polar-signature") || 
                     headersList.get("polar-signature") ||
                     "";
    const webhookId = headersList.get("x-polar-webhook-id") || "";
    const timestamp = headersList.get("x-polar-timestamp") || "";

    // Get Polar webhook secret from environment variables
    const polarWebhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (!polarWebhookSecret) {
      console.error("POLAR_WEBHOOK_SECRET is not set");
      // In development, allow requests without secret for testing
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Webhook secret not configured" },
          { status: 500 }
        );
      }
    }

    // Read raw body for signature verification
    const rawBody = await request.text();

    // Verify signature if secret is provided
    if (polarWebhookSecret && signature) {
      // Polar uses HMAC SHA256 signature
      // The signature is calculated from: timestamp + "." + rawBody
      const signedPayload = timestamp ? `${timestamp}.${rawBody}` : rawBody;
      const isValid = verifyHMACSignature(signedPayload, signature, polarWebhookSecret);
      
      if (!isValid) {
        console.error("Invalid Polar webhook signature");
        logWebhookEvent("signature_verification_failed", "polar", {}, false);
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    } else if (process.env.NODE_ENV === "production" && !signature) {
      // Require signature in production
      console.error("Missing Polar webhook signature in production");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    // Parse webhook payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error("Error parsing Polar webhook payload:", error);
      return NextResponse.json(
        { error: "Invalid payload format" },
        { status: 400 }
      );
    }

    // Extract event information
    const event: PolarWebhookEvent = {
      type: payload.type || payload.event_type || "unknown",
      data: payload.data || payload,
    };

    // Validate event type
    if (!event.type || event.type === "unknown") {
      return NextResponse.json(
        { error: "Missing or invalid event type" },
        { status: 400 }
      );
    }

    // Process the webhook event asynchronously
    // Don't await to respond quickly to Polar
    processPolarEvent(event).catch((error) => {
      console.error("Error processing Polar webhook:", error);
      logWebhookEvent(event.type, "polar", { error: error.message }, false);
      // TODO: Add error logging/alerting here
    });

    // Respond quickly to acknowledge receipt
    return NextResponse.json(
      {
        success: true,
        received: true,
        event: event.type,
        webhookId: webhookId || undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Polar webhook error:", error);
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
 * GET /api/webhooks/polar
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Polar webhook endpoint is active",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}

