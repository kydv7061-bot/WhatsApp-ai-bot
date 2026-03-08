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

client.on('qr', async function() {
  var code = await client.requestPairingCode(process.env.WA_NUMBER);
  console.log('PAIRING CODE: ' + code);
});

client.on('ready', function() {
  console.log('Bot Ready!');
  startChannelAutoPoster(client);
});

client.on('auth_failure', function() { process.exit(1); });
client.on('disconnected', function() { process.exit(1); });

client.initialize();
