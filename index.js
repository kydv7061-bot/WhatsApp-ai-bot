const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const { startChannelAutoPoster, generatePost, reschedulePost } = require('./ai-channel-autoposter');
const express = require('express');
const qrcode = require('qrcode');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var qrData = '';
var status = 'starting';
var currentClient = null;
var scheduledTimes = { morning: '08:00', afternoon: '13:00', evening: '18:00', night: '22:00' };

// ─── DASHBOARD ────────────────────────────────────────────
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
    .title { font-size:28px; font-weight:900; letter-spacing:6px; background:linear-gradient(90deg,#00d4ff,#0077ff,#00d4ff); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .divider { height:1px; background:linear-gradient(90deg,transparent,#00d4ff,transparent); margin:12px 0; }
    .status-bar { display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:16px; }
    .dot { width:8px; height:8px; border-radius:50%; background:${isConnected ? '#00ff66' : '#ffaa00'}; box-shadow:0 0 8px ${isConnected ? '#00ff66' : '#ffaa00'}; animation:pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .status-text { font-size:11px; letter-spacing:3px; color:${isConnected ? '#00ff66' : '#ffaa00'}; }
    .card { background:rgba(0,15,30,0.85); border:1px solid rgba(0,180,255,0.18); border-radius:8px; padding:16px; margin-bottom:12px; }
    .card-title { font-size:9px; letter-spacing:4px; color:#0088bb; margin-bottom:12px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .btn { background:rgba(0,80,160,0.3); border:1px solid rgba(0,180,255,0.35); color:#00d4ff; padding:10px 8px; border-radius:4px; font-family:'Share Tech Mono',monospace; font-size:11px; cursor:pointer; text-align:center; width:100%; }
    .btn-green { border-color:rgba(0,255,100,0.35); color:#00ff88; background:rgba(0,80,30,0.3); }
    .time-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
    .time-label { font-size:11px; color:#aaccdd; }
    .time-input { background:rgba(0,0,0,0.4); border:1px solid rgba(0,180,255,0.3); color:#00d4ff; padding:6px 10px; border-radius:3px; font-family:'Share Tech Mono',monospace; font-size:13px; width:90px; text-align:center; }
    .save-btn { background:rgba(0,100,40,0.4); border:1px solid rgba(0,255,100,0.3); color:#00ff66; padding:10px; border-radius:4px; font-family:'Share Tech Mono',monospace; font-size:11px; letter-spacing:2px; cursor:pointer; width:100%; margin-top:8px; }
    .toast { display:none; position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:rgba(0,20,10,0.9); border:1px solid #00ff66; color:#00ff66; padding:10px 24px; border-radius:4px; font-size:11px; letter-spacing:2px; z-index:999; }
    .qr-wrap { background:white; padding:12px; border-radius:6px; margin:8px auto; display:block; width:fit-content; }
    .qr-wrap img { width:220px; height:220px; display:block; }
    .hint { font-size:11px; color:#aaccdd; text-align:center; line-height:1.8; margin-top:8px; }
    .spin { width:32px; height:32px; border:2px solid #003344; border-top-color:#00d4ff; border-radius:50%; animation:spin 1s linear infinite; margin:12px auto; }
    @keyframes spin { to{transform:rotate(360deg);} }
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
  <div class="status-text">${isConnected ? 'SYSTEM ONLINE' : status === 'qr' ? 'SCAN QR CODE' : 'INITIALIZING...'}</div>
</div>

${!isConnected && qrData ? `
<div class="card">
  <div class="card-title">● SCAN TO CONNECT</div>
  <div class="qr-wrap"><img src="${qrData}"/></div>
  <div class="hint">WhatsApp → Linked Devices → Link a Device</div>
  <div style="font-size:9px;color:#003344;text-align:center;margin-top:8px;letter-spacing:2px;">AUTO REFRESH IN 20S</div>
  <meta http-equiv="refresh" content="20">
</div>
` : !isConnected ? `
<div class="card" style="text-align:center">
  <div class="card-title">● CONNECTING TO MONGODB</div>
  <div class="spin"></div>
  <div class="hint">Bot initialize ho raha hai...<br/>Thoda wait karo ☕</div>
  <meta http-equiv="refresh" content="5">
</div>
` : ''}

${isConnected ? `
<div class="card">
  <div class="card-title">● INSTANT POST</div>
  <div class="grid2">
    <button class="btn btn-green" onclick="sendPost('morning')">🌅 Morning Brief</button>
    <button class="btn btn-green" onclick="sendPost('afternoon')">☀️ Tool Spotlight</button>
    <button class="btn btn-green" onclick="sendPost('evening')">🌆 Big Story</button>
    <button class="btn btn-green" onclick="sendPost('night')">🌙 AI Fact</button>
  </div>
</div>
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
  showToast('⏳ Generating...', '#ffaa00');
  fetch('/send?type=' + type)
    .then(r => r.json())
    .then(d => { if(d.ok) showToast('✅ Posted!'); else showToast('❌ ' + d.error, '#ff4444'); })
    .catch(() => showToast('❌ Failed!', '#ff4444'));
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
    .then(d => { if(d.ok) showToast('✅ Schedule saved!'); else showToast('❌ Error', '#ff4444'); });
}
</script>
</body>
</html>`);
});

// ─── SEND POST ────────────────────────────────────────────
app.get('/send', async function(req, res) {
  try {
    var content = await generatePost(req.query.type || 'morning');
    if (content && currentClient) {
      await currentClient.sendMessage(process.env.CHANNEL_ID, content);
      res.json({ ok: true });
    } else {
      res.json({ ok: false, error: 'Failed to generate' });
    }
  } catch(e) {
    res.json({ ok: false, error: e.message });
  }
});

// ─── RESCHEDULE ───────────────────────────────────────────
app.post('/reschedule', function(req, res) {
  try {
    scheduledTimes = req.body;
    reschedulePost(scheduledTimes, currentClient);
    res.json({ ok: true });
  } catch(e) {
    res.json({ ok: false, error: e.message });
  }
});

app.listen(process.env.PORT || 3000, function() {
  console.log('JARVIS server started!');
});

// ─── MONGODB + WHATSAPP ───────────────────────────────────
async function start() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected!');

  const store = new MongoStore({ mongoose: mongoose });

  const client = new Client({
    authStrategy: new RemoteAuth({
      store: store,
      backupSyncIntervalMs: 300000
    }),
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
    console.log('Bot Ready! Session saved to MongoDB!');
    status = 'connected';
    qrData = '';
    startChannelAutoPoster(client, scheduledTimes);
  });

  client.on('remote_session_saved', function() {
    console.log('Session saved to MongoDB!');
  });

  client.on('auth_failure', function() {
    console.log('Auth failed!');
    process.exit(1);
  });

  client.on('disconnected', function() {
    console.log('Disconnected!');
    process.exit(1);
  });

  client.initialize();
}

start().catch(function(e) {
  console.error('Startup error:', e.message);
  process.exit(1);
});
