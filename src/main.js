const STORAGE_KEY = 'focusforge:v1';
const TOKEN_KEY = 'focusforge:spotify';
const PKCE_KEY = 'focusforge:pkce';

const MODES = {
  pomodoro: { label: 'Pomodoro', emoji: '🍅', description: '25 / 5 with a longer reset after 4 rounds', focus: 25, short: 5, long: 15, rounds: 4 },
  '52-17': { label: '52 / 17', emoji: '🕘', description: 'One long focus block, one meaningful break', focus: 52, short: 17, long: 17, rounds: 1 },
  deep: { label: 'Deep Work', emoji: '◉', description: '90 minutes on, 20 minutes off', focus: 90, short: 20, long: 20, rounds: 1 },
  animedoro: { label: 'Animedoro', emoji: '📺', description: '40 minutes of focus, 20 minutes to reset', focus: 40, short: 20, long: 20, rounds: 1 },
  countdown: { label: 'Countdown', emoji: '⏳', description: 'One focused block with no automatic breaks', focus: 30, short: 5, long: 15, rounds: 1 },
  stopwatch: { label: 'Stopwatch', emoji: '⏱', description: 'Count up until you decide to stop', focus: 0, short: 0, long: 0, rounds: 1 },
  custom: { label: 'Custom', emoji: '✦', description: 'Your own rhythm, down to the minute', focus: 45, short: 10, long: 20, rounds: 4 }
};

const THEMES = {
  // External artwork is intentionally pulled from Unsplash's free image library so the
  // themes feel like real photographic/illustrated landscapes instead of synthetic SVGs.
  forest: { label: 'Alpine Coast', kicker: 'mist / evergreen / blue', art: 'https://images.unsplash.com/photo-1647013450473-673c4824e27f?auto=format&fit=crop&fm=jpg&q=85&w=2400', vars: { accent:'#73b9ff', accent2:'#3c8de8', bg:'#08111b' } },
  midnight: { label: 'Cosmic Dunes', kicker: 'space / dusk / wide open', art: 'https://images.unsplash.com/photo-1765813957002-d38730e03b11?auto=format&fit=crop&fm=jpg&q=85&w=2400', vars: { accent:'#59b7ff', accent2:'#2f83da', bg:'#070d18' } },
  desert: { label: 'Desert Twilight', kicker: 'sand / stars / cobalt', art: 'https://images.unsplash.com/photo-1650114013443-8c4d8b36b319?auto=format&fit=crop&fm=jpg&q=85&w=2400', vars: { accent:'#78aaff', accent2:'#4a77e8', bg:'#0e101a' } },
  ocean: { label: 'PNW Coast', kicker: 'shore / rain / blue hour', art: 'https://images.unsplash.com/photo-1768666950721-725d5f943be8?auto=format&fit=crop&fm=jpg&q=85&w=2400', vars: { accent:'#55d9ff', accent2:'#249dcc', bg:'#06141d' } },
  studio: { label: 'Moonlit Observatory', kicker: 'clean / lunar / calm', art: 'https://images.unsplash.com/photo-1540952602130-34ce5b4bac66?auto=format&fit=crop&fm=jpg&q=85&w=2400', vars: { accent:'#8bb9ff', accent2:'#5a85db', bg:'#0a0f19' } },
  neon: { label: 'Aurora Bay', kicker: 'electric / night / coast', art: 'https://images.unsplash.com/photo-1550656722-8099c82ab00c?auto=format&fit=crop&fm=jpg&q=85&w=2400', vars: { accent:'#79a6ff', accent2:'#586eea', bg:'#080b18' } }
};

const SOUND_DEFS = {
  rain: { label: 'Rain on glass', detail: 'steady rainfall + soft drops', icon: '☂' },
  brown: { label: 'Brown noise', detail: 'deep low-frequency masking', icon: '≈' },
  cafe: { label: 'Quiet café', detail: 'murmur, cups, distant room tone', icon: '☕' },
  fire: { label: 'Fireplace', detail: 'warm hiss + irregular crackle', icon: '♨' },
  ocean: { label: 'Ocean surf', detail: 'slow rolling waves + foam', icon: '∿' },
  wind: { label: 'Mountain wind', detail: 'broad airy gusts', icon: '⌁' },
  white: { label: 'White noise', detail: 'bright even masking', icon: '▱' }
};

const CURATED_PLAYLISTS = [
  { title: 'Deep Focus Radio', note: 'ambient / instrumental', url: 'https://open.spotify.com/playlist/37i9dQZF1E4u1QVkSbTm4P', glyph: '◒' },
  { title: 'Peaceful Piano', note: 'modern classical / soft', url: 'https://open.spotify.com/playlist/2CjqpIIpT2yriVzOqBIdiP', glyph: '⌁' },
  { title: 'Deep Focus Music', note: 'nature / minimal / long-form', url: 'https://open.spotify.com/playlist/0AxEJ06ySlTBEyR3Aq6A39', glyph: '◉' },
  { title: 'Pure Piano', note: 'solo piano / low distraction', url: 'https://open.spotify.com/playlist/1cvPpujeNNmtF3q2hjR3wp', glyph: '◇' }
];

const QUOTES = [
  'Make the next hour count, not the next ten years.',
  'You do not need to feel ready to begin.',
  'Protect the first five minutes. Momentum handles the rest.',
  'Less switching. More finishing.',
  'Work quietly. Let the result be loud.',
  'A focused hour is still an hour you own.'
];

const defaultState = {
  view: 'home',
  theme: 'midnight',
  customBg: '',
  greetingName: 'there',
  quoteEnabled: true,
  notifications: true,
  autoStartBreaks: false,
  alertEnabled: true,
  selectedMode: 'pomodoro',
  durations: { focus: 25, short: 5, long: 15, rounds: 4, countdown: 30, animedoro: 40 },
  timer: { running: false, phase: 'focus', remaining: 1500, total: 1500, cycle: 1, taskId: null, startedAt: null, accumulated: 0 },
  tasks: [],
  sessions: [],
  soundLayers: {},
  activePlaylist: null,
  showCompleted: false,
  spotify: { connected: false, profile: null, playlists: [], nowPlaying: null }
};

