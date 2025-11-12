import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.SENDGRID_FROM;

let initialized = false;
function init() {
  if (initialized) return;
  if (!SENDGRID_API_KEY) {
    console.warn("[email] SENDGRID_API_KEY is not set. Emails will be skipped.");
    return;
  }
  sgMail.setApiKey(SENDGRID_API_KEY);
  initialized = true;
}

export type ReminderEmailContext = {
  to: string;
  userName?: string | null;
  subscriptionName: string;
  amount: string; // numeric string
  currency: string; // e.g. USD
  billingDate: Date;
  reminderType: "today" | "tomorrow";
};

function formatCurrency(amount: string, currency: string) {
  const value = Number(amount || "0");
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency || "USD"}`;
  }
}

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function sendReminderEmail(ctx: ReminderEmailContext) {
  init();
  if (!initialized) {
    // silently skip to allow local dev without SendGrid
    return { skipped: true } as const;
  }
  if (!EMAIL_FROM) {
    console.warn("[email] EMAIL_FROM/SENDGRID_FROM is not set. Skipping.");
    return { skipped: true } as const;
  }

  const formattedAmount = formatCurrency(ctx.amount, ctx.currency);
  const dateStr = formatDate(ctx.billingDate);
  const subjectPrefix = ctx.reminderType === "today" ? "Billing Today" : "Billing Tomorrow";
  const subject = `${subjectPrefix}: ${ctx.subscriptionName} — ${formattedAmount}`;
  const greetingName = ctx.userName || "there";

  const preheader =
    ctx.reminderType === "today"
      ? `${ctx.subscriptionName} bills today (${dateStr}) for ${formattedAmount}`
      : `${ctx.subscriptionName} bills tomorrow (${dateStr}) for ${formattedAmount}`;

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#0f172a">
    <p style="opacity:.0;max-height:0;overflow:hidden">${preheader}</p>
    <h2 style="margin:0 0 12px">${ctx.reminderType === "today" ? "💰 Due Today" : "⏰ Due Tomorrow"}</h2>
    <p>Hi ${greetingName},</p>
    <p>
      This is a reminder that <strong>${ctx.subscriptionName}</strong>
      ${ctx.reminderType === "today" ? "is due today" : "will be due tomorrow"}
      (${dateStr}) for <strong>${formattedAmount}</strong>.
    </p>
    <p style="font-size:12px;color:#475569">You are receiving this because you set a next billing date in Krodit.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0" />
    <p style="font-size:12px;color:#64748b">If this is no longer accurate, update the subscription in your dashboard.</p>
  </div>`;

  const msg = {
    to: ctx.to,
    from: EMAIL_FROM as string,
    subject,
    html,
  } as Parameters<typeof sgMail.send>[0];

  await sgMail.send(msg);
  return { sent: true } as const;
}
