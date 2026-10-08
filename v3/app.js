(() => {
  'use strict';

  const STORE_KEY = 'mr-darkness-hq-v3';
  const OLD_STORE_KEY = 'mr-darkness-hq-v2';
  const MAX_SUNO = 999;
  const TARGET_SUNO = 900;

  const DEFAULT_CANON = {
    music: 'Approximately 95% 1980s goth rock / darkwave dance music. Shimmering chorus guitar, melodic hook-forward bass, restrained analog synth atmosphere, gated or drum-machine character and a nocturnal dance-floor pulse. Psychedelic/progressive influence belongs mainly in arrangement and evolving sections, not virtuoso modern prog instrumentation.',
    production: 'Analog-minded, tactile and slightly imperfect. Chorus guitar, plate reverb, gated snare, warm forward bass, restrained synth arpeggiation and long instrumental passages when useful. Songs may begin minimal and accumulate layers into an earned final-third crescendo.',
    lyrics: 'The darkness comes from the idea, not the vocabulary. Mr Darkness is a jaded but compassionate observer: skeptical of social rituals, fascinated by consciousness, mortality, time, perception, desire and the absurdity of ordinary life. Favor concrete human behavior, mundane objects, contradictions, understated dry wit, unresolved questions and memorable turns of phrase. Observe before declaring; question more than explain; never pile gothic vocabulary together just to manufacture atmosphere. Write for a mouth, not a mood board.',
    visual: 'Tall slim recurring frontman in a black overcoat or trench, dark tousled hair, pale partially shadowed face and controlled body language. Cinematic 1985–1987 underground photography: smoke, dim practical bulbs, dirty red light, black negative space, grain, concrete, wet pavement and VHS-era imperfection.',
    exclusions: 'No falsetto. No head voice. No tenor-led vocal. No high chorus vocal. No screaming or screamo. No pop or emo vocal phrasing. No vocoder. No Auto-Tune effect. No robotic processing. No glossy vocal stacks. No bright synthwave. No EDM drops. No modern pop drums. No trap hats. No djent or metalcore. No heavy-guitar takeover. No shred or glam tapping. No arena-rock belting. No cheerful major-key uplift. No hyper-clean digital production.'
  };

  const DEFAULT_VOCAL = {
    register: 'Deep male baritone; consistently low enough to read as unmistakably 1980s goth without becoming muddy or cartoonishly bass-heavy.',
    placement: 'Chest-dominant, close and controlled. Forward enough for intelligibility; never pushed upward into a bright head-dominant placement.',
    movement: 'Narrow melodic movement, small intervals and deliberate repetition. No soaring upward runs or octave-jump choruses.',
    delivery: 'Cold, restrained, intimate, detached but magnetic. Emotion comes from phrasing and accumulation rather than belting.',
    diction: 'Clear consonants and intelligible lyrics. Avoid swallowed low notes, mumbling and over-reverberated consonants.',
    harmony: 'Sparse and shadowy. Minimal doubling; no glossy pop stacks or perfect choir-like harmonization.',
    chorus: 'Stay in the same low baritone identity through the chorus. Intensity may increase through rhythm, layering and phrasing without raising the register.',
    emotion: 'Controlled pressure. A slight crack or lift in urgency is allowed near a climax, but never a modern emo whine or rock belt.',
    forbidden: 'Falsetto, head voice, tenor lead, high chorus, screamo, yelling, pop runs, melisma, glossy harmony stacks, vocoder, robotic effects, obvious Auto-Tune, modern emo strain.'
  };

  const DNA = ['1985–1987 underground','deep clear baritone','shimmering chorus guitar','melodic bass','restrained analog synth','dance-floor pulse','plate reverb','gated snare','slow earned builds','psychedelic arrangement detail'];
  const RED_LINES = ['modern pop / emo vocal','vocoder / robotic voice','bright synthwave takeover','heavy-guitar takeover','generic goth cliché writing','prog virtuosity replacing goth identity'];
  const CLICHES = ['shadow','shadows','void','blood','moon','grave','graves','raven','ravens','darkness','echo','echoes','whisper','whispers','whispered','ghost','ghosts','chains','ashes','eternal','forever','haunted','shattered','scar','scars','demons','drowning','broken soul','bleeding heart','neon dreams','silent scream','silence screaming','lost in the night','inside my mind'];
  const ABSTRACT_WORDS = ['soul','fate','destiny','pain','sorrow','despair','fear','truth','reality','existence','eternity','memory','time','life','death','love','hate','mind','spirit','nothingness','loneliness'];
  const INFLATION_WORDS = ['always','never','forever','eternal','destroyed','shattered','unbearable','endless','infinite','everything','nothing','screaming','dying','damned','doomed'];
  const HUMAN_OBJECT_WORDS = ['phone','clock','door','window','kitchen','car','street','bed','chair','glass','cup','shoe','shoes','elevator','button','receipt','grocery','refrigerator','fridge','hallway','parking','coffee','table','mirror','television','tv','screen','coat','keys','wallet','sink','stairs','lamp','light','train','bus','office','store','bar'];
  const LYRIC_CONSTITUTION = ['The darkness comes from the idea, not the vocabulary.','Observe before declaring. Question more than explain.','Use concrete human behavior and ordinary objects before abstract emotion.','Find the contradiction hiding inside the subject.','Use dry understatement instead of melodrama; wit may be present without turning the song into comedy.','Treat consciousness, time, mortality, desire and social ritual as strange rather than merely gloomy.','Distrust certainty. Leave some implications unresolved.','Compassion sits underneath the cynicism.','Do not try to sound profound; think clearly enough that the result can become profound by accident.'].join(' ');
  const LYRIC_HUMAN_RULES = ['Vary sentence length and syntax. Permit fragments, enjambment and conversational turns.','Do not make every line polished, beautiful, rhymed or symmetrical.','Use imperfect rhyme or no rhyme when the right word is better.','Avoid repeating the same grammatical construction across consecutive lines.','Use contractions naturally and allow one deliberately plain line beside a strange one.','Do not explain a metaphor after presenting it and do not restate the same idea in prettier words.','Prefer verbs and concrete nouns over adjective stacks and abstract nouns.','Include at least one recognizable human action, one physical detail, one contradiction and one line that feels slightly uncomfortable or unexpectedly funny.','Preserve odd phrases and useful rough edges during revision instead of sanding them into generic lyricism.'].join(' ');

  const $ = id => document.getElementById(id);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const clean = v => String(v ?? '').trim();
  const nowId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  const escapeHtml = (value='') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function starterSong() {
    return {
      id: nowId('song'), title: 'Untitled Transmission', status: 'Idea', thesis: '', anchor: '', bpm: 118, key: '', mode: 'Minor', targetLength: '4:30', groove: 'steady nocturnal dance pulse; bass-led', energy: 'Build to crescendo',
      roles: { bass:'Melodic hook carrier; warm and forward.', guitar:'Shimmering chorus guitar; restrained until the final third.', synth:'Atmosphere and support; never dominate.', drums:'Gated snare and dark dance pulse; no modern pop sheen.', vocal:'Deep clear restrained baritone; remain low through chorus.', wild:'Small psychedelic/prog arrangement surprise without leaving goth.' },
      arrangement: defaultArrangement('Build to crescendo'), productionSheet:'', lyrics:'', phraseBank:[], lyricLab:{plain:'',observation:'',contradiction:'',object:'',lens:'Observer',lens2:'Cosmonaut'}, brainMessages:[], songVocalNote:'', suno:{style:'',exclude:''}, generations:[], visualBrief:'', releaseBoard:'', release:{title:'',type:'Single',moment:'',idea:''}, createdAt:Date.now(), updatedAt:Date.now()
    };
  }

  function defaultArrangement(energy) {
    const crescendo = /crescendo/i.test(energy || '');
    return [
      { start:'0:00', name:'Intro', notes:'Sparse opening; establish texture before the full pulse.' },
      { start:'0:24', name:'Verse 1', notes:'Bass and vocal identity become clear; guitar remains restrained.' },
      { start:'1:02', name:'Lift', notes:'Add one new element, not an entire wall of sound.' },
      { start:'1:24', name:'Chorus', notes:'Bigger through width and rhythm; baritone stays low.' },
      { start:'2:02', name:'Instrumental', notes:'Let guitar/bass carry an evolving section; psychedelic detail can surface here.' },
      { start:'2:46', name:'Breakdown', notes:'Remove something important so the return has somewhere to go.' },
      { start:'3:18', name: crescendo ? 'Final crescendo' : 'Final chorus', notes: crescendo ? 'Accumulate layers and intensity without turning into metal or arena rock.' : 'Strongest version of the central hook.' },
      { start:'4:12', name:'Outro', notes:'Decay, repetition or unresolved exit; avoid generic cinematic button.' }
    ];
  }

  function baseState() {
    const song = starterSong();
    return {
      version:3,
      canon:{...DEFAULT_CANON},
      vocal:{...DEFAULT_VOCAL},
      preferences:{ likes:['shimmering chorus guitar as a core texture','deep intelligible baritone','melodic bass carrying hooks','minimal openings that earn a large final third'], dislikes:['modern synth arpeggio takeover','whiny/high male vocal','heavy guitar replacing the goth core','generic AI goth buzzword soup'] },
      songs:[song], activeSongId:song.id,
      album:{ title:'Mr Darkness', sequence:[song.id] },
      brain:{ mode:'producer', messages:[], model:'' },
      settings:{ browserBridge:true }
    };
  }

  function migrateV2() {
    try {
      const old = JSON.parse(localStorage.getItem(OLD_STORE_KEY) || 'null');
      if (!old) return null;
      const fresh = baseState();
      if (old.canon) {
        fresh.canon.music = old.canon.music || fresh.canon.music;
        fresh.canon.production = old.canon.production || fresh.canon.production;
        fresh.canon.lyrics = old.canon.lyrics || fresh.canon.lyrics;
        fresh.canon.visual = [old.canon.visual, old.canon.visualLanguage].filter(Boolean).join(' ') || fresh.canon.visual;
        fresh.canon.exclusions = old.canon.exclusions || fresh.canon.exclusions;
      }
      if (old.memories) {
        fresh.preferences.likes = old.memories.likes || fresh.preferences.likes;
        fresh.preferences.dislikes = old.memories.dislikes || fresh.preferences.dislikes;
      }
      if (Array.isArray(old.songs) && old.songs.length) {
        fresh.songs = old.songs.map(s => ({
          ...starterSong(), id:s.id || nowId('song'), title:s.title || 'Untitled Transmission', status:s.status || 'Idea', energy:s.energy || 'Build to crescendo', thesis:s.notes || '', lyrics:s.lyrics || '', suno:{style:s.stylePrompt || '',exclude:s.excludePrompt || ''}, createdAt:s.createdAt || Date.now(), updatedAt:Date.now()
        }));
        fresh.activeSongId = old.activeSongId && fresh.songs.some(s=>s.id===old.activeSongId) ? old.activeSongId : fresh.songs[0].id;
        fresh.album.sequence = fresh.songs.map(s=>s.id);
      }
      return fresh;
    } catch { return null; }
  }

  function normalizeState(raw) {
    const defaults=baseState();
    const out=raw && typeof raw==='object' ? raw : defaults;
    out.version=3;
    out.canon={...defaults.canon,...(out.canon||{})};
    out.vocal={...defaults.vocal,...(out.vocal||{})};
    out.preferences={
      likes:Array.isArray(out.preferences?.likes)?out.preferences.likes:defaults.preferences.likes,
      dislikes:Array.isArray(out.preferences?.dislikes)?out.preferences.dislikes:defaults.preferences.dislikes
    };
    const sourceSongs=Array.isArray(out.songs)&&out.songs.length?out.songs:[starterSong()];
    out.songs=sourceSongs.map(song=>{
      const fresh=starterSong();
      return {
        ...fresh,
        ...song,
        roles:{...fresh.roles,...(song?.roles||{})},
        arrangement:Array.isArray(song?.arrangement)?song.arrangement:fresh.arrangement,
        phraseBank:Array.isArray(song?.phraseBank)?song.phraseBank:[],
        generations:Array.isArray(song?.generations)?song.generations:[],
        brainMessages:Array.isArray(song?.brainMessages)?song.brainMessages.slice(-40):[],
        lyricLab:{...fresh.lyricLab,...(song?.lyricLab||{})},
        suno:{...fresh.suno,...(song?.suno||{})},
        release:{...fresh.release,...(song?.release||{})}
      };
    });
    if(!out.songs.some(s=>s.id===out.activeSongId))out.activeSongId=out.songs[0].id;
    const ids=new Set(out.songs.map(s=>s.id));
    const seq=Array.isArray(out.album?.sequence)?out.album.sequence.filter(id=>ids.has(id)):[];
    for(const s of out.songs)if(!seq.includes(s.id))seq.push(s.id);
    out.album={title:out.album?.title||'Mr Darkness',sequence:seq};
    out.brain={
      mode:out.brain?.mode||'producer',
      messages:Array.isArray(out.brain?.messages)?out.brain.messages.slice(-40):[],
      model:out.brain?.model||''
    };
    out.settings={...defaults.settings,...(out.settings||{})};
    return out;
  }

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (stored) return normalizeState(stored);
    } catch {}
    return normalizeState(migrateV2() || baseState());
  }

  let state = loadState();
  let workingAudio = null;

  function activeSong() {
    let song = state.songs.find(s => s.id === state.activeSongId);
    if (!song) { song = state.songs[0] || starterSong(); if (!state.songs.length) state.songs.push(song); state.activeSongId = song.id; }
    return song;
  }

  function save(message='SAVED LOCALLY') {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {}
    const el = $('railSave'); if (el) { el.textContent=message; clearTimeout(save.timer); save.timer=setTimeout(()=>el.textContent='SAVED LOCALLY',1100); }
  }

  function toast(message) {
    const el=$('toast'); if(!el)return; el.textContent=message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),2300);
  }


  async function copyText(text) {
    const value=String(text ?? '');
    if(!value){toast('Nothing to copy.');return false}
    try{
      if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(value);
        return true;
      }
    }catch{}
    const active=document.activeElement;
    const helper=document.createElement('textarea');
    helper.value=value;
    helper.setAttribute('readonly','');
    helper.setAttribute('aria-hidden','true');
    helper.style.position='fixed';
    helper.style.left='-9999px';
    helper.style.top='0';
    helper.style.opacity='0';
    document.body.appendChild(helper);
    helper.focus({preventScroll:true});
    helper.select();
    let ok=false;
    try{ok=document.execCommand('copy')}catch{}
    helper.remove();
    try{active?.focus?.({preventScroll:true})}catch{}
    if(!ok)throw new Error('Clipboard access was blocked by the browser.');
    return true;
  }

  function elementCopyText(el) {
    if(!el)return '';
    if(el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement){
      const start=Number.isInteger(el.selectionStart)?el.selectionStart:0;
      const end=Number.isInteger(el.selectionEnd)?el.selectionEnd:0;
      if(end>start)return el.value.slice(start,end);
      return el.value||'';
    }
    const selection=window.getSelection?.();
    if(selection && !selection.isCollapsed && el.contains(selection.anchorNode) && el.contains(selection.focusNode)){
      const selected=selection.toString();
      if(selected.trim())return selected;
    }
    return el.innerText||el.textContent||'';
  }

  async function copyValue(id) {
    const el=$(id);
    try{
      const text=elementCopyText(el);
      await copyText(text);
      toast((el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) && el.selectionEnd>el.selectionStart ? 'Selection copied.' : 'Copied.');
    }catch(err){toast(err?.message||'Copy failed.')}
  }

  function selectField(id) {
    const el=$(id);
    if(!(el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement))return;
    el.focus({preventScroll:true});
    el.setSelectionRange(0,el.value.length);
    toast('Text selected inside this field.');
  }

  function navigate(view) {
    $$('.view').forEach(v=>v.classList.toggle('active',v.id===view));
    $$('.rail nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    $('rail')?.classList.remove('open');
    window.scrollTo({top:0,behavior:'smooth'});
    if (view==='control') renderControl();
    if (view==='build') hydrateBuild();
    if (view==='generations') renderGenerationLab();
    if (view==='lyrics') renderLyrics();
    if (view==='vocal') hydrateVocal();
    if (view==='suno') hydrateSuno();
    if (view==='vault') renderVault();
    if (view==='album') renderAlbum();
    if (view==='visual') hydrateVisual();
    if (view==='release') hydrateRelease();
  }

  function renderControl() {
    const song=activeSong();
    $('railSong').textContent=song.title;
    $('controlSongTitle').textContent=song.title;
    $('controlSongStatus').textContent=(song.status||'Idea').toUpperCase();
    $('statSongs').textContent=state.songs.length;
    const gens=state.songs.reduce((n,s)=>n+(s.generations?.length||0),0); $('statGenerations').textContent=gens;
    const phrases=state.songs.reduce((n,s)=>n+(s.phraseBank?.length||0),0); $('statPhrases').textContent=phrases;
    const bpms=state.songs.map(s=>Number(s.bpm)).filter(Number.isFinite); $('statBpm').textContent=bpms.length?Math.round(bpms.reduce((a,b)=>a+b,0)/bpms.length):'—';
    $('dnaChips').innerHTML=DNA.map(x=>`<span>${escapeHtml(x)}</span>`).join('');
    $('redLines').innerHTML=RED_LINES.map(x=>`<li>${escapeHtml(x)}</li>`).join('');
    const signal=[song.bpm?`${song.bpm} BPM`:null,song.key?`${song.key} ${song.mode}`:song.mode,song.energy,song.groove].filter(Boolean);
    $('songSignal').innerHTML=signal.map(x=>`<span>${escapeHtml(x)}</span>`).join('');
    $('miniTimeline').innerHTML=(song.arrangement||[]).slice(0,8).map(s=>`<div><b>${escapeHtml(s.start)} · ${escapeHtml(s.name)}</b><small>${escapeHtml(s.notes).slice(0,60)}</small></div>`).join('');
    let title='Build the production sheet',copy='Lock the song thesis, instrument roles and arrangement before generating.' ,target='build';
    if(song.productionSheet){title='Track the next generation';copy='Use KEEP / LOSE / ALMOST / LOCK so the next pass changes only what needs changing.';target='generations'}
    if(song.generations?.length){title='Refine the Suno prompt';copy='Turn the latest generation notes into a short repair-focused style and exclusion prompt.';target='suno'}
    if(/selected|mixing|release ready/i.test(song.status)){title='Check album continuity';copy='See where this song sits against the rest of the record before release decisions.';target='album'}
    $('nextMoveTitle').textContent=title;$('nextMoveCopy').textContent=copy;$('nextMoveBtn').dataset.go=target;
  }

  function hydrateBuild() {
    const s=activeSong();
    $('songTitle').value=s.title||'';$('songStatus').value=s.status||'Idea';$('songThesis').value=s.thesis||'';$('songAnchor').value=s.anchor||'';$('songBpm').value=s.bpm||'';$('songKey').value=s.key||'';$('songMode').value=s.mode||'Minor';$('songLength').value=s.targetLength||'';$('songGroove').value=s.groove||'';$('songEnergy').value=s.energy||'Build to crescendo';
    $('roleBass').value=s.roles?.bass||'';$('roleGuitar').value=s.roles?.guitar||'';$('roleSynth').value=s.roles?.synth||'';$('roleDrums').value=s.roles?.drums||'';$('roleVocal').value=s.roles?.vocal||'';$('roleWild').value=s.roles?.wild||'';
    renderArrangement(); renderProductionSheet();
  }

  function captureBuild() {
    const s=activeSong();
    s.title=clean($('songTitle').value)||'Untitled Transmission'; s.status=$('songStatus').value; s.thesis=clean($('songThesis').value); s.anchor=clean($('songAnchor').value); s.bpm=Number($('songBpm').value)||''; s.key=clean($('songKey').value); s.mode=$('songMode').value; s.targetLength=clean($('songLength').value); s.groove=clean($('songGroove').value); s.energy=$('songEnergy').value;
    s.roles={bass:clean($('roleBass').value),guitar:clean($('roleGuitar').value),synth:clean($('roleSynth').value),drums:clean($('roleDrums').value),vocal:clean($('roleVocal').value),wild:clean($('roleWild').value)}; s.updatedAt=Date.now();
    return s;
  }

  function buildProductionSheetText(s=activeSong()) {
    const arr=(s.arrangement||[]).map(x=>`${x.start} — ${x.name}: ${x.notes}`).join('\n');
    return [`SONG: ${s.title}`,`STATUS: ${s.status}`,`THESIS: ${s.thesis||'Open'}`,`ANCHOR: ${s.anchor||'None'}`,`FRAME: ${s.bpm||'—'} BPM · ${[s.key,s.mode].filter(Boolean).join(' ')||'modal'} · target ${s.targetLength||'open'} · ${s.energy}`,`GROOVE: ${s.groove||'open'}`,'',`BASS: ${s.roles?.bass||'open'}`,`GUITAR: ${s.roles?.guitar||'open'}`,`SYNTH: ${s.roles?.synth||'open'}`,`DRUMS: ${s.roles?.drums||'open'}`,`VOCAL: ${s.roles?.vocal||state.vocal.register}`,`WILD CARD: ${s.roles?.wild||'none'}`,'','ARRANGEMENT',arr].join('\n');
  }

  function renderProductionSheet() {
    const s=activeSong();$('sheetTitle').textContent=s.title||'No active sheet';
    const blocks=[['THESIS',s.thesis||'Not defined yet.'],['MUSICAL FRAME',`${s.bpm||'—'} BPM · ${[s.key,s.mode].filter(Boolean).join(' ')||'modal'} · ${s.energy||'open'} · target ${s.targetLength||'open'}`],['GROOVE',s.groove||'Not defined yet.'],['BASS',s.roles?.bass||'Open'],['GUITAR',s.roles?.guitar||'Open'],['SYNTH',s.roles?.synth||'Open'],['DRUMS',s.roles?.drums||'Open'],['VOCAL',s.roles?.vocal||state.vocal.register]];
    $('productionSheet').innerHTML=blocks.map(([k,v])=>`<div class="sheet-block"><span>${k}</span><p>${escapeHtml(v)}</p></div>`).join('');
  }

  function renderArrangement() {
    const s=activeSong();
    $('arrangementEditor').innerHTML=(s.arrangement||[]).map((x,i)=>`<div class="timeline-row" data-i="${i}"><input data-arr="start" value="${escapeHtml(x.start)}" aria-label="Start time"><input data-arr="name" value="${escapeHtml(x.name)}" aria-label="Section name"><input data-arr="notes" value="${escapeHtml(x.notes)}" aria-label="Section notes"><button data-remove-section="${i}" aria-label="Remove section">×</button></div>`).join('');
  }

  function syncArrangementFromDom() {
    activeSong().arrangement=$$('.timeline-row').map(row=>({start:clean(row.querySelector('[data-arr="start"]').value),name:clean(row.querySelector('[data-arr="name"]').value),notes:clean(row.querySelector('[data-arr="notes"]').value)}));
  }

  function buildSheet() { captureBuild(); syncArrangementFromDom(); const s=activeSong(); s.productionSheet=buildProductionSheetText(s); s.status=s.status==='Idea'?'Pre-production':s.status; save('PRODUCTION SHEET BUILT'); hydrateBuild(); renderControl(); toast('Production sheet built and locked to the song.'); }

  function newGeneration() {
    $('genName').value=`Generation ${(activeSong().generations?.length||0)+1}`;$('genSource').value='';$('genKeep').value='';$('genLose').value='';$('genAlmost').value='';$('genLock').value='';$$('.score-grid input[type="range"]').forEach(x=>{x.value=5;x.nextElementSibling.textContent='5'});workingAudio=null;$('audioAnalysis').innerHTML='';$('repairBrief').textContent='Describe what worked and what drifted, then build the next repair brief.';
  }

  function currentGenDraft() {
    const score=id=>Number($(id).value)||5;
    return { id:nowId('gen'), name:clean($('genName').value)||`Generation ${(activeSong().generations?.length||0)+1}`, source:clean($('genSource').value), keep:clean($('genKeep').value), lose:clean($('genLose').value), almost:clean($('genAlmost').value), lock:clean($('genLock').value), scores:{vocal:score('scoreVocal'),bass:score('scoreBass'),guitar:score('scoreGuitar'),synth:score('scoreSynth'),chorus:score('scoreChorus'),build:score('scoreBuild'),dna:score('scoreDna')}, audio:workingAudio, createdAt:Date.now() };
  }

  function saveGeneration() {
    const s=activeSong();if(!Array.isArray(s.generations))s.generations=[];const g=currentGenDraft();s.generations.push(g);s.status=/Idea|Pre-production|Writing/i.test(s.status)?'Suno tests':s.status;s.updatedAt=Date.now();save('GENERATION SAVED');renderGenerationLab();toast(`${g.name} saved.`);
  }

  function latestGeneration(){const arr=activeSong().generations||[];return arr[arr.length-1]||null}

  function repairText(g=currentGenDraft()) {
    const s=activeSong();
    const measured=g.audio?`\nMEASURED AUDIO: ${g.audio.duration}s, approx ${g.audio.bpm||'—'} BPM, RMS ${g.audio.rmsDb} dBFS, crest ${g.audio.crestDb} dB; energy shape ${g.audio.energyShape}.`:'';
    return [`NEXT GENERATION — REPAIR BRIEF`,`Song: ${s.title}`,`Do not redesign the track. Make the smallest changes needed to correct the failed elements while explicitly preserving locked traits.`,``,`LOCK / MUST SURVIVE: ${g.lock||g.keep||'No locked traits entered.'}`,`KEEP: ${g.keep||'No keep notes entered.'}`,`REMOVE / CORRECT: ${g.lose||'No lose notes entered.'}`,`ALMOST — refine, do not replace: ${g.almost||'None.'}`,measured,``,`MR DARKNESS GUARDRAILS: deep low intelligible 80s goth baritone; shimmering guitar + melodic bass central; synth subordinate; no modern pop/emo vocal; no heavy-guitar takeover; preserve dance-floor goth identity.`].join('\n');
  }

  function buildRepair() { const text=repairText();$('repairBrief').textContent=text;toast('Repair brief built.'); }

  function renderGenerationLab() {
    const s=activeSong(); const gens=s.generations||[];
    $('generationHistory').innerHTML=gens.length?gens.slice().reverse().map(g=>`<article class="gen-card"><div class="head"><h3>${escapeHtml(g.name)}</h3><small>${new Date(g.createdAt).toLocaleDateString()}</small></div><p><b>KEEP</b> ${escapeHtml(g.keep||'—')}</p><p><b>LOSE</b> ${escapeHtml(g.lose||'—')}</p><div class="score-dots">${Object.values(g.scores||{}).map(v=>`<i style="height:${Number(v)*10}%"></i>`).join('')}</div>${g.audio?`<p>${escapeHtml(g.audio.bpm||'—')} BPM · ${escapeHtml(g.audio.duration)}s · crest ${escapeHtml(g.audio.crestDb)} dB</p>`:''}</article>`).join(''):'<div class="empty-state">No generations tracked yet. Start recording what Suno gets right and wrong.</div>';
    const options=['<option value="">Choose…</option>',...gens.map(g=>`<option value="${g.id}">${escapeHtml(g.name)}</option>`)].join('');$('compareA').innerHTML=options;$('compareB').innerHTML=options;
    if(gens.length>=2){$('compareA').value=gens[gens.length-2].id;$('compareB').value=gens[gens.length-1].id}
    if(gens.length){const g=gens[gens.length-1];$('genName').value=g.name;$('genSource').value=g.source||'';$('genKeep').value=g.keep||'';$('genLose').value=g.lose||'';$('genAlmost').value=g.almost||'';$('genLock').value=g.lock||'';Object.entries(g.scores||{}).forEach(([k,v])=>{const id={vocal:'scoreVocal',bass:'scoreBass',guitar:'scoreGuitar',synth:'scoreSynth',chorus:'scoreChorus',build:'scoreBuild',dna:'scoreDna'}[k];if(id&&$(id)){ $(id).value=v;$(id).nextElementSibling.textContent=v }});workingAudio=g.audio||null;if(g.audio)renderAudioMetrics(g.audio);$('repairBrief').textContent=repairText(g)} else newGeneration();
  }

  function compareGenerations() {
    const gens=activeSong().generations||[];const a=gens.find(g=>g.id===$('compareA').value),b=gens.find(g=>g.id===$('compareB').value);if(!a||!b){toast('Choose two generations.');return}
    const labels={vocal:'Vocal',bass:'Bass',guitar:'Guitar',synth:'Synth',chorus:'Chorus',build:'Build',dna:'Mr Darkness DNA'};
    $('comparison').innerHTML=`<table class="compare-table"><thead><tr><th>Element</th><th>${escapeHtml(a.name)}</th><th>${escapeHtml(b.name)}</th></tr></thead><tbody>${Object.entries(labels).map(([k,label])=>`<tr><td>${label}</td><td>${a.scores?.[k]||'—'}/10</td><td>${b.scores?.[k]||'—'}/10</td></tr>`).join('')}</tbody></table>`;
  }

  function combineBest() {
    const gens=activeSong().generations||[];const a=gens.find(g=>g.id===$('compareA').value),b=gens.find(g=>g.id===$('compareB').value);if(!a||!b){toast('Choose two generations first.');return}
    const winner=[];for(const k of ['vocal','bass','guitar','synth','chorus','build','dna']){const av=a.scores?.[k]||0,bv=b.scores?.[k]||0;winner.push(`${k}: preserve ${av>=bv?a.name:b.name} behavior (${Math.max(av,bv)}/10)`) }
    $('repairBrief').textContent=`VERSION C — COMBINE BRIEF\nUse the strongest behavior from A/B without averaging away the character.\n\n${winner.join('\n')}\n\nA LOCKS: ${a.lock||'none'}\nB LOCKS: ${b.lock||'none'}\n\nA KEEP: ${a.keep||'none'}\nB KEEP: ${b.keep||'none'}\n\nDo not introduce new modern elements merely to bridge the two versions.`;
  }

  async function analyzeAudio() {
    const file=$('audioFile').files?.[0];if(!file){toast('Choose an audio file first.');return}
    $('analyzeAudioBtn').disabled=true;$('analyzeAudioBtn').textContent='ANALYZING…';
    try{
      const ctx=new (window.AudioContext||window.webkitAudioContext)();const buffer=await ctx.decodeAudioData(await file.arrayBuffer());const sr=buffer.sampleRate;const channels=buffer.numberOfChannels;const length=buffer.length;const step=Math.max(1,Math.floor(length/800000));let sumSq=0,peak=0,count=0,z=0,last=0;const mono=[];
      for(let i=0;i<length;i+=step){let v=0;for(let c=0;c<channels;c++)v+=buffer.getChannelData(c)[i]||0;v/=channels;mono.push(v);sumSq+=v*v;peak=Math.max(peak,Math.abs(v));if(count&&((v>=0)!=(last>=0)))z++;last=v;count++}
      const rms=Math.sqrt(sumSq/Math.max(1,count));const rmsDb=20*Math.log10(Math.max(rms,1e-8));const peakDb=20*Math.log10(Math.max(peak,1e-8));const crest=peakDb-rmsDb;const duration=buffer.duration;
      const bpm=estimateBpm(mono,sr/step);const segments=10;const energies=[];for(let s=0;s<segments;s++){const a=Math.floor(mono.length*s/segments),b=Math.floor(mono.length*(s+1)/segments);let ss=0;for(let i=a;i<b;i++)ss+=mono[i]*mono[i];energies.push(Math.sqrt(ss/Math.max(1,b-a)))}const maxE=Math.max(...energies,1e-9);const blocks='▁▂▃▄▅▆▇█';const energyShape=energies.map(e=>blocks[Math.min(7,Math.floor(e/maxE*7))]).join('');
      workingAudio={fileName:file.name,duration:duration.toFixed(1),bpm:bpm?Math.round(bpm):null,rmsDb:rmsDb.toFixed(1),peakDb:peakDb.toFixed(1),crestDb:crest.toFixed(1),zeroCross:(z/duration).toFixed(0),energyShape};renderAudioMetrics(workingAudio);await ctx.close();toast('Audio analyzed locally.');
    }catch(err){toast(`Audio analysis failed: ${err.message}`)}finally{$('analyzeAudioBtn').disabled=false;$('analyzeAudioBtn').textContent='ANALYZE AUDIO'}
  }

  function estimateBpm(samples,sampleRate){if(!samples.length||!sampleRate)return null;const frame=Math.max(1,Math.floor(sampleRate*.05));const env=[];for(let i=0;i<samples.length;i+=frame){let s=0;const end=Math.min(samples.length,i+frame);for(let j=i;j<end;j++)s+=Math.abs(samples[j]);env.push(s/(end-i))}const mean=env.reduce((a,b)=>a+b,0)/Math.max(1,env.length);for(let i=0;i<env.length;i++)env[i]-=mean;const fps=sampleRate/frame;let best=-Infinity,bestBpm=null;for(let bpm=60;bpm<=180;bpm++){const lag=Math.round(fps*60/bpm);let corr=0;for(let i=lag;i<env.length;i++)corr+=env[i]*env[i-lag];if(corr>best){best=corr;bestBpm=bpm}}return bestBpm}
  function renderAudioMetrics(a){$('audioAnalysis').innerHTML=[['DURATION',`${a.duration}s`],['BPM',a.bpm||'—'],['RMS',`${a.rmsDb} dBFS`],['PEAK',`${a.peakDb} dBFS`],['CREST',`${a.crestDb} dB`],['ENERGY',a.energyShape]].map(([k,v])=>`<div class="metric"><span>${k}</span><strong>${escapeHtml(v)}</strong></div>`).join('')}

  function lyricLabState(s=activeSong()){
    if(!s.lyricLab)s.lyricLab={plain:'',observation:'',contradiction:'',object:'',lens:'Observer',lens2:'Cosmonaut'};
    return s.lyricLab;
  }
  function syncLyricThoughtFromDom(){
    const s=activeSong(),lab=lyricLabState(s);
    lab.plain=clean($('lyricPlain').value);
    lab.observation=clean($('lyricObservation').value);
    lab.contradiction=clean($('lyricContradiction').value);
    lab.object=clean($('lyricObject').value);
    lab.lens=$('lyricLens').value;
    lab.lens2=$('lyricLens2').value;
    const title=clean($('lyricsTitle')?.value);
    if(title)s.title=title;
    s.lyrics=$('lyricsDraft').value;
    s.updatedAt=Date.now();
    return lab;
  }
  function normalizeSunoSection(raw){
    const value=String(raw||'').replace(/^#{1,6}\s*/,'').replace(/\*\*/g,'').replace(/__/g,'').replace(/`/g,'').trim().replace(/^[\[\(\{]\s*|\s*[\]\)\}]$/g,'').replace(/\s*[-–—]\s*(?:\d{1,2}:)?\d{1,2}:\d{2}\s*$/,'').trim();
    if(!value)return null;
    const lower=value.toLowerCase();
    const number=(value.match(/\b(\d+)\b/)||[])[1]||'';
    const sectionRules=[['pre-chorus','Pre-Chorus'],['post-chorus','Post-Chorus'],['pre chorus','Pre-Chorus'],['post chorus','Post-Chorus'],['verse','Verse'],['chorus','Chorus'],['bridge','Bridge'],['refrain','Refrain'],['outro','Outro'],['interlude','Interlude'],['breakdown','Breakdown'],['hook','Hook'],['lift','Pre-Chorus'],['build','Pre-Chorus']];
    if(/\bintro\b/.test(lower)&&/\binstrumental\b/.test(lower))return '[Instrumental Intro]';
    if(/\boutro\b/.test(lower)&&/\binstrumental\b/.test(lower))return '[Instrumental Outro]';
    if(/\binstrumental\b/.test(lower))return number?'[Instrumental '+number+']':'[Instrumental]';
    for(const [needle,label] of sectionRules){if(lower.includes(needle))return number?'['+label+' '+number+']':'['+label+']'}
    if(/^intro\b/i.test(value))return '[Intro]';
    return null;
  }

  function buildSunoLyricsExport(source=$('lyricsDraft')?.value||''){
    let removed=0,normalized=0;
    const out=[];
    const lines=String(source||'').replace(/\r\n?/g,'\n').split('\n');
    for(const original of lines){
      let line=original.replace(/\*\*/g,'').replace(/__/g,'').replace(/`/g,'').trimEnd();
      const trimmed=line.trim();
      if(!trimmed){if(out.length&&out[out.length-1]!=='')out.push('');continue}
      const bracketOnly=/^[\[\(\{].*[\]\)\}]$/.test(trimmed);
      const markdownHeading=/^#{1,6}\s+/.test(trimmed);
      const timedSection=/^(?:verse|chorus|pre[- ]?chorus|post[- ]?chorus|bridge|refrain|intro|outro|interlude|breakdown|hook|lift|build|instrumental)\b.*(?:\d{1,2}:)?\d{1,2}:\d{2}\s*$/i.test(trimmed.replace(/^#{1,6}\s*/,''));
      if(bracketOnly||markdownHeading||timedSection){
        const tag=normalizeSunoSection(trimmed);
        if(tag){if(tag!==trimmed)normalized++;out.push(tag)}else{removed++}
        continue;
      }
      const withoutLeadingTime=line.replace(/^\s*(?:\d{1,2}:)?\d{1,2}:\d{2}\s*[-–—:|]\s*/,'');
      if(withoutLeadingTime!==line){line=withoutLeadingTime;removed++}
      const withoutTrailingTime=line.replace(/\s*[-–—,;|]\s*(?:\d{1,2}:)?\d{1,2}:\d{2}\s*$/,'').replace(/\s*\((?:\d{1,2}:)?\d{1,2}:\d{2}\)\s*$/,'');
      if(withoutTrailingTime!==line){line=withoutTrailingTime;removed++}
      if(line.trim())out.push(line.trimEnd());
    }
    while(out.length&&out[out.length-1]==='')out.pop();
    const text=out.join('\n').replace(/\n{3,}/g,'\n\n');
    return {text,removed,normalized};
  }

  function updateSunoLyricsExport(){
    const target=$('sunoLyricsExport'),status=$('sunoLyricsStatus');
    if(!target||!status)return;
    const result=buildSunoLyricsExport($('lyricsDraft')?.value||'');
    target.value=result.text;
    const changes=result.removed+result.normalized;
    status.textContent=changes?'Cleaned '+changes+' item'+(changes===1?'':'s')+' · '+result.removed+' removed · '+result.normalized+' section tag'+(result.normalized===1?'':'s')+' normalized':'Already Suno-clean — no notes or formatting needed removal.';
  }

  async function copySunoLyrics(){
    updateSunoLyricsExport();
    try{await copyText($('sunoLyricsExport').value);toast('Suno-ready lyrics copied.')}catch(err){toast(err?.message||'Copy failed.')}
  }
  function nextUntitledSongTitle(){
    const used=new Set(state.songs.map(s=>clean(s.title).toLowerCase()));
    let n=1;
    while(used.has(('Untitled Song '+n).toLowerCase()))n++;
    return 'Untitled Song '+n;
  }

  function lyricFirstSong(){
    const s=starterSong();
    s.title=nextUntitledSongTitle();
    s.bpm='';
    s.key='';
    s.mode='';
    s.targetLength='';
    s.groove='';
    s.energy='';
    s.arrangement=[];
    s.productionSheet='';
    s.generations=[];
    s.suno={style:'',exclude:''};
    s.brainMessages=[];
    return s;
  }

  function stashBrainOnActiveSong(){
    const s=activeSong();
    s.brainMessages=Array.isArray(state.brain?.messages)?state.brain.messages.slice(-40):[];
  }

  function restoreBrainForSong(song){
    if(!state.brain)state.brain={mode:'lyric_writer',messages:[],model:''};
    state.brain.messages=Array.isArray(song?.brainMessages)?song.brainMessages.slice(-40):[];
  }

  function createNewLyricSong(){
    try{syncLyricThoughtFromDom()}catch{}
    stashBrainOnActiveSong();
    const s=lyricFirstSong();
    state.songs.push(s);
    state.activeSongId=s.id;
    if(!Array.isArray(state.album?.sequence))state.album.sequence=[];
    state.album.sequence.push(s.id);
    state.brain.mode='lyric_writer';
    state.brain.messages=[];
    save('NEW LYRIC SONG');
    renderAll();
    navigate('lyrics');
    requestAnimationFrame(()=>{
      const title=$('lyricsTitle');
      if(title){title.focus({preventScroll:true});title.select()}
    });
    toast('Blank lyric song ready.');
  }

  function renameLyricSong(){
    const title=$('lyricsTitle');
    if(!title)return;
    title.focus({preventScroll:true});
    title.select();
  }

  function renderLyrics(){
    const s=activeSong(),lab=lyricLabState(s);
    $('lyricsSongName').textContent=s.title;
    $('lyricsTitle').value=s.title||'';
    $('lyricsDraft').value=s.lyrics||'';
    $('lyricPlain').value=lab.plain||s.thesis||'';
    $('lyricObservation').value=lab.observation||'';
    $('lyricContradiction').value=lab.contradiction||'';
    $('lyricObject').value=lab.object||'';
    $('lyricLens').value=lab.lens||'Observer';
    $('lyricLens2').value=lab.lens2||'Cosmonaut';
    renderPhraseBank();
    $('meterResults').innerHTML='<div class="empty-state">Run the meter checker to see approximate syllable counts line by line.</div>';
    $('clicheResults').innerHTML='<div class="empty-state">Scan for stock goth language, poetic symmetry, abstractness, emotional inflation and other AI-writing tells.</div>';
    $('humanResults').innerHTML='<div class="empty-state">Check whether the lyric contains concrete objects, recognizable behavior, contradiction, conversational language, surprise and restraint.</div>';
    updateSunoLyricsExport();
  }
  function saveLyricThought(){
    syncLyricThoughtFromDom();
    save('LYRIC THOUGHT SAVED');
    toast('Thought engine saved to the active song.');
  }
  function saveLyrics(){
    const s=activeSong();
    syncLyricThoughtFromDom();
    s.updatedAt=Date.now();
    save('LYRICS SAVED');
    toast('Lyrics and thought engine saved to active song.');
  }
  function syllables(word){
    word=word.toLowerCase().replace(/[^a-z]/g,'');
    if(!word)return 0;
    if(word.length<=3)return 1;
    word=word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/,'').replace(/^y/,'');
    const m=word.match(/[aeiouy]{1,2}/g);
    return Math.max(1,m?m.length:1);
  }
  function lineSyllables(line){return line.split(/\s+/).filter(Boolean).reduce((n,w)=>n+syllables(w),0)}
  function checkMeter(){
    const lines=$('lyricsDraft').value.split('\n');
    const counts=lines.map(l=>clean(l)?lineSyllables(l):0).filter(Boolean).sort((a,b)=>a-b);
    const median=counts.length?counts[Math.floor(counts.length/2)]:0;
    $('meterResults').innerHTML=lines.map(line=>{
      if(!clean(line))return '<div class="meter-line"><b>—</b><span></span></div>';
      const n=lineSyllables(line),bad=median&&Math.abs(n-median)>=4;
      return '<div class="meter-line '+(bad?'bad':'')+'"><b>'+n+'</b><span>'+escapeHtml(line)+'</span></div>';
    }).join('')||'<div class="empty-state">No lyrics yet.</div>';
  }
  function tokenWords(text){return text.toLowerCase().match(/[a-z']+/g)||[]}
  function escapeRegExp(text){return text.replace(/[.*+?^$()|[\]\\]/g,'\\$&')}
  function scanCliches(){
    const text=$('lyricsDraft').value,lines=text.split('\n').filter(l=>clean(l));
    let stock=0;
    const marked=lines.map(line=>{
      let html=escapeHtml(line),hits=[];
      for(const phrase of CLICHES){
        const re=new RegExp('\\b'+escapeRegExp(phrase)+'\\b','ig');
        if(re.test(line)){
          hits.push(phrase);
          html=html.replace(re,m=>'<span class="cliche-hit">'+m+'</span>');
        }
      }
      stock+=hits.length;
      return hits.length?'<div class="cliche-line"><b>'+hits.length+'</b><span>'+html+'</span></div>':'';
    }).filter(Boolean);
    const words=tokenWords(text);
    const abstract=words.filter(w=>ABSTRACT_WORDS.includes(w)).length;
    const inflation=words.filter(w=>INFLATION_WORDS.includes(w)).length;
    const starters={};
    lines.forEach(l=>{const key=tokenWords(l).slice(0,2).join(' ');if(key)starters[key]=(starters[key]||0)+1});
    const symmetry=Object.values(starters).filter(n=>n>=3).reduce((a,b)=>a+b,0);
    const lengths=lines.map(l=>tokenWords(l).length).filter(Boolean);
    const spread=lengths.length?Math.max(...lengths)-Math.min(...lengths):0;
    const pressure=stock*2+abstract+inflation*2+symmetry+(lines.length>=6&&spread<=2?4:0);
    const level=pressure>=16?'HIGH':pressure>=7?'MEDIUM':'LOW';
    const summary='<div class="pressure-summary '+level.toLowerCase()+'"><b>'+level+' AI PRESSURE</b><span>stock '+stock+' · abstract '+abstract+' · inflation '+inflation+' · symmetry '+symmetry+'</span></div>';
    $('clicheResults').innerHTML=summary+(marked.join('')||'<div class="empty-state">No stock-goth phrase hits. The structural pressure score above matters more than vocabulary alone.</div>');
    toast(level+' AI-writing pressure.');
  }
  function humanTest(){
    const text=$('lyricsDraft').value,lab=syncLyricThoughtFromDom(),words=tokenWords(text),lines=text.split('\n').filter(l=>clean(l));
    const hasObject=!!lab.object||words.some(w=>HUMAN_OBJECT_WORDS.includes(w));
    const hasBehavior=!!lab.observation||/\b(wait|waiting|walk|walking|sit|sitting|look|looking|check|checking|drive|driving|call|calling|answer|sleep|wake|work|working|eat|drink|watch|scroll|scrolling|leave|left|stand|standing|hold|holding)\b/i.test(text);
    const hasContradiction=!!lab.contradiction||/\b(but|yet|although|instead|still|except|while)\b/i.test(text);
    const conversational=/\b(i'm|i've|i'd|can't|don't|won't|we're|we've|isn't|aren't|that's|there's|you've|you'd)\b/i.test(text)||lines.some(l=>tokenWords(l).length>0&&tokenWords(l).length<=7);
    const hasQuestion=/\?/.test(text)||/\b(why|how|who|what if|apparently|suppose)\b/i.test(text);
    const inflation=words.filter(w=>INFLATION_WORDS.includes(w)).length;
    const restrained=inflation<=2;
    const tests=[
      ['PHYSICAL DETAIL',hasObject,'Give the thought a thing you could point at.'],
      ['HUMAN BEHAVIOR',hasBehavior,'Show somebody doing something ordinary.'],
      ['CONTRADICTION',hasContradiction,'Find the part of the idea that does not add up.'],
      ['SPOKEN LANGUAGE',conversational,'Let at least one line sound like a person could actually say it.'],
      ['QUESTION / TURN',hasQuestion,'Let the lyric wonder, pivot or undermine itself.'],
      ['RESTRAINT',restrained,'Reduce emotional superlatives; let the image carry the damage.']
    ];
    const score=tests.filter(x=>x[1]).length;
    $('humanResults').innerHTML='<div class="human-score"><strong>'+score+'/6</strong><span>human texture</span></div>'+tests.map(([name,ok,tip])=>'<div class="human-check '+(ok?'pass':'fail')+'"><b>'+(ok?'✓':'○')+' '+name+'</b><span>'+(ok?'Present':escapeHtml(tip))+'</span></div>').join('');
    toast('Human texture: '+score+'/6.');
  }
  const LYRIC_TOOL_PROMPTS={
    concepts:'Do not write lyrics yet. Generate 6 genuinely different conceptual directions for this song. Each direction must begin with a concrete human observation, identify the contradiction, show the darker implication, include one dry or absurd angle, and optionally zoom out to consciousness/time/mortality. Avoid goth vocabulary. End by recommending the 2 richest directions for an actual song.',
    plain:'Translate the current draft into blunt plain English. For each section, tell me what the speaker is actually saying without poetry. Identify any line that sounds meaningful but has no clear underlying thought. Then give one concise song thesis. Do not rewrite the lyric yet.',
    human:'Revise only the lines that feel synthetic. Preserve the strongest odd phrases and useful rough edges. Add concrete behavior, mundane objects, contractions, asymmetry and lived-in detail. Vary sentence lengths and line shapes. Do not polish everything. Do not introduce a rhyme merely because it is available.',
    less_poetic:'Make the current lyric less performatively poetic and more conversational without making it dull. Replace adjective stacks and abstract declarations with verbs, objects, behavior and blunt statements. Keep the best images. Leave some lines almost embarrassingly plain.',
    drier:'Reduce melodrama. Introduce restrained understatement and dry observational wit where the subject permits it. The joke must reveal something sad, absurd or human; never turn the song into comedy.',
    stranger:'Make the underlying ideas stranger, not the vocabulary. Find an unexpected logical implication, social ritual, perceptual problem or consciousness question inside the existing subject. Do not add random surreal imagery.',
    cosmic:'Take the most mundane physical detail in the current song and zoom outward: individual → society → species → consciousness/time/cosmos. Keep one foot in the original room or object so the result does not become abstract space poetry.',
    earth:'Bring the current lyric back to Earth. Replace at least two abstract/cosmic statements with a room, object, gesture, social interaction or bodily action. Preserve the philosophical implication but stop explaining it.',
    darkness:'Rewrite with the Mr Darkness constitution: jaded, cosmic, introspective, skeptical, compassionate underneath, with dry wit and 1980s underground emotional restraint. Do not add generic goth imagery. The darkness must come from the thought. Preserve any line that already feels singular.'
  };
  function lyricTool(task){
    syncLyricThoughtFromDom();
    save('LYRIC CONTEXT SAVED');
    state.brain.mode='lyric_writer';
    renderBrainModes();
    const lab=lyricLabState();
    const frame=[
      LYRIC_TOOL_PROMPTS[task]||LYRIC_TOOL_PROMPTS.human,
      'Primary lens: '+lab.lens+'. Secondary lens: '+lab.lens2+'.',
      lab.plain&&'Plain thesis: '+lab.plain,
      lab.observation&&'Observation: '+lab.observation,
      lab.contradiction&&'Contradiction: '+lab.contradiction,
      lab.object&&'Physical anchor: '+lab.object
    ].filter(Boolean).join('\n\n');
    $('brainInput').value=frame;
    openBrain();
  }
  function renderPhraseBank(){
    const s=activeSong();
    $('phraseBank').innerHTML=(s.phraseBank||[]).length?s.phraseBank.map((p,i)=>'<span class="phrase">'+escapeHtml(p)+'<button data-remove-phrase="'+i+'">×</button></span>').join(''):'<span class="muted">No saved phrases yet.</span>';
  }
  function addPhrase(text){
    const p=clean(text||prompt('Phrase to save:'));
    if(!p)return;
    const s=activeSong();
    if(!s.phraseBank)s.phraseBank=[];
    if(!s.phraseBank.includes(p))s.phraseBank.unshift(p);
    save('PHRASE SAVED');
    renderPhraseBank();
    renderControl();
  }
  function addSelectedPhrase(){
    const el=$('lyricsDraft'),text=el.value.slice(el.selectionStart,el.selectionEnd);
    if(!clean(text)){toast('Select a lyric phrase first.');return}
    addPhrase(text);
  }

  function hydrateVocal(){const v=state.vocal;$('vRegister').value=v.register;$('vPlacement').value=v.placement;$('vMovement').value=v.movement;$('vDelivery').value=v.delivery;$('vDiction').value=v.diction;$('vHarmony').value=v.harmony;$('vChorus').value=v.chorus;$('vEmotion').value=v.emotion;$('vForbidden').value=v.forbidden;$('vocalSongTitle').textContent=activeSong().title;$('songVocalNote').value=activeSong().songVocalNote||''}
  function saveVocal(){state.vocal={register:clean($('vRegister').value),placement:clean($('vPlacement').value),movement:clean($('vMovement').value),delivery:clean($('vDelivery').value),diction:clean($('vDiction').value),harmony:clean($('vHarmony').value),chorus:clean($('vChorus').value),emotion:clean($('vEmotion').value),forbidden:clean($('vForbidden').value)};save('VOCAL DNA SAVED');toast('Vocal DNA updated globally.')}

  function compactJoin(parts,max=TARGET_SUNO){let out='';for(const raw of parts){const part=clean(raw).replace(/\s+/g,' ');if(!part)continue;const next=out?`${out} ${part}`:part;if(next.length<=max){out=next;continue}const remaining=max-out.length-(out?1:0);if(remaining>35){let cut=part.slice(0,remaining);const boundary=Math.max(cut.lastIndexOf('. '),cut.lastIndexOf('; '),cut.lastIndexOf(', '),cut.lastIndexOf(' '));if(boundary>20)cut=cut.slice(0,boundary+1);out+=(out?' ':'')+cut}break}return out.slice(0,MAX_SUNO)}
  function negativeize(text){return clean(text).split(/[.;\n]+/).map(x=>clean(x)).filter(Boolean).map(x=>/^no\b/i.test(x)?x:`No ${x.charAt(0).toLowerCase()+x.slice(1)}`).join('. ')+'.'}
  function buildSuno(){const s=activeSong();const last=latestGeneration();const direction=clean($('sunoDirection').value);const locked=last?[last.lock,last.keep].filter(Boolean).join('; '):'';const arr=(s.arrangement||[]).map(x=>x.name).join(' → ');
    const styleParts=[`1980s underground goth rock / darkwave dance; deep clear low baritone; shimmering chorus guitar and melodic bass remain central.`,`Song: ${s.bpm||'~118'} BPM, ${[s.key,s.mode].filter(Boolean).join(' ')||'minor/modal'}, ${s.energy||'build'}, target ${s.targetLength||'4–5 min'}.`,s.groove&&`Groove: ${s.groove}.`,s.roles?.bass&&`Bass: ${s.roles.bass}`,s.roles?.guitar&&`Guitar: ${s.roles.guitar}`,s.roles?.synth&&`Synth: ${s.roles.synth}`,s.roles?.drums&&`Drums: ${s.roles.drums}`,`Vocal: ${s.roles?.vocal||state.vocal.register} ${state.vocal.chorus}`,arr&&`Arrangement: ${arr}.`,locked&&`LOCK: ${locked}.`,direction&&`This pass: ${direction}.`];
    const excludeParts=[state.canon.exclusions,state.vocal.forbidden,...state.preferences.dislikes,last?.lose||''].filter(Boolean);const style=compactJoin(styleParts,TARGET_SUNO);const exclude=compactJoin([negativeize(excludeParts.join('. '))],TARGET_SUNO);$('stylePrompt').value=style;$('excludePrompt').value=exclude;updateCounters();s.suno={style,exclude};save('SUNO PROMPTS BUILT');toast('Suno prompts rebuilt under the hard limit.')}
  function updateCounters(){for(const [id,cid] of [['stylePrompt','styleCount'],['excludePrompt','excludeCount']]){const n=$(id).value.length;const c=$(cid);c.textContent=`${n} / ${MAX_SUNO}`;c.classList.toggle('warn',n>900&&n<980);c.classList.toggle('bad',n>=980)}}
  function hydrateSuno(){const s=activeSong();$('sunoTempo').value=s.bpm?`${s.bpm} BPM`:'';$('stylePrompt').value=s.suno?.style||'';$('excludePrompt').value=s.suno?.exclude||'';updateCounters()}

  function renderVault(){const active=activeSong();$('songVault').innerHTML=state.songs.map(s=>`<article class="song-card ${s.id===active.id?'active':''}"><span class="panel-title">${escapeHtml((s.status||'Idea').toUpperCase())}</span><h2>${escapeHtml(s.title)}</h2><div class="meta"><span>${escapeHtml(s.bpm||'—')} BPM</span><span>${escapeHtml(s.mode||'—')}</span><span>${s.generations?.length||0} generations</span></div><p>${escapeHtml(s.thesis||'No thesis yet.')}</p><div class="actions"><button class="secondary" data-open-song="${s.id}">OPEN</button><button class="ghost" data-duplicate-song="${s.id}">DUPLICATE</button></div></article>`).join('')}
  function createNewSong(){const s=starterSong();state.songs.push(s);state.activeSongId=s.id;state.album.sequence.push(s.id);save('NEW SONG');renderVault();navigate('build');toast('New song created.')}
  function duplicateSong(id){const src=state.songs.find(s=>s.id===id);if(!src)return;const copy=JSON.parse(JSON.stringify(src));copy.id=nowId('song');copy.title=`${src.title} — Copy`;copy.generations=[];copy.status='Idea';copy.createdAt=Date.now();copy.updatedAt=Date.now();state.songs.push(copy);state.album.sequence.push(copy.id);save();renderVault()}

  function albumSongs(){const selected=state.songs.filter(s=>/selected|mixing|release ready/i.test(s.status));return selected.length?selected:state.songs}
  function renderAlbum(){const songs=albumSongs();const bpms=songs.map(s=>Number(s.bpm)).filter(Number.isFinite);const avg=bpms.length?Math.round(bpms.reduce((a,b)=>a+b,0)/bpms.length):null;const min=bpms.length?Math.min(...bpms):null,max=bpms.length?Math.max(...bpms):null;const cresc=songs.filter(s=>/crescendo/i.test(s.energy||'')).length;$('albumTrackCount').textContent=songs.length;$('albumAvgBpm').textContent=avg||'—';$('albumBpmRange').textContent=min?`${min}–${max}`:'—';$('albumCrescendos').textContent=cresc;
    const maxB=Math.max(...bpms,140);$('albumMap').innerHTML=songs.map(s=>`<div class="album-row"><b>${escapeHtml(s.title)}</b><div class="album-track"><i style="width:${Math.max(12,(Number(s.bpm)||80)/maxB*100)}%"></i></div><span>${escapeHtml(s.bpm||'—')} BPM</span></div>`).join('');
    const flags=[];if(songs.length>=3&&max-min<12)flags.push('Tempo spread is tight. The record may need one clearly slower or faster track to change physical feel.');if(cresc>=Math.ceil(songs.length*.6)&&songs.length>=3)flags.push(`${cresc} of ${songs.length} tracks use a crescendo architecture. Consider at least one song that arrives hard or stays hypnotically level.`);const modes={};songs.forEach(s=>modes[s.mode]=(modes[s.mode]||0)+1);const top=Object.entries(modes).sort((a,b)=>b[1]-a[1])[0];if(top&&top[1]>=Math.ceil(songs.length*.75)&&songs.length>=4)flags.push(`${top[1]} tracks lean ${top[0]}. Modal sameness can be useful, but check whether harmonic color is becoming predictable.`);if(songs.some(s=>/ritual|hypnotic/i.test(s.energy))&&songs.some(s=>/immediate/i.test(s.energy)))flags.push({good:true,text:'Energy architecture includes both hypnotic and immediate entries — useful contrast for sequencing.'});if(!flags.length)flags.push({good:true,text:'No obvious structural repetition flags yet. Add more completed songs for a stronger album read.'});$('albumFlags').innerHTML=flags.map(f=>typeof f==='string'?`<div class="flag">${escapeHtml(f)}</div>`:`<div class="flag good">${escapeHtml(f.text)}</div>`).join('');
    const seq=state.album.sequence.map(id=>state.songs.find(s=>s.id===id)).filter(Boolean);$('albumSequence').innerHTML=seq.map((s,i)=>`<div class="track"><small>TRACK ${String(i+1).padStart(2,'0')}</small><b>${escapeHtml(s.title)}</b><small>${escapeHtml(s.bpm||'—')} BPM · ${escapeHtml(s.energy||'')}</small></div>`).join('')}

  function hydrateVisual(){const s=activeSong();$('visualSongTitle').textContent=s.title;$('visualBrief').value=s.visualBrief||''}
  function buildVisual(){const s=activeSong();const format=$('visualFormat').value,aspect=clean($('visualAspect').value),scene=clean($('visualScene').value),motif=clean($('visualMotif').value);const out=[`${format}${aspect?` · ${aspect}`:''}.`,`Recurring Mr Darkness character: ${state.canon.visual}`,scene&&`SCENE: ${scene}`,motif&&`SONG MOTIF: ${motif}`,`Continuity: same recognizable face/body language across images; analog 1980s photographic imperfection, not slick modern goth cosplay. Avoid plastic skin, fantasy-vampire styling, generic AI poster symmetry, bright cyberpunk neon and illegible text artifacts.`].filter(Boolean).join('\n\n');$('visualBrief').value=out;s.visualBrief=out;save('VISUAL BRIEF BUILT')}
  function hydrateRelease(){const s=activeSong();$('releaseTitle').value=s.release?.title||s.title;$('releaseType').value=s.release?.type||'Single';$('releaseMoment').value=s.release?.moment||'';$('releaseIdea').value=s.release?.idea||'';$('releaseBoard').value=s.releaseBoard||''}
  function buildRelease(){const s=activeSong();s.release={title:clean($('releaseTitle').value),type:$('releaseType').value,moment:clean($('releaseMoment').value),idea:clean($('releaseIdea').value)};const r=s.release;const out=[`RELEASE: ${r.title||s.title} · ${r.type}`,`CORE SIGNAL: ${r.idea||'Present Mr Darkness as a discovered recurring artist-character. Preserve mystery; do not explain the machinery.'}`,`TEASER MOMENT: ${r.moment||'Choose the strongest 10–15 second vocal or chorus identity moment.'}`,'','1 // SIGNAL','One strong image + a short audio fragment. Minimal copy. No biography dump.','', '2 // EVIDENCE','Second artifact from the same world: lyric fragment, alternate still, or short visual loop.','', '3 // IDENTITY','Reveal title/artwork and date. Keep copy short enough that the image and sound remain the event.','', '4 // TRANSMISSION',`Use ${r.moment||'the strongest chorus / vocal entry'} as the final pre-release teaser.`, '', '5 // RELEASE','Direct link, clean artwork, one sentence at most.','', '6 // AFTERIMAGE','Continue the world after release with an alternate scene, lyric artifact, generation fragment or short visual from the same song.'].join('\n');$('releaseBoard').value=out;s.releaseBoard=out;save('CAMPAIGN BUILT')}

  function brainInstructions(mode){
    const lyric='Act as Mr Darkness’s lyric writer/editor. '+LYRIC_CONSTITUTION+' HUMAN FLOW: '+LYRIC_HUMAN_RULES+' Use skeptical social observation, cosmic curiosity, existential absurdity, introspection, dry wit and underlying compassion without imitating any specific writer. Favor human thought over poetic decoration. Preserve strong odd lines and useful rough edges. Write for a deep low baritone with natural stresses and no forced rhyme. STRICT LYRIC WRITER CONTRACT: unless the user explicitly asks for critique, analysis, meter, explanation or notes, return ONLY the finished or revised lyrics and nothing else. No preface. No postscript. No title. No markdown headings. No bullets. No timestamps. No durations. No clock times. No production notes. No vocal directions. No arrangement instructions. No commentary in parentheses. No descriptions such as instrumental-establish the pulse. Use only compact Suno-safe section tags when structurally useful: [Verse 1], [Verse 2], [Pre-Chorus], [Chorus], [Bridge], [Instrumental], [Outro]. Everything else in the lyric block must be words intended to be sung. Wrap the lyric-only result in <lyrics> and </lyrics>. If the user explicitly asks for critique or analysis, answer that request without reproducing the full lyric unless asked.';
    const modes={
      producer:'Act as Mr Darkness’s record producer. Think in arrangement, dynamics, instrumentation, transitions, mix perspective and song identity. Make specific production decisions. Put the usable result in <answer>...</answer>. Put optional explanation or rationale in <notes>...</notes>. Keep notes brief and never mix them into the copy-ready answer.',
      song_doctor:'Act as a song doctor. Diagnose drift between generations and preserve locked traits while making the smallest useful corrections. Put the usable repair direction in <answer>...</answer>. Put optional diagnosis or rationale in <notes>...</notes>. Keep the copy-ready repair direction separate from notes.',
      lyric_writer:lyric,
      suno_engineer:'Act as a Suno prompt engineer. Return exactly separate copy-ready blocks: <style>STYLE PROMPT ONLY</style> and <exclude>EXCLUDE PROMPT ONLY</exclude>. Each must remain under 1000 characters, ideally 850–900. Put any optional explanation in <notes>...</notes>; never mix notes into either prompt.',
      album_director:'Act as an album producer. Analyze continuity, contrast, sequence, tempo/energy shape and repeated arrangement habits without ranking songs as winners or losers. Put the actionable recommendation in <answer>...</answer> and optional reasoning in <notes>...</notes>.',
      visual_director:'Act as a visual director maintaining one recognizable Mr Darkness character and one 1980s underground world. Put the copy-ready visual brief in <answer>...</answer> and optional reasoning in <notes>...</notes>.',
      release_director:'Act as a release director. Preserve mystery, avoid influencer language, and build practical teaser/release sequences. Put the usable campaign output in <answer>...</answer> and optional reasoning in <notes>...</notes>.'
    };
    return modes[mode]||modes.producer;
  }
  function projectContext(mode=state.brain.mode){const s=activeSong();if(mode==='lyric_writer'){return {canon:{lyrics:state.canon.lyrics},vocalDNA:{register:state.vocal.register,movement:state.vocal.movement,diction:state.vocal.diction},lyricConstitution:LYRIC_CONSTITUTION,lyricHumanRules:LYRIC_HUMAN_RULES,likes:state.preferences.likes,dislikes:state.preferences.dislikes,activeSong:{title:s.title,thesis:s.thesis,anchor:s.anchor,lyrics:s.lyrics,lyricLab:lyricLabState(s),phraseBank:s.phraseBank||[]}}}return {canon:state.canon,vocalDNA:state.vocal,lyricConstitution:LYRIC_CONSTITUTION,lyricHumanRules:LYRIC_HUMAN_RULES,likes:state.preferences.likes,dislikes:state.preferences.dislikes,activeSong:{title:s.title,status:s.status,thesis:s.thesis,anchor:s.anchor,bpm:s.bpm,key:s.key,mode:s.mode,targetLength:s.targetLength,groove:s.groove,energy:s.energy,roles:s.roles,arrangement:s.arrangement,lyrics:s.lyrics,lyricLab:lyricLabState(s),songVocalNote:s.songVocalNote,suno:s.suno,latestGeneration:latestGeneration()},album:albumSongs().map(x=>({title:x.title,status:x.status,bpm:x.bpm,mode:x.mode,energy:x.energy,targetLength:x.targetLength,thesis:x.thesis}))}}
  function browserPrompt(userText,mode=state.brain.mode){return [`You are working inside MR DARKNESS HQ, a production workstation for one recurring fictional 1980s goth/darkwave artist.`,brainInstructions(mode),mode==='lyric_writer'?'Use only the lyric-writing context below. Ignore timing, production and arrangement assumptions unless the user explicitly asks about them.':`Treat the supplied canon, vocal DNA, likes/don'ts, active production sheet and generation locks as source-of-truth constraints. Do not flatter. Diagnose drift specifically. For Suno prompts, target 850–900 characters and never exceed 999 per prompt.`,`\nPROJECT CONTEXT\n${JSON.stringify(projectContext(mode),null,2)}`,`\nUSER REQUEST\n${userText}`].join('\n\n')}
  function openBrain(){ $('brainDrawer').classList.add('open');$('drawerScrim').classList.add('show');$('brainDrawer').setAttribute('aria-hidden','false');setTimeout(()=>$('brainInput').focus(),150)}
  function closeBrain(){ $('brainDrawer').classList.remove('open');$('drawerScrim').classList.remove('show');$('brainDrawer').setAttribute('aria-hidden','true')}
  function addBrainMessage(role,text){if(!state.brain)state.brain={mode:'producer',messages:[],model:''};if(!Array.isArray(state.brain.messages))state.brain.messages=[];state.brain.messages.push({role,text,mode:state.brain.mode||'producer',at:Date.now()});state.brain.messages=state.brain.messages.slice(-40);activeSong().brainMessages=state.brain.messages.slice(-40);save();renderBrainMessages()}
  function stripBrainTags(text){
    return String(text||'').replace(/<\/?(?:lyrics|answer|notes|style|exclude)>/gi,'').trim();
  }

  function brainTag(text,tag){
    const m=String(text||'').match(new RegExp('<'+tag+'>([\\s\\S]*?)<\\/'+tag+'>','i'));
    return m?m[1].trim():'';
  }

  function parseBrainMessage(message){
    const raw=String(message?.text||'');
    const mode=message?.mode||'producer';
    const blocks=[];
    const lyrics=brainTag(raw,'lyrics');
    const style=brainTag(raw,'style');
    const exclude=brainTag(raw,'exclude');
    const answer=brainTag(raw,'answer');
    const notes=brainTag(raw,'notes');

    if(lyrics)blocks.push({key:'lyrics',label:'LYRICS',text:buildSunoLyricsExport(lyrics).text.trim()});
    if(style)blocks.push({key:'style',label:'STYLE PROMPT',text:style});
    if(exclude)blocks.push({key:'exclude',label:'EXCLUDE PROMPT',text:exclude});
    if(answer)blocks.push({key:'answer',label:mode==='song_doctor'?'REPAIR DIRECTION':'PRIMARY OUTPUT',text:answer});

    if(!blocks.length){
      const cleaned=stripBrainTags(raw);
      blocks.push({
        key:mode==='lyric_writer'?'lyrics':'answer',
        label:mode==='lyric_writer'?'LYRICS':'PRIMARY OUTPUT',
        text:mode==='lyric_writer'?(extractLyricsFromBrainText(cleaned)||cleaned):cleaned
      });
    }

    let residual=raw
      .replace(/<lyrics>[\s\S]*?<\/lyrics>/ig,'')
      .replace(/<style>[\s\S]*?<\/style>/ig,'')
      .replace(/<exclude>[\s\S]*?<\/exclude>/ig,'')
      .replace(/<answer>[\s\S]*?<\/answer>/ig,'')
      .replace(/<notes>[\s\S]*?<\/notes>/ig,'')
      .trim();

    return {blocks,notes:notes||residual};
  }

  function displayBrainText(text){return stripBrainTags(text)}

  function latestAssistantMessage(){
    const msgs=state.brain?.messages||[];
    for(let i=msgs.length-1;i>=0;i--)if(msgs[i]?.role==='assistant')return msgs[i];
    return null;
  }

  async function copyBrainBlock(message,key){
    const parsed=parseBrainMessage(message);
    const block=parsed.blocks.find(b=>b.key===key)||parsed.blocks[0];
    if(!block?.text){toast('Nothing to copy.');return}
    try{await copyText(block.text);toast(block.key==='lyrics'?'Lyrics copied.':'Output copied.')}catch(err){toast(err?.message||'Copy failed.')}
  }

  async function copyBrainLyrics(text){
    const fake={text,mode:'lyric_writer'};
    const parsed=parseBrainMessage(fake);
    const block=parsed.blocks.find(b=>b.key==='lyrics');
    if(!block?.text){toast('No lyric block found in that response.');return}
    try{await copyText(block.text);toast('Lyrics only copied.')}catch(err){toast(err?.message||'Copy failed.')}
  }

  function sendBrainLyricsToLab(text){
    const fake={text,mode:'lyric_writer'};
    const parsed=parseBrainMessage(fake);
    const block=parsed.blocks.find(b=>b.key==='lyrics');
    const lyrics=block?.text||'';
    if(!lyrics){toast('No lyric block found in that response.');return}
    const s=activeSong();
    s.lyrics=lyrics;s.updatedAt=Date.now();save('LYRICS IMPORTED FROM BRAIN');renderLyrics();closeBrain();navigate('lyrics');toast('Lyrics sent to Lyrics Lab.');
  }

  function renderBrainMessages(){
    const msgs=state.brain.messages||[];
    $('brainMessages').innerHTML=msgs.length?msgs.map((m,i)=>{
      if(m.role==='user'){
        return '<div class="brain-message user"><div class="brain-message-head"><span>YOU // '+escapeHtml((m.mode||'producer').replaceAll('_',' ').toUpperCase())+'</span></div><div class="brain-user-text">'+escapeHtml(m.text)+'</div></div>';
      }
      const parsed=parseBrainMessage(m);
      const outputs=parsed.blocks.map(b=>{
        const lyricActions=b.key==='lyrics'
          ? '<button class="message-copy" data-copy-brain-block="'+i+':'+b.key+'" type="button">COPY LYRICS</button><button class="message-copy" data-send-brain-lyrics="'+i+'" type="button">TO LYRICS</button>'
          : '<button class="message-copy" data-copy-brain-block="'+i+':'+b.key+'" type="button">COPY '+escapeHtml(b.label)+'</button>';
        return '<section class="brain-output-block"><div class="brain-output-head"><span>'+escapeHtml(b.label)+'</span><div class="message-actions">'+lyricActions+'</div></div><pre class="brain-output-text">'+escapeHtml(b.text)+'</pre></section>';
      }).join('');
      const notes=parsed.notes
        ? '<details class="brain-notes"><summary>NOTES / WHY <small>optional</small></summary><div class="brain-notes-body"><button class="message-copy" data-copy-brain-notes="'+i+'" type="button">COPY NOTES</button><pre>'+escapeHtml(parsed.notes)+'</pre></div></details>'
        : '';
      return '<div class="brain-message md"><div class="brain-message-head"><span>MR DARKNESS // '+escapeHtml((m.mode||'producer').replaceAll('_',' ').toUpperCase())+'</span></div>'+outputs+notes+'</div>';
    }).join(''):'<div class="brain-message md"><div class="brain-message-head"><span>MR DARKNESS</span></div><div class="brain-user-text">I already know the active song and the Mr Darkness canon. Ask from where you are.</div></div>';
    $('brainMessages').scrollTop=$('brainMessages').scrollHeight;
  }

  async function refreshNativeStatus(){
    const btn=$('nativeConnectBtn');
    try{
      const status=await window.MDNative.status();
      if(status.available&&status.connected){
        $('brainConnection').textContent='CHATGPT PLAN CONNECTED';
        $('brainConnectionSub').textContent=status.email?'Signed in as '+status.email:'Using eligible ChatGPT plan usage';
        $('brainLabel').textContent='CHATGPT ONLINE';
        $('brainBtn').classList.add('native');
        $('nativeStatus').textContent='Connected';
        btn.textContent='CONNECTED';btn.disabled=true;$('.native-brain-action').forEach(x=>x.hidden=false);$('.browser-brain-action').forEach(x=>x.hidden=true);
        if(!state.brain.model){
          try{
            const models=await window.MDNative.models();
            state.brain.model=models?.[0]?.slug||models?.[0]?.id||'';
            save();
          }catch{}
        }
      }else if(status.available){
        $('brainConnection').textContent=status.authorized?'CHATGPT AUTHORIZED — CHECK CONNECTION':'NATIVE BRIDGE READY';
        $('brainConnectionSub').textContent=status.error||'Connect your ChatGPT account to use plan sharing.';
        $('nativeStatus').textContent=status.error||'Detected — not signed in';
        btn.textContent=status.authorized?'RETRY CONNECTION TEST':'CONTINUE WITH CHATGPT';
        btn.disabled=false;$('.native-brain-action').forEach(x=>x.hidden=true);$('.browser-brain-action').forEach(x=>x.hidden=false);
      }else{
        $('brainConnection').textContent='BROWSER BRIDGE';
        $('brainConnectionSub').textContent='Copies only the requested context into your existing ChatGPT account.';
        $('nativeStatus').textContent='Not detected in browser';
        btn.textContent='CONTINUE WITH CHATGPT';btn.disabled=false;$('.native-brain-action').forEach(x=>x.hidden=true);$('.browser-brain-action').forEach(x=>x.hidden=false);
      }
    }catch(err){
      $('brainConnection').textContent='CONNECTION CHECK FAILED';
      $('brainConnectionSub').textContent=err?.message||String(err);
      $('nativeStatus').textContent=err?.message||'Connection check failed';
      btn.textContent='RETRY';btn.disabled=false;$('.native-brain-action').forEach(x=>x.hidden=true);$('.browser-brain-action').forEach(x=>x.hidden=false);
    }
  }
  async function connectNative(){if(!window.MDNative.available){toast('The direct Plus connection activates in the local Android build. This browser build can still hand off full context to ChatGPT.');return}try{$('nativeConnectBtn').disabled=true;$('nativeConnectBtn').textContent='CONNECTING…';await window.MDNative.connect();await refreshNativeStatus();toast('ChatGPT plan connected.')}catch(err){toast(err.message);$('nativeConnectBtn').disabled=false;$('nativeConnectBtn').textContent='CONTINUE WITH CHATGPT'}}
  function isLyricAnalysisRequest(text){
    return /\b(analy[sz]e|analysis|critique|feedback|meter|syllable|singability|explain|why|notes?|diagnose|what works|what doesn't|what does not)\b/i.test(String(text||''));
  }
  function normalizeLyricWriterReply(reply,request){
    if(isLyricAnalysisRequest(request))return reply;
    const extracted=extractLyricsFromBrainText(reply);
    if(extracted)return '<lyrics>'+extracted+'</lyrics>';
    return reply;
  }

  async function askBrain(){const input=$('brainInput');const text=clean(input.value);if(!text)return;addBrainMessage('user',text);input.value='';$('brainSend').disabled=true;$('brainSend').textContent='THINKING…';try{const status=await window.MDNative.status();if(status.available&&status.connected){const result=await window.MDNative.ask({model:state.brain.model,instructions:browserPrompt('',state.brain.mode),input:text});const reply=state.brain.mode==='lyric_writer'?normalizeLyricWriterReply(result.text,text):result.text;addBrainMessage('assistant',reply)}else{const full=browserPrompt(text,state.brain.mode);await copyText(full);addBrainMessage('assistant','Full project context copied. I opened ChatGPT so you can paste it there; the browser prototype cannot safely hold ChatGPT plan tokens. The packaged local build will answer here directly.');window.open('https://chatgpt.com/','_blank','noopener')}}catch(err){addBrainMessage('assistant',`Connection problem: ${err.message}`)}finally{$('brainSend').disabled=false;$('brainSend').textContent='ASK'}}
  async function copyFullContext(){try{await copyText(browserPrompt(clean($('brainInput').value)||'Continue working on the active Mr Darkness project.',state.brain.mode));toast('Full Mr Darkness context copied.')}catch(err){toast(err?.message||'Copy failed.')}}
  async function openChatGPT(){await copyFullContext();window.open('https://chatgpt.com/','_blank','noopener')}
  function triggerBrainTask(task){const prompts={repair:'Refine the current repair brief. Preserve every LOCK and KEEP trait, correct the LOSE traits, and give me the smallest useful next-generation changes.',lyrics:'Start by diagnosing the underlying thought, not by decorating the lyric. Use the Mr Darkness constitution and human-flow rules. If the concept is weak, give distinct conceptual directions before writing. If a draft exists, preserve singular lines and revise only the generic, overly poetic, symmetrical, over-explained or forced-rhyme parts. Make it concrete, human, jaded, cosmic, introspective and dryly funny without becoming comedic. Any actual lyric output must be Suno-safe: no timestamps, no markdown headings, no performance notes, no vocal instructions, no durations. Use only clean section tags like [Verse 1], [Pre-Chorus], [Chorus], [Bridge], [Instrumental], [Outro].',suno:'Build a corrected STYLE PROMPT and EXCLUDE PROMPT for the active song. Each prompt must remain under 1000 characters, ideally 850–900.',album:'Analyze the album as a producer. Identify repeated tempo, energy, arrangement or instrumentation habits and suggest useful contrast while preserving Mr Darkness identity.',visual:'Refine the current visual brief so the same recognizable Mr Darkness character and 1980s underground world survive across assets.',release:'Build or refine the release campaign so it feels like fragments from the Mr Darkness world rather than generic social media marketing.'};state.brain.mode={repair:'song_doctor',lyrics:'lyric_writer',suno:'suno_engineer',album:'album_director',visual:'visual_director',release:'release_director'}[task]||'producer';renderBrainModes();$('brainInput').value=prompts[task]||'';openBrain()}
  function renderBrainModes(){$$('#brainModes button').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.brain.mode))}

  function hydrateCanonDialog(){ $('canonMusic').value=state.canon.music;$('canonProduction').value=state.canon.production;$('canonLyrics').value=state.canon.lyrics;$('canonVisual').value=state.canon.visual;$('canonExclusions').value=state.canon.exclusions }
  function saveCanon(){state.canon={music:clean($('canonMusic').value),production:clean($('canonProduction').value),lyrics:clean($('canonLyrics').value),visual:clean($('canonVisual').value),exclusions:clean($('canonExclusions').value)};save('CORE CANON SAVED');$('canonDialog').close();toast('Core Mr Darkness canon updated.')}
  function exportState(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`mr-darkness-v3-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  async function importState(file){try{const data=JSON.parse(await file.text());if(!data||!Array.isArray(data.songs))throw new Error('Not a Mr Darkness V3 project file.');state=normalizeState(data);save('PROJECT IMPORTED');renderAll();toast('Project imported.')}catch(err){toast(err.message)}}

  function debounce(fn,wait=450){let timer;return (...args)=>{clearTimeout(timer);timer=setTimeout(()=>fn(...args),wait)}}
  const autosaveBuild=debounce(()=>{try{captureBuild();syncArrangementFromDom();save('AUTOSAVED')}catch{}});
  const autosaveLyrics=debounce(()=>{try{syncLyricThoughtFromDom();save('AUTOSAVED')}catch{}});
  const autosaveSuno=debounce(()=>{try{const s=activeSong();s.suno={style:$('stylePrompt').value,exclude:$('excludePrompt').value};save('AUTOSAVED')}catch{}});
  const autosaveVisual=debounce(()=>{try{activeSong().visualBrief=$('visualBrief').value;save('AUTOSAVED')}catch{}});
  const autosaveRelease=debounce(()=>{try{activeSong().releaseBoard=$('releaseBoard').value;save('AUTOSAVED')}catch{}});
  function renderAll(){renderControl();hydrateBuild();renderGenerationLab();renderLyrics();hydrateVocal();hydrateSuno();renderVault();renderAlbum();hydrateVisual();hydrateRelease();renderBrainMessages();renderBrainModes();refreshNativeStatus()}

  document.addEventListener('click',e=>{
    const go=e.target.closest('[data-go]');if(go){navigate(go.dataset.go);return}
    const railBtn=e.target.closest('.rail nav button[data-view]');if(railBtn){navigate(railBtn.dataset.view);return}
    const rem=e.target.closest('[data-remove-section]');if(rem){syncArrangementFromDom();activeSong().arrangement.splice(Number(rem.dataset.removeSection),1);save();renderArrangement();return}
    const phrase=e.target.closest('[data-remove-phrase]');if(phrase){activeSong().phraseBank.splice(Number(phrase.dataset.removePhrase),1);save();renderPhraseBank();return}
    const open=e.target.closest('[data-open-song]');if(open){stashBrainOnActiveSong();state.activeSongId=open.dataset.openSong;restoreBrainForSong(activeSong());save('ACTIVE SONG CHANGED');renderAll();navigate('control');toast(`${activeSong().title} is active.`);return}
    const dup=e.target.closest('[data-duplicate-song]');if(dup){duplicateSong(dup.dataset.duplicateSong);return}
    const brainTask=e.target.closest('[data-brain-task]');if(brainTask){triggerBrainTask(brainTask.dataset.brainTask);return}
    const lyricAi=e.target.closest('[data-lyric-tool]');if(lyricAi){lyricTool(lyricAi.dataset.lyricTool);return}
    const blockCopy=e.target.closest('[data-copy-brain-block]');if(blockCopy){const [idx,key]=String(blockCopy.dataset.copyBrainBlock).split(':');const msg=(state.brain.messages||[])[Number(idx)];if(msg)copyBrainBlock(msg,key);return}
    const notesCopy=e.target.closest('[data-copy-brain-notes]');if(notesCopy){const msg=(state.brain.messages||[])[Number(notesCopy.dataset.copyBrainNotes)];if(msg){const notes=parseBrainMessage(msg).notes;if(notes)copyText(notes).then(()=>toast('Notes copied.')).catch(err=>toast(err?.message||'Copy failed.'))}return}
    const lyricSend=e.target.closest('[data-send-brain-lyrics]');if(lyricSend){const msg=(state.brain.messages||[])[Number(lyricSend.dataset.sendBrainLyrics)];if(msg)sendBrainLyricsToLab(msg.text);return}
    const copy=e.target.closest('[data-copy]');if(copy){copyValue(copy.dataset.copy);return}
  });

  $('menuBtn').addEventListener('click',()=> $('rail').classList.toggle('open'));
  $('brainBtn').addEventListener('click',openBrain);$('brainClose').addEventListener('click',closeBrain);$('drawerScrim').addEventListener('click',closeBrain);
  $('settingsBtn').addEventListener('click',()=>{$('settingsDialog').showModal();refreshNativeStatus()});
  $('editCanonBtn').addEventListener('click',()=>{hydrateCanonDialog();$('canonDialog').showModal()});$('saveCanonBtn').addEventListener('click',saveCanon);
  $('buildSheetBtn').addEventListener('click',buildSheet);$('saveSongBtn').addEventListener('click',()=>{captureBuild();syncArrangementFromDom();activeSong().productionSheet=buildProductionSheetText();save('SONG SAVED');renderControl();toast('Song saved.')});
  $('copySheetBtn').addEventListener('click',async()=>{try{await copyText(buildProductionSheetText());toast('Production sheet copied.')}catch(err){toast(err?.message||'Copy failed.')}});
  $('addSectionBtn').addEventListener('click',()=>{syncArrangementFromDom();activeSong().arrangement.push({start:'',name:'New section',notes:''});renderArrangement()});
  $('songEnergy').addEventListener('change',()=>{const s=activeSong();if(confirm('Rebuild the arrangement template for this energy arc?')){s.energy=$('songEnergy').value;s.arrangement=defaultArrangement(s.energy);renderArrangement()}autosaveBuild()});
  $('build').addEventListener('input',e=>{if(e.target.matches('input,textarea,select'))autosaveBuild()});$('arrangementEditor').addEventListener('input',autosaveBuild);
  $('newGenerationBtn').addEventListener('click',newGeneration);$('saveGenerationBtn').addEventListener('click',saveGeneration);$('repairBtn').addEventListener('click',buildRepair);$('copyRepairBtn').addEventListener('click',()=>copyValue('repairBrief'));$('compareBtn').addEventListener('click',compareGenerations);$('combineBtn').addEventListener('click',combineBest);$('analyzeAudioBtn').addEventListener('click',analyzeAudio);
  $$('.score-grid input[type="range"]').forEach(x=>x.addEventListener('input',()=>x.nextElementSibling.textContent=x.value));
  $('newLyricSongBtn').addEventListener('click',createNewLyricSong);$('renameLyricSongBtn').addEventListener('click',renameLyricSong);$('openLyricVaultBtn').addEventListener('click',()=>navigate('vault'));$('lyricsTitle').addEventListener('input',autosaveLyrics);
    $('saveLyricsBtn').addEventListener('click',saveLyrics);$('saveLyricDNA').addEventListener('click',saveLyricThought);$('meterBtn').addEventListener('click',checkMeter);$('clicheBtn').addEventListener('click',scanCliches);$('humanBtn').addEventListener('click',humanTest);$('copyLyricsBtn').addEventListener('click',()=>copyValue('lyricsDraft'));$('selectLyricsBtn').addEventListener('click',()=>selectField('lyricsDraft'));$('copySunoLyricsBtn').addEventListener('click',copySunoLyrics);$('selectionPhraseBtn').addEventListener('click',addSelectedPhrase);$('addPhraseBtn').addEventListener('click',()=>addPhrase());$('lyrics').addEventListener('input',e=>{if(e.target.matches('input,textarea,select')){autosaveLyrics();if(e.target.id==='lyricsDraft')updateSunoLyricsExport()}});
  $('saveVocalBtn').addEventListener('click',saveVocal);$('saveSongVocalBtn').addEventListener('click',()=>{activeSong().songVocalNote=clean($('songVocalNote').value);save('SONG VOCAL NOTE SAVED');toast('Song-specific vocal direction saved.')});
  $('buildSunoBtn').addEventListener('click',buildSuno);$('stylePrompt').addEventListener('input',()=>{updateCounters();autosaveSuno()});$('excludePrompt').addEventListener('input',()=>{updateCounters();autosaveSuno()});
  $('newSongFromVaultBtn').addEventListener('click',createNewSong);
  $('buildVisualBtn').addEventListener('click',buildVisual);$('copyVisualBtn').addEventListener('click',()=>copyValue('visualBrief'));$('visualBrief').addEventListener('input',autosaveVisual);
  $('buildReleaseBtn').addEventListener('click',buildRelease);$('copyReleaseBtn').addEventListener('click',()=>copyValue('releaseBoard'));$('releaseBoard').addEventListener('input',autosaveRelease);
  $('brainSend').addEventListener('click',askBrain);$('brainInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();askBrain()}});$('nativeConnectBtn').addEventListener('click',connectNative);$('openChatGPTBtn').addEventListener('click',openChatGPT);$('copyLastLyricsBtn').addEventListener('click',()=>{const m=latestAssistantMessage();if(m)copyBrainLyrics(m.text);else toast('No Mr Darkness response yet.')});$('sendLastLyricsBtn').addEventListener('click',()=>{const m=latestAssistantMessage();if(m)sendBrainLyricsToLab(m.text);else toast('No Mr Darkness response yet.')});$('clearBrainBtn').addEventListener('click',()=>{state.brain.messages=[];activeSong().brainMessages=[];save();renderBrainMessages()});
  $$('#brainModes button').forEach(b=>b.addEventListener('click',()=>{state.brain.mode=b.dataset.mode;save();renderBrainModes()}));
  $('exportBtn').addEventListener('click',exportState);$('importBtn').addEventListener('click',()=>$('importFile').click());$('importFile').addEventListener('change',()=>{const f=$('importFile').files?.[0];if(f)importState(f)});

  document.addEventListener('keydown',e=>{
    if(!(e.ctrlKey||e.metaKey) || String(e.key).toLowerCase()!=='a')return;
    const el=e.target;
    if(el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && !['range','file','checkbox','radio','button','submit'].includes(el.type))){
      e.preventDefault();
      el.select();
    }
  });

  renderAll();
})();
