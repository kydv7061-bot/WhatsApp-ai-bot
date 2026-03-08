const { Client, LocalAuth } = require('whatsapp-web.js');
const { startChannelAutoPoster } = require('./ai-channel-autoposter');

const client = new Client({
  authStrategy: new LocalAuth(),
  pairingCodeEnabled: true, // ← Yeh missing tha!
  puppeteer: {
    executablePath: '/usr/bin/google-chrome-stable',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process'
    ]
  }
});

client.on('qr', async () => {
  try {
    const number = process.env.WA_NUMBER;
    const code = await client.requestPairingCode(number);
    console.log('🔑 PAIRING CODE:', code);
    console.log('👆 Yeh code WhatsApp Linked Devices mein daalo!');
  } catch (e) {
    console.error('❌ Pairing error:', e.message);
  }
});

client.on('ready', () => {
  console.log('✅ WhatsApp Bot Ready!');
  startChannelAutoPoster(client);
});

client.on('auth_failure', () => {
  console.log('❌ Auth Failed!');
  process.exit(1);
});

client.on('disconnected', () => {
  console.log('❌ Disconnected!');
  process.exit(1);
});

client.initialize();  process.exit(1);
});

client.initialize();
