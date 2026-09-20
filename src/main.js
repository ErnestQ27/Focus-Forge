const STORAGE_KEY = 'focusforge:v3';
const TOKEN_KEY = 'focusforge:spotify:v1';
const PKCE_KEY = 'focusforge:pkce:v1';

const MODES = {
  pomodoro: { label:'Pomodoro', icon:'🍅', description:'25 min focus · 5 min break · long break after 4 rounds', focus:25, short:5, long:15, rounds:4 },
  '52-17': { label:'52 / 17', icon:'◷', description:'52 min focus · 17 min break', focus:52, short:17, long:17, rounds:1 },
  deep: { label:'Deep Work', icon:'◉', description:'90 min focus · 20 min break', focus:90, short:20, long:20, rounds:1 },
  animedoro: { label:'Animedoro', icon:'▸', description:'40 min focus · 20 min reset', focus:40, short:20, long:20, rounds:1 },
  countdown: { label:'Countdown', icon:'⌛', description:'A single custom countdown with no auto-break', focus:30, short:5, long:15, rounds:1 },
  stopwatch: { label:'Stopwatch', icon:'⏱', description:'Count up until you stop', focus:0, short:0, long:0, rounds:1 },
  custom: { label:'Custom', icon:'✦', description:'Set your own focus / break rhythm', focus:45, short:10, long:20, rounds:4 }
};

const THEMES = {
  cosmic: {
    label:'Cosmic Dunes', kicker:'space · desert · dusk',
    art:'https://images.unsplash.com/photo-1765813957002-d38730e03b11?auto=format&fit=crop&fm=jpg&q=82&w=2400',
    source:'https://unsplash.com/photos/stars-shine-brightly-over-dark-desert-dunes-at-night-gbmYqH4Wv1U',
    vars:{ bg:'#06101e', panel:'rgba(7,17,31,.72)', panel2:'rgba(13,28,49,.82)', accent:'#63c5ff', accent2:'#3978ff', warm:'#e7b56c' }
  },
  pnw: {
    label:'PNW Coast', kicker:'ocean · evergreen · blue hour',
    art:'https://images.unsplash.com/photo-1559872204-3ba018836d10?auto=format&fit=crop&fm=jpg&q=82&w=2400',
    source:'https://unsplash.com/s/photos/costa-de-oregon',
    vars:{ bg:'#06131c', panel:'rgba(6,22,31,.68)', panel2:'rgba(12,34,45,.8)', accent:'#60dbff', accent2:'#2c94e5', warm:'#9ecab8' }
  },
  alpine: {
    label:'Alpine', kicker:'snow · mountains · stillness',
    art:'https://images.unsplash.com/photo-1565199953730-2ea3b119ae22?auto=format&fit=crop&fm=jpg&q=82&w=2400',
    source:'https://unsplash.com/photos/landscape-photography-of-mountain-y-njhJIffIo',
    vars:{ bg:'#08111b', panel:'rgba(8,19,30,.7)', panel2:'rgba(17,33,49,.82)', accent:'#8cc8ff', accent2:'#4f8de7', warm:'#cad9e6' }
  },
  desert: {
    label:'Desert Twilight', kicker:'sand · stars · long horizon',
    art:'https://images.unsplash.com/photo-1764821882901-01edc342cda3?auto=format&fit=crop&fm=jpg&q=82&w=2400',
    source:'https://unsplash.com/photos/sun-setting-over-vast-desert-sand-dunes-ywOWmk02NFQ',
    vars:{ bg:'#0f1017', panel:'rgba(20,17,24,.7)', panel2:'rgba(39,30,35,.82)', accent:'#78a9ff', accent2:'#5569dd', warm:'#e8ba78' }
  },
  coast: {
    label:'Moonlit Coast', kicker:'lighthouse · sea · night',
    art:'https://images.unsplash.com/photo-1763147297620-7f7663e906ad?auto=format&fit=crop&fm=jpg&q=82&w=2400',
    source:'https://unsplash.com/photos/lighthouse-on-a-rocky-coast-under-the-milky-way-IW7KXVfrTp4',
    vars:{ bg:'#071018', panel:'rgba(8,18,28,.72)', panel2:'rgba(18,34,45,.84)', accent:'#72c9ff', accent2:'#376fe2', warm:'#d6a96f' }
  },
  aurora: {
    label:'Aurora Bay', kicker:'northern lights · ocean · night',
    art:'https://images.unsplash.com/photo-1687373005624-53004f8b04de?auto=format&fit=crop&fm=jpg&q=82&w=2400',
    source:'https://unsplash.com/photos/a-green-and-blue-aurora-above-a-snowy-mountain-range-pUqW9tM7nTM',
    vars:{ bg:'#07111f', panel:'rgba(7,20,31,.72)', panel2:'rgba(14,35,47,.82)', accent:'#65d7ff', accent2:'#5778ff', warm:'#8ed7c2' }
  }
};

const SOUNDS = {
  rain: { label:'Rain on glass', detail:'soft drops · steady shower', file:'rain.wav', icon:'☂' },
  brown:{ label:'Brown noise', detail:'deep low-frequency masking', file:'brown.wav', icon:'≈' },
  cafe:{ label:'Quiet café', detail:'murmur · cups · room tone', file:'cafe.wav', icon:'☕' },
  fire:{ label:'Fireplace', detail:'warm hiss · tiny crackles', file:'fire.wav', icon:'♨' },
  ocean:{ label:'Ocean surf', detail:'rolling waves · distant foam', file:'ocean.wav', icon:'∿' },
  wind:{ label:'Mountain wind', detail:'broad airy gusts', file:'wind.wav', icon:'⌁' },
  white:{ label:'White noise', detail:'bright even masking', file:'white.wav', icon:'▱' }
};

