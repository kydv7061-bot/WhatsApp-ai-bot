const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { startChannelAutoPoster } = require('./ai-channel-autoposter');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  }
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log('📱 QR Code scan karo WhatsApp se!');
});

client.on('ready', () => {
  console.log('✅ WhatsApp Bot Ready!');
  startChannelAutoPoster(client);
});

client.on('auth_failure', () => {
  console.log('❌ Auth failed! Restart karo.');
  process.exit(1);
});

client.on('disconnected', () => {
  console.log('❌ Disconnected! Restarting...');
  process.exit(1);
});

client.initialize();
