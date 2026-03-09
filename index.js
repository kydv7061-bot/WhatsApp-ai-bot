const { Client, LocalAuth } = require('whatsapp-web.js');
const { startChannelAutoPoster, generatePost, reschedulePost } = require('./ai-channel-autoposter');
const express = require('express');
const qrcode = require('qrcode');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var qrData = '';
var status = 'starting';
var pairingCode = '';
var currentClient = null;
var scheduledTimes = { morning: '08:00', afternoon: '13:00', evening: '18:00', night: '22:00' };

// ─── MAIN DASHBOARD ───────────────────────────────────────
app.get('/', function(req, res) {
  var isConnected = status === 'connected';
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JARVIS Control Panel</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#030810; min-height:100vh; font-family:'Share Tech Mono',monospace; color:#00d4ff; padding:16px; background-image:radial-gradient(ellipse at 50% 0%, rgba(0,100,180,0.12) 0%, transparent 60%); }
    .header { text-align:center; padding:20px 0 16px; }
    .brand { font-size:10px; letter-spacing:8px; color:#0088bb; }
    .title { font-size:28px; font-weight:900; letter-spacing:6px; background:linear-gradient(90deg,#00d4ff,#0077ff,#00d4ff); -webkit-background-clip:text; -webkit-text-fill-color:transparent; filter:drop-shadow(0 0 15px rgba(0,180,255,0.4)); }
    .divider { height:1px; background:linear-gradient(90deg,transparent,#00d4ff,transparent); margin:12px 0; }
    .status-bar { display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:16px; }
    .dot { width:8px; height:8px; border-radius:50%; background:${isConnected ? '#00ff66' : '#ff4444'}; box-shadow:0 0 8px ${isConnected ? '#00ff66' : '#ff4444'}; animation:pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .status-text { font-size:11px; letter-spacing:3px; color:${isConnected ? '#00ff66' : '#ff4444'}; }
    .card { background:rgba(0,15,30,0.85); border:1px solid rgba(0,180,255,0.18); border-radius:8px; padding:16px; margin-bottom:12px; }
    .card-title { font-size:9px; letter-spacing:4px; color:#0088bb; margin-bottom:12px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .btn { background:rgba(0,80,160,0.3); border:1px solid rgba(0,180,255,0.35); color:#00d4ff; padding:10px 8px; border-radius:4px; font-family:'Share Tech Mono',monospace; font-size:11px; letter-spacing:1px; cursor:pointer; text-align:center; transition:all 0.2s; width:100%; }
    .btn:hover { background:rgba(0,120,220,0.4); border-color:rgba(0,200,255,0.6); }
    .btn-green { border-color:rgba(0,255,100,0.35); color:#00ff88; background:rgba(0,80,30,0.3); }
    .btn-green:hover { background:rgba(0,120,50,0.4); }
    .btn-orange { border-color:rgba(255,160,0,0.35); color:#ffaa00; background:rgba(80,40,0,0.3); }
    .time-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
    .time-label { font-size:11px; color:#aaccdd; }
    .time-input { background:rgba(0,0,0,0.4); border:1px solid rgba(0,180,255,0.3); color:#00d4ff; padding:6px 10px; border-radius:3px; font-family:'Share Tech Mono',monospace; font-size:13px; width:90px; text-align:center; }
    .save-btn { background:rgba(0,100,40,0.4); border:1px solid rgba(0,255,100,0.3); color:#00ff66; padding:10px; border-radius:4px; font-family:'Share Tech Mono',monospace; font-size:11px; letter-spacing:2px; cursor:pointer; width:100%; margin-top:8px; }
    .toast { display:none; position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:rgba(0,255,100,0.15); border:1px solid #00ff66; color:#00ff66; padding:10px 24px; border-radius:4px; font-size:11px; letter-spacing:2px; z-index:999; }
    .qr-wrap { background:white; padding:12px; border-radius:6px; margin:8px auto; display:block; width:fit-content; }
    .qr-wrap img { width:200px; height:200px; display:block; }
    .code-box { background:rgba(0,0,0,0.5); border:2px solid #ffaa00; border-radius:6px; padding:12px; text-align:center; }
    .code-val { font-size:28px; letter-spacing:6px; color:#fff; }
    .hint { font-size:11px; color:#aaccdd; text-align:center; line-height:1.8; margin-top:8px; }
    select { background:rgba(0,0,0,0.5); border:1px solid rgba(0,180,255,0.3); color:#00d4ff; padding:8px; border-radius:3px; font-family:'Share Tech Mono',monospace; font-size:11px; width:100%; margin-bottom:8px; }
  </style>
</head>
<body>

<div class="header">
  <div class="brand">STARK INDUSTRIES</div>
  <div class="title">J.A.R.V.I.S</div>
  <div class="brand" style="margin-top:4px">CONTROL PANEL</div>
</div>

<div class="divider"></div>

<div class="status-bar">
  <div class="dot"></div>
  <div class="status-text">${isConnected ? 'SYSTEM ONLINE' : status === 'qr' ? 'AWAITING SCAN' : 'INITIALIZING'}</div>
</div>

${!isConnected && qrData ? `
<div class="card">
  <div class="card-title">● SCAN TO CONNECT</div>
  <div class="qr-wrap"><img src="${qrData}"/></div>
  <div class="hint">WhatsApp → Linked Devices → Link a Device</div>
</div>
` : ''}

${!isConnected && pairingCode ? `
<div class="card">
  <div class="card-title">● PAIRING CODE</div>
  <div class="code-box"><div class="code-val">${pairingCode}</div></div>
  <div class="hint">WhatsApp → Linked Devices → Link with phone number</div>
</div>
` : ''}

${isConnected ? `
<!-- QUICK POST -->
<div class="card">
  <div class="card-title">● INSTANT POST</div>
  <div class="grid2">
    <button class="btn btn-green" onclick="sendPost('morning')">🌅 Morning Brief</button>
    <button class="btn btn-green" onclick="sendPost('afternoon')">☀️ Tool Spotlight</button>
    <button class="btn btn-green" onclick="sendPost('evening')">🌆 Big Story</button>
    <button class="btn btn-green" onclick="sendPost('night')">🌙 AI Fact</button>
  </div>
</div>

<!-- SCHEDULE -->
<div class="card">
  <div class="card-title">● RESCHEDULE POSTS (IST)</div>
  <div class="time-row"><span class="time-label">🌅 Morning Brief</span><input type="time" class="time-input" id="t_morning" value="${scheduledTimes.morning}"/></div>
  <div class="time-row"><span class="time-label">☀️ Tool Spotlight</span><input type="time" class="time-input" id="t_afternoon" value="${scheduledTimes.afternoon}"/></div>
  <div class="time-row"><span class="time-label">🌆 Big Story</span><input type="time" class="time-input" id="t_evening" value="${scheduledTimes.evening}"/></div>
  <div class="time-row"><span class="time-label">🌙 AI Fact</span><input type="time" class="time-input" id="t_night" value="${scheduledTimes.night}"/></div>
  <button class="save-btn" onclick="saveSchedule()">💾 SAVE SCHEDULE</button>
</div>
` : ''}

<div class="toast" id="toast"></div>

<script>
function showToast(msg, color) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  t.style.borderColor = color || '#00ff66';
  t.style.color = color || '#00ff66';
  setTimeout(function(){ t.style.display='none'; }, 3000);
}

function sendPost(type) {
  showToast('⏳ Generating post...', '#ffaa00');
  fetch('/send?type=' + type)
    .then(r => r.json())
    .then(d => { if(d.ok) showToast('✅ Posted to channel!'); else showToast('❌ Error: ' + d.error, '#ff4444'); })
    .catch(e => showToast('❌ Failed!', '#ff4444'));
}

function saveSchedule() {
  var data = {
    morning: document.getElementById('t_morning').value,
    afternoon: document.getElementById('t_afternoon').value,
    evening: document.getElementById('t_evening').value,
    night: document.getElementById('t_night').value
  };
  fetch('/reschedule', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) })
    .then(r => r.json())
    .then(d => { if(d.ok) showToast('✅ Schedule saved! Restart hoga.'); else showToast('❌ Error', '#ff4444'); })
    .catch(() => showToast('❌ Failed!', '#ff4444'));
}
</script>
</body>
</html>`);
});

// ─── SEND POST NOW ─────────────────────────────────────────
app.get('/send', async function(req, res) {
  var type = req.query.type || 'morning';
  try {
    var content = await generatePost(type);
    if (content && currentClient) {
      await currentClient.sendMessage(process.env.CHANNEL_ID, content);
      res.json({ ok: true });
    } else {
      res.json({ ok: false, error: 'Generate failed' });
    }
  } catch(e) {
    res.json({ ok: false, error: e.message });
  }
});

// ─── RESCHEDULE ────────────────────────────────────────────
app.post('/reschedule', function(req, res) {
  try {
    var times = req.body;
    scheduledTimes = times;
    reschedulePost(times, currentClient);
    res.json({ ok: true });
  } catch(e) {
    res.json({ ok: false, error: e.message });
  }
});

// ─── PAIRING ──────────────────────────────────────────────
app.get('/pair', async function(req, res) {
  try {
    await new Promise(r => setTimeout(r, 2000));
    var code = await currentClient.requestPairingCode(process.env.WA_NUMBER);
    pairingCode = code;
    res.redirect('/');
  } catch(e) {
    res.redirect('/');
  }
});

app.listen(process.env.PORT || 3000, function() {
  console.log('JARVIS Control Panel started!');
});

// ─── WHATSAPP CLIENT ──────────────────────────────────────
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
  status = 'qr';
  qrData = await qrcode.toDataURL(qr, { errorCorrectionLevel: 'H', margin: 2, width: 400 });
  console.log('QR Ready!');
});

client.on('ready', function() {
  status = 'connected';
  qrData = '';
  pairingCode = '';
  console.log('Bot Ready!');
  startChannelAutoPoster(client, scheduledTimes);
});

client.on('auth_failure', function() { process.exit(1); });
client.on('disconnected', function() { process.exit(1); });

client.initialize();
