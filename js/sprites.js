(function () {
  const COLS = 6;
  const FRAME = 32;
  const UNIT = 4.8;
  const SRC = [
    [0xd9, 0x57, 0x63],
    [0xac, 0x32, 0x32],
    [0x5f, 0xcd, 0xe4],
    [0x63, 0x9b, 0xff],
    [0x32, 0x2b, 0x28],
    [0x22, 0x1c, 0x1a],
  ];
  const KITS = {
    mara: { colors: ["#f7f1e6", "#e4d8c8", "#3c4654", "#2a313c", "#f4efe6", "#d5cdc0"], outline: "#5c564e" },
    keel: { colors: ["#8fb4dc", "#5d86b0", "#f4efe6", "#d5cdc0", "#6e94c4", "#3e6494"], outline: "#1c3358" },
    keep: { colors: ["#8fd0c4", "#5e9a90", "#0e3330", "#164742", "#3e8f86", "#1f5c56"], outline: "#0e3330" },
    ar: { colors: ["#8fd0c4", "#5e9a90", "#3a414b", "#22272e", "#8aa0b4", "#5b6778"], outline: "#22272e" },
    ref: { colors: ["#3a414c", "#2c3138", "#24282e", "#1a1e24", "#4a5160", "#2c3138"], outline: "#14181e" },
  };

  const sheets = {};
  let playerImg = null;
  let ballImg = null;
  let shadowImg = null;
  let ballShadowImg = null;
  let ready = false;

  function hex(s) {
    return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  }

  function tint(img, kit) {
    const colors = kit.colors;
    const outline = hex(kit.outline);
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const data = g.getImageData(0, 0, c.width, c.height);
    const d = data.data;
    const map = new Map();
    SRC.forEach((rgb, i) => {
      map.set((rgb[0] << 16) | (rgb[1] << 8) | rgb[2], hex(colors[i]));
    });
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 8) continue;
      const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
      const rep = key === 0x000008 || key === 0x000009 ? outline : map.get(key);
      if (!rep) continue;
      d[i] = rep[0];
      d[i + 1] = rep[1];
      d[i + 2] = rep[2];
    }
    g.putImageData(data, 0, 0);
    return c;
  }

  function load(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });
  }

  Promise.all([
    load("assets/soccer-player.png"),
    load("assets/soccer-ball.png"),
    load("assets/player-shadow.png"),
    load("assets/ball-shadow.png"),
  ]).then((imgs) => {
    playerImg = imgs[0];
    ballImg = imgs[1];
    shadowImg = imgs[2];
    ballShadowImg = imgs[3];
    Object.keys(KITS).forEach((name) => {
      sheets[name] = tint(playerImg, KITS[name]);
    });
    ready = true;
  });

  function framesFor(p) {
    const slide = p.slide || 0;
    const pitch = p.pitch || 0;
    const blend = p.blend || 0;
    const pose = blend > 0.42 && p.poseTo ? p.poseTo : p.pose;
    if (slide > 0.45 || pose === "slide") return [30];
    if (pitch > 0.62 || pose === "down" || pose === "swept" || pose === "fall") return [72];
    if (pitch > 0.18 || pose === "trip" || pose === "sell") return [54, 55];
    if (pose === "strike") return [49, 50, 51];
    if (pose === "jog") return [12, 13, 14, 15, 16, 17];
    if (pose === "run" || pose === "dribble") return [6, 7, 8, 9, 10, 11];
    return [0, 1, 2, 3];
  }

  function frameIndex(frames, phase) {
    const n = frames.length;
    const step = Math.floor(Math.abs(phase || 0) * (n > 2 ? 8 : 4));
    return frames[((step % n) + n) % n];
  }

  function blit(ctx, img, frame, dx, dy, dw, dh) {
    const col = frame % COLS;
    const row = Math.floor(frame / COLS);
    ctx.drawImage(img, col * FRAME, row * FRAME, FRAME, FRAME, dx, dy, dw, dh);
  }

  function player(ctx, p) {
    if (!ready) return;
    const facing = p.facing || 1;
    const sc = (p.s || 1) * UNIT;
    const sheet = sheets[p.kit] || sheets.mara;
    const frame = frameIndex(framesFor(p), p.phaseTo != null && (p.blend || 0) > 0.42 ? p.phaseTo : p.phase);
    const smooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(facing * sc, sc);
    if (shadowImg) ctx.drawImage(shadowImg, -14, -6, 28, 10);
    blit(ctx, sheet, frame, -16, -32, 32, 32);
    if ((p.card || 0) > 0.2) {
      const lift = Math.max(0, Math.min(1, p.card));
      const y = -22 - lift * 6;
      ctx.fillStyle = "#d0122a";
      ctx.fillRect(5, y, 6, 10);
      ctx.fillStyle = "#fff6ea";
      ctx.fillRect(6, y + 1, 4, 1);
    }
    if (p.band) {
      ctx.fillStyle = "#5ef2e0";
      ctx.fillRect(-2, -18, 4, 2);
    }
    ctx.restore();
    if (p.num && sc >= 3.2) {
      ctx.save();
      ctx.font = "700 16px Oswald, Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "rgba(244,247,251,0.88)";
      ctx.fillText(String(p.num), p.x, p.y - 32 * sc - 2);
      ctx.restore();
    }
    if (p.flag) {
      ctx.save();
      ctx.translate(p.x + facing * 18 * (p.s || 1), p.y - 20 * sc);
      ctx.fillStyle = "#f4f7fb";
      ctx.fillRect(0, -16, 2, 22);
      ctx.fillStyle = p.flag === "down" ? "#f4f7fb" : "#5ef2e0";
      ctx.fillRect(2, -16, 12, 8);
      ctx.restore();
    }
    ctx.imageSmoothingEnabled = smooth;
  }

  function ball(ctx, a) {
    if (!ready || !ballImg) return false;
    const sc = 3.4 * (a.s || 1);
    const frame = Math.floor(Math.abs((a.x || 0) + (a.y || 0)) / 18) % 4;
    const smooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    const by = a.y - (a.z || 0);
    if (ballShadowImg) ctx.drawImage(ballShadowImg, a.x - 10 * (a.s || 1), a.y - 4, 20 * (a.s || 1), 8 * (a.s || 1));
    ctx.drawImage(ballImg, frame * 10, 0, 10, 10, a.x - 5 * sc, by - 10 * sc, 10 * sc, 10 * sc);
    ctx.imageSmoothingEnabled = smooth;
    return true;
  }

  window.Sprites = {
    get ready() { return ready; },
    player,
    ball,
  };
})();
