import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { invitedEmail, inviterName, tripName, inviteUrl } = await req.json();

    if (!invitedEmail || !inviteUrl || !tripName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromName = inviterName || "Someone";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>You're invited to ${tripName}</title>
</head>
<body style="margin:0;padding:0;background:#0D0D12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D12;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- Logo -->
  <tr><td align="center" style="padding-bottom:28px;">
    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.02em;">Orbit<span style="color:#E8724A;">Split</span></span>
  </td></tr>

  <!-- Card -->
  <tr><td style="background:#16161F;border-radius:16px;border:1px solid rgba(255,255,255,0.08);">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:48px 40px;">

        <p style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.38);margin:0 0 16px 0;">Trip invitation</p>

        <h1 style="font-size:28px;font-weight:700;color:#ffffff;margin:0 0 16px 0;line-height:1.2;">You're invited to<br/><span style="color:#E8724A;">${tripName}</span></h1>

        <p style="font-size:15px;line-height:1.7;color:rgba(255,255,255,0.6);margin:0 0 32px 0;">
          <strong style="color:rgba(255,255,255,0.85);">${fromName}</strong> has invited you to join their trip on OrbitSplit — where you can track places, split expenses, and keep memories together.
        </p>

        <!-- CTA -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr><td style="background:#E8724A;border-radius:100px;box-shadow:0 0 28px rgba(232,114,74,0.35);">
            <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:100px;">Join the trip →</a>
          </td></tr>
        </table>

        <!-- Divider -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="border-top:1px solid rgba(255,255,255,0.08);font-size:0;">&nbsp;</td></tr>
        </table>

        <p style="font-size:12px;color:rgba(255,255,255,0.25);margin:0;">
          Button not working? Copy this link:<br/>
          <a href="${inviteUrl}" style="color:rgba(255,119,74,0.7);word-break:break-all;text-decoration:none;">${inviteUrl}</a>
        </p>

      </td></tr>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:28px 0 0 0;">
    <p style="font-size:12px;color:rgba(255,255,255,0.25);text-align:center;margin:0;">
      <a href="https://orbitsplit.com" style="color:rgba(255,255,255,0.3);text-decoration:none;">orbitsplit.com</a>
      &nbsp;·&nbsp;
      <a href="https://orbitsplit.com/privacy.html" style="color:rgba(255,255,255,0.3);text-decoration:none;">Privacy Policy</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "OrbitSplit <hello@orbitsplit.com>",
        to: [invitedEmail],
        subject: `${fromName} invited you to ${tripName} on OrbitSplit`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Resend error");

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("send-invite error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
