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
    console.warn("Twilio signature validation failed for incoming call webhook");
  }

  const from = params.From || "unknown number";
  await sendNotification(`Incoming call from ${from}`);

  // Basic TwiML: let it ring through to voicemail-style message.
  // Replace this with <Dial> if you want to forward the call to your own phone.
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thanks for calling. Please leave a message after the tone.</Say>
  <Record maxLength="120" />
</Response>`;

  return new Response(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
