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

var pairingDone = false;

client.on('qr', function(qr) {
  if (pairingDone) return;
  pairingDone = true;
  
  var number = process.env.WA_NUMBER;
  console.log('Requesting pairing code for: ' + number);
  
  client.requestPairingCode(number).then(function(code) {
    console.log('');
    console.log('================================');
    console.log('  PAIRING CODE: ' + code);
    console.log('================================');
    console.log('WhatsApp > Linked Devices > Link with phone number');
  }).catch(function(err) {
    console.error('Failed: ' + err.message);
    pairingDone = false;
  });
});

client.on('ready', function() {
  console.log('Bot Ready!');
  startChannelAutoPoster(client);
});

client.on('authenticated', function() {
  console.log('Authenticated!');
});

client.on('auth_failure', function() {
  console.log('Auth Failed!');
  process.exit(1);
});

client.on('disconnected', function() {
  console.log('Disconnected!');
  process.exit(1);
});

client.initialize();
