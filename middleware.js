import { NextResponse } from "next/server";

// Simple password lock so the dashboard isn't public to the whole internet.
// Set DASHBOARD_PASSWORD in Vercel env vars. Username can be anything.
export function middleware(req) {
  const auth = req.headers.get("authorization");
  const expected = process.env.DASHBOARD_PASSWORD;

  if (!expected) {
    // If no password is set, block access rather than leaving it open.
    return new NextResponse("Dashboard locked: set DASHBOARD_PASSWORD in your environment variables.", {
      status: 503,
    });
  }

  if (auth) {
    const [, encoded] = auth.split(" ");
    const decoded = Buffer.from(encoded, "base64").toString();
    const [, password] = decoded.split(":");
    if (password === expected) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Twilio Dashboard"' },
  });
}

export const config = {
  // Exclude Twilio webhook endpoints — Twilio can't send a basic-auth header,
  // so those routes are protected separately by validating the Twilio signature instead.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhook).*)"],
};
