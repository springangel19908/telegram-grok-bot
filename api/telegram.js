export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Telegram Webhook Active');
  }

  const { message } = req.body;

  if (!message || !message.text) {
    return res.status(200).send('No text message received');
  }

  const chatId = message.chat.id;
  const userText = message.text;

  try {
    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "x-ai/grok-2-1212",
        messages: [{ role: "user", content: userText }]
      })
    });

    const openRouterData = await openRouterResponse.json();
    const replyText = openRouterData.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText
      })
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error handling request:", error);
    return res.status(500).json({ error: error.message });
  }
}