const PLAYLISTS = [
  { title:'Deep Focus', note:'ambient electric guitar · long-form', url:'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ', icon:'◒' },
  { title:'Deep Focus Radio', note:'ambient · instrumental · radio', url:'https://open.spotify.com/playlist/37i9dQZF1E4u1QVkSbTm4P', icon:'◎' },
  { title:'Peaceful Piano', note:'modern classical · soft', url:'https://open.spotify.com/playlist/2CjqpIIpT2yriVzOqBIdiP', icon:'⌁' },
  { title:'lofi beats', note:'chill beats · low distraction', url:'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn', icon:'◌' },
  { title:'Pure Piano', note:'piano · contemplative · quiet', url:'https://open.spotify.com/playlist/1cvPpujeNNmtF3q2hjR3wp', icon:'◇' }
];

const QUOTES = [
  'Make the next hour count, not the next ten years.',
  'Protect the first five minutes. Momentum handles the rest.',
  'Less switching. More finishing.',
  'Work quietly. Let the result be loud.',
  'A focused hour is still an hour you own.',
  'One clear task is enough to start.'
];

const DEFAULT = {
  view:'home',
  theme:'cosmic',
  customBg:'',
  greetingName:'there',
  selectedMode:'pomodoro',
  durations:{ focus:25, short:5, long:15, rounds:4, countdown:30, animedoro:40 },
  notifications:false,
  alertEnabled:true,
  autoStartBreaks:false,
  quoteEnabled:true,
  timer:{ running:false, phase:'focus', remaining:1500, total:1500, cycle:1, taskId:null, startedAt:null, lastTick:null },
  tasks:[],
  sessions:[],
  sounds:{},
  master:0.28,
  spotify:{ connected:false, profile:null, playlists:[], nowPlaying:null }
};

let state = loadState();
let audio = { players:new Map(), initialized:false };
let runtime = { spotifyClientId:'' };
let timerInterval = null;
let clockInterval = null;

