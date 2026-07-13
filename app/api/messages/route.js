import { getClient } from "../../../lib/twilio";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = getClient();
    const myNumber = process.env.TWILIO_PHONE_NUMBER;

    const messages = await client.messages.list({ limit: 300 });

    const threads = {};

    for (const m of messages) {
      const counterpart = m.direction.startsWith("outbound") ? m.to : m.from;
      if (!counterpart || counterpart === myNumber && m.to === m.from) continue;

      if (!threads[counterpart]) {
        threads[counterpart] = { number: counterpart, messages: [] };
      }

      threads[counterpart].messages.push({
        sid: m.sid,
        body: m.body,
        direction: m.direction,
        status: m.status,
        dateSent: m.dateSent || m.dateCreated,
      });
    }

    const result = Object.values(threads).map((t) => {
      t.messages.sort((a, b) => new Date(a.dateSent) - new Date(b.dateSent));
      return t;
    });

    result.sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1]?.dateSent;
      const bLast = b.messages[b.messages.length - 1]?.dateSent;
      return new Date(bLast) - new Date(aLast);
    });

    return Response.json({ threads: result });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
