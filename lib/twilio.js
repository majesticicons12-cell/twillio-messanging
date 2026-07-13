import Twilio from "twilio";

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  TWILIO_WHATSAPP_NUMBER,
  NOTIFY_PHONE_NUMBER,
  NOTIFY_WHATSAPP_NUMBER,
} = process.env;

export function getClient() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN env vars");
  }
  return Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

// Sends "you've got a new message/call" alert to Rishi's own number,
// over SMS and WhatsApp (both, per his instructions).
export async function sendNotification(text) {
  const client = getClient();
  const jobs = [];

  if (TWILIO_PHONE_NUMBER && NOTIFY_PHONE_NUMBER) {
    jobs.push(
      client.messages.create({
        from: TWILIO_PHONE_NUMBER,
        to: NOTIFY_PHONE_NUMBER,
        body: text,
      })
    );
  }

  if (TWILIO_WHATSAPP_NUMBER && NOTIFY_WHATSAPP_NUMBER) {
    jobs.push(
      client.messages.create({
        from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${NOTIFY_WHATSAPP_NUMBER}`,
        body: text,
      })
    );
  }

  const results = await Promise.allSettled(jobs);
  results.forEach((r) => {
    if (r.status === "rejected") {
      console.error("Notification send failed:", r.reason?.message || r.reason);
    }
  });
}

export function validateTwilioSignature(request, rawBody, params) {
  const signature = request.headers.get("x-twilio-signature");
  const url = request.url;
  if (!signature || !TWILIO_AUTH_TOKEN) return false;
  return Twilio.validateRequest(TWILIO_AUTH_TOKEN, signature, url, params);
}
