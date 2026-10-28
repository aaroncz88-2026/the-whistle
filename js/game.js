(function () {
  const $ = (id) => document.getElementById(id);
  const FRAME_N = 8;
  const STAMP_MS = 880;
  const BEAT_MS = 2000;
  const CARD_MS = 4000;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, x) {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function ease(t) { return t * t * (3 - 2 * t); }
  function esc(s) {
    return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }
  function P(o) {
    return Object.assign({ type: "player", facing: 1, pose: "stand", phase: 0, s: 1, num: "" }, o);
  }
  function sawTell(res, tell) {
    return (res.studied || []).some((f) => Math.abs(f / (FRAME_N - 1) - tell) <= 0.16);
  }
  function pack(res, points, note) {
    let p = points;
    if (res.late) {
      p = Math.max(0, p - 4);
      note += " 窗口关了。";
    } else if (res.cardLate) {
      p = Math.max(0, p - 2);
      note += " 牌给晚了。";
    }
    return { points: p, note };
  }

  function idleActors(now) {
    const u = (now / 700) % 1;
    return [
      P({ x: 540, y: 730, s: 1.22, kit: "mara", num: "10", pose: "dribble", phase: u, band: true }),
      P({ x: 730, y: 650, s: 0.82, kit: "mara", num: "7", pose: "jog", phase: u + 0.2 }),
      P({ x: 900, y: 770, s: 1.36, kit: "keel", num: "4", pose: "stand", facing: -1 }),
      P({ x: 1120, y: 700, s: 1.02, kit: "keel", num: "5", pose: "jog", phase: u + 0.55, facing: -1 }),
      P({ x: 1280, y: 640, s: 0.7, kit: "keep", num: "1", pose: "stand", facing: -1 }),
      { type: "goal", x: 1420, y: 660, s: 1.05 },
      { type: "ball", x: 600, y: 748, z: 10 + Math.sin(now / 180) * 8, s: 1 },
      P({ x: 280, y: 690, s: 0.9, kit: "ar", pose: "stand", flag: "down" }),
    ];
  }

  function tripActors(t) {
    const slide = smooth(0.16, 0.58, t);
    const falling = smooth(0.4, 0.82, t);
    const tackleX = lerp(600, 840, slide);
    const list = [
      P({ x: 250, y: 710, s: 1.08, kit: "mara", num: "11", pose: "jog", phase: t * 2.4 }),
      P({ x: tackleX, y: 748, s: 1.42, kit: "keel", num: "4", pose: t < 0.2 ? "run" : "slide", phase: t * 3 }),
      P({
        x: lerp(930, 880, falling),
        y: 736,
        s: 1.5,
        kit: "mara",
        num: "10",
        pose: t < 0.4 ? "dribble" : "fall",
        phase: t < 0.4 ? t * 4 : falling,
        band: true,
      }),
      { type: "ball", x: lerp(980, 1080, falling), y: 760, z: falling * 86, s: 1.05 },
      P({ x: 1480, y: 700, s: 1, kit: "ar", pose: "stand", flag: "down", facing: -1 }),
      P({ x: 1360, y: 620, s: 0.5, kit: "keel", num: "2", pose: "jog", phase: t * 2 }),
    ];
    if (t > 0.46) list.push({ type: "impact", x: lerp(900, 860, falling), y: 690, a: 0.95 });
    return list;
  }

  function gapActors(t) {
    const u = ease(t);
    const pullX = 300;
    const runnerX = lerp(980, 1160, u);
    const ballX = lerp(1040, 1260, u);
    const list = [
      P({ x: pullX, y: 740, s: 1.4, kit: "keel", num: "6", pose: "pull" }),
      P({ x: pullX + 168, y: 728, s: 1.36, kit: "mara", num: "7", pose: "pulled" }),
      { type: "cloth", x1: pullX + 36, y1: 650, x2: pullX + 130, y2: 640 },
      P({ x: runnerX, y: 745, s: 1.52, kit: "mara", num: "9", pose: "run", phase: t * 5.5 }),
      { type: "speed", x: runnerX - 30, y: 690 },
      { type: "ball", x: ballX, y: 760, z: 18 + Math.sin(t * Math.PI) * 28, s: 1.05 },
      { type: "goal", x: 1360, y: 700, s: 1.4 },
      P({ x: 1260, y: 710, s: 0.92, kit: "keep", num: "1", pose: "stand", facing: -1 }),
      P({ x: 1900, y: 730, s: 1.28, kit: "keel", num: "3", pose: "appeal", facing: -1 }),
      P({ x: 2060, y: 770, s: 1.42, kit: "mara", num: "11", pose: "appeal", facing: -1, phase: 0.3 }),
    ];
    if (t > 0.22) list.push({ type: "impact", x: pullX + 100, y: 660, a: 0.8 });
    return list;
  }

  function armActors(t) {
    const down = smooth(0.28, 0.9, t);
    const victimX = lerp(860, 1180, down);
    return [
      P({ x: 690, y: 735, s: 1.48, kit: "keel", num: "5", pose: "elbow" }),
      P({
        x: victimX,
        y: 748,
        s: 1.4,
        kit: "mara",
        num: "8",
        facing: -1,
        pose: t < 0.34 ? "stand" : "fall",
        phase: down,
      }),
      P({ x: 930, y: 810, s: 1.9, kit: "keel", num: "15", pose: "wall", facing: -1 }),
      P({ x: 780, y: 690, s: 1.12, kit: "mara", num: "6", pose: "appeal" }),
      P({ x: 1080, y: 680, s: 1.05, kit: "keel", num: "2", pose: "appeal", facing: -1, phase: 0.4 }),
      { type: "ball", x: 1000, y: 800, z: 2, s: 0.9 },
    ];
  }

  function ankleActors(t) {
    const ground = 792;
    const approach = smooth(0.04, 0.38, t);
    const strike = smooth(0.32, 0.48, t);
    const down = smooth(0.48, 0.8, t);
    const defX = lerp(720, 900, Math.max(approach, strike));
    const atkX = lerp(1040, 1120, down);
    const ballT = smooth(0.48, 0.78, t);
    const list = [
      P({
        x: defX,
        y: ground,
        s: 1.55,
        kit: "keel",
        num: "4",
        pose: "run",
        poseTo: "strike",
        blend: strike,
        phase: t * 2.4,
        phaseTo: 1,
      }),
      P({
        x: atkX,
        y: ground,
        s: 1.62,
        kit: "mara",
        num: "10",
        pose: "dribble",
        poseTo: "trip",
        blend: down,
        phase: t * 2.2,
        phaseTo: down,
        band: true,
      }),
      {
        type: "ball",
        x: lerp(atkX + 46, 1240, ballT),
        y: ground + 6,
        z: ballT < 0.04 ? 8 : Math.sin(ballT * Math.PI) * 78,
        s: 1.05,
      },
    ];
    if (t > 0.46 && t < 0.7) {
      const a = t < 0.54 ? (t - 0.46) / 0.08 : 1 - (t - 0.54) / 0.16;
      list.push({ type: "dust", x: 1005, y: ground + 8, a: Math.max(0, a) });
    }
    return list;
  }

  function diveFrontActors(t) {
    const ground = 792;
    const chase = smooth(0.04, 0.36, t);
    const brake = smooth(0.32, 0.48, t);
    const sell = smooth(0.56, 0.9, t);
    const defX = lerp(680, 860, chase);
    const atkX = 1160;
    const list = [
      P({
        x: defX,
        y: ground,
        s: 1.5,
        kit: "keel",
        num: "4",
        pose: "run",
        poseTo: "brake",
        blend: brake,
        phase: t * 2.6,
        phaseTo: 1,
      }),
      P({
        x: atkX,
        y: ground,
        s: 1.58,
        kit: "mara",
        num: "9",
        pose: "dribble",
        poseTo: "sell",
        blend: sell,
        phase: t * 2.4,
        phaseTo: sell,
        band: true,
      }),
      {
        type: "ball",
        x: lerp(atkX + 48, 1320, smooth(0.2, 0.7, t)),
        y: ground + 6,
        z: 10,
        s: 1.05,
      },
    ];
    return list;
  }

  function diveActors(t) {
    const chase = smooth(0, 0.4, t);
    const sell = smooth(0.62, 1, t);
    const defX = lerp(500, 760, chase);
    const list = [
      P({
        x: defX,
        y: 750,
        s: 1.34,
        kit: "keel",
        num: "4",
        pose: t < 0.5 ? "run" : "stand",
        phase: t * 3,
      }),
      P({
        x: 1040,
        y: 728,
        s: 1.5,
        kit: "mara",
        num: "9",
        pose: sell > 0.08 ? "fall" : "dribble",
        phase: sell > 0.08 ? sell : t * 4,
        band: true,
      }),
      { type: "ball", x: lerp(1080, 1220, t), y: 758, z: 10 + sell * 16, s: 1.05 },
    ];
    if (sell > 0.45) list.push({ type: "impact", x: 990, y: 700, a: 0.35 });
    return list;
  }

  const CAM = {
    trip: {
      left: { x: 280, y: 700, zoom: 1.78 },
      center: { x: 880, y: 720, zoom: 1.82 },
      right: { x: 1620, y: 700, zoom: 1.72 },
    },
    gap: {
      left: { x: 390, y: 710, zoom: 1.86 },
      center: { x: 1120, y: 710, zoom: 1.56 },
      right: { x: 1980, y: 745, zoom: 1.72 },
    },
    arm: {
      left: { x: 700, y: 690, zoom: 2.05 },
      center: { x: 960, y: 750, zoom: 1.3 },
      right: { x: 1240, y: 740, zoom: 1.78 },
    },
    dive: {
      left: { x: 280, y: 690, zoom: 1.7 },
      center: { x: 900, y: 730, zoom: 1.48 },
      right: { x: 1480, y: 680, zoom: 1.55 },
    },
  };

  const ankleCall = {
    id: "ankle",
    clock: "14:20",
    kicker: "",
    pitch: "box",
    cameras: {
      left: { x: 1000, y: 860, zoom: 1.38 },
      center: { x: 1000, y: 860, zoom: 1.38 },
      right: { x: 1000, y: 860, zoom: 1.38 },
    },
    actors: ankleActors,
    bestCard: null,
    live(res) {
      if (res.decision === "play") return "没有哨。10 号留在地上。";
      return "哨响。铲到了脚踝。";
    },
    grade(res) {
      if (res.decision === "foul") return pack(res, 10, "铲到脚踝。吹停是对的。");
      return pack(res, 0, "脚穿到了人。这一下该停。");
    },
  };

  const foulCall = {
    id: "trip",
    clock: "18:40",
    kicker: "弧顶",
    pitch: "box",
    cameras: CAM.trip,
    actors: tripActors,
    bestCard: null,
    live(res) {
      if (res.late || res.decision === "play") return "没有哨。10 号留在地上。";
      if (res.decision === "advantage") return "你给了有利。弧顶没有空间。";
      return "哨响。比赛停在弧顶。";
    },
    grade(res) {
      if (res.decision === "foul" && res.seen.center) return pack(res, 10, "铲球穿到脚踝，吹停是对的。");
      if (res.decision === "foul") return pack(res, 6, "哨是对的。中路这一下你没有看住。");
      if (res.decision === "advantage") return pack(res, 2, "弧顶没有能放的球。");
      return pack(res, 0, "人倒在中路。这下没有哨。");
    },
  };

  const diveCall = {
    id: "dive",
    clock: "27:15",
    kicker: "假摔",
    pitch: "open",
    cameras: CAM.dive,
    actors: diveActors,
    tell: 0.34,
    bestCard: null,
    live(res) {
      if (res.decision === "foul") return "哨响。接触并没有发生。";
      if (res.decision === "advantage") return "你给了有利。这里没有犯规可放。";
      return "没有哨。9 号自己倒下去。";
    },
    grade(res) {
      const back = sawTell(res, 0.34);
      if (res.decision === "play" && back) return pack(res, 10, "你翻回了接触前。脚没有到，人是后倒的。");
      if (res.decision === "play") return pack(res, 5, "继续是对的。你停在末帧，没看接触前。");
      if (res.decision === "advantage") return pack(res, 2, "没有犯规，有利无从给起。");
      return pack(res, 0, "末帧像犯规。往前翻，防守队员的脚是空的。");
    },
  };

  const advantageCall = {
    id: "gap",
    clock: "71:40",
    kicker: "反击",
    pitch: "open",
    cameras: CAM.gap,
    actors: gapActors,
    bestCard: null,
    live(res) {
      if (res.decision === "advantage") return "手臂张开。中路的球还在走。";
      if (res.decision === "foul") return "哨声落下。单刀停了。";
      return "没有手势。进攻自己往前走。";
    },
    grade(res) {
      const both = res.seen.left && res.seen.center;
      if (res.decision === "advantage" && both) return pack(res, 10, "左边是拉扯，中路已经单刀。你让球走了。");
      if (res.decision === "advantage") return pack(res, 6, "有利用对了。左右两边没有看全。");
      if (res.decision === "foul") return pack(res, 0, "哨声把单刀停掉了。");
      if (!res.seen.left) return pack(res, 4, "拉人你没看见。继续，算诚实。");
      return pack(res, 2, "拉人在你视线里。球可以走，有利手势没有给。");
    },
  };

  const armCall = {
    id: "arm",
    clock: "90+2",
    kicker: "手臂",
    pitch: "box",
    cameras: CAM.arm,
    actors: armActors,
    bestCard: "yellow",
    live(res) {
      if (res.card === "yellow") return "黄牌。5 号退开半步。";
      if (res.card === "red") return "红牌。两边都围上来。";
      if (res.card === "verbal") return "口头警告。人没有散开。";
      if (res.decision === "advantage") return "你给了有利。禁区里已经没有球。";
      return "没有哨。人还躺在禁区里。";
    },
    grade(res) {
      if (res.decision !== "foul") return pack(res, 0, "混战已经死了。这下该停，牌也该出。");
      if (res.card === "yellow" && res.seen.left) return pack(res, 10, "手臂在左边。黄牌，鲁莽，还不是红牌。");
      if (res.card === "yellow") return pack(res, 6, "黄牌的尺度对。手臂那一下你没亲眼看到。");
      if (res.card === "verbal") return pack(res, 4, "比赛停了，牌只停在口头。");
      if (res.card === "red" && res.seen.right && !res.seen.left) return pack(res, 2, "你右边看见的是倒地的人。红牌是被场面推出来的。");
      return pack(res, 2, "这一下还没到暴力行为。红牌重了。");
    },
  };

  const recklessCall = {
    id: "reckless",
    clock: "90+5",
    kicker: "铲球",
    pitch: "box",
    cameras: CAM.trip,
    actors: tripActors,
    bestCard: "yellow",
    live(res) {
      if (res.card === "yellow") return "黄牌。4 号的铲是冲着人去的。";
      if (res.card === "red") return "红牌。场面顿了一下。";
      if (res.card === "verbal") return "口头警告。人还没从地上起来。";
      if (res.decision === "foul") return "哨响。牌没有举起来。";
      return "没有哨。10 号留在地上。";
    },
    grade(res) {
      if (res.decision !== "foul") return pack(res, 0, "脚从侧面穿过来。这下要停，而且要出牌。");
      if (res.card === "yellow" && res.seen.center) return pack(res, 10, "铲到人，不是球。黄牌，鲁莽。");
      if (res.card === "yellow") return pack(res, 6, "黄牌对。中路的接触你没有看住。");
      if (res.card === "verbal") return pack(res, 4, "停了比赛，牌太轻。");
      return pack(res, 3, "红牌重了。这一下还不是危及安全的暴力行为。");
    },
  };

  const LEVELS = [
    {
      id: 1,
      name: "看清楚",
      pass: 20,
      lookMs: 6800,
      callMs: 5600,
      plain: true,
      loopMs: 4200,
      hs: 0,
      as: 0,
      blurb: "两下都在正面。先看脚有没有碰到人。",
      incidents: [
        ankleCall,
        {
          id: "dive",
          clock: "27:15",
          kicker: "",
          pitch: "open",
          cameras: {
            left: { x: 1000, y: 860, zoom: 1.38 },
            center: { x: 1000, y: 860, zoom: 1.38 },
            right: { x: 1000, y: 860, zoom: 1.38 },
          },
          actors: diveFrontActors,
          bestCard: null,
          live: diveCall.live,
          grade(res) {
            if (res.decision === "play") return pack(res, 10, "脚没有到。人是自己倒下去的。");
            return pack(res, 0, "没有接触。这一下不该吹。");
          },
        },
      ],
    },
    {
      id: 2,
      name: "放还是停",
      blurb: "有犯规，也要看球还在不在更好的位置。",
      pass: 18,
      lookMs: 5400,
      callMs: 4000,
      hs: 1,
      as: 1,
      incidents: [
        Object.assign({}, foulCall, { clock: "63:10" }),
        advantageCall,
        Object.assign({}, diveCall, { clock: "77:05" }),
      ],
    },
    {
      id: 3,
      name: "牌的尺度",
      blurb: "先决定吹不吹，再决定牌有多重。",
      pass: 18,
      lookMs: 4600,
      callMs: 3200,
      hs: 2,
      as: 2,
      incidents: [
        Object.assign({}, advantageCall, { clock: "88:20" }),
        armCall,
        recklessCall,
      ],
    },
  ];

  const STAMPS = {
    foul: { en: "FOUL", zh: "吹停", tone: "", sound: "whistle", shake: true, flash: "" },
    advantage: { en: "ADVANTAGE", zh: "有利", tone: "", sound: "advantage", shake: false, flash: "" },
    play: { en: "PLAY ON", zh: "继续", tone: "quiet", sound: "tick", shake: false, flash: false },
    late: { en: "PLAY ON", zh: "没有鸣哨", tone: "quiet", sound: "tick", shake: false, flash: false },
    verbal: { en: "WARNING", zh: "口头警告", tone: "", sound: "tick", shake: false, flash: "" },
    yellow: { en: "YELLOW", zh: "黄牌", tone: "cardy", sound: "card", shake: true, flash: "cardy" },
    red: { en: "RED", zh: "红牌", tone: "bad", sound: "card", shake: true, flash: "bad" },
  };

  const state = {
    phase: "intro",
    level: 0,
    index: 0,
    camera: "center",
    seen: { left: false, center: true, right: false },
    frame: FRAME_N - 1,
    studied: [],
    since: 0,
    until: 0,
    phaseTotal: 1,
    locked: false,
    pending: null,
    committed: false,
    results: [],
    sheet: [],
    levelScore: null,
    line: "",
    pulse: 0,
  };

  let last = 0;

  function level() { return LEVELS[state.level]; }
  function current() { return level().incidents[state.index]; }
  function isPlain() { return !!level().plain; }

  function beginPhase(phase, ms) {
    state.phase = phase;
    state.since = performance.now();
    state.phaseTotal = ms;
    state.until = state.since + ms;
    document.body.dataset.phase = phase;
  }

  function makeGrain() {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const g = c.getContext("2d");
    const img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 190 + Math.random() * 65;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 50;
    }
    g.putImageData(img, 0, 0);
    $("grain").style.backgroundImage = `url(${c.toDataURL("image/png")})`;
  }

  function fit() {
    const stage = $("stage");
    const view = $("view");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const bw = Math.max(1, Math.round(w * dpr));
    const bh = Math.max(1, Math.round(h * dpr));
    if (view.width !== bw || view.height !== bh) {
      view.width = bw;
      view.height = bh;
    }
    return { w, h, dpr };
  }

  function visor(big) {
    const btn = (side, key, zh) => {
      const on = state.camera === side ? "true" : "false";
      return `<button type="button" data-act="${side}" data-look="${side}" aria-pressed="${on}"><b>${zh}</b><kbd>${key}</kbd></button>`;
    };
    return `<div class="visor ${big ? "big" : ""}">${btn("left", "A", "左")}${btn("center", "W", "中")}${btn("right", "D", "右")}</div>`;
  }

  function callButtons() {
    return `<div class="calls">
      <button type="button" data-act="foul"><kbd>空格</kbd><span class="en">FOUL</span><span class="zh">吹停</span></button>
      <button type="button" data-act="advantage"><kbd>F</kbd><span class="en">ADVANTAGE</span><span class="zh">有利</span></button>
      <button type="button" data-act="play"><kbd>C</kbd><span class="en">PLAY ON</span><span class="zh">继续</span></button>
    </div>`;
  }

  function cardButtons() {
    return `<div class="cards">
      <button type="button" class="verbal" data-act="verbal"><b>WARNING</b><span>口头</span><kbd>1</kbd></button>
      <button type="button" class="yellow" data-act="yellow"><b>YELLOW</b><span>黄牌</span><kbd>2</kbd></button>
      <button type="button" class="red" data-act="red"><b>RED</b><span>红牌</span><kbd>3</kbd></button>
    </div>`;
  }

  function scrubHTML() {
    const pips = Array.from({ length: FRAME_N }, (_, i) => `<i data-pip="${i}"></i>`).join("");
    const hint = current().tell != null ? "末帧会骗人" : "可回看";
    return `<div class="scrub">
      <button type="button" data-act="prev">Q</button>
      <div class="scrub-mid"><span>${hint}</span><div class="pips">${pips}</div></div>
      <button type="button" data-act="next">E</button>
    </div>`;
  }

  const COLD_MS = 1800;
  const COLD_HIT = 0.48;

  function topHTML() {
    if (state.phase === "cold" || state.phase === "coldhold") {
      return `<div class="hud"><div class="scorebug">
        <div class="team mara"><b>MARA</b><em>0</em></div>
        <div class="clock"><strong>14:20</strong></div>
        <div class="team keel"><em>0</em><b>KEEL</b></div>
      </div></div>`;
    }
    if (["intro", "level", "final"].includes(state.phase)) return "";
    const lv = level();
    const inc = current();
    const n = `${state.index + 1} / ${lv.incidents.length}`;
    const kicker = state.phase === "look" ? inc.kicker : "";
    const meta = isPlain() ? "" : `<small>LV ${lv.id}  ${lv.name}  ·  ${n}</small>`;
    const eyes = isPlain() ? "" : `<div class="eyes" aria-hidden="true"><i data-eye="left"></i><i data-eye="center"></i><i data-eye="right"></i></div>`;
    const kick = isPlain() ? "" : `<div id="kicker" class="${kicker ? "go" : ""}">${kicker}</div>`;
    return `<div class="hud"><div class="scorebug">
      <div class="team mara"><b>MARA</b><em>${lv.hs}</em></div>
      <div class="clock">${meta}<strong>${inc.clock}</strong></div>
      <div class="team keel"><em>${lv.as}</em><b>KEEL</b></div>
      ${kick}
      ${eyes}
    </div></div>`;
  }

  function dockHTML() {
    if (state.phase === "beat") {
      return `<div class="hud beat"><p>${esc(state.line || "")}</p><span>空格跳过</span></div>`;
    }
    if (!["look", "call", "card"].includes(state.phase)) return "";
    if (isPlain() && state.phase === "call") {
      return `<div class="hud"><div class="actions call plain"><div class="calls two">
        <button type="button" data-act="foul"><kbd>空格</kbd><span class="en">FOUL</span><span class="zh">吹停</span></button>
        <button type="button" data-act="play"><kbd>C</kbd><span class="en">PLAY ON</span><span class="zh">继续</span></button>
      </div></div></div>`;
    }
    const label = state.phase === "look" ? "观察" : state.phase === "card" ? "出牌" : "判罚";
    let actions = "";
    if (state.phase === "look") actions = `<div class="actions look">${visor(true)}</div>`;
    else if (state.phase === "call") actions = `${scrubHTML()}<div class="actions call">${visor(false)}${callButtons()}</div>`;
    else actions = `<div class="actions card">${cardButtons()}</div>`;
    return `<div class="hud">
      <div class="phase-row"><b>${label}</b><span id="secs">0.0</span></div>
      <div class="timer" id="timer"><i id="bar"></i></div>
      ${actions}
    </div>`;
  }

  function introHTML() {
    const scrim = state.coldFrame ? "scrim intro after" : "scrim intro";
    return `<div class="${scrim}"></div><div class="poster boot">
      <p class="eyebrow">NIGHT MATCH</p>
      <h1><span>THE</span>WHISTLE</h1>
      <p class="lede">哨响。比赛停在这一下。</p>
      <button type="button" class="start" data-act="start">开始</button>
    </div>`;
  }

  function chipOf(res) {
    if (res.card === "yellow") return "YELLOW";
    if (res.card === "red") return "RED";
    if (res.card === "verbal") return "WARNING";
    if (res.late && res.decision === "play") return "NO CALL";
    if (res.decision === "foul") return "FOUL";
    if (res.decision === "advantage") return "ADVANTAGE";
    return "PLAY ON";
  }

  function rowsHTML(results, incidents) {
    return results.map((res, i) => {
      const inc = incidents[i];
      const tone = res.points >= 8 ? "c" : res.points <= 3 ? "r" : "";
      return `<article class="row">
        <div class="meta"><b>${inc.clock}</b><span>${esc(inc.kicker)}</span></div>
        <div class="chip ${tone}">${res.points}/10</div>
        <p><b class="callname">${chipOf(res)}</b>${esc(res.note || "")}</p>
      </article>`;
    }).join("");
  }

  function levelHTML() {
    const lv = level();
    const score = state.levelScore;
    const passed = score.pass;
    return `<div class="scrim end"></div><div class="end-grid">
      <div>
        <p class="eyebrow">LEVEL 0${lv.id} · ${esc(lv.name)}</p>
        <p class="tally ${passed ? "" : "bad"}">${score.sum}<span> / ${score.max}</span></p>
        <p class="style-zh">${passed ? "过关" : "未过线"}</p>
        <p class="tag">${esc(lv.blurb)}</p>
        <p class="passline">过关线 ${lv.pass}</p>
        ${passed
          ? `<button type="button" class="start" data-act="nextlevel">下一关</button>`
          : `<button type="button" class="start" data-act="retry">再试这一关</button>`}
      </div>
      <div class="log">${rowsHTML(state.results, lv.incidents)}</div>
    </div>`;
  }

  function finalHTML() {
    const sum = state.sheet.reduce((s, g) => s + g.sum, 0);
    const max = state.sheet.reduce((s, g) => s + g.max, 0);
    const pct = max ? sum / max : 0;
    const word = pct >= 0.9 ? "SHARP" : pct >= 0.75 ? "SOLID" : "PASS";
    const zh = pct >= 0.9 ? "读势准" : pct >= 0.75 ? "站得住" : "过关";
    const rows = state.sheet.map((g) => `<article class="row">
      <div class="meta"><b>LV ${g.id}</b><span>${esc(g.name)}</span></div>
      <div class="chip c">${g.sum}/${g.max}</div>
      <p>${esc(g.blurb || "")}</p>
    </article>`).join("");
    return `<div class="scrim end"></div><div class="end-grid">
      <div>
        <p class="eyebrow">THREE MATCHES</p>
        <h2 class="style-en hot">${word}</h2>
        <p class="style-zh">${zh}</p>
        <p class="tally">${sum}<span> / ${max}</span></p>
        <p class="tag">三场的关键判罚加在一起。</p>
        <button type="button" class="start" data-act="restart">再闯一次</button>
      </div>
      <div class="log">${rows}</div>
    </div>`;
  }

  function renderChrome() {
    $("top").innerHTML = topHTML();
    $("dock").innerHTML = dockHTML();
    if (state.phase === "intro") $("overlay").innerHTML = introHTML();
    else if (state.phase === "level") $("overlay").innerHTML = levelHTML();
    else if (state.phase === "final") $("overlay").innerHTML = finalHTML();
    else $("overlay").innerHTML = "";
    paintEyes();
    paintPips();
  }

  function paintEyes() {
    ["left", "center", "right"].forEach((side) => {
      const el = document.querySelector(`#top [data-eye="${side}"]`);
      if (!el) return;
      el.classList.toggle("on", state.camera === side);
      el.classList.toggle("seen", !!state.seen[side]);
    });
    document.querySelectorAll("#dock [data-look]").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.look === state.camera ? "true" : "false");
    });
  }

  function paintPips() {
    document.querySelectorAll(".pips i").forEach((el) => {
      const i = Number(el.dataset.pip);
      el.classList.toggle("on", i === state.frame);
      el.classList.toggle("seen", state.studied.includes(i) && i !== state.frame);
    });
  }

  function paintTimer(now) {
    if (!["look", "call", "card"].includes(state.phase)) return;
    const bar = $("bar");
    const secs = $("secs");
    if (!bar) return;
    const left = Math.max(0, state.until - now);
    const ratio = state.phaseTotal ? left / state.phaseTotal : 0;
    bar.style.transform = `scaleX(${ratio})`;
    if (secs) secs.textContent = (left / 1000).toFixed(1);
    const timer = $("timer");
    if (timer) timer.classList.toggle("urgent", ratio < 0.28 && ratio > 0);
  }

  function look(side) {
    if (!state.seen) return;
    if (state.camera === side) {
      state.seen[side] = true;
      return;
    }
    const order = { left: 0, center: 1, right: 2 };
    const dir = order[side] > order[state.camera] ? "r" : "l";
    state.camera = side;
    state.seen[side] = true;
    const stage = $("stage");
    stage.classList.remove("whip-l", "whip-r");
    void stage.offsetWidth;
    stage.classList.add(dir === "l" ? "whip-l" : "whip-r");
    AudioBus.tick();
    paintEyes();
  }

  function scrub(dir) {
    if (isPlain() || state.phase !== "call") return;
    const next = clamp(state.frame + dir, 0, FRAME_N - 1);
    if (next === state.frame) return;
    state.frame = next;
    if (!state.studied.includes(next)) state.studied.push(next);
    paintPips();
    AudioBus.tick();
  }

  function shake() {
    const stage = $("stage");
    stage.classList.remove("shake");
    void stage.offsetWidth;
    stage.classList.add("shake");
  }

  function flash(kind) {
    const el = $("flash");
    el.className = kind || "";
    void el.offsetWidth;
    el.classList.add("go");
  }

  function playSound(name) {
    if (name === "whistle") AudioBus.whistle();
    else if (name === "advantage") AudioBus.advantage();
    else if (name === "card") AudioBus.thud();
    else AudioBus.tick();
  }

  function commitPending() {
    if (state.committed || !state.pending) return;
    const graded = current().grade(state.pending);
    state.results.push(Object.assign({
      id: current().id,
      points: graded.points,
      note: graded.note,
    }, state.pending));
    state.committed = true;
  }

  function showStamp(key) {
    const info = STAMPS[key];
    commitPending();
    beginPhase("stamp", STAMP_MS);
    const stamp = $("stamp");
    const long = info.en.replace(/\s/g, "").length > 5;
    stamp.hidden = false;
    stamp.className = `${info.tone} ${long ? "long" : ""}`;
    stamp.innerHTML = `<div class="mark"><div class="en">${info.en}</div><div class="zh">${info.zh}</div></div>`;
    if (info.shake) shake();
    if (info.flash !== false) flash(info.flash || "");
    playSound(info.sound);
    state.pulse = 1;
    renderChrome();
  }

  function enterBeat() {
    $("stamp").hidden = true;
    beginPhase("beat", BEAT_MS);
    renderChrome();
  }

  function enterCall() {
    state.locked = false;
    state.frame = FRAME_N - 1;
    state.studied = [FRAME_N - 1];
    beginPhase("call", level().callMs);
    renderChrome();
    AudioBus.tick();
  }

  function enterCard() {
    state.locked = false;
    beginPhase("card", CARD_MS);
    AudioBus.whistle();
    state.pulse = 1;
    shake();
    flash("");
    renderChrome();
  }

  function choose(decision) {
    if (state.phase !== "call" || state.locked) return;
    if (isPlain() && decision === "advantage") return;
    state.locked = true;
    if (isPlain()) {
      const ms = level().loopMs;
      state.holdT = ((performance.now() - state.since) % ms) / ms;
    }
    const late = decision === "late";
    state.pending = {
      decision: late ? "play" : decision,
      late,
      seen: { left: state.seen.left, center: state.seen.center, right: state.seen.right },
      studied: state.studied.slice(),
      card: null,
      cardLate: false,
    };
    const inc = current();
    if (inc.bestCard && state.pending.decision === "foul") {
      enterCard();
      return;
    }
    state.line = inc.live(state.pending);
    showStamp(late ? "late" : state.pending.decision);
  }

  function chooseCard(card, fromTimeout) {
    if (state.phase !== "card" || state.locked) return;
    state.locked = true;
    state.pending.card = card;
    state.pending.cardLate = !!fromTimeout;
    state.line = current().live(state.pending);
    showStamp(card);
  }

  function beginOpen() {
    state.phase = "call";
    state.since = performance.now();
    state.phaseTotal = level().loopMs;
    state.until = 0;
    document.body.dataset.phase = "call";
  }

  function beginIncident() {
    state.camera = "center";
    state.seen = { left: false, center: true, right: false };
    state.frame = 0;
    state.studied = [];
    state.holdT = null;
    state.locked = false;
    state.pending = null;
    state.committed = false;
    state.line = "";
    $("stamp").hidden = true;
    if (isPlain()) beginOpen();
    else beginPhase("look", level().lookMs);
    renderChrome();
  }

  function showLevelEnd() {
    const lv = level();
    const sum = state.results.reduce((s, r) => s + r.points, 0);
    const max = state.results.length * 10;
    const pass = sum >= lv.pass;
    state.levelScore = { sum, max, pass };
    state.sheet.push({
      id: lv.id,
      name: lv.name,
      blurb: lv.blurb,
      sum,
      max,
      pass,
    });
    $("stamp").hidden = true;
    if (pass && state.level === LEVELS.length - 1) {
      showFinal();
      return;
    }
    state.phase = "level";
    state.until = 0;
    document.body.dataset.phase = "level";
    renderChrome();
  }

  function showFinal() {
    state.phase = "final";
    state.until = 0;
    document.body.dataset.phase = "final";
    $("stamp").hidden = true;
    renderChrome();
  }

  function nextIncident() {
    state.index += 1;
    if (state.index >= level().incidents.length) showLevelEnd();
    else beginIncident();
  }

  function nextLevel() {
    if (!state.levelScore || !state.levelScore.pass) return;
    if (state.level >= LEVELS.length - 1) return showFinal();
    state.level += 1;
    state.index = 0;
    state.results = [];
    beginIncident();
  }

  function retry() {
    state.sheet.pop();
    state.index = 0;
    state.results = [];
    beginIncident();
  }

  function showCold() {
    state.phase = "cold";
    state.since = performance.now();
    state.phaseTotal = COLD_MS;
    state.until = state.since + COLD_MS * COLD_HIT;
    state.coldFrame = false;
    state.holdT = null;
    state.level = 0;
    state.index = 0;
    state.results = [];
    state.sheet = [];
    document.body.dataset.phase = "cold";
    $("stamp").hidden = true;
    $("overlay").innerHTML = "";
    renderChrome();
  }

  function coldHit() {
    state.phase = "coldhold";
    state.holdT = 0.7;
    state.pulse = 1;
    state.since = performance.now();
    state.until = state.since + 780;
    document.body.dataset.phase = "coldhold";
    const stamp = $("stamp");
    stamp.hidden = false;
    stamp.className = "cold";
    stamp.innerHTML = `<div class="mark"><div class="en">FOUL</div><div class="zh">吹停</div></div>`;
    shake();
    flash("bad");
    AudioBus.whistle();
    renderChrome();
  }

  function showIntro() {
    state.phase = "intro";
    state.until = 0;
    state.level = 0;
    state.index = 0;
    state.results = [];
    state.sheet = [];
    state.coldFrame = true;
    state.holdT = 0.7;
    document.body.dataset.phase = "intro";
    $("stamp").hidden = true;
    renderChrome();
  }

  function start() {
    AudioBus.ensure();
    state.level = 0;
    state.index = 0;
    state.results = [];
    state.sheet = [];
    beginIncident();
  }

  function onAct(name) {
    if (name === "mute") {
      const on = AudioBus.toggle();
      const b = $("mute");
      b.textContent = on ? "声" : "静";
      b.classList.toggle("off", !on);
      b.setAttribute("aria-label", on ? "关闭声音" : "打开声音");
      return;
    }
    if (name === "start" && state.phase === "intro") return start();
    if (name === "restart") return start();
    if (name === "retry" && state.phase === "level") return retry();
    if (name === "nextlevel" && state.phase === "level") return nextLevel();
    if (name === "skip" && state.phase === "beat") return nextIncident();
    if (name === "prev") return scrub(-1);
    if (name === "next") return scrub(1);
    if (!isPlain() && (name === "left" || name === "center" || name === "right") && (state.phase === "look" || state.phase === "call")) {
      return look(name);
    }
    if (isPlain() && name === "advantage") return;
    if ((name === "foul" || name === "advantage" || name === "play") && state.phase === "call") return choose(name);
    if ((name === "verbal" || name === "yellow" || name === "red") && state.phase === "card") return chooseCard(name, false);
  }

  function keyAct(e) {
    if (e.code === "Space") return "space";
    const map = {
      a: "left",
      arrowleft: "left",
      d: "right",
      arrowright: "right",
      w: "center",
      arrowup: "center",
      s: "center",
      q: "prev",
      e: "next",
      f: "advantage",
      c: "play",
      "1": "verbal",
      v: "verbal",
      "2": "yellow",
      y: "yellow",
      "3": "red",
      r: "red",
      enter: "start",
      m: "mute",
    };
    return map[e.key.toLowerCase()] || null;
  }

  function onKey(e) {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    const act = keyAct(e);
    if (!act) return;
    e.preventDefault();
    if (act === "space") {
      if (state.phase === "intro") onAct("start");
      else if (state.phase === "call") onAct("foul");
      else if (state.phase === "beat") onAct("skip");
      else if (state.phase === "level") onAct(state.levelScore && state.levelScore.pass ? "nextlevel" : "retry");
      else if (state.phase === "final") onAct("restart");
      return;
    }
    if (act === "start") {
      if (state.phase === "intro") onAct("start");
      else if (state.phase === "final") onAct("restart");
      else if (state.phase === "level") onAct(state.levelScore && state.levelScore.pass ? "nextlevel" : "retry");
      return;
    }
    onAct(act);
  }

  function step(now) {
    if (!state.until || now < state.until) return;
    if (state.phase === "cold") return coldHit();
    if (state.phase === "coldhold") return showIntro();
    if (state.phase === "look") enterCall();
    else if (state.phase === "call") choose("late");
    else if (state.phase === "card") chooseCard("verbal", true);
    else if (state.phase === "stamp") enterBeat();
    else if (state.phase === "beat") nextIncident();
  }

  function playT(now) {
    if (isPlain()) {
      if (state.phase === "call") return ((now - state.since) % level().loopMs) / level().loopMs;
      if (state.holdT != null) return state.holdT;
    }
    if (state.phase === "look") return clamp((now - state.since) / state.phaseTotal, 0, 1);
    return state.frame / (FRAME_N - 1);
  }

  function buildFrame(now, size) {
    let cam;
    let actors = [];
    let pitch = "box";
    let face = false;
    if (state.phase === "cold" || state.phase === "coldhold" || (state.phase === "intro" && state.coldFrame)) {
      const t = state.phase === "cold" ? clamp((now - state.since) / COLD_MS, 0, 1) : 0.7;
      const zoom = state.phase === "cold" ? lerp(1.16, 1.52, smooth(0.12, COLD_HIT, t)) : 1.46;
      return {
        dpr: size.dpr,
        cam: { x: 1000, y: 860, zoom },
        actors: ankleActors(t),
        pitch: "box",
        face: false,
        pulse: state.pulse,
        vignette: state.phase === "intro" ? 0.34 : 0.42,
      };
    }
    if (state.phase === "intro" || state.phase === "level" || state.phase === "final") {
      cam = { x: 860, y: 720, zoom: 1.2 };
      actors = idleActors(now);
    } else {
      const inc = current();
      cam = inc.cameras[state.camera];
      actors = inc.actors(playT(now));
      pitch = inc.pitch;
      const showFace = state.phase === "card" || ((state.phase === "stamp" || state.phase === "beat") && state.pending && state.pending.card);
      if (showFace) face = true;
    }
    return {
      dpr: size.dpr,
      cam,
      actors,
      pitch,
      face,
      pulse: state.pulse,
      vignette: state.phase === "intro" ? 0.28 : 0.4,
    };
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    state.pulse = Math.max(0, state.pulse - dt * 0.85);
    step(now);
    paintTimer(now);
    paintEyes();
    paintPips();
    const size = fit();
    const ctx = $("view").getContext("2d");
    Pitch.draw(ctx, size.w, size.h, buildFrame(now, size));
    requestAnimationFrame(loop);
  }

  document.addEventListener("keydown", onKey);
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    onAct(btn.dataset.act);
  });
  window.addEventListener("resize", fit);

  makeGrain();
  showCold();
  requestAnimationFrame(loop);
})();
