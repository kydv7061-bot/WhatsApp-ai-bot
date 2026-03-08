const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { startChannelAutoPoster } = require('./ai-channel-autoposter');
const pino = require('pino');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' })
  });

  // Pairing code
  if (!sock.authState.creds.registered) {
    var number = process.env.WA_NUMBER;
    await sock.waitForConnectionUpdate((update) => !!update.qr);
    var code = await sock.requestPairingCode(number);
    console.log('');
    console.log('================================');
    console.log('  PAIRING CODE: ' + code);
    console.log('================================');
    console.log('WhatsApp > Linked Devices > Link with phone number');
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', function(update) {
    var connection = update.connection;
    var lastDisconnect = update.lastDisconnect;

    if (connection === 'close') {
      var shouldReconnect = lastDisconnect && lastDisconnect.error &&
        lastDisconnect.error.output &&
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;

      console.log('Disconnected. Reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('Bot Ready!');
      startChannelAutoPoster(sock);
    }
  });
}

startBot();
