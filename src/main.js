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
  forest: { label: 'Deep Forest', kicker: 'quiet / organic', bg: 'forest' },
  midnight: { label: 'Midnight Lab', kicker: 'dark / focused', bg: 'midnight' },
  desert: { label: 'Desert Dusk', kicker: 'warm / slow', bg: 'desert' },
  ocean: { label: 'Blue Hour', kicker: 'cool / spacious', bg: 'ocean' },
  studio: { label: 'Paper Studio', kicker: 'clean / bright', bg: 'studio' },
  neon: { label: 'Neon Grid', kicker: 'electric / late', bg: 'neon' }
};

const SOUND_DEFS = {
  rain: { label: 'Rain', icon: '☂', color: '#a9c9ff' },
  brown: { label: 'Brown noise', icon: '≈', color: '#d4a36a' },
  cafe: { label: 'Café', icon: '☕', color: '#d6b58b' },
  fire: { label: 'Fireplace', icon: '♨', color: '#ffad76' },
  ocean: { label: 'Ocean', icon: '∿', color: '#7bd6e8' },
  wind: { label: 'Wind', icon: '⌁', color: '#c9d5df' },
  white: { label: 'White noise', icon: '▱', color: '#dce7ed' }
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
    return raw ? mergeState(JSON.parse(raw)) : clone(defaultState);
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
  constructor() { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ctx.createGain(); this.master.gain.value=0.26; this.master.connect(this.ctx.destination); this.layers = new Map(); }
  buffer(type) {
    const rate=this.ctx.sampleRate, length=rate*2, b=this.ctx.createBuffer(1,length,rate), data=b.getChannelData(0); let last=0;
    for (let i=0;i<length;i++) {
      const white=Math.random()*2-1;
      if(type==='brown'){ last=(last+0.02*white)/(1.02); data[i]=last*2.8; }
      else data[i]=white;
    }
    return b;
  }
  add(name, volume=0.32) {
    if(this.layers.has(name)) { this.set(name, volume); return; }
    const src=this.ctx.createBufferSource(); src.buffer=this.buffer(name==='brown'?'brown':'white'); src.loop=true;
    const filter=this.ctx.createBiquadFilter(); const g=this.ctx.createGain(); g.gain.value=0;
    if(name==='rain'){ filter.type='bandpass'; filter.frequency.value=2400; filter.Q.value=0.35; }
    if(name==='cafe'){ filter.type='lowpass'; filter.frequency.value=1800; filter.Q.value=0.5; }
    if(name==='fire'){ filter.type='lowpass'; filter.frequency.value=1200; filter.Q.value=0.7; }
    if(name==='ocean'){ filter.type='lowpass'; filter.frequency.value=700; filter.Q.value=0.55; }
    if(name==='wind'){ filter.type='lowpass'; filter.frequency.value=550; filter.Q.value=0.4; }
    if(name==='white'){ filter.type='highpass'; filter.frequency.value=500; }
    if(name==='brown'){ filter.type='lowpass'; filter.frequency.value=280; }
    const lfo=this.ctx.createOscillator(); const lfoGain=this.ctx.createGain();
    if(name==='ocean' || name==='wind'){ lfo.frequency.value=name==='ocean'?0.11:0.07; lfoGain.gain.value=0.28; lfo.connect(lfoGain).connect(g.gain); lfo.start(); }
    src.connect(filter).connect(g).connect(this.master); src.start();
    this.layers.set(name,{src,g,filter,lfo});
    this.set(name, volume);
    if(name==='cafe' || name==='fire') this.addTexture(name);
  }
  addTexture(name){
    const data=this.layers.get(name); if(!data) return;
    const osc=this.ctx.createOscillator(); const g=this.ctx.createGain(); osc.type='triangle'; osc.frequency.value=name==='fire'?48:140; g.gain.value=0.004; osc.connect(g).connect(this.master); osc.start(); data.texture={osc,g};
  }
  set(name, value) { const item=this.layers.get(name); if(item) item.g.gain.setTargetAtTime(Number(value),this.ctx.currentTime,0.08); state.soundLayers[name]=Number(value); saveState(); }
  remove(name){ const item=this.layers.get(name); if(!item) return; try{ item.src.stop(); item.lfo?.stop(); item.texture?.osc.stop(); }catch{} this.layers.delete(name); delete state.soundLayers[name]; saveState(); }
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
  ['home','⌂','Home'],['focus','◷','Focus'],['tasks','✓','Tasks'],['stats','▥','Stats'],['sound','∿','Sound'],['music','♫','Music'],['settings','⚙','Settings']
]; }
function appShell(content){
  const stats=taskStats();
  return `<div class="app" data-theme="${esc(state.theme)}" ${state.customBg?`style="--custom-bg:url('${esc(state.customBg)}')"`:''}>
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
  return `<div class="hero-grid">
    <section class="hero-card panel">
      <div><div class="eyebrow">${timeNow()} · ${localDateLabel()}</div><h1>Make space for <span>deep work.</span></h1><p>Welcome back, ${esc(state.greetingName||'there')}. One clear task, one focused block, no noise.</p></div>
      <div class="hero-actions"><button class="primary-btn" data-action="start-focus">Start focus <span>⌁</span></button><button class="secondary-btn" data-action="nav" data-view="tasks">See tasks <span>→</span></button></div>
      <div class="hero-meta"><span><b>${formatMinutes(today)}</b> today</span><span><b>${formatMinutes(week)}</b> this week</span><span><b>${streakN}</b> day streak</span></div>
      <div class="hero-orb"></div>
    </section>
    <section class="panel priority-card">
      <div class="panel-head"><div><span class="eyebrow">UP NEXT</span><h2>One thing at a time</h2></div><button class="link-btn" data-action="nav" data-view="tasks">All tasks →</button></div>
      ${featured ? taskCard(featured,true) : emptyTasks()}
    </section>
  </div>
  <div class="section-head"><div><span class="eyebrow">YOUR WORKSPACE</span><h2>Everything in one place</h2></div><div class="segmented"><button class="${state.theme?'active':''}" data-action="nav" data-view="focus">Focus</button><button data-action="nav" data-view="sound">Soundscape</button><button data-action="nav" data-view="music">Music</button></div></div>
  <div class="dashboard-grid">
    <section class="panel snapshot-panel"><div class="panel-head"><div><span class="eyebrow">7-DAY SNAPSHOT</span><h2>Focus rhythm</h2></div><span class="muted">${Math.round(week)} min</span></div>${miniChart(trend(7))}</section>
    <section class="panel quote-panel"><div class="quote-mark">“</div><p>${state.quoteEnabled?esc(quote):'Quote mode is off. Keep the page quiet and let the work speak.'}</p><span>DAILY NOTE</span></section>
    <section class="panel mode-panel"><div class="panel-head"><div><span class="eyebrow">TIMER MODE</span><h2>${currentMode().emoji} ${esc(currentMode().label)}</h2></div><button class="icon-btn" data-action="nav" data-view="settings">⚙</button></div><div class="mode-big">${state.selectedMode==='stopwatch'?'UP':formatTime(durationForPhase('focus'))}</div><div class="mode-sub">${esc(currentMode().description)}</div><button class="secondary-btn full" data-action="start-focus">Start ${esc(currentMode().label)}</button></section>
  </div>`;
}

function focusView(){
  const mode=currentMode(); const total=state.timer.total || durationForPhase(state.timer.phase); const progress=state.selectedMode==='stopwatch'?0:Math.min(1,Math.max(0,1-(state.timer.remaining/Math.max(1,total))));
  const current=getCurrentTask(); const taskList=state.tasks.filter(t=>!t.completed).sort((a,b)=>priorityScore(b.priority)-priorityScore(a.priority));
  return `<div class="focus-layout">
    <section class="focus-main panel" data-theme="${esc(state.theme)}">
      <div class="focus-top"><div><span class="eyebrow">${esc(state.timer.phase==='focus'?'FOCUS':'BREAK')} · ${esc(mode.label)}</span><h1>${state.timer.running?'Stay with it.':'Ready when you are.'}</h1></div><button class="icon-btn" data-action="open-timer-settings">⚙</button></div>
      <div class="ring-wrap"><div class="timer-ring" style="--progress:${Math.round(progress*360)}deg"><div class="timer-inner"><span>${state.selectedMode==='stopwatch'?'STOPWATCH':state.timer.phase==='focus'?'FOCUS':'RESET'}</span><strong id="timer-time">${formatTime(state.timer.remaining,state.selectedMode==='stopwatch')}</strong><em>${current?esc(current.title):'No task selected'}</em></div></div></div>
      <div class="timer-controls"><button class="timer-round" data-action="reset">↺</button><button class="timer-play" data-action="toggle-timer">${state.timer.running?'Ⅱ':'▶'}</button><button class="timer-round" data-action="skip">→|</button></div>
      <div class="timer-caption">${state.selectedMode==='stopwatch'?'Count up until you stop.':`${formatTime(state.timer.total)} session · cycle ${state.timer.cycle}`}</div>
      <div class="focus-task-strip"><span>FOCUSING ON</span>${current?`<strong>${esc(current.title)}</strong>`:`<button class="link-btn" data-action="nav" data-view="tasks">Choose a task →</button>`}</div>
    </section>
    <aside class="focus-side">
      <section class="panel task-panel"><div class="panel-head"><div><span class="eyebrow">PRIORITY QUEUE</span><h2>What is next?</h2></div><button class="link-btn" data-action="nav" data-view="tasks">Manage →</button></div>${taskList.length?taskList.slice(0,5).map(t=>taskCard(t,false)).join(''):emptyTasks()}</section>
      <section class="panel sound-mini"><div class="panel-head"><div><span class="eyebrow">SOUNDSCAPE</span><h2>Build your room</h2></div><button class="link-btn" data-action="nav" data-view="sound">Open →</button></div>${soundMini()}</section>
    </aside>
  </div>`;
}

function tasksView(){
  const active=state.tasks.filter(t=>!t.completed).sort((a,b)=>priorityScore(b.priority)-priorityScore(a.priority));
  const done=state.tasks.filter(t=>t.completed);
  return `<div class="section-head"><div><span class="eyebrow">TASKS</span><h1>Keep the queue small.</h1><p>Front-load what matters. Give deep work a single destination.</p></div><button class="primary-btn" data-action="add-task">+ Add task</button></div>
  <div class="tasks-layout"><section class="panel task-list-panel"><div class="list-toolbar"><span>${active.length} active</span><span>${done.length} completed</span><button class="ghost-btn" data-action="toggle-completed">${state.showCompleted?'Hide':'Show'} completed</button></div>${active.length?active.map(t=>taskCard(t,true)).join(''):'<div class="blank-slate"><div>✓</div><h3>Queue is clear.</h3><p>Add one concrete thing and start there.</p></div>'}${state.showCompleted&&done.length?`<div class="completed-divider">COMPLETED</div>${done.map(t=>taskCard(t,true)).join('')}`:''}</section>
  <aside class="panel task-guide"><span class="eyebrow">WORKING RULES</span><div class="rule"><b>01</b><span>One task can be active at a time.</span></div><div class="rule"><b>02</b><span>Add a time estimate so a vague task becomes a block.</span></div><div class="rule"><b>03</b><span>Complete the session before switching context.</span></div><div class="task-progress"><div class="progress-label"><span>Today</span><b>${Math.round(focusMinutesForRange(1))} min</b></div><div class="progress-bar"><i style="width:${Math.min(100,focusMinutesForRange(1)/120*100)}%"></i></div><small>Target: 2h</small></div></aside></div>`;
}
function taskCard(task, featured=false){
  const selected=state.timer.taskId===task.id; const mins=task.estimate||25;
  return `<article class="task-row ${selected?'selected':''} ${task.completed?'completed':''}">
    <button class="check ${task.completed?'checked':''}" data-action="toggle-task" data-id="${task.id}">${task.completed?'✓':''}</button>
    <button class="task-main" data-action="select-task" data-id="${task.id}"><span class="task-title">${esc(task.title)}</span><span class="task-meta"><i class="pill ${tagClass(task.priority)}">${esc(task.priority||'low')}</i><span>${mins} min</span>${task.tag?`<span>· ${esc(task.tag)}</span>`:''}</span></button>
    <div class="task-actions"><button class="mini-icon ${selected?'active':''}" title="Focus this task" data-action="select-task" data-id="${task.id}">◷</button><button class="mini-icon" title="Delete" data-action="delete-task" data-id="${task.id}">×</button></div>
  </article>`;
}
function emptyTasks(){ return `<div class="blank-slate small"><div>+</div><h3>No task in the queue.</h3><p>Add something concrete, then make it the center of the timer.</p><button class="link-btn" data-action="add-task">Add a task →</button></div>`; }
function priorityScore(p){ return p==='high'?3:p==='medium'?2:1; }

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
  return `<div class="section-head"><div><span class="eyebrow">SOUNDSCAPE</span><h1>Build the room around you.</h1><p>These textures are generated locally in your browser. Layer as many as you want.</p></div><div class="sound-total"><span>${active.length}</span> layers</div></div>
  <div class="sound-layout"><section class="panel sound-grid">${layers.map(([key,d])=>{const val=state.soundLayers[key]||0;return `<div class="sound-card ${val?'on':''}" data-sound="${key}"><div class="sound-icon">${d.icon}</div><div class="sound-info"><strong>${esc(d.label)}</strong><span>${val?'playing':'click to add'}</span></div><button class="sound-toggle" data-action="toggle-sound" data-sound="${key}">${val?'−':'+'}</button><input type="range" min="0" max="0.7" step="0.01" value="${val}" data-action="sound-volume" data-sound="${key}"/></div>`}).join('')}</section>
  <aside class="panel sound-side"><span class="eyebrow">MASTER</span><h2>Your focus room</h2><div class="master-knob"><div><strong>${Math.round((audioEngine?.master?.gain.value||0.26)*100)}%</strong><span>output</span></div></div><input class="wide-range" type="range" min="0" max="0.8" step="0.01" value="${audioEngine?.master?.gain.value||0.26}" data-action="master-volume"><p>Tip: rain + brown noise is a low-distraction starting point.</p><button class="secondary-btn full" data-action="stop-sounds">Clear soundscape</button></aside></div>`;
}
function soundMini(){
  const active=Object.entries(state.soundLayers).filter(([,v])=>v).slice(0,3); return active.length ? active.map(([k,v])=>`<div class="sound-chip"><span>${SOUND_DEFS[k]?.icon||'∿'} ${esc(SOUND_DEFS[k]?.label||k)}</span><b>${Math.round(v*100)}</b></div>`).join('') : '<div class="sound-empty">No layers active. <button class="link-btn" data-action="nav" data-view="sound">Add sound →</button></div>';
}

function musicView(){
  const cfg=spotifyConfig(), sp=state.spotify;
  return `<div class="section-head"><div><span class="eyebrow">MUSIC</span><h1>Bring your own soundtrack.</h1><p>Use curated playlists or connect Spotify to bring your personal library into the workspace.</p></div>${sp.connected?`<button class="secondary-btn" data-action="spotify-refresh">Refresh Spotify</button>`:`<button class="primary-btn" data-action="spotify-connect">Connect Spotify</button>`}</div>
  <div class="music-layout"><section class="panel playlist-panel"><div class="panel-head"><div><span class="eyebrow">CURATED</span><h2>Pick a lane</h2></div><span class="muted">opens in Spotify</span></div><div class="playlist-grid">${CURATED_PLAYLISTS.map(p=>`<a class="playlist-card" href="${p.url}" target="_blank" rel="noreferrer"><div class="playlist-art">${p.glyph}</div><div><strong>${esc(p.title)}</strong><span>${esc(p.note)}</span></div><b>↗</b></a>`).join('')}</div></section>
  <aside class="panel spotify-panel">${sp.connected && sp.profile ? `<div class="spotify-user"><div class="spotify-avatar">${esc((sp.profile.display_name||'S')[0].toUpperCase())}</div><div><span class="eyebrow">CONNECTED</span><h2>${esc(sp.profile.display_name||'Spotify')}</h2><p>${sp.playlists.length} playlists loaded</p></div><button class="ghost-btn" data-action="spotify-disconnect">Disconnect</button></div>${sp.nowPlaying?.item?`<div class="now-playing"><span class="eyebrow">NOW PLAYING</span><strong>${esc(sp.nowPlaying.item.name)}</strong><span>${esc(sp.nowPlaying.item.artists?.map(a=>a.name).join(', ')||'')}</span></div>`:''}<div class="my-playlists">${sp.playlists.slice(0,8).map(p=>`<a href="${p.external_urls.spotify}" target="_blank" rel="noreferrer"><span>${esc(p.name)}</span><b>↗</b></a>`).join('')}</div>`:`<div class="spotify-lock"><div class="spotify-mark">●</div><span class="eyebrow">OPTIONAL CONNECTION</span><h2>Your Spotify, here.</h2><p>Connect with Spotify’s browser-safe Authorization Code + PKCE flow. No client secret is stored in this app.</p>${cfg.clientId?'<button class="secondary-btn full" data-action="spotify-connect">Connect Spotify</button>':'<div class="setup-note">Add <code>VITE_SPOTIFY_CLIENT_ID</code> to Netlify build environment variables to enable this.</div>'}</div>`}</aside></div>`;
}

function miniChart(data){ const max=Math.max(20,...data.map(x=>x.minutes)); return `<div class="mini-chart">${data.map(x=>`<div><i style="height:${Math.max(8,x.minutes/max*100)}%"></i><small>${x.label[0]}</small></div>`).join('')}</div>`; }

function settingsView(){
  const cfg=MODES[state.selectedMode];
  return `<div class="section-head"><div><span class="eyebrow">SETTINGS</span><h1>Make it yours.</h1><p>Everything is stored locally in your browser unless you choose to connect Spotify.</p></div><button class="ghost-btn" data-action="reset-app">Reset app</button></div>
  <div class="settings-grid"><section class="panel settings-panel"><div class="settings-group"><span class="eyebrow">APPEARANCE</span><h2>Theme</h2><div class="theme-grid">${Object.entries(THEMES).map(([k,t])=>`<button class="theme-card ${state.theme===k?'active':''}" data-action="theme" data-theme-value="${k}"><span class="theme-thumb ${t.bg}"></span><strong>${esc(t.label)}</strong><small>${esc(t.kicker)}</small></button>`).join('')}</div><label class="field"><span>Custom background URL</span><input value="${esc(state.customBg)}" placeholder="https://…" data-setting="customBg"></label></div>
  <div class="settings-group"><span class="eyebrow">TIMER</span><h2>Mode</h2><select class="select" data-setting="selectedMode">${Object.entries(MODES).map(([k,m])=>`<option value="${k}" ${state.selectedMode===k?'selected':''}>${m.emoji} ${m.label} — ${m.description}</option>`).join('')}</select><div class="timer-fields">${timerField('Focus minutes','focus',state.durations.focus)}${timerField('Short break','short',state.durations.short)}${timerField('Long break','long',state.durations.long)}${timerField('Rounds','rounds',state.durations.rounds)}${state.selectedMode==='countdown'?timerField('Countdown','countdown',state.durations.countdown):''}${state.selectedMode==='animedoro'?timerField('Animedoro focus','animedoro',state.durations.animedoro):''}</div></div></section>
  <aside class="panel settings-side"><div class="toggle-row"><div><b>Motivational quotes</b><span>Show a small daily note on Home.</span></div><input type="checkbox" ${state.quoteEnabled?'checked':''} data-setting="quoteEnabled"></div><div class="toggle-row"><div><b>Notifications</b><span>Browser alerts when a session ends.</span></div><input type="checkbox" ${state.notifications?'checked':''} data-setting="notifications"></div><div class="toggle-row"><div><b>Auto-start breaks</b><span>Start the break as soon as focus ends.</span></div><input type="checkbox" ${state.autoStartBreaks?'checked':''} data-setting="autoStartBreaks"></div><div class="toggle-row"><div><b>Alert sound</b><span>Play a small local chime.</span></div><input type="checkbox" ${state.alertEnabled?'checked':''} data-setting="alertEnabled"></div><div class="settings-group compact"><span class="eyebrow">PROFILE</span><label class="field"><span>Your name</span><input value="${esc(state.greetingName)}" data-setting="greetingName" placeholder="there"></label></div><div class="settings-group compact"><span class="eyebrow">KEYBOARD</span><div class="shortcut"><kbd>Space</kbd><span>Start / pause timer</span></div><div class="shortcut"><kbd>R</kbd><span>Reset timer</span></div><div class="shortcut"><kbd>1–6</kbd><span>Jump between workspaces</span></div></div></aside></div>`;
}
function timerField(label,key,val){ return `<label class="field small-field"><span>${label}</span><input type="number" min="1" max="480" value="${val}" data-setting="durations.${key}"></label>`; }

function render(){
  document.getElementById('app').innerHTML=appShell(({home:homeView,focus:focusView,tasks:tasksView,stats:statsView,sound:soundView,music:musicView,settings:settingsView}[state.view]||homeView)());
  updateTimerDom();
  if(audioEngine) syncAudioUi();
}
function syncAudioUi(){ if(!audioEngine) return; document.querySelectorAll('[data-sound]').forEach(card=>{const key=card.dataset.sound; if(key && state.soundLayers[key]) card.classList.add('on');}); }
function updateTimerDom(){ const el=document.getElementById('timer-time'); if(el) el.textContent=formatTime(state.timer.remaining,state.selectedMode==='stopwatch'); const ring=document.querySelector('.timer-ring'); if(ring && state.timer.total){ ring.style.setProperty('--progress',`${Math.round(Math.min(1,Math.max(0,1-state.timer.remaining/state.timer.total))*360)}deg`); } }
function showToast(msg){ const el=document.getElementById('toast'); if(!el) return; el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),3200); }
function addTask(){ const title=prompt('Task name'); if(!title?.trim()) return; const estimate=Number(prompt('Estimated minutes', '25')||25); const priority=prompt('Priority: high / medium / low','medium')||'medium'; state.tasks.push({id:uid(),title:title.trim(),estimate:Math.max(1,estimate),priority:['high','medium','low'].includes(priority)?priority:'medium',tag:'',completed:false,createdAt:new Date().toISOString(),focusedMinutes:0}); saveState(); render(); }
function exportData(){ const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),tasks:state.tasks,sessions:state.sessions,settings:{theme:state.theme,selectedMode:state.selectedMode,durations:state.durations}},null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`focusforge-${todayKey()}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }

