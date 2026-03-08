import cron from 'node-cron';
import axios from 'axios';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;

const POSTS = {
  morning: {
    time: '0 8 * * *',
    prompt: `Write a WhatsApp channel post about latest AI news from last 24 hours.
Format exactly like this:
🌅 *AI MORNING BRIEF*
━━━━━━━━━━━━━━━━━━━━
📌 *[Headline 1]*
[2-3 line summary in Hinglish]
📌 *[Headline 2]*
[2-3 line summary in Hinglish]
📌 *[Headline 3]*
[2-3 line summary in Hinglish]
━━━━━━━━━━━━━━━━━━━━
🤖 _Powered by AI Daily_`
  },
  afternoon: {
    time: '0 13 * * *',
    prompt: `Write a WhatsApp post about ONE useful AI tool.
Format exactly like this:
☀️ *AI TOOL SPOTLIGHT*
━━━━━━━━━━━━━━━━━━━━
🔧 *Tool: [NAME]*
❓ *Kya karta hai?*
[2-3 lines in Hinglish]
🚀 *Kyu try karo?*
[2-3 lines in Hinglish]
💰 *Price:* [Free/Paid/Freemium]
🔗 *Link:* [website]
━━━━━━━━━━━━━━━━━━━━
🤖 _Powered by AI Daily_`
  },
  evening: {
    time: '0 18 * * *',
    prompt: `Write a WhatsApp deep-dive post on the biggest AI story this week.
Format exactly like this:
🌆 *AI BIG STORY*
━━━━━━━━━━━━━━━━━━━━
🔥 *[Story Title]*
📖 *Kya hua?*
[3-4 lines in Hinglish]
💡 *Iska matlab kya hai?*
[2-3 lines in Hinglish]
🌏 *India ke liye?*
[1-2 lines in Hinglish]
━━━━━━━━━━━━━━━━━━━━
🤖 _Powered by AI Daily_`
  },
  night: {
    time: '0 22 * * *',
    prompt: `Write a fun WhatsApp post with a mind-blowing AI fact.
Format exactly like this:
🌙 *AI FACT OF THE DAY*
━━━━━━━━━━━━━━━━━━━━
🤯 *[Interesting Title]*
[3-4 fun lines in Hinglish]
💬 *Tumhara kya opinion hai? Reply karo!*
━━━━━━━━━━━━━━━━━━━━
🔁 _Share karo AI lovers ke saath!_
🤖 _Powered by AI Daily_`
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
          {
            role: 'system',
            content: 'You are an AI news curator for a WhatsApp channel. Always write in Hinglish (Hindi+English mix). Use WhatsApp formatting: *bold*, _italic_. Never add extra commentary.'
          },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Authorization': 'Bearer ' + GROQ_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    return res.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('Groq error:', err.message);
    return null;
  }
}

export function startChannelAutoPoster(sock) {
  console.log('Auto-Poster started! 8AM | 1PM | 6PM | 10PM IST');

  for (const [name, config] of Object.entries(POSTS)) {
    cron.schedule(config.time, async () => {
      console.log('Generating ' + name + ' post...');
      const content = await generatePost(config.prompt);
      if (content) {
        await sock.sendMessage(CHANNEL_ID + '@newsletter', { text: content });
        console.log('Posted: ' + name);
      }
    }, { timezone: 'Asia/Kolkata' });
  }
}
