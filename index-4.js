import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { startChannelAutoPoster } from './ai-channel-autoposter.js';

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
  });

  // Pairing code - 3 second delay for socket to be ready
  if (!sock.authState.creds.registered) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const code = await sock.requestPairingCode(process.env.WA_NUMBER);
      console.log('\n==================================');
      console.log('  PAIRING CODE: ' + code);
      console.log('==================================');
      console.log('WhatsApp > Linked Devices > Link with phone number\n');
    } catch (e) {
      console.error('Pairing error:', e.message);
    }
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        console.log('Reconnecting...');
        connectToWhatsApp();
      } else {
        console.log('Logged out!');
      }
    } else if (connection === 'open') {
      console.log('Bot Ready!');
      startChannelAutoPoster(sock);
    }
  });
}

connectToWhatsApp();
