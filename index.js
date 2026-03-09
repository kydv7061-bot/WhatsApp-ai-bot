const { Client, LocalAuth } = require('whatsapp-web.js');
const { startChannelAutoPoster } = require('./ai-channel-autoposter');
const express = require('express');
const qrcode = require('qrcode');

const app = express();
var qrData = '';
var status = 'starting';

app.get('/', function(req, res) {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="20">
  <title>JARVIS — WhatsApp Bot</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      background:#030810; min-height:100vh; display:flex; flex-direction:column;
      align-items:center; justify-content:center; font-family:'Share Tech Mono',monospace;
      color:#00d4ff; background-image:radial-gradient(ellipse at 50% 0%, rgba(0,100,180,0.15) 0%, transparent 70%);
      padding:20px;
    }
    .brand { font-size:11px; letter-spacing:8px; color:#0088bb; margin-bottom:6px; }
    .title {
      font-size:36px; font-weight:900; letter-spacing:8px;
      background:linear-gradient(90deg,#00d4ff,#0077ff,#00d4ff);
      -webkit-background-clip:text; -webkit-text-fill-color:transparent;
      filter:drop-shadow(0 0 20px rgba(0,180,255,0.5)); margin-bottom:4px;
    }
    .subtitle { font-size:9px; letter-spacing:4px; color:#004466; margin-bottom:20px; }
    .divider { width:200px; height:1px; background:linear-gradient(90deg,transparent,#00d4ff,transparent); margin-bottom:20px; }
    .card {
      background:rgba(0,15,30,0.9); border:1px solid rgba(0,180,255,0.25); border-radius:8px;
      padding:24px 20px; display:flex; flex-direction:column; align-items:center; gap:14px;
      box-shadow:0 0 40px rgba(0,120,200,0.1); width:100%; max-width:340px;
    }
    .badge { font-size:10px; letter-spacing:3px; padding:4px 16px; border-radius:2px; border:1px solid; }
    .badge-wait { border-color:rgba(0,180,255,0.3); color:#0077aa; }
    .badge-scan { border-color:rgba(0,255,150,0.4); color:#00ff88; }
    .badge-ok { border-color:rgba(0,255,150,0.6); color:#00ff66; }
    .qr-wrap { background:white; padding:14px; border-radius:6px; border:3px solid rgba(0,212,255,0.4); box-shadow:0 0 20px rgba(0,180,255,0.2); }
    .qr-wrap img { display:block; width:240px; height:240px; }
    .hint { font-size:12px; color:#aaccdd; text-align:center; line-height:2; letter-spacing:1px; }
    .hint b { color:#00d4ff; }
    .note { font-size:9px; color:#003344; letter-spacing:2px; }
    .pulse { width:10px; height:10px; border-radius:50%; background:#00ff66; box-shadow:0 0 10px #00ff66; animation:pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.5;transform:scale(1.4);} }
    .row { display:flex; align-items:center; gap:10px; }
    .spin { width:32px; height:32px; border:2px solid #003344; border-top-color:#00d4ff; border-radius:50%; animation:spin 1s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg);} }
  </style>
</head>
<body>
  <div class="brand">STARK INDUSTRIES</div>
  <div class="title">J.A.R.V.I.S</div>
  <div class="subtitle">WHATSAPP AI CHANNEL BOT</div>
  <div class="divider"></div>
  <div class="card">
    ${status === 'connected' ? `
      <div class="badge badge-ok">● SYSTEM ONLINE</div>
      <div style="font-size:52px">✅</div>
      <div class="hint">Bot connected hai!<br/><b>8AM · 1PM · 6PM · 10PM IST</b><br/>Daily 4 posts auto ho rahe hain</div>
      <div class="row"><div class="pulse"></div><div class="note">AI CHANNEL AUTOPOSTER ACTIVE</div></div>
    ` : qrData ? `
      <div class="badge badge-scan">● QR READY — SCAN NOW</div>
      <div class="qr-wrap"><img src="${qrData}" /></div>
      <div class="hint">WhatsApp → <b>Linked Devices</b><br/>→ <b>Link a Device</b> → Scan karo</div>
      <div class="note">PAGE AUTO REFRESHES EVERY 20S</div>
    ` : `
      <div class="badge badge-wait">● INITIALIZING</div>
      <div class="spin"></div>
      <div class="hint">Bot start ho raha hai...<br/>Thoda wait karo ☕</div>
      <div class="note">PAGE AUTO REFRESHES EVERY 20S</div>
    `}
  </div>
  <div style="margin-top:16px;font-size:9px;color:#002233;letter-spacing:3px;">POWERED BY GROQ AI + WHATSAPP</div>
</body>
</html>`);
});

app.listen(process.env.PORT || 3000, function() {
  console.log('JARVIS server started!');
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process']
  }
});

client.on('qr', async function(qr) {
  console.log('QR Ready! Open Railway URL!');
  status = 'qr';
  qrData = await qrcode.toDataURL(qr, { errorCorrectionLevel: 'H', margin: 2, width: 400 });
});

client.on('ready', function() {
  console.log('Bot Ready!');
  status = 'connected';
  qrData = '';
  startChannelAutoPoster(client);
});

client.on('auth_failure', function() { process.exit(1); });
client.on('disconnected', function() { process.exit(1); });

client.initialize();
