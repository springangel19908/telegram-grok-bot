export default async function handler(req, res) {
  // GET request များအတွက် (ဘရောက်ဆာဖြင့် ဝင်ကြည့်ချိန် သို့မဟုတ် Favicon အတွက်)
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'Grok Bot is running successfully!' });
  }

  // Telegram Webhook မှ POST request ဝင်လာချိန်
  if (req.method === 'POST') {
    try {
      const { message } = req.body;
      
      if (!message || !message.text) {
        return res.status(200).json({ status: 'No text message' });
      }

      const chatId = message.chat.id;
      const userText = message.text;

      // 1. OpenRouter (Grok AI) သို့ မေးခွန်းပို့ခြင်း
      const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "x-ai/grok-2-1212",
          messages: [{ role: "user", content: userText }]
        })
      });

      const openRouterData = await openRouterResponse.json();
      const replyText = openRouterData.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";

      // 2. Telegram သို့ AI အဖြေကို ပြန်လည်ပို့ဆောင်ခြင်း
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText
        })
      });

      return res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Error handling update:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