function applySetting(el){ const key=el.dataset.setting; if(!key) return; let value=el.type==='checkbox'?el.checked:el.value; if(el.type==='number') value=Number(value); if(key.startsWith('durations.')) state.durations[key.split('.')[1]]=value; else state[key]=value; if(key==='selectedMode'){ const mode=MODES[value]||MODES.custom; if(value!=='custom'){ state.durations.focus=mode.focus||state.durations.focus; state.durations.short=mode.short||state.durations.short; state.durations.long=mode.long||state.durations.long; if(value==='countdown') state.durations.countdown=mode.focus||state.durations.countdown; if(value==='animedoro') state.durations.animedoro=mode.focus||state.durations.animedoro; if(value==='52-17') {state.durations.focus=52;state.durations.short=17;state.durations.long=17;} if(value==='deep') {state.durations.focus=90;state.durations.short=20;state.durations.long=20;} if(value==='pomodoro') {state.durations.focus=25;state.durations.short=5;state.durations.long=15;state.durations.rounds=4;} if(value==='animedoro') {state.durations.focus=40;state.durations.short=20;state.durations.long=20;state.durations.rounds=1;} } state.timer.phase='focus'; state.timer.cycle=1; state.timer.taskId=null; resetTimer('focus'); return; } saveState(); if(key==='customBg'||key==='theme'||key==='greetingName') render(); }