function deepCopy(o){ return JSON.parse(JSON.stringify(o)); }
function escapeHtml(s){ return String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function save(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }
function uid(){ return globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    const s=raw ? JSON.parse(raw) : deepCopy(DEFAULT);
    const merged={...deepCopy(DEFAULT),...s,durations:{...DEFAULT.durations,...(s.durations||{})},timer:{...DEFAULT.timer,...(s.timer||{})},spotify:{...DEFAULT.spotify,...(s.spotify||{})},sounds:{...(s.sounds||{})}};
    if(!THEMES[merged.theme]) merged.theme='cosmic';
    if(!['home','focus','tasks','stats','sound','settings'].includes(merged.view)) merged.view='home';
    return merged;
  }catch{return deepCopy(DEFAULT);}
}
function selectedMode(){ return MODES[state.selectedMode] || MODES.pomodoro; }
function durationSeconds(phase='focus'){
  if(state.selectedMode==='stopwatch') return 0;
  if(state.selectedMode==='countdown') return Math.max(1,Number(state.durations.countdown)||30)*60;
  if(phase==='focus') return Math.max(1,Number(state.selectedMode==='animedoro'?state.durations.animedoro:state.durations.focus)||25)*60;
  return Math.max(1,Number(phase==='long'?state.durations.long:state.durations.short)||5)*60;
}
function formatTime(sec){
  const n=Math.max(0,Math.floor(sec));
  const h=Math.floor(n/3600),m=Math.floor((n%3600)/60),s=n%60;
  return h ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function formatMinutes(m){ if(m<60)return `${Math.round(m)}m`; const h=Math.floor(m/60),r=Math.round(m%60); return r?`${h}h ${r}m`:`${h}h`; }
function dayKey(d=new Date()){ const x=new Date(d); return x.toLocaleDateString('en-CA'); }
function sessionMinutes(days=1){
  const start=Date.now()-(days-1)*86400000;
  return state.sessions.filter(s=>new Date(s.endedAt).getTime()>=start).reduce((a,s)=>a+s.duration/60,0);
}
function streak(){
  const days=new Set(state.sessions.map(s=>dayKey(s.endedAt))); let d=new Date(); let n=0;
  if(!days.has(dayKey(d))) d.setDate(d.getDate()-1);
  while(days.has(dayKey(d))){ n++; d.setDate(d.getDate()-1); }
  return n;
}
function trend(days=7){
  const out=[]; const base=new Date(); base.setHours(0,0,0,0);
  for(let i=days-1;i>=0;i--){ const d=new Date(base); d.setDate(d.getDate()-i); const k=dayKey(d); const min=state.sessions.filter(s=>dayKey(s.endedAt)===k).reduce((a,s)=>a+s.duration/60,0); out.push({label:d.toLocaleDateString([], {weekday:'short'}),minutes:min,key:k}); }
  return out;
}
function currentTask(){ return state.tasks.find(t=>t.id===state.timer.taskId) || null; }
function priorityScore(p){ return p==='high'?3:p==='medium'?2:1; }
function sanitizeUrl(u){ try{ const x=new URL(u); return ['http:','https:'].includes(x.protocol)?x.href:''; }catch{return '';} }
function themeStyle(){
  const t=THEMES[state.theme];
  const bg=state.customBg ? sanitizeUrl(state.customBg) : t.art;
  const v=t.vars;
  return `--bg:${v.bg};--panel:${v.panel};--panel2:${v.panel2};--accent:${v.accent};--accent2:${v.accent2};--warm:${v.warm};--art:url("${bg}");`;
}

function homeView(){
  const active=state.tasks.filter(t=>!t.completed).sort((a,b)=>priorityScore(b.priority)-priorityScore(a.priority));
  const next=active[0]; const today=Math.round(sessionMinutes(1)); const week=Math.round(sessionMinutes(7));
  return `<div class="view view-home">
    <div class="home-head"><div><span class="eyebrow">${new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})} · ${new Date().toLocaleDateString([], {weekday:'long',month:'long',day:'numeric'})}</span><h1>Make space for <em>deep work.</em></h1><p>Welcome back, ${escapeHtml(state.greetingName||'there')}. Keep the next block simple.</p></div><div class="home-actions"><button class="primary" data-action="start-focus">Start focus <span>↗</span></button><button class="secondary" data-action="nav" data-view="tasks">Add task <span>＋</span></button></div></div>
    <div class="home-grid">
      <section class="glass hero-home"><div class="hero-copy"><span class="eyebrow">CURRENT MODE</span><strong>${selectedMode().icon} ${escapeHtml(selectedMode().label)}</strong><span>${escapeHtml(selectedMode().description)}</span></div><div class="home-time">${state.selectedMode==='stopwatch'?'UP':formatTime(durationSeconds('focus'))}</div><div class="home-hero-meta"><span><b>${formatMinutes(today)}</b> today</span><span><b>${formatMinutes(week)}</b> 7 days</span><span><b>${streak()}</b> streak</span></div></section>
      <section class="glass upnext"><div class="section-mini"><span class="eyebrow">UP NEXT</span><button class="text-button" data-action="nav" data-view="tasks">All tasks →</button></div>${next?taskRow(next,true):`<div class="empty-inline"><span>+</span><div><strong>No task queued</strong><p>Add one concrete thing and make it the center of the next block.</p></div><button class="secondary" data-action="nav" data-view="tasks">Add task</button></div>`}</section>
      <section class="glass snapshot"><div class="section-mini"><div><span class="eyebrow">7-DAY SNAPSHOT</span><strong>Focus rhythm</strong></div><span class="mono">${week} min</span></div>${miniBars(trend(7))}</section>
      <section class="glass room-mini"><div class="section-mini"><div><span class="eyebrow">FOCUS ROOM</span><strong>${Object.keys(state.sounds).filter(k=>state.sounds[k]>0).length} sound layers</strong></div><button class="text-button" data-action="nav" data-view="sound">Open soundroom →</button></div><div class="chip-row">${activeSoundChips() || '<span class="muted">Nothing playing yet.</span>'}</div></section>
      <section class="glass quote-home"><span class="quote-mark">“</span><p>${state.quoteEnabled?QUOTES[new Date().getDate()%QUOTES.length]:'Quotes are off. Let the work speak.'}</p><span class="eyebrow">DAILY NOTE</span></section>
    </div>
  </div>`;
}

function focusView(){
  const mode=selectedMode(); const total=Math.max(1,state.timer.total||durationSeconds(state.timer.phase)); const progress=state.selectedMode==='stopwatch'?0:Math.min(1,Math.max(0,1-state.timer.remaining/total)); const task=currentTask();
  return `<div class="view view-focus">
    <section class="focus-stage glass">
      <div class="focus-art" style="background-image:var(--art)"></div>
      <div class="focus-overlay"></div>
      <div class="focus-content">
        <div class="focus-top"><div><span class="eyebrow">${state.timer.phase==='focus'?'FOCUS':'BREAK'} · ${escapeHtml(mode.label)}</span><h1>${state.timer.running?'Stay with it.':'Ready when you are.'}</h1><p>${task?escapeHtml(task.title):'Pick a task below or start without one.'}</p></div><button class="icon" data-action="nav" data-view="settings" title="Timer settings">⚙</button></div>
        <div class="timer-zone"><div class="timer-ring" style="--progress:${Math.round(progress*360)}deg"><div class="timer-inner"><span>${state.selectedMode==='stopwatch'?'STOPWATCH':state.timer.phase==='focus'?'FOCUS':'RESET'}</span><strong id="timer-time">${formatTime(state.timer.remaining)}</strong><em>${task?escapeHtml(task.title):'No task selected'}</em></div></div></div>
        <div class="timer-controls"><button class="timer-primary" data-action="toggle-timer">${state.timer.running?'Pause':'Start'}</button><button class="secondary" data-action="reset">Reset</button><button class="secondary" data-action="skip">Skip phase</button></div>
        <div class="focus-bottom"><span>Round ${state.timer.cycle} · ${escapeHtml(mode.description)}</span><button class="text-button" data-action="nav" data-view="tasks">Choose task →</button></div>
      </div>
    </section>
  </div>`;
}

function tasksView(){
  const active=state.tasks.filter(t=>!t.completed).sort((a,b)=>priorityScore(b.priority)-priorityScore(a.priority));
  const done=state.tasks.filter(t=>t.completed);
  return `<div class="view"><div class="section-head"><div><span class="eyebrow">TASKS</span><h1>Give the timer a target.</h1><p>Capture the next concrete thing instead of carrying the whole list in your head.</p></div><span class="count-badge">${active.length} active</span></div>
    <section class="glass task-composer"><form id="task-form"><div class="task-title-input"><span class="plus">＋</span><input name="title" autocomplete="off" placeholder="What are you actually trying to finish?" required></div><div class="task-fields"><label><span>Estimate</span><div class="input-with-suffix"><input type="number" name="estimate" min="1" max="480" value="25"><em>min</em></div></label><label><span>Priority</span><select name="priority"><option value="medium">Medium</option><option value="high">High</option><option value="low">Low</option></select></label><label><span>Tag</span><input name="tag" maxlength="24" placeholder="school, coding…"></label><button class="primary" type="submit">Add task</button></div></form></section>
    <section class="task-list">${active.map(t=>taskRow(t)).join('') || '<div class="glass empty-state"><strong>Your queue is clear.</strong><span>Use the composer above when the next thing becomes concrete.</span></div>'}</section>
    ${done.length?`<div class="completed-wrap"><button class="text-button" data-action="toggle-completed">${state.showCompleted?'Hide':'Show'} completed · ${done.length}</button>${state.showCompleted?`<section class="task-list completed-list">${done.map(t=>taskRow(t)).join('')}</section>`:''}</div>`:''}
  </div>`;
}

function statsView(){
  const d7=trend(7), max=Math.max(30,...d7.map(x=>x.minutes)), today=Math.round(sessionMinutes(1)), week=Math.round(sessionMinutes(7)), month=Math.round(sessionMinutes(30));
  return `<div class="view"><div class="section-head"><div><span class="eyebrow">FOCUS STATS</span><h1>See your actual work.</h1><p>Only completed focus blocks count here.</p></div><button class="secondary" data-action="export">Export data</button></div>
    <div class="stats-cards"><div class="glass stat"><span>Today</span><b>${formatMinutes(today)}</b><small>${state.sessions.filter(s=>dayKey(s.endedAt)===dayKey()).length} sessions</small></div><div class="glass stat"><span>7 days</span><b>${formatMinutes(week)}</b><small>${state.sessions.filter(s=>new Date(s.endedAt).getTime()>Date.now()-7*86400000).length} sessions</small></div><div class="glass stat"><span>30 days</span><b>${formatMinutes(month)}</b><small>${formatMinutes(state.sessions.reduce((a,s)=>a+s.duration/60,0))} all time</small></div><div class="glass stat accent-stat"><span>Streak</span><b>${streak()}d</b><small>days with completed focus</small></div></div>
    <div class="stats-grid"><section class="glass chart"><div class="section-mini"><div><span class="eyebrow">LAST 7 DAYS</span><strong>Focus rhythm</strong></div><span class="mono">${week} min</span></div><div class="bar-chart">${d7.map(d=>`<div class="bar-column"><span>${d.minutes?Math.round(d.minutes):''}</span><div class="bar-track"><i style="height:${Math.max(5,d.minutes/max*100)}%"></i></div><small>${d.label}</small></div>`).join('')}</div></section>
    <section class="glass breakdown"><div class="section-mini"><div><span class="eyebrow">OUTPUT</span><strong>Today at a glance</strong></div></div><div class="ring-stat" style="--p:${Math.min(100,today/120*100)}%"><b>${Math.min(100,Math.round(today/120*100))}%</b><span>of 2h target</span></div><div class="break-list"><div><span>Focus sessions</span><b>${state.sessions.length}</b></div><div><span>Tasks completed</span><b>${state.tasks.filter(t=>t.completed).length}</b></div><div><span>All-time focus</span><b>${formatMinutes(state.sessions.reduce((a,s)=>a+s.duration/60,0))}</b></div></div></section></div>
    <section class="glass history"><div class="section-mini"><div><span class="eyebrow">HISTORY</span><strong>Recent sessions</strong></div><button class="text-button" data-action="clear-sessions">Clear history</button></div><div class="history-list">${state.sessions.slice().reverse().slice(0,20).map(s=>`<div><span>${new Date(s.endedAt).toLocaleDateString([], {month:'short',day:'numeric'})}</span><b>${formatMinutes(s.duration/60)}</b><span>${escapeHtml(MODES[s.mode]?.label||s.mode)}</span><span>${escapeHtml(state.tasks.find(t=>t.id===s.taskId)?.title||'Focus session')}</span></div>`).join('') || '<div class="empty-state"><strong>No completed sessions yet.</strong></div>'}</div></section>
  </div>`;
}

function soundView(){
  const activeCount=Object.values(state.sounds).filter(v=>v>0).length;
  return `<div class="view view-sound"><div class="section-head"><div><span class="eyebrow">SOUNDROOM</span><h1>Build the room around you.</h1><p>Every sound below is a real local audio loop in your repo. Music lives right underneath the soundboards.</p></div><span class="count-badge">${activeCount} layers</span></div>
    <div class="sound-layout"><section class="glass sound-board">${Object.entries(SOUNDS).map(([key,s])=>soundCard(key,s)).join('')}</section>
    <aside class="glass master-card"><span class="eyebrow">MASTER</span><h2>Room volume</h2><div class="master-value" id="master-value">${Math.round(state.master*100)}%</div><input type="range" min="0" max="0.8" step="0.01" value="${state.master}" data-action="master-volume"><p>Mix the layers independently, then use one master control for the entire room.</p><button class="secondary full" data-action="stop-sounds">Clear soundscape</button></aside></div>
    <section class="music-section"><div class="section-mini"><div><span class="eyebrow">MUSIC</span><strong>Curated playlists + Spotify</strong></div><span class="muted">opens in Spotify</span></div><div class="music-grid">${PLAYLISTS.map(p=>`<a class="playlist" href="${p.url}" target="_blank" rel="noopener noreferrer"><div class="playlist-art">${p.icon}</div><div><strong>${escapeHtml(p.title)}</strong><span>${escapeHtml(p.note)}</span></div><b>↗</b></a>`).join('')}
      <div class="spotify-connect glass-inner">${spotifyBlock()}</div>
    </div></section>
  </div>`;
}

function settingsView(){
  const mode=selectedMode();
  return `<div class="view"><div class="section-head"><div><span class="eyebrow">SETTINGS</span><h1>Make it yours.</h1><p>Everything except Spotify stays in this browser.</p></div><button class="text-button" data-action="reset-app">Reset app</button></div>
    <div class="settings-grid"><section class="glass settings-panel"><div class="settings-group"><span class="eyebrow">THEME</span><h2>Choose a world</h2><div class="theme-grid">${Object.entries(THEMES).map(([k,t])=>`<button class="theme-choice ${state.theme===k?'active':''}" data-action="theme" data-theme-value="${k}"><span style="background-image:url('${t.art}')"></span><strong>${escapeHtml(t.label)}</strong><small>${escapeHtml(t.kicker)}</small></button>`).join('')}</div><label class="field"><span>Custom background URL</span><input data-setting="customBg" value="${escapeHtml(state.customBg)}" placeholder="https://example.com/image.jpg"></label></div>
      <div class="settings-group"><span class="eyebrow">TIMER</span><h2>${mode.icon} Timer rhythm</h2><select class="field-control" data-setting="selectedMode">${Object.entries(MODES).map(([k,m])=>`<option value="${k}" ${state.selectedMode===k?'selected':''}>${m.label} — ${m.description}</option>`).join('')}</select><div class="timer-fields"><label class="field"><span>Focus minutes</span><input type="number" min="1" max="480" data-setting="durations.focus" value="${state.durations.focus}"></label><label class="field"><span>Short break</span><input type="number" min="1" max="120" data-setting="durations.short" value="${state.durations.short}"></label><label class="field"><span>Long break</span><input type="number" min="1" max="240" data-setting="durations.long" value="${state.durations.long}"></label><label class="field"><span>Rounds</span><input type="number" min="1" max="12" data-setting="durations.rounds" value="${state.durations.rounds}"></label>${state.selectedMode==='countdown'?`<label class="field"><span>Countdown</span><input type="number" min="1" max="480" data-setting="durations.countdown" value="${state.durations.countdown}"></label>`:''}${state.selectedMode==='animedoro'?`<label class="field"><span>Animedoro focus</span><input type="number" min="1" max="480" data-setting="durations.animedoro" value="${state.durations.animedoro}"></label>`:''}</div></div></section>
    <aside class="glass settings-side"><div class="toggle"><div><b>Browser notifications</b><span>Alert when a focus or break ends.</span></div><input type="checkbox" data-setting="notifications" ${state.notifications?'checked':''}></div><div class="toggle"><div><b>Auto-start breaks</b><span>Jump directly into the next break.</span></div><input type="checkbox" data-setting="autoStartBreaks" ${state.autoStartBreaks?'checked':''}></div><div class="toggle"><div><b>Timer alert sound</b><span>Use the local chime at phase changes.</span></div><input type="checkbox" data-setting="alertEnabled" ${state.alertEnabled?'checked':''}></div><div class="toggle"><div><b>Daily note</b><span>Keep the small quote on Home.</span></div><input type="checkbox" data-setting="quoteEnabled" ${state.quoteEnabled?'checked':''}></div><div class="settings-group"><span class="eyebrow">PROFILE</span><label class="field"><span>Your name</span><input data-setting="greetingName" value="${escapeHtml(state.greetingName)}"></label></div><div class="settings-group"><span class="eyebrow">SHORTCUTS</span><div class="shortcut"><kbd>Space</kbd><span>start / pause</span></div><div class="shortcut"><kbd>R</kbd><span>reset</span></div><div class="shortcut"><kbd>1–6</kbd><span>jump workspaces</span></div></div></aside></div>
  </div>`;
}

function taskRow(t,featured=false){
  const selected=state.timer.taskId===t.id;
  return `<article class="task-row ${selected?'selected':''} ${featured?'featured':''} ${t.completed?'completed':''}"><button class="check ${t.completed?'checked':''}" data-action="toggle-task" data-id="${t.id}">${t.completed?'✓':''}</button><button class="task-body" data-action="select-task" data-id="${t.id}"><strong>${escapeHtml(t.title)}</strong><span><i class="pill ${t.priority}">${t.priority}</i><em>${t.estimate} min</em>${t.tag?`<em>· ${escapeHtml(t.tag)}</em>`:''}</span></button><div class="task-actions"><button class="mini-action ${selected?'active':''}" title="Focus this task" data-action="select-task" data-id="${t.id}">◷</button><button class="mini-action" title="Delete" data-action="delete-task" data-id="${t.id}">×</button></div></article>`;
}
function activeSoundChips(){
  return Object.entries(state.sounds).filter(([,v])=>v>0).slice(0,4).map(([k,v])=>`<span class="sound-chip">${SOUNDS[k]?.icon||'∿'} ${escapeHtml(SOUNDS[k]?.label||k)} <b>${Math.round(v*100)}</b></span>`).join('');
}
function soundCard(key,s){
  const val=Number(state.sounds[key]||0);
  return `<div class="sound-item ${val>0?'on':''}"><button class="sound-main" data-action="toggle-sound" data-sound="${key}"><span class="sound-icon">${s.icon}</span><span><strong>${escapeHtml(s.label)}</strong><small>${escapeHtml(s.detail)}</small></span><b>${val>0?'−':'+'}</b></button><input type="range" min="0" max="0.7" step="0.01" value="${val}" data-action="sound-volume" data-sound="${key}" aria-label="${escapeHtml(s.label)} volume"></div>`;
}
function miniBars(data){ const max=Math.max(20,...data.map(d=>d.minutes)); return `<div class="mini-bars">${data.map(d=>`<div><i style="height:${Math.max(7,d.minutes/max*100)}%"></i><small>${d.label[0]}</small></div>`).join('')}</div>`; }
function spotifyBlock(){
  if(state.spotify.connected && state.spotify.profile){
    const now=state.spotify.nowPlaying?.item;
    return `<div><div class="spotify-user"><div class="spotify-badge">S</div><div><span class="eyebrow">CONNECTED</span><strong>${escapeHtml(state.spotify.profile.display_name||'Spotify')}</strong><small>${state.spotify.playlists.length} playlists loaded</small></div></div>${now?`<div class="now-playing"><span class="eyebrow">NOW PLAYING</span><strong>${escapeHtml(now.name)}</strong><span>${escapeHtml(now.artists?.map(a=>a.name).join(', ')||'')}</span></div>`:''}<button class="secondary full" data-action="spotify-refresh">Refresh Spotify</button><button class="text-button full" data-action="spotify-disconnect">Disconnect</button></div>`;
  }
  return `<div><span class="eyebrow">OPTIONAL CONNECTION</span><h3>Bring your Spotify library here.</h3><p>Connect with Authorization Code + PKCE. No Spotify client secret is stored in the browser.</p>${runtime.spotifyClientId?'<button class="secondary full" data-action="spotify-connect">Connect Spotify</button>':'<div class="setup-note">Set <code>SPOTIFY_CLIENT_ID</code> in Netlify to enable the connection.</div>'}</div>`;
}

function shell(content){
  const t=THEMES[state.theme];
  return `<div class="app" data-theme="${state.theme}" style="${themeStyle()}"><div class="art-backdrop"></div><aside class="sidebar"><button class="brand" data-action="nav" data-view="home"><span class="brand-mark">◔</span><span><b>FOCUS</b><em>FORGE</em></span></button><div class="side-kicker">WORKSPACE</div><nav>${[['home','⌂','Home'],['focus','◷','Focus'],['tasks','✓','Tasks'],['stats','▥','Stats'],['sound','∿','Sound'],['settings','⚙','Settings']].map(([v,i,l])=>`<button class="nav-button ${state.view===v?'active':''}" data-action="nav" data-view="${v}"><span>${i}</span>${l}${v==='tasks'&&state.tasks.filter(x=>!x.completed).length?`<i>${state.tasks.filter(x=>!x.completed).length}</i>`:''}</button>`).join('')}</nav><div class="sidebar-bottom"><div class="mode-card"><span class="eyebrow">CURRENT MODE</span><strong>${t?escapeHtml(selectedMode().label):''}</strong><span>${escapeHtml(selectedMode().description)}</span></div><button class="ghost full" data-action="nav" data-view="settings">Customize workspace <span>↗</span></button><small>Free · open source</small></div></aside><main class="main"><header class="topbar"><div class="mobile-brand">FOCUSFORGE</div><div class="crumb">${state.view.toUpperCase()} <span>·</span> ${new Date().toLocaleDateString([], {month:'short',day:'numeric'})}</div><div class="top-actions"><button class="icon" data-action="notify" title="Notifications">◌</button><button class="avatar" data-action="nav" data-view="settings">${escapeHtml((state.greetingName||'T')[0].toUpperCase())}</button></div></header><div class="content">${content}</div></main><div class="toast" id="toast"></div></div>`;
}

function render(){
  const app=document.getElementById('app'); if(!app)return;
  const viewMap={home:homeView,focus:focusView,tasks:tasksView,stats:statsView,sound:soundView,settings:settingsView};
  app.innerHTML=shell((viewMap[state.view]||homeView)());
  updateTimerDom(); syncAudioUI(); updateClock();
}
function updateClock(){ const el=document.querySelector('.topbar .crumb'); if(el)el.innerHTML=`${state.view.toUpperCase()} <span>·</span> ${new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`; }
function toast(msg){ const el=document.getElementById('toast'); if(!el)return; el.textContent=msg; el.classList.add('show'); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),2800); }

