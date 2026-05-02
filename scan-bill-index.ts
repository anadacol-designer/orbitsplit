import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { base64, mimeType } = await req.json();

    if (!base64 || !mimeType) {
      return new Response(JSON.stringify({ error: "Missing base64 or mimeType" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = new Anthropic();

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 100,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType, data: base64 },
          },
          {
            type: "text",
            text: "Look at this bill or receipt. Reply with ONLY the final total amount as a plain number (e.g. 24.50). No currency symbol, no explanation, no text — just the number. If you cannot find a clear total, reply with 0.",
          },
        ],
      }],
    });

    const text = message.content[0]?.text?.trim() || "0";
    const amount = parseFloat(text.replace(/[^0-9.]/g, "")) || 0;

    return new Response(JSON.stringify({ amount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("scan-bill error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
