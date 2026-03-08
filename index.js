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

client.on('qr', function() {
  console.log('QR ready, waiting 5 seconds before pairing...');
  setTimeout(async function() {
    try {
      var number = process.env.WA_NUMBER;
      console.log('Requesting pairing code for: ' + number);
      var code = await client.requestPairingCode(number);
      console.log('===================');
      console.log('PAIRING CODE: ' + code);
      console.log('===================');
    } catch (e) {
      console.error('Pairing failed: ' + e.message);
    }
  }, 5000);
});

client.on('ready', function() {
  console.log('Bot Ready!');
  startChannelAutoPoster(client);
});

client.on('auth_failure', function() { process.exit(1); });
client.on('disconnected', function() { process.exit(1); });

client.initialize();
