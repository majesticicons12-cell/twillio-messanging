# Signal — apna Twilio dashboard

Ye ek chhota Next.js app hai jo tumhare Twilio account se seedha connect hota hai —
koi alag database nahi, Twilio history hi source of truth hai.

Kya milega:
- **Messages tab**: har number ke saath poora conversation thread (tumne bheja + unka reply), WhatsApp jaisa view.
- **Calls tab**: recent incoming/outgoing calls, status, duration.
- **Notifications**: jaise hi koi naya SMS ya call aata hai, tumhare number pe SMS + WhatsApp dono pe alert chala jaata hai.
- Poora dashboard ek password se locked hai (sirf tum dekh sakte ho).

## 1. Local mein test karna (optional)

```bash
npm install
cp .env.example .env.local
# .env.local mein apni Twilio details bharo
npm run dev
```

## 2. Vercel pe deploy karna

1. Is folder ko GitHub repo bana ke push karo (ya Vercel CLI se seedha deploy karo: `npx vercel`).
2. [vercel.com](https://vercel.com) pe jaake "Import Project" se repo import karo.
3. Deploy hone se pehle **Environment Variables** section mein `.env.example` ki saari values bharo (apni real Twilio details ke saath).
4. Deploy karo. Vercel tumhe ek URL dega jaise `https://your-app.vercel.app`.

## 3. Twilio console mein webhook set karna

Ye zaroori step hai — isi se Twilio ko pata chalega ki naya SMS/call aane par kahan bhejna hai.

1. [Twilio Console](https://console.twilio.com) → **Phone Numbers** → apna number kholo.
2. **Messaging** section mein, "A message comes in" ke aage webhook URL daalo:
   ```
   https://your-app.vercel.app/api/webhook/sms
   ```
   Method: `HTTP POST`
3. **Voice** section mein, "A call comes in" ke aage:
   ```
   https://your-app.vercel.app/api/webhook/call
   ```
   Method: `HTTP POST`
4. Save karo.

## 4. WhatsApp notifications (agar sandbox use kar rahe ho)

Agar tumhare paas approved WhatsApp Business sender nahi hai, Twilio ka free sandbox number
(`+14155238886`) use kar sakte ho testing ke liye — lekin usmein tumhe apne WhatsApp se ek baar
join code bhejna padega (Twilio console → Messaging → Try it out → Send a WhatsApp message,
wahan join code milega). Production ke liye WhatsApp Business sender approve karwana hoga.

## 5. Dashboard dekhna

`https://your-app.vercel.app` kholo, browser ek username/password maangega —
username kuch bhi daal do, password wahi jo `DASHBOARD_PASSWORD` mein set kiya tha.

## Notes

- Twilio API se live data fetch hota hai (last 300 messages, last 100 calls) — koi caching nahi, har refresh pe fresh data.
- Agar "Couldn't reach Twilio" error aaye, matlab env vars galat hain ya missing hain — Vercel project settings mein check karo.
- Call ka webhook abhi ek simple "leave a message after the tone" TwiML bhejta hai. Agar chaho toh ye apne asli number pe forward (`<Dial>`) bhi kar sakta hai — bata dena, add kar dunga.
