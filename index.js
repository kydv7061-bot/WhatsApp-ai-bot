const { Client, LocalAuth } = require('whatsapp-web.js');
const { startChannelAutoPoster } = require('./ai-channel-autoposter');

const client = new Client({
  authStrategy: new LocalAuth(),
  pairingCodeEnabled: true,
  puppeteer: {
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process']
  }
});

client.on('qr', async () => {
  try {
    const code = await client.requestPairingCode(process.env.WA_NUMBER);
    console.log('PAIRING CODE: ' + code);
  } catch (e) {
    console.error('Error: ' + e.message);
  }
});

client.on('ready', () => {
  console.log('Bot Ready!');
  startChannelAutoPoster(client);
});

client.on('auth_failure', () => { process.exit(1); });
client.on('disconnected', () => { process.exit(1); });

client.initialize();  process.exit(1);
});

client.on('disconnected', () => {
  console.log('❌ Disconnected!');
  process.exit(1);
});

client.initialize();  process.exit(1);
});

client.initialize();
