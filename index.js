const { Client, LocalAuth } = require('whatsapp-web.js');
const { startChannelAutoPoster } = require('./ai-channel-autoposter');
const express = require('express');
const qrcode = require('qrcode');

const app = express();
var qrData = '';
var status = 'starting';
var pairingCode = '';
var clientReady = false;
var currentClient = null;

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
      box-shadow:0 0 40px rgba(0,120,200,0.1); width:100%; max-width:360px;
    }
    .badge { font-size:10px; letter-spacing:3px; padding:4px 16px; border-radius:2px; border:1px solid; }
    .badge-wait { border-color:rgba(0,180,255,0.3); color:#0077aa; }
    .badge-scan { border-color:rgba(0,255,150,0.4); color:#00ff88; }
    .badge-ok { border-color:rgba(0,255,150,0.6); color:#00ff66; }
    .badge-pair { border-color:rgba(255,180,0,0.4); color:#ffaa00; }
    .qr-wrap { background:white; padding:14px; border-radius:6px; border:3px solid rgba(0,212,255,0.4); }
    .qr-wrap img { display:block; width:240px; height:240px; }
    .hint { font-size:12px; color:#aaccdd; text-align:center; line-height:2; letter-spacing:1px; }
    .hint b { color:#00d4ff; }
    .note { font-size:9px; color:#003344; letter-spacing:2px; }
    .code-box {
      background:rgba(0,0,0,0.5); border:2px solid #ffaa00;
      border-radius:8px; padding:16px 24px; text-align:center;
    }
    .code-label { font-size:9px; letter-spacing:4px; color:#ffaa00; margin-bottom:8px; }
    .code-value { font-size:32px; letter-spacing:6px; color:#fff; font-weight:bold; }
    .pair-btn {
      background:rgba(0,100,180,0.3); border:1px solid rgba(0,180,255,0.5);
      color:#00d4ff; padding:10px 24px; border-radius:4px;
      font-family:'Share Tech Mono',monospace; font-size:12px; letter-spacing:3px;
      cursor:pointer; text-decoration:none; display:inline-block; margin-top:4px;
    }
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
      <div class="hint">Bot connected hai!<br/><b>8AM · 1PM · 6PM · 10PM IST</b></div>
      <div class="row"><div class="pulse"></div><div class="note">AI CHANNEL AUTOPOSTER ACTIVE</div></div>
    ` : pairingCode ? `
      <div class="badge badge-pair">● PAIRING CODE READY</div>
      <div class="code-box">
        <div class="code-label">ENTER THIS CODE IN WHATSAPP</div>
        <div class="code-value">${pairingCode}</div>
      </div>
      <div class="hint">WhatsApp → <b>Linked Devices</b><br/>→ <b>Link with phone number</b><br/>→ Code daalo</div>
      <div class="note">PAGE AUTO REFRESHES EVERY 20S</div>
    ` : qrData ? `
      <div class="badge badge-scan">● QR READY — SCAN NOW</div>
      <div class="qr-wrap"><img src="${qrData}" /></div>
      <div class="hint">WhatsApp → <b>Linked Devices</b><br/>→ <b>Link a Device</b> → Scan karo</div>
      <a href="/pair" class="pair-btn">→ USE PAIRING CODE INSTEAD</a>
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

// Pairing code route
app.get('/pair', async function(req, res) {
  if (!currentClient) {
    return res.send('<h2 style="color:red;font-family:sans-serif;">Bot not ready yet! Wait karo aur wapas aao.</h2>');
  }
  try {
    var number = process.env.WA_NUMBER;
    if (!number) {
      return res.send('<h2 style="color:red;font-family:sans-serif;">WA_NUMBER variable set nahi hai Railway pe!</h2>');
    }
    var code = await currentClient.requestPairingCode(number);
    pairingCode = code;
    console.log('Pairing code generated: ' + code);
    res.redirect('/');
  } catch(e) {
    res.send('<h2 style="color:red;font-family:sans-serif;">Error: ' + e.message + '</h2>');
  }
});

app.listen(process.env.PORT || 3000, function() {
  console.log('JARVIS server started!');
});

const client = new Client({
  authStrategy: new LocalAuth(),
  pairingCodeEnabled: true,
  puppeteer: {
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process']
  }
});

currentClient = client;

client.on('qr', async function(qr) {
  console.log('QR Ready!');
  status = 'qr';
  qrData = await qrcode.toDataURL(qr, { errorCorrectionLevel: 'H', margin: 2, width: 400 });
});

client.on('ready', function() {
  console.log('Bot Ready!');
  status = 'connected';
  qrData = '';
  pairingCode = '';
  startChannelAutoPoster(client);
});

client.on('auth_failure', function() { process.exit(1); });
client.on('disconnected', function() { process.exit(1); });

client.initialize();