function setupEvents(){
  document.addEventListener('click', e=>{
    const btn=e.target.closest('[data-action]'); if(!btn) return; const a=btn.dataset.action;
    if(a==='nav'){state.view=btn.dataset.view; saveState(); render(); return;}
    if(a==='start-focus'){state.view='focus'; startTimer(); return;}
    if(a==='toggle-timer'){state.timer.running?pauseTimer():startTimer(); return;}
    if(a==='reset'){resetTimer(state.timer.phase); return;}
    if(a==='skip'){skipPhase(); return;}
    if(a==='add-task'){addTask(); return;}
    if(a==='toggle-completed'){state.showCompleted=!state.showCompleted; saveState(); render(); return;}
    if(a==='toggle-task'){const t=state.tasks.find(t=>t.id===btn.dataset.id); if(t){t.completed=!t.completed; if(t.completed&&state.timer.taskId===t.id) state.timer.taskId=null; saveState(); render();} return;}
    if(a==='select-task'){state.timer.taskId=btn.dataset.id; saveState(); render(); return;}
    if(a==='delete-task'){state.tasks=state.tasks.filter(t=>t.id!==btn.dataset.id); if(state.timer.taskId===btn.dataset.id)state.timer.taskId=null; saveState(); render(); return;}
    if(a==='theme'){state.theme=btn.dataset.themeValue; saveState(); render(); return;}
    if(a==='open-timer-settings'){state.view='settings'; saveState(); render(); return;}
    if(a==='quick-settings'){state.view='settings';saveState();render();return;}
    if(a==='toggle-sound'){const k=btn.dataset.sound; ensureAudio(); if(state.soundLayers[k]) audioEngine.remove(k); else audioEngine.add(k,0.32); render(); return;}
    if(a==='stop-sounds'){ if(audioEngine){ [...audioEngine.layers.keys()].forEach(k=>audioEngine.remove(k)); } render(); return; }
    if(a==='master-volume'){return;}
    if(a==='notify'){requestNotifications(); showToast('Notification permission requested.'); return;}
    if(a==='export'){exportData();return;}
    if(a==='clear-sessions'){ if(confirm('Clear all recorded focus sessions?')){state.sessions=[];saveState();render();}return; }
    if(a==='reset-app'){ if(confirm('Reset FocusForge data on this device?')){localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(TOKEN_KEY);location.reload();}return; }
    if(a==='spotify-connect'){connectSpotify();return;}
    if(a==='spotify-refresh'){loadSpotify();return;}
    if(a==='spotify-disconnect'){disconnectSpotify();return;}
  });
  document.addEventListener('change', e=>{ const el=e.target.closest('[data-setting]'); if(el) applySetting(el); });
  document.addEventListener('input', e=>{ const el=e.target; if(el.dataset?.action==='sound-volume'){const k=el.dataset.sound; const v=Number(el.value); ensureAudio(); if(!state.soundLayers[k]) audioEngine.add(k,v); else audioEngine.set(k,v); const card=el.closest('.sound-card'); card?.classList.toggle('on',v>0); return;} if(el.dataset?.action==='master-volume'){ensureAudio(); audioEngine.master.gain.value=Number(el.value); return;} const setting=el.dataset?.setting; if(setting==='customBg'){state.customBg=el.value;saveState();document.querySelector('.app')?.style.setProperty('--custom-bg',`url('${el.value.replaceAll("'",'')}')`);return;} });
  window.addEventListener('keydown', e=>{ if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return; if(e.code==='Space'){e.preventDefault(); state.timer.running?pauseTimer():startTimer();} if(e.key.toLowerCase()==='r') resetTimer('focus'); const map={'1':'home','2':'focus','3':'tasks','4':'stats','5':'sound','6':'music'}; if(map[e.key]){state.view=map[e.key];saveState();render();} });
}

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
