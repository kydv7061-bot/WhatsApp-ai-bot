const cron = require('node-cron');
const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;

const POST_CONFIGS = {
  morning: {
    time: '0 8 * * *',
    prompt: `Write a WhatsApp channel post about latest AI news from last 24 hours.
Format:
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
Write in Hinglish.`
  },
  afternoon: {
    time: '0 13 * * *',
    prompt: `Write a WhatsApp post spotlighting ONE AI tool.
Format:
☀️ *AI TOOL SPOTLIGHT*
━━━━━━━━━━━━━━━━━━━━
🔧 *Tool Name: [NAME]*
❓ *Kya karta hai?* [2-3 lines]
🚀 *Kyu try karo?* [2-3 lines]
💰 *Price:* [Free/Paid/Freemium]
🔗 *Link:* [website]
━━━━━━━━━━━━━━━━━━━━
🤖 _Powered by AI Daily_
Write in Hinglish.`
  },
  evening: {
    time: '0 18 * * *',
    prompt: `Write a WhatsApp deep-dive on biggest AI story this week.
Format:
🌆 *AI BIG STORY*
━━━━━━━━━━━━━━━━━━━━
🔥 *[Story Title]*
📖 *Kya hua?* [3-4 lines]
💡 *Iska matlab?* [2-3 lines]
🌏 *India ke liye?* [1-2 lines]
━━━━━━━━━━━━━━━━━━━━
🤖 _Powered by AI Daily_
Write in Hinglish.`
  },
  night: {
    time: '0 22 * * *',
    prompt: `Write a fun WhatsApp post with mind-blowing AI fact.
Format:
🌙 *AI FACT OF THE DAY*
━━━━━━━━━━━━━━━━━━━━
🤯 *[Title]*
[3-4 fun lines]
💬 *Tumhara kya opinion hai?*
━━━━━━━━━━━━━━━━━━━━
🔁 _Share karo!_
🤖 _Powered by AI Daily_
Write in Hinglish.`
  }
};

async function generatePost(prompt) {
  try {
    var res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        max_tokens: 600,
        messages: [
          { role: 'system', content: 'You are an AI news curator. Write in Hinglish. Use WhatsApp formatting: *bold*, _italic_.' },
          { role: 'user', content: prompt }
        ]
      },
      { headers: { 'Authorization': 'Bearer ' + GROQ_API_KEY, 'Content-Type': 'application/json' } }
    );
    return res.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('Groq error:', err.message);
    return null;
  }
}

function startChannelAutoPoster(sock) {
  console.log('Auto-Poster started! 8AM | 1PM | 6PM | 10PM IST');

  Object.entries(POST_CONFIGS).forEach(function(entry) {
    var name = entry[0];
    var config = entry[1];
    cron.schedule(config.time, async function() {
      console.log('Generating ' + name + ' post...');
      var content = await generatePost(config.prompt);
      if (content) {
        await sock.sendMessage(CHANNEL_ID, { text: content });
        console.log('Posted: ' + name);
      }
    }, { timezone: 'Asia/Kolkata' });
  });
}

module.exports = { startChannelAutoPoster };
