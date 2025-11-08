/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe
 * 
 * Handles Stripe webhook events
 * Configure in Stripe Dashboard:
 * https://dashboard.stripe.com/webhooks
 * 
 * For local testing with ngrok:
 * https://your-ngrok-url.ngrok.io/api/webhooks/stripe
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyStripeSignature, logWebhookEvent } from "@/lib/webhook-utils";

/**
 * Handle Stripe webhook events
 */
async function handleStripeEvent(event: any): Promise<void> {
  const eventType = event.type;
  const data = event.data?.object;

  logWebhookEvent(eventType, "stripe", data, true);

  switch (eventType) {
    case "checkout.session.completed":
      // Payment or subscription created
      console.log("Checkout completed:", data.id);
      // TODO: Update subscription status in database
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      // Subscription created or updated
      console.log("Subscription event:", eventType, data.id);
      // TODO: Sync subscription to database
      break;

    case "customer.subscription.deleted":
      // Subscription cancelled
      console.log("Subscription deleted:", data.id);
      // TODO: Update subscription status to cancelled
      break;

    case "invoice.paid":
      // Invoice paid successfully
      console.log("Invoice paid:", data.id);
      // TODO: Update invoice status
      break;

    case "invoice.payment_failed":
      // Invoice payment failed
      console.log("Invoice payment failed:", data.id);
      // TODO: Handle failed payment, send notification
      break;

    case "payment_intent.succeeded":
      // Payment succeeded
      console.log("Payment succeeded:", data.id);
      // TODO: Update payment status
      break;

    case "payment_intent.payment_failed":
      // Payment failed
      console.log("Payment failed:", data.id);
      // TODO: Handle failed payment
      break;

    default:
      console.log("Unhandled Stripe event type:", eventType);
  }
}

/**
 * POST /api/webhooks/stripe
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 401 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify signature
    const isValid = verifyStripeSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error("Invalid Stripe webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse event
    const event = JSON.parse(rawBody);

    // Process event asynchronously
    handleStripeEvent(event).catch((error) => {
      console.error("Error processing Stripe webhook:", error);
    });

    // Acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
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
 * GET /api/webhooks/stripe
 * Health check
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Stripe webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}