function ensureAudio(){ audio.initialized=true; Object.entries(state.sounds).forEach(([k,v])=>{if(Number(v)>0)playSound(k,Number(v));}); }
function playSound(key,volume){
  const def=SOUNDS[key]; if(!def)return;
  let a=audio.players.get(key);
  if(!a){ a=new Audio(`/assets/audio/${def.file}`); a.loop=true; a.preload='auto'; audio.players.set(key,a); }
  a.volume=Math.min(1,Math.max(0,volume*state.master));
  a.play().catch(()=>{});
}
function stopSound(key){ const a=audio.players.get(key); if(a){a.pause(); a.currentTime=0; audio.players.delete(key);} }
function stopAllSounds(){ [...audio.players.keys()].forEach(stopSound); state.sounds={}; save(); }
function syncAudioUI(){
  document.querySelectorAll('.sound-item').forEach(el=>{const k=el.querySelector('[data-sound]')?.dataset.sound; const v=Number(state.sounds[k]||0); el.classList.toggle('on',v>0); const r=el.querySelector('input[type=range]'); if(r)r.value=v;});
  const m=document.querySelector('[data-action="master-volume"]'); if(m)m.value=state.master;
  const mv=document.getElementById('master-value'); if(mv)mv.textContent=`${Math.round(state.master*100)}%`;
}
function updateTimerDom(){
  const el=document.getElementById('timer-time'); if(el)el.textContent=state.selectedMode==='stopwatch'?formatTime(state.timer.remaining):formatTime(state.timer.remaining);
  const ring=document.querySelector('.timer-ring'); if(ring&&state.timer.total)ring.style.setProperty('--progress',`${Math.round((1-state.timer.remaining/state.timer.total)*360)}deg`);
}
function startTimer(){
  ensureAudio();
  if(state.selectedMode!=='stopwatch' && state.timer.remaining<=0){state.timer.remaining=durationSeconds(state.timer.phase);state.timer.total=state.timer.remaining;}
  if(!state.timer.startedAt)state.timer.startedAt=Date.now(); state.timer.lastTick=Date.now(); state.timer.running=true; save(); requestNotifications();
  if(!timerInterval)timerInterval=setInterval(tick,250);
  render();
}
function pauseTimer(){ state.timer.running=false; state.timer.lastTick=null; if(state.selectedMode==='stopwatch'&&state.timer.remaining>=60)recordSession(Math.round(state.timer.remaining), 'stopwatch'); save(); render(); }
function resetTimer(phase='focus'){ state.timer={...state.timer,running:false,phase,remaining:state.selectedMode==='stopwatch'?0:durationSeconds(phase),total:state.selectedMode==='stopwatch'?0:durationSeconds(phase),startedAt:null,lastTick:null}; save(); render(); }
function skipPhase(){ finishPhase(true); }
function tick(){
  if(!state.timer.running)return;
  const now=Date.now(); const delta=(now-(state.timer.lastTick||now))/1000; state.timer.lastTick=now;
  if(state.selectedMode==='stopwatch')state.timer.remaining+=delta; else state.timer.remaining-=delta;
  if(state.selectedMode!=='stopwatch'&&state.timer.remaining<=0){state.timer.remaining=0; finishPhase(false);} else updateTimerDom();
}
function recordSession(seconds,mode=state.selectedMode){ const safe=Math.max(60,Math.round(seconds)); state.sessions.push({id:uid(),endedAt:new Date().toISOString(),duration:safe,taskId:state.timer.taskId,mode}); const t=currentTask(); if(t)t.focusedMinutes=(t.focusedMinutes||0)+Math.round(safe/60); }
function finishPhase(skipped){
  const phase=state.timer.phase;
  state.timer.running=false; state.timer.lastTick=null;
  if(phase==='focus'&&!skipped){ recordSession(state.timer.total||durationSeconds('focus')); if(state.alertEnabled)beep(); notify('Focus complete',currentTask()?`${currentTask().title} · ${Math.round((state.timer.total||0)/60)} min`:'Nice work. Take a breath.'); }
  if(phase!=='focus'&&!skipped&&state.alertEnabled)beep();
  if(state.selectedMode==='countdown'||state.selectedMode==='stopwatch'){resetTimer('focus');return;}
  if(phase==='focus'){ const rounds=Math.max(1,Number(state.durations.rounds)||4); state.timer.phase=(state.timer.cycle%rounds===0)?'long':'short'; state.timer.remaining=durationSeconds(state.timer.phase); state.timer.total=state.timer.remaining; }
  else { const rounds=Math.max(1,Number(state.durations.rounds)||4); state.timer.cycle=(state.timer.cycle%rounds)+1; state.timer.phase='focus'; state.timer.remaining=durationSeconds('focus'); state.timer.total=state.timer.remaining; }
  state.timer.startedAt=null; save(); render();
  if(state.autoStartBreaks&&phase==='focus')setTimeout(startTimer,120);
}
function beep(){ try{const c=new (window.AudioContext||window.webkitAudioContext)();const o=c.createOscillator(),g=c.createGain();o.frequency.value=880;o.type='sine';g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.14,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.38);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.4);}catch{} }
function requestNotifications(){ if(!state.notifications || !('Notification' in window))return; if(Notification.permission==='default')Notification.requestPermission().catch(()=>{}); }
function notify(title,body){ if(state.notifications&&'Notification' in window&&Notification.permission==='granted'){try{new Notification(title,{body});}catch{}} }

