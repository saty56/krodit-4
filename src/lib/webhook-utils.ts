/**
 * Webhook Utilities
 * Helper functions for webhook processing
 */

import crypto from "crypto";

/**
 * Verify Stripe webhook signature
 * Stripe signature format: t=timestamp,v1=signature1,v1=signature2,...
 * Stripe can send multiple v1 signatures, verify against all of them
 */
export function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Stripe signature format: "t=timestamp,v1=signature1,v1=signature2,..."
    const elements = signature.split(",");
    const timestamp = elements.find((el) => el.startsWith("t="))?.split("=")[1];
    
    if (!timestamp) {
      return false;
    }

    // Extract ALL v1 signatures (Stripe may send multiple)
    const v1Signatures = elements
      .filter((el) => el.startsWith("v1="))
      .map((el) => el.split("=")[1])
      .filter((sig): sig is string => Boolean(sig));

    if (v1Signatures.length === 0) {
      return false;
    }

    // Stripe signs: timestamp + "." + payload
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload, "utf8")
      .digest("hex");

    // Verify against ALL v1 signatures - accept if ANY match
    // This handles Stripe secret rotation and multiple signature scenarios
    // Use 'hex' encoding since HMAC digests are hex-encoded strings
    return v1Signatures.some((signatureHash) =>
      crypto.timingSafeEqual(
        Buffer.from(signatureHash, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )
    );
  } catch (error) {
    console.error("Error verifying Stripe signature:", error);
    return false;
  }
}

/**
 * Verify generic HMAC SHA256 signature
 */
export function verifyHMACSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload, "utf8")
      .digest("hex");

    // Use 'hex' encoding since HMAC digests are hex-encoded strings
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error("Error verifying HMAC signature:", error);
    return false;
  }
}

/**
 * Verify webhook signature based on provider
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  provider: "stripe" | "generic" | "hmac" = "hmac"
): boolean {
  switch (provider) {
    case "stripe":
      return verifyStripeSignature(payload, signature, secret);
    case "hmac":
    case "generic":
      return verifyHMACSignature(payload, signature, secret);
    default:
      console.warn(`Unknown webhook provider: ${provider}`);
      return false;
  }
}

/**
 * Extract webhook event type from payload
 */
export function extractWebhookEventType(payload: any): string {
  return (
    payload.type ||
    payload.event ||
    payload.event_type ||
    payload["event.type"] ||
    "unknown"
  );
}

/**
 * Extract webhook data from payload
 */
export function extractWebhookData(payload: any): any {
  return payload.data || payload.object || payload;
}

/**
 * Log webhook event for debugging
 */
export function logWebhookEvent(
  type: string,
  source: string,
  data: any,
  success: boolean = true
): void {
  console.log(`[Webhook] ${success ? "✅" : "❌"} ${type}`, {
    source,
    type,
    timestamp: new Date().toISOString(),
    success,
    data: JSON.stringify(data).substring(0, 200), // Limit log size
  });
}

