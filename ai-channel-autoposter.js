const cron = require('node-cron');
const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;

const POSTS = {
  morning: {
    time: '0 8 * * *',
    prompt: `Write a WhatsApp channel post about latest AI news from last 24 hours.
Format exactly:
🌅 *AI MORNING BRIEF*
━━━━━━━━━━━━━━━━━━━━
📌 *[Headline 1]*
[2-3 lines]
📌 *[Headline 2]*
[2-3 lines]
📌 *[Headline 3]*
[2-3 lines]
━━━━━━━━━━━━━━━━━━━━
🤖 _Powered by AI Daily_
Write in Hinglish.`
  },
  afternoon: {
    time: '0 13 * * *',
    prompt: `Write a WhatsApp post about ONE useful AI tool.
Format exactly:
☀️ *AI TOOL SPOTLIGHT*
━━━━━━━━━━━━━━━━━━━━
🔧 *Tool: [NAME]*
❓ *Kya karta hai?*
[2-3 lines]
🚀 *Kyu try karo?*
[2-3 lines]
💰 *Price:* [Free/Paid/Freemium]
🔗 *Link:* [website]
━━━━━━━━━━━━━━━━━━━━
🤖 _Powered by AI Daily_
Write in Hinglish.`
  },
  evening: {
    time: '0 18 * * *',
    prompt: `Write a WhatsApp deep-dive on biggest AI story this week.
Format exactly:
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
Write in Hinglish.`
  },
  night: {
    time: '0 22 * * *',
    prompt: `Write a fun WhatsApp post with a mind-blowing AI fact.
Format exactly:
🌙 *AI FACT OF THE DAY*
━━━━━━━━━━━━━━━━━━━━
🤯 *[Title]*
[3-4 fun lines]
💬 *Tumhara kya opinion hai? Reply karo!*
━━━━━━━━━━━━━━━━━━━━
🔁 _Share karo AI lovers ke saath!_
🤖 _Powered by AI Daily_
Write in Hinglish.`
  }
};

async function generatePost(prompt) {
  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        max_tokens: 600,
        messages: [
          { role: 'system', content: 'You are an AI news curator for WhatsApp. Write in Hinglish. Use *bold* and _italic_ formatting.' },
          { role: 'user', content: prompt }
        ]
      },
      { headers: { 'Authorization': 'Bearer ' + GROQ_API_KEY, 'Content-Type': 'application/json' } }
    );
    return res.data.choices[0].message.content.trim();
  } catch (e) {
    console.error('Groq error:', e.message);
    return null;
  }
}

function startChannelAutoPoster(client) {
  console.log('Auto-Poster started! 8AM | 1PM | 6PM | 10PM IST');
  for (const [name, config] of Object.entries(POSTS)) {
    cron.schedule(config.time, async () => {
      console.log('Generating ' + name + ' post...');
      const content = await generatePost(config.prompt);
      if (content) {
        await client.sendMessage(CHANNEL_ID, content);
        console.log('Posted: ' + name);
      }
    }, { timezone: 'Asia/Kolkata' });
  }
}

module.exports = { startChannelAutoPoster };
