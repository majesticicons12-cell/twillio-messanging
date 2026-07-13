import { getClient } from "../../../lib/twilio";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { to, body, channel } = await request.json();

    if (!to || !body) {
      return Response.json({ error: "Missing 'to' or 'body'" }, { status: 400 });
    }

    const client = getClient();
    const myNumber = process.env.TWILIO_PHONE_NUMBER;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    let from = myNumber;
    let toNumber = to;

    if (channel === "whatsapp") {
      from = `whatsapp:${whatsappNumber}`;
      toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    }

    const message = await client.messages.create({
      from,
      to: toNumber,
      body,
    });

    return Response.json({
      sid: message.sid,
      status: message.status,
      to: toNumber,
      body,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