let state = loadState();
let audioEngine = null;
let timerInterval = null;
let runtimeConfig = { spotifyClientId: '' };

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function mergeState(saved) {
  const base = clone(defaultState);
  return {
    ...base,
    ...saved,
    durations: { ...base.durations, ...(saved?.durations || {}) },
    timer: { ...base.timer, ...(saved?.timer || {}) },
    spotify: { ...base.spotify, ...(saved?.spotify || {}) }
  };
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const loaded = raw ? mergeState(JSON.parse(raw)) : clone(defaultState);
    if (!THEMES[loaded.theme]) loaded.theme='midnight';
    if (!['home','focus','tasks','stats','sound','settings'].includes(loaded.view)) loaded.view='home';
    return loaded;
  } catch { return clone(defaultState); }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function uid() { return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function esc(str) { return String(str ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c])); }
function todayKey(date = new Date()) { const d = new Date(date); return d.toISOString().slice(0,10); }
function formatTime(seconds, stopwatch = false) {
  seconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  if (stopwatch || h > 0) return [h, m, s].map((v,i) => i===0 ? String(v).padStart(2,'0') : String(v).padStart(2,'0')).join(':');
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function formatMinutes(mins) {
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}
function localDateLabel(date = new Date()) {
  return new Intl.DateTimeFormat(undefined, { weekday:'long', month:'long', day:'numeric' }).format(date);
}
function timeNow() { return new Intl.DateTimeFormat([], { hour:'numeric', minute:'2-digit' }).format(new Date()); }
function currentMode() { return MODES[state.selectedMode] || MODES.pomodoro; }
function durationForPhase(phase) {
  if (state.selectedMode === 'stopwatch') return 0;
  if (state.selectedMode === 'countdown') return state.durations.countdown * 60;
  if (phase === 'focus') {
    if (state.selectedMode === 'animedoro') return state.durations.animedoro * 60;
    return state.durations.focus * 60;
  }
  if (phase === 'long') return state.durations.long * 60;
  return state.durations.short * 60;
}
function getCurrentTask() { return state.tasks.find(t => t.id === state.timer.taskId) || null; }
function taskStats() {
  const active = state.tasks.filter(t => !t.completed).length;
  const completed = state.tasks.filter(t => t.completed).length;
  return { active, completed };
}
function focusMinutesForRange(days) {
  const cutoff = Date.now() - (days - 1) * 86400000;
  return state.sessions.filter(s => new Date(s.endedAt).getTime() >= cutoff).reduce((n,s) => n + s.duration / 60, 0);
}
function streak() {
  const days = new Set(state.sessions.map(s => todayKey(s.endedAt)));
  let n = 0; const d = new Date();
  if (!days.has(todayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(todayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function trend(days=7) {
  const out = [];
  const now = new Date(); now.setHours(0,0,0,0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = todayKey(d);
    const minutes = state.sessions.filter(s => todayKey(s.endedAt) === key).reduce((n,s)=>n+s.duration/60,0);
    out.push({ key, label: d.toLocaleDateString([], { weekday:'short' }), minutes });
  }
  return out;
}
function tagClass(priority) { return priority === 'high' ? 'danger' : priority === 'medium' ? 'accent' : 'muted'; }

function resetTimer(phase='focus') {
  const total = durationForPhase(phase);
  state.timer = { running:false, phase, remaining: state.selectedMode === 'stopwatch' ? 0 : total, total: total, cycle: state.timer.cycle || 1, taskId: state.timer.taskId, startedAt:null, accumulated:0 };
  saveState();
  render();
}

function startTimer() {
  ensureAudio();
  if (state.selectedMode === 'stopwatch') {
    state.timer.running = true; state.timer.startedAt = state.timer.startedAt || Date.now(); state.timer.lastTick = Date.now();
  } else {
    if (state.timer.remaining <= 0) resetTimer(state.timer.phase);
    state.timer.running = true; state.timer.startedAt = state.timer.startedAt || Date.now(); state.timer.lastTick = Date.now();
  }
  saveState();
  requestNotifications();
  tickTimer();
  if (!timerInterval) timerInterval = setInterval(tickTimer, 250);
  render();
}
function pauseTimer() {
  if (state.selectedMode === 'stopwatch' && state.timer.remaining >= 60) {
    state.sessions.push({ id:uid(), endedAt:new Date().toISOString(), duration:Math.round(state.timer.remaining), taskId:state.timer.taskId, mode:'stopwatch' });
    const task = getCurrentTask();
    if (task) task.focusedMinutes = (task.focusedMinutes || 0) + Math.round(state.timer.remaining/60);
    if (state.alertEnabled) beep();
    state.timer.remaining = 0;
  }
  state.timer.running = false;
  state.timer.lastTick = null;
  saveState(); render();
}
function skipPhase() { finishPhase(true); }
function tickTimer() {
  if (!state.timer.running) return;
  const now = Date.now(); const delta = (now - (state.timer.lastTick || now)) / 1000; state.timer.lastTick = now;
  if (state.selectedMode === 'stopwatch') state.timer.remaining += delta;
  else state.timer.remaining -= delta;
  if (state.timer.remaining <= 0 && state.selectedMode !== 'stopwatch') finishPhase(false);
  updateTimerDom();
}
function finishPhase(skipped) {
  const phase = state.timer.phase;
  const mode = state.selectedMode;
  state.timer.running = false;
  state.timer.lastTick = null;
  if (phase === 'focus' && !skipped) {
    const total = state.timer.total || durationForPhase('focus');
    const seconds = Math.max(60, Math.round(total));
    state.sessions.push({ id:uid(), endedAt:new Date().toISOString(), duration:seconds, taskId:state.timer.taskId, mode });
    const task = getCurrentTask();
    if (task) task.focusedMinutes = (task.focusedMinutes || 0) + Math.round(seconds/60);
    if (state.alertEnabled) beep();
    if (state.notifications && 'Notification' in window && Notification.permission === 'granted') { try { new Notification('Focus complete', { body: task ? `${task.title} · ${Math.round(seconds/60)} minutes` : 'Nice work. Take a breath.' }); } catch {} }
  } else if (phase !== 'focus' && !skipped && state.alertEnabled) beep();

  if (mode === 'stopwatch') { state.timer.phase = 'focus'; state.timer.remaining = 0; state.timer.total = 0; saveState(); render(); return; }
  if (mode === 'countdown') { state.timer.phase = 'focus'; state.timer.remaining = durationForPhase('focus'); state.timer.total = durationForPhase('focus'); saveState(); render(); return; }

  if (phase === 'focus') {
    const rounds = Math.max(1, Number(state.durations.rounds) || 4);
    const isLong = state.timer.cycle % rounds === 0;
    state.timer.phase = isLong ? 'long' : 'short';
    state.timer.remaining = durationForPhase(state.timer.phase);
    state.timer.total = state.timer.remaining;
    state.timer.accumulated = 0;
    if (!isLong && mode !== 'pomodoro') state.timer.cycle = state.timer.cycle;
  } else {
    state.timer.cycle = (state.timer.cycle % Math.max(1, Number(state.durations.rounds)||4)) + 1;
    state.timer.phase = 'focus';
    state.timer.remaining = durationForPhase('focus');
    state.timer.total = state.timer.remaining;
    state.timer.accumulated = 0;
  }
  saveState(); render();
  if (state.autoStartBreaks && phase === 'focus') setTimeout(startTimer, 150);
}

function beep() {
  try {
    const ctx = ensureAudio(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type='sine'; osc.frequency.value=880; gain.gain.setValueAtTime(0.0001,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.18,ctx.currentTime+0.02); gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.45); osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+0.48);
  } catch {}
}
function requestNotifications() {
  if (!state.notifications || !('Notification' in window)) return;
  if (Notification.permission === 'default') Notification.requestPermission().catch(()=>{});
}

class AudioEngine {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.24;
    this.master.connect(this.ctx.destination);
    this.layers = new Map();
  }
  noiseBuffer(type) {
    const rate = this.ctx.sampleRate;
    const seconds = type === 'ocean' || type === 'wind' ? 6 : 4;
    const length = rate * seconds;
    const b = this.ctx.createBuffer(1, length, rate);
    const data = b.getChannelData(0);
    let brown = 0;
    let pink = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      brown = (brown + 0.025 * white) / 1.025;
      pink = 0.985 * pink + 0.12 * white;
      let sample = white;
      if (type === 'brown') sample = brown * 3.6;
      if (type === 'rain') {
        sample = white * 0.17;
        if (Math.random() < 0.0008) sample += (Math.random() * 2 - 1) * 0.95;
      }
      if (type === 'cafe') {
        sample = pink * 0.19;
        if (Math.random() < 0.00045) sample += (Math.random() * 2 - 1) * 0.65;
      }
      if (type === 'fire') {
        sample = brown * 1.9;
        if (Math.random() < 0.00065) sample += (Math.random() * 2 - 1) * (0.4 + Math.random() * 1.2);
      }
      if (type === 'ocean') {
        const wave = 0.5 + 0.5 * Math.sin(i / rate * 0.085 * Math.PI * 2 + 0.9);
        sample = pink * (0.18 + wave * 0.36);
      }
      if (type === 'wind') {
        const gust = 0.6 + 0.4 * Math.sin(i / rate * 0.045 * Math.PI * 2);
        sample = brown * gust * 2.2;
      }
      if (type === 'white') sample = white * 0.22;
      data[i] = sample;
    }
    return b;
  }
  add(name, volume = 0.28) {
    if (this.layers.has(name)) { this.set(name, volume); return; }
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer(name);
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    g.gain.value = 0;
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    if (name === 'rain') { filter.type='bandpass'; filter.frequency.value=2600; filter.Q.value=0.45; lfo.frequency.value=0.18; lfoGain.gain.value=0.05; }
    if (name === 'brown') { filter.type='lowpass'; filter.frequency.value=260; filter.Q.value=0.65; lfo.frequency.value=0.035; lfoGain.gain.value=0.02; }
    if (name === 'cafe') { filter.type='bandpass'; filter.frequency.value=980; filter.Q.value=0.3; lfo.frequency.value=0.06; lfoGain.gain.value=0.035; }
    if (name === 'fire') { filter.type='lowpass'; filter.frequency.value=1500; filter.Q.value=0.5; lfo.frequency.value=0.11; lfoGain.gain.value=0.045; }
    if (name === 'ocean') { filter.type='lowpass'; filter.frequency.value=1050; filter.Q.value=0.6; lfo.frequency.value=0.075; lfoGain.gain.value=0.09; }
    if (name === 'wind') { filter.type='lowpass'; filter.frequency.value=720; filter.Q.value=0.35; lfo.frequency.value=0.055; lfoGain.gain.value=0.07; }
    if (name === 'white') { filter.type='highpass'; filter.frequency.value=600; filter.Q.value=0.25; lfo.frequency.value=0.025; lfoGain.gain.value=0.02; }

    lfo.connect(lfoGain).connect(g.gain);
    src.connect(filter).connect(g).connect(this.master);
    src.start(); lfo.start();
    this.layers.set(name,{src,g,filter,lfo});
    this.set(name, volume);
  }
  set(name, value) {
    const item = this.layers.get(name);
    if (item) item.g.gain.setTargetAtTime(Number(value), this.ctx.currentTime, 0.08);
    state.soundLayers[name] = Number(value);
    saveState();
  }
  remove(name) {
    const item = this.layers.get(name); if (!item) return;
    try { item.src.stop(); item.lfo?.stop(); } catch {}
    this.layers.delete(name); delete state.soundLayers[name]; saveState();
  }
  clear() { [...this.layers.keys()].forEach(k => this.remove(k)); state.soundLayers={}; saveState(); }
  sync() { Object.entries(state.soundLayers).forEach(([k,v])=>this.add(k,Number(v))); }
}

function ensureAudio(){ if(!audioEngine) audioEngine=new AudioEngine(); if(audioEngine.ctx.state==='suspended') audioEngine.ctx.resume(); return audioEngine.ctx; }

async function spotifyTokenFromCode(code) {
  const cfg = spotifyConfig(); if(!cfg.clientId) throw new Error('No Spotify client ID configured.');
  const verifier = localStorage.getItem(PKCE_KEY); if(!verifier) throw new Error('Missing PKCE verifier. Start the connection again.');
  const body = new URLSearchParams({ client_id:cfg.clientId, grant_type:'authorization_code', code_verifier:verifier, code, redirect_uri:cfg.redirectUri });
  const res = await fetch('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
  const data=await res.json(); if(!res.ok) throw new Error(data.error_description||'Spotify token exchange failed.');
  const token={...data,obtained_at:Date.now()}; localStorage.setItem(TOKEN_KEY,JSON.stringify(token)); localStorage.removeItem(PKCE_KEY); return token;
}
function spotifyConfig(){ return { clientId:runtimeConfig.spotifyClientId || '', redirectUri:window.location.origin + window.location.pathname }; }
async function loadRuntimeConfig(){ try { const res = await fetch('/.netlify/functions/config',{headers:{Accept:'application/json'}}); if(res.ok){ const data=await res.json(); runtimeConfig={...runtimeConfig,...data}; saveState(); render(); } } catch {} }
async function pkceChallenge(verifier){ const bytes=new TextEncoder().encode(verifier); const digest=await crypto.subtle.digest('SHA-256',bytes); return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function randomString(len=64){ const a=new Uint8Array(len); crypto.getRandomValues(a); return Array.from(a,b=>('0'+b.toString(16)).slice(-2)).join(''); }
async function connectSpotify(){
  if(!runtimeConfig.spotifyClientId){ await loadRuntimeConfig(); }
  const cfg=spotifyConfig();
  if(!cfg.clientId){ showToast('Add VITE_SPOTIFY_CLIENT_ID in Netlify site settings to enable the Spotify connection.'); return; }
  const verifier=randomString(48), challenge=await pkceChallenge(verifier); localStorage.setItem(PKCE_KEY,verifier);
  const scope='playlist-read-private user-read-currently-playing user-read-playback-state';
  const url=new URL('https://accounts.spotify.com/authorize');
  url.search=new URLSearchParams({client_id:cfg.clientId,response_type:'code',redirect_uri:cfg.redirectUri,scope,code_challenge_method:'S256',code_challenge:challenge,state:randomString(20)}).toString();
  window.location.href=url.toString();
}
async function spotifyApi(path, options={}){
  let token=loadSpotifyToken(); if(!token) throw new Error('Not connected to Spotify.');
  if(token.expires_in && Date.now() > token.obtained_at + (token.expires_in-60)*1000 && token.refresh_token){ token=await refreshSpotify(token); }
  let res=await fetch('https://api.spotify.com/v1'+path,{...options,headers:{Authorization:`Bearer ${token.access_token}`,...(options.headers||{})}});
  if(res.status===401 && token.refresh_token){ token=await refreshSpotify(token); res=await fetch('https://api.spotify.com/v1'+path,{...options,headers:{Authorization:`Bearer ${token.access_token}`,...(options.headers||{})}}); }
  if(!res.ok){ const text=await res.text(); throw new Error(text || `Spotify request failed (${res.status})`); }
  return res.status===204?null:res.json();
}
function loadSpotifyToken(){ try{return JSON.parse(localStorage.getItem(TOKEN_KEY)||'null')}catch{return null} }
async function refreshSpotify(old){ const cfg=spotifyConfig(); const body=new URLSearchParams({grant_type:'refresh_token',refresh_token:old.refresh_token,client_id:cfg.clientId}); const res=await fetch('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body}); const d=await res.json(); if(!res.ok) throw new Error(d.error_description||'Could not refresh Spotify session.'); const token={...old,...d,obtained_at:Date.now()}; localStorage.setItem(TOKEN_KEY,JSON.stringify(token)); return token; }
async function loadSpotify(){
  try{
    const [me, pls, now] = await Promise.all([spotifyApi('/me'), spotifyApi('/me/playlists?limit=24'), spotifyApi('/me/player/currently-playing').catch(()=>null)]);
    state.spotify={connected:true,profile:me,playlists:pls?.items||[],nowPlaying:now}; saveState(); render();
  }catch(err){ showToast(err.message); }
}
function disconnectSpotify(){ localStorage.removeItem(TOKEN_KEY); state.spotify={connected:false,profile:null,playlists:[],nowPlaying:null}; saveState(); render(); }
async function handleSpotifyCallback(){ const p=new URLSearchParams(location.search); const code=p.get('code'); if(!code) return; try{ await spotifyTokenFromCode(code); history.replaceState({},'',window.location.pathname+window.location.hash); await loadSpotify(); }catch(e){ showToast(e.message); history.replaceState({},'',window.location.pathname+window.location.hash); } }

function navItems(){ return [
  ['home','⌂','Home'],['focus','◷','Focus'],['tasks','✓','Tasks'],['stats','▥','Stats'],['sound','∿','Sound'],['settings','⚙','Settings']
]; }
function appShell(content){
  const stats=taskStats();
  return `<div class="app" data-theme="${esc(state.theme)}" style="--theme-art:url('${esc(THEMES[state.theme]?.art||THEMES.midnight.art)}');${state.customBg?`--custom-bg:url('${esc(state.customBg)}');`:''}">
    <aside class="sidebar">
      <button class="brand" data-action="nav" data-view="home"><span class="brand-mark">◔</span><span><b>FOCUS</b><em>FORGE</em></span></button>
      <div class="side-kicker">WORKSPACE</div>
      <nav>${navItems().map(([v,icon,label])=>`<button class="nav-btn ${state.view===v?'active':''}" data-action="nav" data-view="${v}"><span>${icon}</span>${label}${v==='tasks'&&stats.active?`<i>${stats.active}</i>`:''}</button>`).join('')}</nav>
      <div class="sidebar-bottom">
        <div class="mini-card"><div class="mini-label">CURRENT MODE</div><strong>${esc(currentMode().label)}</strong><span>${esc(currentMode().description)}</span></div>
        <button class="ghost-btn full" data-action="quick-settings">Customize workspace <span>↗</span></button>
        <div class="sidebar-foot"><span>Open source · free forever</span><span>v1.0</span></div>
      </div>
    </aside>
    <main class="main">
      <header class="topbar"><div class="mobile-brand">FOCUSFORGE</div><div class="breadcrumbs"><span>${state.view.toUpperCase()}</span><b>·</b><span>${localDateLabel()}</span></div><div class="top-actions"><button class="icon-btn" title="Request notifications" data-action="notify">◌</button><button class="avatar" data-action="nav" data-view="settings">${esc((state.greetingName||'T')[0].toUpperCase())}</button></div></header>
      <section class="content">${content}</section>
    </main>
    <div id="toast" class="toast"></div>
  </div>`;
}

function homeView(){
  const today=focusMinutesForRange(1), week=focusMinutesForRange(7), streakN=streak();
  const active=state.tasks.filter(t=>!t.completed).sort((a,b)=>priorityScore(b.priority)-priorityScore(a.priority));
  const featured=active[0];
  const quote=QUOTES[new Date().getDate()%QUOTES.length];
  return `<div class="home-screen">
    <div class="home-top-grid">
      <section class="hero-card panel">
        <div class="hero-art" aria-hidden="true"></div>
        <div class="hero-copy"><div class="eyebrow">${timeNow()} · ${localDateLabel()}</div><h1>Make space for <span>deep work.</span></h1><p>Welcome back, ${esc(state.greetingName||'there')}. One clear task, one focused block, no noise.</p></div>
        <div class="hero-actions"><button class="primary-btn" data-action="start-focus">Start focus <span>⌁</span></button><button class="secondary-btn" data-action="nav" data-view="tasks">See tasks <span>→</span></button></div>
        <div class="hero-meta"><span><b>${formatMinutes(today)}</b> today</span><span><b>${formatMinutes(week)}</b> this week</span><span><b>${streakN}</b> day streak</span></div>
      </section>
      <section class="panel priority-card">
        <div class="panel-head"><div><span class="eyebrow">UP NEXT</span><h2>One thing at a time</h2></div><button class="link-btn" data-action="nav" data-view="tasks">All tasks →</button></div>
        ${featured ? taskCard(featured,true) : emptyTasks()}
      </section>
    </div>
    <div class="workspace-row"><div><span class="eyebrow">YOUR WORKSPACE</span><h2>Everything in one place</h2></div><div class="segmented"><button class="active" data-action="nav" data-view="focus">Focus</button><button data-action="nav" data-view="sound">Sound + Music</button></div></div>
    <div class="home-dashboard-grid">
      <section class="panel snapshot-panel"><div class="panel-head"><div><span class="eyebrow">7-DAY SNAPSHOT</span><h2>Focus rhythm</h2></div><span class="muted">${Math.round(week)} min</span></div>${miniChart(trend(7))}</section>
      <section class="panel quote-panel"><div class="quote-mark">“</div><p>${state.quoteEnabled?esc(quote):'Quote mode is off. Keep the page quiet and let the work speak.'}</p><span>DAILY NOTE</span></section>
      <section class="panel mode-panel"><div class="panel-head"><div><span class="eyebrow">TIMER MODE</span><h2>${currentMode().emoji} ${esc(currentMode().label)}</h2></div><button class="icon-btn" data-action="nav" data-view="settings">⚙</button></div><div class="mode-big">${state.selectedMode==='stopwatch'?'UP':formatTime(durationForPhase('focus'))}</div><div class="mode-sub">${esc(currentMode().description)}</div><button class="secondary-btn full" data-action="start-focus">Start ${esc(currentMode().label)}</button></section>
    </div>
  </div>`;
}

function focusView(){
  const mode=currentMode(); const total=state.timer.total || durationForPhase(state.timer.phase); const progress=state.selectedMode==='stopwatch'?0:Math.min(1,Math.max(0,1-(state.timer.remaining/Math.max(1,total))));
  const current=getCurrentTask(); const taskList=state.tasks.filter(t=>!t.completed).sort((a,b)=>priorityScore(b.priority)-priorityScore(a.priority));
  return `<div class="focus-layout">
    <section class="focus-main panel">
      <div class="focus-art-panel" aria-hidden="true"></div>
      <div class="focus-top"><div><span class="eyebrow">${esc(state.timer.phase==='focus'?'FOCUS':'BREAK')} · ${esc(mode.label)}</span><h1>${state.timer.running?'Stay with it.':'Ready when you are.'}</h1></div><button class="icon-btn" data-action="open-timer-settings">⚙</button></div>
      <div class="focus-core"><div class="ring-wrap"><div class="timer-ring" style="--progress:${Math.round(progress*360)}deg"><div class="timer-inner"><span>${state.selectedMode==='stopwatch'?'STOPWATCH':state.timer.phase==='focus'?'FOCUS':'RESET'}</span><strong id="timer-time">${formatTime(state.timer.remaining,state.selectedMode==='stopwatch')}</strong><em>${current?esc(current.title):'No task selected'}</em></div></div></div>
      <div class="timer-stack"><div class="timer-controls"><button class="timer-round" data-action="reset">↺</button><button class="timer-play" data-action="toggle-timer">${state.timer.running?'Ⅱ':'▶'}</button><button class="timer-round" data-action="skip">→|</button></div><div class="timer-caption">${state.selectedMode==='stopwatch'?'Count up until you stop.':`${formatTime(state.timer.total)} session · cycle ${state.timer.cycle}`}</div></div></div>
      <div class="focus-task-strip"><span>FOCUSING ON</span>${current?`<strong>${esc(current.title)}</strong>`:`<button class="link-btn" data-action="nav" data-view="tasks">Choose a task →</button>`}</div>
    </section>
    <aside class="focus-side">
      <section class="panel task-panel"><div class="panel-head"><div><span class="eyebrow">PRIORITY QUEUE</span><h2>What is next?</h2></div><button class="link-btn" data-action="nav" data-view="tasks">Manage →</button></div>${taskList.length?taskList.slice(0,5).map(t=>taskCard(t,false)).join(''):emptyTasks()}</section>
      <section class="panel sound-mini"><div class="panel-head"><div><span class="eyebrow">SOUND + MUSIC</span><h2>Build your room</h2></div><button class="link-btn" data-action="nav" data-view="sound">Open →</button></div>${soundMini()}</section>
    </aside>
  </div>`;
}

function tasksView(){
  const active=state.tasks.filter(t=>!t.completed).sort((a,b)=>priorityScore(b.priority)-priorityScore(a.priority));
  const done=state.tasks.filter(t=>t.completed);
  return `<div class="section-head"><div><span class="eyebrow">TASKS</span><h1>Keep the queue small.</h1><p>Front-load what matters. Give deep work a single destination.</p></div></div>
  <form class="task-composer panel" id="task-form">
    <div class="task-compose-main"><span class="compose-icon">+</span><input name="title" autocomplete="off" placeholder="What needs your attention?" aria-label="Task title" required /></div>
    <input class="compose-small" type="number" name="estimate" min="1" max="480" value="25" aria-label="Estimated minutes" title="Estimated minutes" />
    <select class="compose-small" name="priority" aria-label="Priority" title="Priority"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select>
    <input class="compose-tag" name="tag" maxlength="24" placeholder="tag" aria-label="Tag" />
    <button class="primary-btn" type="submit">Add task <span>↵</span></button>
  </form>
  <div class="tasks-layout"><section class="panel task-list-panel"><div class="list-toolbar"><span>${active.length} active</span><span>${done.length} completed</span><button type="button" class="ghost-btn" data-action="toggle-completed">${state.showCompleted?'Hide':'Show'} completed</button></div>${active.length?active.map(t=>taskCard(t,true)).join(''):'<div class="blank-slate"><div>✓</div><h3>Queue is clear.</h3><p>Add one concrete thing and start there.</p></div>'}${state.showCompleted&&done.length?`<div class="completed-divider">COMPLETED</div>${done.map(t=>taskCard(t,true)).join('')}`:''}</section>
  <aside class="panel task-guide"><span class="eyebrow">WORKING RULES</span><div class="rule"><b>01</b><span>One task can be active at a time.</span></div><div class="rule"><b>02</b><span>Add an estimate so a vague task becomes a concrete block.</span></div><div class="rule"><b>03</b><span>Complete the session before switching context.</span></div><div class="task-progress"><div class="progress-label"><span>Today</span><b>${Math.round(focusMinutesForRange(1))} min</b></div><div class="progress-bar"><i style="width:${Math.min(100,focusMinutesForRange(1)/120*100)}%"></i></div><small>Target: 2h</small></div></aside></div>`;
}
function taskCard(task, featured=false){
  const selected=state.timer.taskId===task.id; const mins=task.estimate||25;
  return `<article class="task-row ${selected?'selected':''} ${task.completed?'completed':''}">
    <button class="check ${task.completed?'checked':''}" data-action="toggle-task" data-id="${task.id}">${task.completed?'✓':''}</button>
    <button class="task-main" data-action="select-task" data-id="${task.id}"><span class="task-title">${esc(task.title)}</span><span class="task-meta"><i class="pill ${tagClass(task.priority)}">${esc(task.priority||'low')}</i><span>${mins} min</span>${task.tag?`<span>· ${esc(task.tag)}</span>`:''}</span></button>
    <div class="task-actions"><button class="mini-icon ${selected?'active':''}" title="Focus this task" data-action="select-task" data-id="${task.id}">◷</button><button class="mini-icon" title="Delete" data-action="delete-task" data-id="${task.id}">×</button></div>
  </article>`;
}
function emptyTasks(){ return `<div class="blank-slate small"><div>+</div><h3>No task in the queue.</h3><p>Add something concrete, then make it the center of the timer.</p><button class="link-btn" data-action="focus-task-input">Add a task →</button></div>`; }
function priorityScore(p){ return p==='high'?3:p==='medium'?2:1; }
function addTaskFromForm(form){
  const fd=new FormData(form); const title=String(fd.get('title')||'').trim(); if(!title) return;
  const estimate=Math.max(1,Math.min(480,Number(fd.get('estimate')||25)));
  const priority=['high','medium','low'].includes(fd.get('priority'))?fd.get('priority'):'medium';
  const tag=String(fd.get('tag')||'').trim();
  state.tasks.push({id:uid(),title,estimate,priority,tag,completed:false,createdAt:new Date().toISOString(),focusedMinutes:0});
  saveState(); render(); setTimeout(()=>document.querySelector('#task-form input[name="title"]')?.focus(),0);
}

function statsView(){
  const d7=trend(7), d30=trend(30), today=Math.round(focusMinutesForRange(1)), week=Math.round(focusMinutesForRange(7)), month=Math.round(focusMinutesForRange(30)), streakN=streak();
  const taskDone=state.tasks.filter(t=>t.completed).length; const totalFocus=state.sessions.reduce((n,s)=>n+s.duration/60,0);
  const max=Math.max(30,...d7.map(d=>d.minutes));
  return `<div class="section-head"><div><span class="eyebrow">FOCUS STATS</span><h1>See your actual work.</h1><p>Sessions are logged automatically when a focus block completes.</p></div><button class="secondary-btn" data-action="export">Export data</button></div>
  <div class="stat-cards"><div class="stat-card"><span>Today</span><strong>${formatMinutes(today)}</strong><small>${Math.round(today/60*100)/100} focus hours</small></div><div class="stat-card"><span>7 days</span><strong>${formatMinutes(week)}</strong><small>${state.sessions.filter(s=>new Date(s.endedAt).getTime()>Date.now()-604800000).length} sessions</small></div><div class="stat-card"><span>30 days</span><strong>${formatMinutes(month)}</strong><small>${Math.round(month/60*100)/100} focus hours</small></div><div class="stat-card accent-stat"><span>Streak</span><strong>${streakN}d</strong><small>Keep showing up</small></div></div>
  <div class="stats-grid"><section class="panel chart-panel"><div class="panel-head"><div><span class="eyebrow">LAST 7 DAYS</span><h2>Focus rhythm</h2></div><span class="muted">${Math.round(d7.reduce((n,d)=>n+d.minutes,0))} min</span></div><div class="bar-chart">${d7.map(d=>`<div class="bar-col"><span class="bar-value">${d.minutes?Math.round(d.minutes):''}</span><div class="bar-track"><i style="height:${Math.max(5,d.minutes/max*100)}%"></i></div><small>${d.label}</small></div>`).join('')}</div></section>
  <section class="panel breakdown-panel"><div class="panel-head"><div><span class="eyebrow">OUTPUT</span><h2>Work profile</h2></div></div><div class="donut" style="--p:${Math.min(100,(today/120)*100)}%"><div><strong>${Math.min(100,Math.round(today/120*100))}%</strong><span>of 2h target</span></div></div><div class="break-list"><div><span>Focus sessions</span><b>${state.sessions.length}</b></div><div><span>Tasks completed</span><b>${taskDone}</b></div><div><span>All-time focus</span><b>${formatMinutes(totalFocus)}</b></div></div></section></div>
  <section class="panel history-panel"><div class="panel-head"><div><span class="eyebrow">HISTORY</span><h2>Recent sessions</h2></div><button class="ghost-btn" data-action="clear-sessions">Clear history</button></div><div class="history-table">${state.sessions.slice().reverse().slice(0,15).map(s=>`<div class="history-row"><span>${new Date(s.endedAt).toLocaleDateString([], {month:'short',day:'numeric'})}</span><b>${formatMinutes(s.duration/60)}</b><span>${esc(MODES[s.mode]?.label||s.mode)}</span><span>${esc(state.tasks.find(t=>t.id===s.taskId)?.title||'Focus session')}</span></div>`).join('') || '<div class="blank-slate small">No completed sessions yet.</div>'}</div></section>`;
}

function soundView(){
  const layers=Object.entries(SOUND_DEFS); const active=layers.filter(([k])=>state.soundLayers[k]);
  const sp=state.spotify, cfg=spotifyConfig();
  return `<div class="section-head"><div><span class="eyebrow">SOUNDROOM</span><h1>Build the room around you.</h1><p>These textures are synthesized locally in your browser, then your music sits directly underneath them.</p></div><div class="sound-total"><span>${active.length}</span> layers</div></div>
  <div class="sound-layout"><section class="panel sound-grid">${layers.map(([key,d])=>{const val=state.soundLayers[key]||0;return `<div class="sound-card ${val?'on':''}" data-sound="${key}"><div class="sound-icon">${d.icon}</div><div class="sound-info"><strong>${esc(d.label)}</strong><span>${esc(d.detail)}</span></div><button class="sound-toggle" data-action="toggle-sound" data-sound="${key}">${val?'−':'+'}</button><input type="range" min="0" max="0.7" step="0.01" value="${val}" data-action="sound-volume" data-sound="${key}" aria-label="${esc(d.label)} volume"/></div>`}).join('')}</section>
  <aside class="panel sound-side"><span class="eyebrow">MASTER</span><h2>Your focus room</h2><div class="master-knob"><div><strong id="master-value">${Math.round((audioEngine?.master?.gain.value||0.24)*100)}%</strong><span>output</span></div></div><input class="wide-range" type="range" min="0" max="0.8" step="0.01" value="${audioEngine?.master?.gain.value||0.24}" data-action="master-volume" aria-label="Master volume"><p>Layer rain with ocean for motion, café with brown noise for busy environments, or fireplace with wind for a warmer room.</p><button class="secondary-btn full" data-action="stop-sounds">Clear soundscape</button></aside></div>
  <section class="sound-music-block">
    <div class="sound-music-heading"><div><span class="eyebrow">MUSIC</span><h2>Playlists, right below your sounds.</h2></div><span class="muted">opens in Spotify</span></div>
    <div class="music-inline-grid">
      <section class="panel playlist-panel"><div class="playlist-grid">${CURATED_PLAYLISTS.map(p=>`<a class="playlist-card" href="${p.url}" target="_blank" rel="noreferrer"><div class="playlist-art">${p.glyph}</div><div><strong>${esc(p.title)}</strong><span>${esc(p.note)}</span></div><b>↗</b></a>`).join('')}</div></section>
      <aside class="panel spotify-panel">${sp.connected && sp.profile ? `<div class="spotify-user"><div class="spotify-avatar">${esc((sp.profile.display_name||'S')[0].toUpperCase())}</div><div><span class="eyebrow">CONNECTED</span><h2>${esc(sp.profile.display_name||'Spotify')}</h2><p>${sp.playlists.length} playlists loaded</p></div><button class="ghost-btn" data-action="spotify-disconnect">Disconnect</button></div>${sp.nowPlaying?.item?`<div class="now-playing"><span class="eyebrow">NOW PLAYING</span><strong>${esc(sp.nowPlaying.item.name)}</strong><span>${esc(sp.nowPlaying.item.artists?.map(a=>a.name).join(', ')||'')}</span></div>`:''}<div class="my-playlists">${sp.playlists.slice(0,8).map(p=>`<a href="${p.external_urls.spotify}" target="_blank" rel="noreferrer"><span>${esc(p.name)}</span><b>↗</b></a>`).join('')}</div>`:`<div class="spotify-lock"><div class="spotify-mark">●</div><span class="eyebrow">OPTIONAL CONNECTION</span><h2>Your Spotify, here.</h2><p>Connect with Spotify’s browser-safe Authorization Code + PKCE flow. No client secret is stored in this app.</p>${cfg.clientId?'<button class="secondary-btn full" data-action="spotify-connect">Connect Spotify</button>':'<div class="setup-note">Add <code>VITE_SPOTIFY_CLIENT_ID</code> to Netlify site settings to enable this.</div>'}</div>`}</aside>
    </div>
  </section>`;
}
function soundMini(){
  const active=Object.entries(state.soundLayers).filter(([,v])=>v).slice(0,3); return active.length ? active.map(([k,v])=>`<div class="sound-chip"><span>${SOUND_DEFS[k]?.icon||'∿'} ${esc(SOUND_DEFS[k]?.label||k)}</span><b>${Math.round(v*100)}</b></div>`).join('') : '<div class="sound-empty">No layers active. <button class="link-btn" data-action="nav" data-view="sound">Add sound →</button></div>';
}

function miniChart(data){ const max=Math.max(20,...data.map(x=>x.minutes)); return `<div class="mini-chart">${data.map(x=>`<div><i style="height:${Math.max(8,x.minutes/max*100)}%"></i><small>${x.label[0]}</small></div>`).join('')}</div>`; }

function settingsView(){
  const cfg=MODES[state.selectedMode];
  return `<div class="section-head"><div><span class="eyebrow">SETTINGS</span><h1>Make it yours.</h1><p>Everything is stored locally in your browser unless you choose to connect Spotify.</p></div><button class="ghost-btn" data-action="reset-app">Reset app</button></div>
  <div class="settings-grid"><section class="panel settings-panel"><div class="settings-group"><span class="eyebrow">APPEARANCE</span><h2>Theme</h2><div class="theme-grid">${Object.entries(THEMES).map(([k,t])=>`<button class="theme-card ${state.theme===k?'active':''}" data-action="theme" data-theme-value="${k}"><span class="theme-thumb" style="background-image:url('${esc(t.art)}')"></span><strong>${esc(t.label)}</strong><small>${esc(t.kicker)}</small></button>`).join('')}</div><label class="field"><span>Custom background URL</span><input value="${esc(state.customBg)}" placeholder="https://…" data-setting="customBg"></label></div>
  <div class="settings-group"><span class="eyebrow">TIMER</span><h2>Mode</h2><select class="select" data-setting="selectedMode">${Object.entries(MODES).map(([k,m])=>`<option value="${k}" ${state.selectedMode===k?'selected':''}>${m.emoji} ${m.label} — ${m.description}</option>`).join('')}</select><div class="timer-fields">${timerField('Focus minutes','focus',state.durations.focus)}${timerField('Short break','short',state.durations.short)}${timerField('Long break','long',state.durations.long)}${timerField('Rounds','rounds',state.durations.rounds)}${state.selectedMode==='countdown'?timerField('Countdown','countdown',state.durations.countdown):''}${state.selectedMode==='animedoro'?timerField('Animedoro focus','animedoro',state.durations.animedoro):''}</div></div></section>
  <aside class="panel settings-side"><div class="toggle-row"><div><b>Motivational quotes</b><span>Show a small daily note on Home.</span></div><input type="checkbox" ${state.quoteEnabled?'checked':''} data-setting="quoteEnabled"></div><div class="toggle-row"><div><b>Notifications</b><span>Browser alerts when a session ends.</span></div><input type="checkbox" ${state.notifications?'checked':''} data-setting="notifications"></div><div class="toggle-row"><div><b>Auto-start breaks</b><span>Start the break as soon as focus ends.</span></div><input type="checkbox" ${state.autoStartBreaks?'checked':''} data-setting="autoStartBreaks"></div><div class="toggle-row"><div><b>Alert sound</b><span>Play a small local chime.</span></div><input type="checkbox" ${state.alertEnabled?'checked':''} data-setting="alertEnabled"></div><div class="settings-group compact"><span class="eyebrow">PROFILE</span><label class="field"><span>Your name</span><input value="${esc(state.greetingName)}" data-setting="greetingName" placeholder="there"></label></div><div class="settings-group compact"><span class="eyebrow">KEYBOARD</span><div class="shortcut"><kbd>Space</kbd><span>Start / pause timer</span></div><div class="shortcut"><kbd>R</kbd><span>Reset timer</span></div><div class="shortcut"><kbd>1–6</kbd><span>Jump between workspaces</span></div></div></aside></div>`;
}
function timerField(label,key,val){ return `<label class="field small-field"><span>${label}</span><input type="number" min="1" max="480" value="${val}" data-setting="durations.${key}"></label>`; }

function render(){
  document.getElementById('app').innerHTML=appShell(({home:homeView,focus:focusView,tasks:tasksView,stats:statsView,sound:soundView,settings:settingsView}[state.view]||homeView)());
  updateTimerDom();
  if(audioEngine) syncAudioUi();
}
function syncAudioUi(){ document.querySelectorAll('[data-sound]').forEach(card=>{ const key=card.dataset.sound; const val=Number(state.soundLayers[key]||0); card.classList.toggle('on',val>0); const range=card.querySelector('[data-action="sound-volume"]'); if(range) range.value=val; const label=card.querySelector('.sound-info span'); if(label) label.textContent=val?`${Math.round(val*100)}% volume`:`${SOUND_DEFS[key]?.detail||''}`; }); const master=document.querySelector('[data-action="master-volume"]'); const gain=audioEngine?.master?.gain.value??0.24; if(master) master.value=gain; const value=document.getElementById('master-value'); if(value) value.textContent=`${Math.round(gain*100)}%`; }
function updateTimerDom(){ const el=document.getElementById('timer-time'); if(el) el.textContent=formatTime(state.timer.remaining,state.selectedMode==='stopwatch'); const ring=document.querySelector('.timer-ring'); if(ring && state.timer.total){ ring.style.setProperty('--progress',`${Math.round(Math.min(1,Math.max(0,1-state.timer.remaining/state.timer.total))*360)}deg`); } }
function showToast(msg){ const el=document.getElementById('toast'); if(!el) return; el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),3200); }
function addTask(){ document.querySelector('#task-form input[name="title"]')?.focus(); }

async function boot(){
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
  setupEvents();
  await handleSpotifyCallback().catch(()=>{});
  await loadRuntimeConfig();
  render();
  if(state.timer.running){ state.timer.running=false; state.timer.startedAt=null; state.timer.lastTick=null; saveState(); }
  if(loadSpotifyToken()) loadSpotify().catch(()=>{});
}

boot();
