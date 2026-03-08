const { Client, LocalAuth } = require('whatsapp-web.js');
const { startChannelAutoPoster } = require('./ai-channel-autoposter');

const client = new Client({
  authStrategy: new LocalAuth(),
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

// Pairing code mode
client.on('qr', async () => {
  const number = process.env.WA_NUMBER; // Railway variable se
  const code = await client.requestPairingCode(number);
  console.log('🔑 Pairing Code:', code);
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

client.initialize();
