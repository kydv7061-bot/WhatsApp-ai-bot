/**
 * ╔══════════════════════════════════════════╗
 * ║   AI CHANNEL AUTO-POSTER FOR WHATSAPP   ║
 * ║   4 posts/day | Powered by Claude API   ║
 * ╚══════════════════════════════════════════╝
 *
 * SETUP:
 * 1. npm install node-cron axios
 * 2. Fill in: CHANNEL_ID, CLAUDE_API_KEY
 * 3. Import this file in your main bot.js
 */

const cron = require("node-cron");
const axios = require("axios");

// ─── CONFIG ───────────────────────────────────────────────
const CLAUDE_API_KEY = "YOUR_CLAUDE_API_KEY"; // <-- Apni key
const CHANNEL_ID = "YOUR_CHANNEL_ID@newsletter"; // <-- WhatsApp channel JID

// ─── POST TYPES ───────────────────────────────────────────
const POST_CONFIGS = {
  morning: {
    time: "0 8 * * *", // 8:00 AM daily
    emoji: "🌅",
    label: "AI MORNING BRIEF",
    prompt: `You are an AI news curator. Write a WhatsApp channel post about the LATEST AI news from the last 24 hours.

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

Write in Hinglish (Hindi + English mix). Keep it engaging and informative. Use real recent AI news (ChatGPT, Gemini, Claude, Grok, open source models, AI tools, etc.)`,
  },

  afternoon: {
    time: "0 13 * * *", // 1:00 PM daily
    emoji: "☀️",
    label: "AI TOOL SPOTLIGHT",
    prompt: `You are an AI tools expert. Write a WhatsApp channel post spotlighting ONE interesting AI tool or product.

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

Write in Hinglish. Pick something genuinely useful — for creators, developers, or business owners. Must be a real tool.`,
  },

  evening: {
    time: "0 18 * * *", // 6:00 PM daily
    emoji: "🌆",
    label: "AI BIG STORY",
    prompt: `You are an AI journalist. Write a deep-dive WhatsApp post on the BIGGEST AI story of today or this week.

Format EXACTLY like this:
🌆 *AI BIG STORY*
━━━━━━━━━━━━━━━━━━━━

🔥 *[Story Title]*

📖 *Kya hua?*
[3-4 lines explaining the story]

💡 *Iska matlab kya hai?*
[2-3 lines on why it matters]

🌏 *India ke liye?*
[1-2 lines on impact for Indian users/developers]

━━━━━━━━━━━━━━━━━━━━
🤖 _Powered by AI Daily_

Write in Hinglish. Cover topics like: AI regulations, model releases, company news, breakthroughs, controversies.`,
  },

  night: {
    time: "0 22 * * *", // 10:00 PM daily
    emoji: "🌙",
    label: "AI FACT OF THE DAY",
    prompt: `You are an AI educator. Write a fun and mind-blowing WhatsApp post — either an AI fact, a viral AI moment, or an interesting AI experiment.

Format EXACTLY like this:
🌙 *AI FACT OF THE DAY*
━━━━━━━━━━━━━━━━━━━━

🤯 *[Interesting Title]*

[3-4 lines of the fact/story — make it surprising and easy to understand]

💬 *Tumhara kya opinion hai? Reply karo!*

━━━━━━━━━━━━━━━━━━━━
🔁 _Share karo AI lovers ke saath!_
🤖 _Powered by AI Daily_

Write in Hinglish. Keep it casual, fun, and shareable. Examples: AI art records, robot stories, GPT fun experiments, AI vs human comparisons.`,
  },
};

// ─── CLAUDE API CALL ──────────────────────────────────────
async function generatePost(prompt) {
  try {
    const res = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      }
    );

    // Extract text from response (handles tool_use blocks too)
    const text = (res.data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return text || null;
  } catch (err) {
    console.error("❌ Claude API error:", err?.response?.data || err.message);
    return null;
  }
}

// ─── SEND TO CHANNEL ──────────────────────────────────────
async function sendToChannel(client, message) {
  try {
    await client.sendMessage(CHANNEL_ID, message);
    console.log(`✅ Posted to channel at ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.error("❌ WhatsApp send error:", err.message);
  }
}

// ─── SCHEDULE ALL 4 POSTS ─────────────────────────────────
function startChannelAutoPoster(client) {
  console.log("🚀 AI Channel Auto-Poster started! 4 posts/day scheduled.");

  Object.entries(POST_CONFIGS).forEach(([name, config]) => {
    cron.schedule(config.time, async () => {
      console.log(`\n📝 Generating ${config.label}...`);

      const content = await generatePost(config.prompt);

      if (content) {
        await sendToChannel(client, content);
      } else {
        console.error(`❌ Failed to generate ${name} post`);
      }
    });

    console.log(`⏰ ${config.emoji} ${config.label} → scheduled`);
  });
}

// ─── MANUAL TEST (optional) ───────────────────────────────
// Ek specific post abhi test karna ho toh:
async function testPost(client, postType = "morning") {
  const config = POST_CONFIGS[postType];
  if (!config) return console.error("Invalid post type");

  console.log(`🧪 Testing ${config.label}...`);
  const content = await generatePost(config.prompt);
  if (content) {
    console.log("\n--- PREVIEW ---\n", content, "\n---------------");
    await sendToChannel(client, content);
  }
}

module.exports = { startChannelAutoPoster, testPost };

/**
 * ─── HOW TO USE IN YOUR BOT.JS ─────────────────────────
 *
 * const { startChannelAutoPoster, testPost } = require('./ai-channel-autoposter');
 *
 * client.on('ready', () => {
 *   console.log('Bot ready!');
 *   startChannelAutoPoster(client);  // Auto-posts shuru
 *
 *   // Test karna ho toh:
 *   // testPost(client, 'morning');
 * });
 *
 * ─── CHANNEL_ID KAISE DHUNDHE? ─────────────────────────
 * client.getChats().then(chats => {
 *   chats.forEach(c => {
 *     if (c.isChannel) console.log(c.name, c.id._serialized);
 *   });
 * });
 */
