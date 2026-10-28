(function () {
  const KITS = {
    mara: { shirt: "#f4f7fb", short: "#f4f7fb", sock: "#f4f7fb", num: "#121820", trim: "#c5ced8" },
    keel: { shirt: "#2c4e7a", short: "#1b314e", sock: "#2c4e7a", num: "#7ff6ea", trim: "#5ef2e0" },
    keep: { shirt: "#0f3d3a", short: "#0f3d3a", sock: "#f4f7fb", num: "#f4f7fb", trim: "#5ef2e0" },
    ar: { shirt: "#14181f", short: "#101318", sock: "#14181f", num: "#5ef2e0", trim: "#5ef2e0" },
  };

  function line(ctx, x1, y1, x2, y2, w, color) {
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function drawLimb(ctx, x, y, hipDeg, kneeDeg, len1, w1, col1, len2, w2, col2, boot) {
    const a1 = (hipDeg * Math.PI) / 180;
    const kx = x + Math.sin(a1) * len1;
    const ky = y + Math.cos(a1) * len1;
    const a2 = ((hipDeg + kneeDeg) * Math.PI) / 180;
    const ex = kx + Math.sin(a2) * len2;
    const ey = ky + Math.cos(a2) * len2;
    line(ctx, x, y, kx, ky, w1 + 5, "#081018");
    line(ctx, x, y, kx, ky, w1, col1);
    line(ctx, kx, ky, ex, ey, w2 + 4, "#081018");
    line(ctx, kx, ky, ex, ey, w2, col2);
    if (boot) {
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(a2);
      ctx.fillStyle = "#0b0e12";
      ctx.beginPath();
      ctx.ellipse(8, 0, 13, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    return { x: ex, y: ey };
  }

  function torsoPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(-26, -64);
    ctx.quadraticCurveTo(0, -78, 26, -64);
    ctx.lineTo(20, -4);
    ctx.quadraticCurveTo(0, 8, -20, -4);
    ctx.closePath();
  }

  function drawHead(ctx) {
    ctx.beginPath();
    ctx.arc(-3, -96, 18, 0, Math.PI * 2);
    ctx.fillStyle = "#5ef2e0";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -92, 18, 0, Math.PI * 2);
    ctx.fillStyle = "#e2ac86";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#081018";
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, -102, 15, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#141820";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(15, -90, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#e2ac86";
    ctx.fill();
    ctx.fillStyle = "#141820";
    ctx.beginPath();
    ctx.arc(8, -92, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFlag(ctx) {
    ctx.save();
    ctx.translate(22, -8);
    ctx.fillStyle = "#081018";
    ctx.fillRect(-2, -8, 4, 54);
    ctx.fillStyle = "#f4f7fb";
    ctx.fillRect(2, -6, 22, 16);
    ctx.fillStyle = "#5ef2e0";
    ctx.fillRect(2, -6, 11, 8);
    ctx.fillRect(13, 2, 11, 8);
    ctx.restore();
  }

  function mixPose(a, b, t) {
    const u = Math.max(0, Math.min(1, t || 0));
    const n = (x, y) => x + (y - x) * u;
    const leg = (p, q) => ({ hip: n(p.hip, q.hip), knee: n(p.knee, q.knee) });
    const arm = (p, q) => ({ up: n(p.up, q.up), fore: n(p.fore, q.fore) });
    return {
      body: n(a.body, b.body),
      drop: n(a.drop, b.drop),
      legL: leg(a.legL, b.legL),
      legR: leg(a.legR, b.legR),
      armL: arm(a.armL, b.armL),
      armR: arm(a.armR, b.armR),
    };
  }

  function poseOf(name, phase) {
    const s = Math.sin(phase * Math.PI * 2);
    const pack = (body, drop, lHip, lKnee, rHip, rKnee, la, lf, ra, rf) => ({
      body,
      drop,
      legL: { hip: lHip, knee: lKnee },
      legR: { hip: rHip, knee: rKnee },
      armL: { up: la, fore: lf },
      armR: { up: ra, fore: rf },
    });
    switch (name) {
      case "jog":
        return pack(0.04, 0, 16 * s, 14, -16 * s, 14, -16 * s, 8, 16 * s, 8);
      case "run":
      case "dribble":
        return pack(0.1, 0, 36 * s, 16 + 20 * Math.max(-s, 0), -36 * s, 16 + 20 * Math.max(s, 0), -32 * s, 14, 32 * s, 12);
      case "slide":
        return pack(-1.05, 28, -24, 36, 62, 8, -70, 16, 86, -8);
      case "strike":
        return pack(0.62, 40, -36, 62, 74, 8, -24, 18, 36, 8);
      case "brake":
        return pack(-0.18, 8, 18, 16, -30, 28, -36, 12, 22, 10);
      case "trip": {
        const u = Math.max(0, Math.min(1, phase));
        const lean = 0.16 + 1.05 * u;
        const plant = (lean * 180) / Math.PI;
        return pack(lean, 12 + 14 * u, plant - 16, 18, plant + 6, 20, -22, 12, 30, 8);
      }
      case "sell": {
        const u = Math.max(0, Math.min(1, phase));
        const lean = -0.1 - 1.02 * u;
        const plant = (lean * 180) / Math.PI;
        return pack(lean, 10 + 18 * u, plant - 6, 16, plant + 8, 18, -96, 10, 102, -8);
      }
      case "fall":
        return pack(-1.2 * Math.max(0, Math.min(1, phase)), 16 * phase, 18, 12, -8, 48, -150, 20, -96, 16);
      case "down":
        return pack(-1.48, 34, 36, 46, 18, 40, -70, 10, 24, 16);
      case "elbow":
        return pack(-0.12, 0, 12, 8, -14, 10, 28, 16, 148, -70);
      case "pull":
        return pack(0.18, 0, 14, 10, -6, 12, 22, 8, 58, -6);
      case "pulled":
        return pack(0.48, 6, 22, 16, -18, 28, 64, 10, -36, 20);
      case "appeal":
        return pack(-0.06, 0, 8, 6, -10, 8, 132, -16, 148, -10);
      case "wall":
        return pack(0.02, 0, 10, 6, -8, 8, -108, 18, 96, 14);
      default:
        return pack(0, 0, 8, 6, -6, 8, 18, 10, -14, 12);
    }
  }

  function drawPlayer(ctx, p) {
    const kit = KITS[p.kit] || KITS.mara;
    const base = poseOf(p.pose, p.phase || 0);
    const pose = p.poseTo ? mixPose(base, poseOf(p.poseTo, p.phaseTo == null ? p.phase || 0 : p.phaseTo), p.blend || 0) : base;
    const sc = p.s || 1;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale((p.facing || 1) * sc, sc);

    ctx.save();
    ctx.scale(1, 0.22);
    ctx.beginPath();
    ctx.ellipse(0, 8, 48, 48, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fill();
    ctx.restore();

    ctx.translate(0, -74 + (pose.drop || 0));
    ctx.rotate(pose.body || 0);

    drawLimb(ctx, -10, 4, pose.legL.hip, pose.legL.knee, 40, 13, kit.short, 34, 8, kit.sock, true);
    drawLimb(ctx, 10, 4, pose.legR.hip, pose.legR.knee, 40, 13, kit.short, 34, 8, kit.sock, true);

    ctx.beginPath();
    ctx.moveTo(-22, -6);
    ctx.lineTo(22, -6);
    ctx.lineTo(16, 24);
    ctx.lineTo(5, 16);
    ctx.lineTo(0, 26);
    ctx.lineTo(-5, 16);
    ctx.lineTo(-16, 24);
    ctx.closePath();
    ctx.fillStyle = kit.short;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#081018";
    ctx.stroke();

    ctx.save();
    ctx.translate(-3, -4);
    torsoPath(ctx);
    ctx.fillStyle = "rgba(94,242,224,0.95)";
    ctx.fill();
    ctx.restore();
    torsoPath(ctx);
    ctx.fillStyle = kit.shirt;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#081018";
    ctx.stroke();

    if (p.num && sc >= 0.72) {
      ctx.font = "700 26px Oswald, Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = kit.num;
      ctx.fillText(String(p.num), 0, -32);
    }

    if (p.band) {
      ctx.fillStyle = "#5ef2e0";
      ctx.fillRect(-28, -46, 10, 8);
    }

    const left = drawLimb(ctx, -18, -50, pose.armL.up, pose.armL.fore, 28, 9, kit.shirt, 22, 7, "#e2ac86", false);
    const right = drawLimb(ctx, 18, -50, pose.armR.up, pose.armR.fore, 28, 9, kit.shirt, 22, 7, "#e2ac86", false);
    [left, right].forEach((hand) => {
      ctx.beginPath();
      ctx.arc(hand.x, hand.y, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = "#e2ac86";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#081018";
      ctx.stroke();
    });

    drawHead(ctx);
    if (p.flag) drawFlag(ctx);
    ctx.restore();
  }

  function drawBall(ctx, a) {
    const r = 14 * (a.s || 1);
    ctx.beginPath();
    ctx.ellipse(a.x, a.y + 4, r * 1.2, r * 0.42, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fill();
    const by = a.y - (a.z || 0) - r;
    ctx.beginPath();
    ctx.arc(a.x, by, r, 0, Math.PI * 2);
    ctx.fillStyle = "#f4f7fb";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#081018";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(a.x - r * 0.15, by - r * 0.72);
    ctx.lineTo(a.x - r * 0.42, by + r * 0.05);
    ctx.moveTo(a.x + r * 0.2, by - r * 0.45);
    ctx.lineTo(a.x + r * 0.05, by + r * 0.5);
    ctx.stroke();
  }

  function drawGoal(ctx, a) {
    const s = a.s || 1;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.scale(s, s);
    ctx.lineCap = "butt";
    ctx.strokeStyle = "rgba(244,247,251,0.28)";
    ctx.lineWidth = 2;
    for (let i = 1; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(-78, -8 - i * 14);
      ctx.lineTo(78, -8 - i * 14);
      ctx.stroke();
    }
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 22, -100);
      ctx.lineTo(i * 16, -8);
      ctx.stroke();
    }
    ctx.strokeStyle = "#f4f7fb";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-88, -4);
    ctx.lineTo(-78, -112);
    ctx.lineTo(78, -112);
    ctx.lineTo(88, -4);
    ctx.stroke();
    ctx.restore();
  }

  function drawDust(ctx, a) {
    const alpha = Math.max(0, Math.min(1, a.a == null ? 1 : a.a));
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(244,247,251,0.62)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-22, -8, 12, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(26, -5, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawImpact(ctx, a) {
    const alpha = Math.max(0, Math.min(1, a.a == null ? 1 : a.a));
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.globalAlpha = alpha;
    for (let i = 0; i < 5; i++) {
      ctx.rotate((Math.PI * 2) / 5);
      ctx.fillStyle = i % 2 ? "#f4f7fb" : "#5ef2e0";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(28, 6);
      ctx.lineTo(10, 16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCloth(ctx, a) {
    ctx.beginPath();
    ctx.moveTo(a.x1, a.y1);
    ctx.quadraticCurveTo((a.x1 + a.x2) / 2, (a.y1 + a.y2) / 2 + 16, a.x2, a.y2);
    ctx.lineCap = "round";
    ctx.strokeStyle = "#081018";
    ctx.lineWidth = 11;
    ctx.stroke();
    ctx.strokeStyle = "#f4f7fb";
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  function drawSpeed(ctx, a) {
    ctx.save();
    ctx.strokeStyle = "rgba(94,242,224,0.9)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (let i = 0; i < 4; i++) {
      const y = a.y - i * 18;
      ctx.beginPath();
      ctx.moveTo(a.x, y);
      ctx.lineTo(a.x - 78 - i * 16, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTower(ctx, x) {
    ctx.fillStyle = "#0a1018";
    ctx.fillRect(x, 40, 28, 200);
    ctx.fillStyle = "#d7fffb";
    for (let i = 0; i < 4; i++) ctx.fillRect(x - 18 + i * 16, 28, 10, 16);
    const glow = ctx.createRadialGradient(x + 14, 36, 8, x + 14, 36, 90);
    glow.addColorStop(0, "rgba(220,255,252,0.9)");
    glow.addColorStop(1, "rgba(220,255,252,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 80, -20, 200, 140);
  }

  function drawEnvironment(ctx, frame) {
    const sky = ctx.createLinearGradient(0, -200, 0, 540);
    sky.addColorStop(0, "#05070c");
    sky.addColorStop(0.55, "#0c1828");
    sky.addColorStop(1, "#17364c");
    ctx.fillStyle = sky;
    ctx.fillRect(-900, -700, 3600, 1400);

    const left = ctx.createRadialGradient(180, 40, 10, 220, 80, 560);
    left.addColorStop(0, "rgba(190,255,248,0.22)");
    left.addColorStop(1, "rgba(190,255,248,0)");
    ctx.fillStyle = left;
    ctx.fillRect(-200, -200, 900, 700);

    drawTower(ctx, 70);
    drawTower(ctx, 1540);

    ctx.fillStyle = "#0c121c";
    ctx.fillRect(-400, 168, 3400, 300);
    const pulse = frame.pulse || 0;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 96; col++) {
        const x = -360 + col * 36 + (row % 2) * 12;
        const y = 198 + row * 34;
        const hot = (col * 5 + row * 3) % 11 === 0;
        const lit = pulse > 0.2 && (col + row) % 4 === 0;
        ctx.fillStyle = hot || lit ? `rgba(94,242,224,${0.35 + pulse * 0.6})` : "rgba(233,241,247,0.16)";
        ctx.fillRect(x, y, 18, 10);
      }
    }
    ctx.fillStyle = "#080b10";
    ctx.fillRect(-400, 140, 3400, 32);

    const boards = ["#f4f7fb", "#5ef2e0", "#f4f7fb", "#16324a", "#f4f7fb", "#5ef2e0"];
    for (let i = 0; i < 24; i++) {
      const x = -400 + i * 150;
      ctx.fillStyle = boards[i % boards.length];
      ctx.fillRect(x, 452, 144, 68);
      if (i % 3 === 1) {
        ctx.fillStyle = "#070a12";
        ctx.fillRect(x + 18, 476, 108, 8);
      } else if (i % 3 === 2) {
        ctx.beginPath();
        ctx.moveTo(x, 520);
        ctx.lineTo(x + 54, 452);
        ctx.lineTo(x + 76, 452);
        ctx.lineTo(x + 22, 520);
        ctx.fillStyle = "rgba(7,10,18,0.88)";
        ctx.fill();
      }
    }

    const grass = ctx.createLinearGradient(0, 520, 0, 1200);
    grass.addColorStop(0, "#0d2622");
    grass.addColorStop(0.4, "#12352f");
    grass.addColorStop(1, "#071412");
    ctx.fillStyle = grass;
    ctx.fillRect(-700, 518, 4000, 800);

    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.16)";
      ctx.beginPath();
      ctx.moveTo(-300 + i * 210, 530);
      ctx.lineTo(-520 + i * 280, 1280);
      ctx.lineTo(-520 + (i + 1) * 280, 1280);
      ctx.lineTo(-300 + (i + 1) * 210, 530);
      ctx.fill();
    }

    ctx.save();
    ctx.strokeStyle = "rgba(244,247,251,0.72)";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 560, 1560, 460);
    if (frame.pitch === "open") {
      ctx.beginPath();
      ctx.moveTo(20, 640);
      ctx.lineTo(1580, 640);
      ctx.stroke();
    } else {
      ctx.strokeRect(620, 590, 620, 300);
      ctx.beginPath();
      ctx.arc(930, 890, 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(244,247,251,0.9)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(930, 650, 120, 0.05 * Math.PI, 0.95 * Math.PI);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFace(ctx) {
    ctx.fillStyle = "#070a12";
    ctx.fillRect(-400, -400, 2400, 1700);

    ctx.fillStyle = "#1b314e";
    ctx.beginPath();
    ctx.moveTo(160, 1040);
    ctx.lineTo(400, 640);
    ctx.lineTo(1200, 640);
    ctx.lineTo(1460, 1040);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#5ef2e0";
    ctx.stroke();

    ctx.font = "700 72px Oswald, Impact, sans-serif";
    ctx.fillStyle = "#7ff6ea";
    ctx.fillText("5", 800, 760);

    ctx.save();
    ctx.translate(800, 400);
    ctx.beginPath();
    ctx.arc(-10, -12, 172, 0, Math.PI * 2);
    ctx.fillStyle = "#5ef2e0";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 172, 0, Math.PI * 2);
    ctx.fillStyle = "#e2ac86";
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#081018";
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-6, -108, 148, 72, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#141820";
    ctx.fill();
    ctx.strokeStyle = "#141820";
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-118, -36);
    ctx.lineTo(-28, -4);
    ctx.moveTo(118, -36);
    ctx.lineTo(28, -4);
    ctx.stroke();
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(-96, 18);
    ctx.lineTo(-36, 28);
    ctx.moveTo(96, 18);
    ctx.lineTo(36, 28);
    ctx.stroke();
    ctx.fillStyle = "#141820";
    ctx.fillRect(-40, 86, 80, 28);
    ctx.restore();
  }

  function drawVignette(ctx, amount) {
    const g = ctx.createRadialGradient(800, 460, 200, 800, 480, 860);
    g.addColorStop(0, "rgba(5,8,14,0)");
    g.addColorStop(1, `rgba(5,8,14,${amount})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1600, 900);
  }

  function depthOf(a) {
    if (a.type === "goal") return a.y - 40;
    if (a.type === "speed") return a.y - 8;
    if (a.type === "cloth") return a.y1 + 24;
    if (a.type === "impact" || a.type === "dust") return a.y + 40;
    return a.y || 0;
  }

  function drawActors(ctx, actors) {
    const list = actors.slice().sort((a, b) => depthOf(a) - depthOf(b));
    list.forEach((a) => {
      if (a.type === "player") drawPlayer(ctx, a);
      else if (a.type === "ball") drawBall(ctx, a);
      else if (a.type === "goal") drawGoal(ctx, a);
      else if (a.type === "impact") drawImpact(ctx, a);
      else if (a.type === "dust") drawDust(ctx, a);
      else if (a.type === "cloth") drawCloth(ctx, a);
      else if (a.type === "speed") drawSpeed(ctx, a);
    });
  }

  function draw(ctx, cssW, cssH, frame) {
    if (!ctx || !cssW || !cssH) return;
    const dpr = frame.dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    const scale = Math.max(cssW / 1600, cssH / 900);
    const ox = (cssW - 1600 * scale) / 2;
    const oy = (cssH - 900 * scale) / 2;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);

    if (frame.face) {
      drawFace(ctx);
    } else {
      const cam = frame.cam || { x: 800, y: 700, zoom: 1.2 };
      ctx.save();
      ctx.translate(800, 500);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);
      drawEnvironment(ctx, frame);
      drawActors(ctx, frame.actors || []);
      ctx.restore();
    }
    drawVignette(ctx, frame.vignette == null ? 0.62 : frame.vignette);
  }

  window.Pitch = { draw };
})();
