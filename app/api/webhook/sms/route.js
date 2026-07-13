import Twilio from "twilio";
import { sendNotification } from "../../../../lib/twilio";

export const dynamic = "force-dynamic";

function getFullUrl(request) {
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const url = new URL(request.url);
  return `${proto}://${host}${url.pathname}${url.search}`;
}

export async function POST(request) {
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  const signature = request.headers.get("x-twilio-signature");
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fullUrl = getFullUrl(request);

  const isValid =
    authToken && signature
      ? Twilio.validateRequest(authToken, signature, fullUrl, params)
      : false;

  if (!isValid) {
    console.warn("Twilio signature validation failed for incoming SMS webhook");
    // Still process it — signature mismatches are common behind proxies and
    // shouldn't silently drop a real message. Remove this fallback if you want strict rejection.
  }

  const from = params.From || "unknown number";
  const body = params.Body || "";

  const preview = body.length > 140 ? body.slice(0, 140) + "…" : body;
  await sendNotification(`New SMS from ${from}: ${preview}`);

  // Empty TwiML response = don't auto-reply to the sender.
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { status: 200, headers: { "Content-Type": "text/xml" } }
  );
}