function addTask(form){
  const fd=new FormData(form); const title=String(fd.get('title')||'').trim(); if(!title)return;
  const estimate=Math.min(480,Math.max(1,Number(fd.get('estimate')||25))); const priority=['high','medium','low'].includes(fd.get('priority'))?fd.get('priority'):'medium'; const tag=String(fd.get('tag')||'').trim();
  state.tasks.push({id:uid(),title,estimate,priority,tag,completed:false,createdAt:new Date().toISOString(),focusedMinutes:0}); save(); render(); setTimeout(()=>document.querySelector('#task-form input[name="title"]')?.focus(),0);
}
function exportData(){ const b=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),tasks:state.tasks,sessions:state.sessions,settings:{theme:state.theme,mode:state.selectedMode,durations:state.durations}},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`focusforge-${dayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500); }

function applySetting(el){
  const key=el.dataset.setting; if(!key)return; let val=el.type==='checkbox'?el.checked:el.value; if(el.type==='number')val=Number(val);
  if(key.startsWith('durations.'))state.durations[key.split('.')[1]]=val; else state[key]=val;
  if(key==='selectedMode') { const m=MODES[val]||MODES.custom; if(val==='pomodoro'){state.durations={...state.durations,focus:25,short:5,long:15,rounds:4};} if(val==='52-17'){state.durations={...state.durations,focus:52,short:17,long:17,rounds:1};} if(val==='deep'){state.durations={...state.durations,focus:90,short:20,long:20,rounds:1};} if(val==='animedoro'){state.durations={...state.durations,focus:40,short:20,long:20,rounds:1,animedoro:40};} if(val==='countdown')state.durations.countdown=m.focus||30; resetTimer('focus'); return; }
  if(key==='customBg'||key==='greetingName'||key.startsWith('durations.'))render(); save();
}

async function loadRuntime(){ try{const r=await fetch('/.netlify/functions/config',{headers:{Accept:'application/json'}});if(r.ok){const d=await r.json();runtime={...runtime,...d};}}catch{} }
function spotifyConfig(){ return {clientId:runtime.spotifyClientId||'',redirectUri:window.location.origin+'/'}; }
function randomString(len=48){const a=new Uint8Array(len);crypto.getRandomValues(a);return Array.from(a,b=>('0'+b.toString(16)).slice(-2)).join('');}
async function challenge(v){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function loadSpotifyToken(){try{return JSON.parse(localStorage.getItem(TOKEN_KEY)||'null');}catch{return null;}}
async function connectSpotify(){
  if(!runtime.spotifyClientId){toast('Add SPOTIFY_CLIENT_ID in Netlify site settings first.');return;}
  const verifier=randomString(); localStorage.setItem(PKCE_KEY,verifier); const c=await challenge(verifier); const cfg=spotifyConfig(); const u=new URL('https://accounts.spotify.com/authorize');
  u.search=new URLSearchParams({client_id:cfg.clientId,response_type:'code',redirect_uri:cfg.redirectUri,scope:'playlist-read-private user-read-currently-playing user-read-playback-state',code_challenge_method:'S256',code_challenge:c}).toString(); window.location.assign(u.href);
}
async function spotifyCallback(){const p=new URLSearchParams(location.search);const code=p.get('code');if(!code)return;const verifier=localStorage.getItem(PKCE_KEY);if(!verifier)return;try{const cfg=spotifyConfig();const body=new URLSearchParams({client_id:cfg.clientId,grant_type:'authorization_code',code_verifier:verifier,code,redirect_uri:cfg.redirectUri});const r=await fetch('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});const d=await r.json();if(!r.ok)throw new Error(d.error_description||'Spotify connection failed.');localStorage.setItem(TOKEN_KEY,JSON.stringify({...d,obtainedAt:Date.now()}));localStorage.removeItem(PKCE_KEY);history.replaceState({},'',location.pathname);await loadSpotify();}catch(e){toast(e.message);history.replaceState({},'',location.pathname);}}
async function spotifyApi(path){const token=loadSpotifyToken();if(!token)throw new Error('Not connected.');const r=await fetch('https://api.spotify.com/v1'+path,{headers:{Authorization:`Bearer ${token.access_token}`}});if(!r.ok)throw new Error(await r.text()||`Spotify ${r.status}`);return r.status===204?null:r.json();}
async function loadSpotify(){try{const [me,pl,now]=await Promise.all([spotifyApi('/me'),spotifyApi('/me/playlists?limit=24'),spotifyApi('/me/player/currently-playing').catch(()=>null)]);state.spotify={connected:true,profile:me,playlists:pl?.items||[],nowPlaying:now};save();render();}catch(e){toast(e.message);}}
function disconnectSpotify(){localStorage.removeItem(TOKEN_KEY);state.spotify={...DEFAULT.spotify};save();render();}

function setup(){
  document.addEventListener('submit',e=>{if(e.target.id==='task-form'){e.preventDefault();addTask(e.target);}});
  document.addEventListener('click',e=>{
    const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action;
    if(a==='nav'){state.view=el.dataset.view;save();render();return;}
    if(a==='start-focus'){state.view='focus';save();startTimer();return;}
    if(a==='toggle-timer'){state.timer.running?pauseTimer():startTimer();return;}
    if(a==='reset'){resetTimer(state.timer.phase);return;}
    if(a==='skip'){skipPhase();return;}
    if(a==='select-task'){state.timer.taskId=el.dataset.id;save();render();return;}
    if(a==='toggle-task'){const t=state.tasks.find(t=>t.id===el.dataset.id);if(t){t.completed=!t.completed;if(t.completed&&state.timer.taskId===t.id)state.timer.taskId=null;save();render();}return;}
    if(a==='delete-task'){state.tasks=state.tasks.filter(t=>t.id!==el.dataset.id);if(state.timer.taskId===el.dataset.id)state.timer.taskId=null;save();render();return;}
    if(a==='toggle-completed'){state.showCompleted=!state.showCompleted;return render();}
    if(a==='theme'){state.theme=el.dataset.themeValue;save();render();return;}
    if(a==='toggle-sound'){const k=el.dataset.sound;ensureAudio();if(state.sounds[k]){stopSound(k);delete state.sounds[k];}else{state.sounds[k]=.32;playSound(k,.32);}save();render();return;}
    if(a==='stop-sounds'){stopAllSounds();render();return;}
    if(a==='notify'){requestNotifications();toast('Notification permission requested.');return;}
    if(a==='export'){exportData();return;}
    if(a==='clear-sessions'){if(confirm('Clear all focus history on this device?')){state.sessions=[];save();render();}return;}
    if(a==='reset-app'){if(confirm('Reset FocusForge data on this device?')){localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(TOKEN_KEY);location.reload();}return;}
    if(a==='spotify-connect'){connectSpotify();return;}
    if(a==='spotify-refresh'){loadSpotify();return;}
    if(a==='spotify-disconnect'){disconnectSpotify();return;}
  });
  document.addEventListener('input',e=>{
    const el=e.target;
    if(el.dataset.action==='sound-volume'){const k=el.dataset.sound,v=Math.max(0,Math.min(.7,Number(el.value)));ensureAudio();if(v===0){stopSound(k);delete state.sounds[k];}else{state.sounds[k]=v;playSound(k,v);}save();syncAudioUI();return;}
    if(el.dataset.action==='master-volume'){state.master=Number(el.value);Object.entries(audio.players).forEach(()=>{});audio.players.forEach((a,k)=>{a.volume=Number(state.sounds[k]||0)*state.master;});save();syncAudioUI();return;}
    if(el.dataset.setting==='customBg'){state.customBg=el.value.trim();save();render();return;}
  });
  document.addEventListener('change',e=>{const el=e.target.closest('[data-setting]');if(el)applySetting(el);});
  window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;if(e.code==='Space'){e.preventDefault();state.timer.running?pauseTimer():startTimer();}if(e.key.toLowerCase()==='r')resetTimer(state.timer.phase);const map={'1':'home','2':'focus','3':'tasks','4':'stats','5':'sound','6':'settings'};if(map[e.key]){state.view=map[e.key];save();render();}});
}

async function boot(){
  setup();
  await loadRuntime();
  await spotifyCallback();
  const token=loadSpotifyToken(); if(token)state.spotify.connected=true;
  render();
  if(state.sounds && Object.keys(state.sounds).length)audio={...audio,initialized:false,players:new Map()};
  if(token)loadSpotify().catch(()=>{});
  clearInterval(clockInterval); clockInterval=setInterval(updateClock,30000);
}

boot();
