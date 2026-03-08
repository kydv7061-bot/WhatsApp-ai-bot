/**
 * ╔══════════════════════════════════════════╗
 * ║   AI CHANNEL AUTO-POSTER FOR WHATSAPP   ║
 * ║   4 posts/day | Powered by Groq API     ║
 * ╚══════════════════════════════════════════╝
 */

const cron = require("node-cron");
const axios = require("axios");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;

const POST_CONFIGS = {
  morning: {
    time: "0 8 * * *",
    prompt: `Write a WhatsApp channel post about latest AI news from last 24 hours.

Format EXACTLY like this:
🌅 *AI MORNING BRIEF*
━━━━━━━━━━━━━━━━━━━━

📌 *[Headline 1]*
[2-3 line summary]

📌 *[Headline 2]*
[2-3 line summary]

📌 *[Headline 3]*
[2-3 line summary]

━━━━━━━━━━━━━━━━━━━━
🤖 _Powered by AI Daily_

Write in Hinglish. Cover real AI news: ChatGPT, Gemini, Claude, Grok, open source models, AI tools.`,
  },

  afternoon: {
    time: "0 13 * * *",
    prompt: `Write a WhatsApp channel post spotlighting ONE interesting AI tool.

Format EXACTLY like this:
☀️ *AI TOOL SPOTLIGHT*
━━━━━━━━━━━━━━━━━━━━

🔧 *Tool Name: [NAME]*

❓ *Kya karta hai?*
[2-3 lines]

🚀 *Kyu try karo?*
[2-3 lines]

💰 *Price:* [Free/Paid/Freemium]
🔗 *Link:* [website]

━━━━━━━━━━━━━━━━━━━━
🤖 _Powered by AI Daily_

Write in Hinglish.`,
  },

  evening: {
    time: "0 18 * * *",
    prompt: `Write a WhatsApp deep-dive post on the biggest AI story this week.

Format EXACTLY like this:
🌆 *AI BIG STORY*
━━━━━━━━━━━━━━━━━━━━

🔥 *[Story Title]*

📖 *Kya hua?*
[3-4 lines]

💡 *Iska matlab kya hai?*
[2-3 lines]

🌏 *India ke liye?*
[1-2 lines]

━━━━━━━━━━━━━━━━━━━━
🤖 _Powered by AI Daily_

Write in Hinglish.`,
  },

  night: {
    time: "0 22 * * *",
    prompt: `Write a fun WhatsApp post with a mind-blowing AI fact or viral AI moment.

Format EXACTLY like this:
🌙 *AI FACT OF THE DAY*
━━━━━━━━━━━━━━━━━━━━

🤯 *[Interesting Title]*

[3-4 lines — surprising and easy to understand]

💬 *Tumhara kya opinion hai? Reply karo!*

━━━━━━━━━━━━━━━━━━━━
🔁 _Share karo AI lovers ke saath!_
🤖 _Powered by AI Daily_

Write in Hinglish. Keep it fun and shareable.`,
  },
};

async function generatePost(prompt) {
  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        max_tokens: 600,
        messages: [
          {
            role: "system",
            content: "You are an AI news curator for a WhatsApp channel. Write in Hinglish (Hindi+English). Use WhatsApp formatting: *bold*, _italic_.",
          },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${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}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("❌ Groq API error:", err?.response?.data || err.message);
    return null;
  }
}

async function sendToChannel(client, message) {
  try {
    await client.sendMessage(CHANNEL_ID, message);
    console.log(`✅ Posted at ${new Date().toLocaleTimeString("en-IN")}`);
  } catch (err) {
    console.error("❌ Send error:", err.message);
  }
}

function startChannelAutoPoster(client) {
  console.log("🚀 Auto-Poster started! Schedule: 8AM | 1PM | 6PM | 10PM IST");

  Object.entries(POST_CONFIGS).forEach(([name, config]) => {
    cron.schedule(config.time, async () => {
      console.log(`\n📝 Generating ${name} post...`);
      const content = await generatePost(config.prompt);
      if (content) await sendToChannel(client, content);
    }, { timezone: "Asia/Kolkata" });
  });
}

async function testPost(client, postType = "morning") {
  const config = POST_CONFIGS[postType];
  if (!config) return console.error("Use: morning/afternoon/evening/night");
  const content = await generatePost(config.prompt);
  if (content) {
    console.log("\n--- PREVIEW ---\n", content, "\n---");
    await sendToChannel(client, content);
  }
}

module.exports = { startChannelAutoPoster, testPost };
