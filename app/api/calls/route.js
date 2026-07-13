import { getClient } from "../../../lib/twilio";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = getClient();
    const calls = await client.calls.list({ limit: 100 });

    const result = calls.map((c) => ({
      sid: c.sid,
      from: c.from,
      to: c.to,
      direction: c.direction,
      status: c.status,
      duration: c.duration,
      startTime: c.startTime,
    }));

    return Response.json({ calls: result });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
