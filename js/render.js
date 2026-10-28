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

  const THIGH = 36;
  const SHIN = 34;
  const UPPER = 32;
  const FORE = 24;

  function tip(len, deg) {
    const a = (deg * Math.PI) / 180;
    return { x: Math.sin(a) * len, y: Math.cos(a) * len };
  }

  function pose(lean, hipL, kneeL, hipR, kneeR, shoulderL, shoulderR) {
    return { lean, hipL, kneeL, hipR, kneeR, shoulderL, shoulderR, elbow: 68 };
  }

  function mixPose(a, b, t) {
    const u = Math.max(0, Math.min(1, t || 0));
    const n = (x, y) => x + (y - x) * u;
    return pose(
      n(a.lean, b.lean),
      n(a.hipL, b.hipL),
      n(a.kneeL, b.kneeL),
      n(a.hipR, b.hipR),
      n(a.kneeR, b.kneeR),
      n(a.shoulderL, b.shoulderL),
      n(a.shoulderR, b.shoulderR)
    );
  }

  const RUN_LEG = [
    [0, 48, 20],
    [0.18, 6, 36],
    [0.36, -30, 16],
    [0.55, 40, 108],
    [0.78, 52, 36],
    [1, 48, 20],
  ];
  const RUN_ARM = [
    [0, 58],
    [0.5, -62],
    [1, 58],
  ];

  function sampleCycle(phase, keys) {
    const t = ((phase % 1) + 1) % 1;
    let i = 0;
    while (i < keys.length - 1 && keys[i + 1][0] < t) i += 1;
    const a = keys[i];
    const b = keys[i + 1];
    const span = b[0] - a[0] || 1;
    const u = Math.max(0, Math.min(1, (t - a[0]) / span));
    const s = u * u * (3 - 2 * u);
    const out = [];
    for (let k = 1; k < a.length; k += 1) out.push(a[k] + (b[k] - a[k]) * s);
    return out;
  }

  function gait(phase, lean, legScale, armScale) {
    const left = sampleCycle(phase, RUN_LEG);
    const right = sampleCycle(phase + 0.5, RUN_LEG);
    const armL = sampleCycle(phase + 0.5, RUN_ARM)[0] * armScale;
    const armR = sampleCycle(phase, RUN_ARM)[0] * armScale;
    return pose(
      lean,
      left[0] * legScale,
      12 + (left[1] - 12) * legScale,
      right[0] * legScale,
      12 + (right[1] - 12) * legScale,
      armL,
      armR
    );
  }

  function poseOf(name, phase) {
    switch (name) {
      case "jog":
        return gait(phase, 3, 0.55, 0.6);
      case "run":
      case "dribble":
        return gait(phase, 8, 1, 1);
      case "slide":
      case "strike":
        return pose(12, -18, 96, 70, 14, -22, 18);
      case "brake":
        return pose(-6, 8, 36, 18, 42, -8, 10);
      case "trip": {
        const u = Math.max(0, Math.min(1, phase));
        return pose(10 + 12 * u, 6, 28 + 10 * u, 18, 32 + 8 * u, -8, 12);
      }
      case "sell": {
        const u = Math.max(0, Math.min(1, phase));
        return pose(-8 - 14 * u, 10, 48 + 16 * u, 16, 52 + 14 * u, -16, 8);
      }
      case "fall":
      case "down": {
        const u = name === "down" ? 1 : Math.max(0, Math.min(1, phase));
        return pose(-6 - 16 * u, 8, 40 + 20 * u, 14, 44 + 18 * u, -12, 6);
      }
      case "elbow":
        return pose(4, 4, 16, 8, 18, 6, 28);
      case "pull":
        return pose(6, 4, 14, 8, 16, 4, 36);
      case "pulled":
        return pose(12, 6, 24, 10, 28, 20, -6);
      case "appeal":
        return pose(-4, 4, 12, 6, 14, -28, 24);
      case "wall":
        return pose(2, 4, 12, 6, 14, -8, 10);
      default:
        return pose(0, 4, 12, 6, 14, 4, -4);
    }
  }

  function makeLeg(hipDeg, kneeBend) {
    const bend = Math.max(8, Math.min(110, kneeBend));
    const knee = tip(THIGH, hipDeg);
    const foot = {
      x: knee.x + tip(SHIN, hipDeg - bend).x,
      y: knee.y + tip(SHIN, hipDeg - bend).y,
    };
    return { knee, foot };
  }

  function makeArm(shoulderDeg) {
    const elbow = tip(UPPER, shoulderDeg);
    let fore = shoulderDeg + 86;
    if (fore > 98) fore = 98;
    if (fore < 18) fore = 18;
    const hand = {
      x: elbow.x + tip(FORE, fore).x,
      y: elbow.y + tip(FORE, fore).y,
    };
    return { elbow, hand };
  }

  function drawArm(ctx, x, y, part, kit) {
    const elbow = { x: x + part.elbow.x, y: y + part.elbow.y };
    const hand = { x: x + part.hand.x, y: y + part.hand.y };
    drawBone(ctx, x, y, elbow.x, elbow.y, 9, kit.shirt);
    drawBone(ctx, elbow.x, elbow.y, hand.x, hand.y, 7, "#e2ac86");
    drawHand(ctx, hand);
  }

  function drawBone(ctx, x1, y1, x2, y2, width, color) {
    line(ctx, x1, y1, x2, y2, width + 5, "#081018");
    line(ctx, x1, y1, x2, y2, width, color);
  }

  function drawBoot(ctx, foot) {
    ctx.save();
    ctx.translate(foot.x, foot.y);
    ctx.fillStyle = "#0b0e12";
    ctx.beginPath();
    ctx.ellipse(8, 2, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawLegParts(ctx, hipX, hipY, part, kit) {
    const knee = { x: hipX + part.knee.x, y: hipY + part.knee.y };
    const foot = { x: hipX + part.foot.x, y: hipY + part.foot.y };
    drawBone(ctx, hipX, hipY, knee.x, knee.y, 13, kit.short);
    drawBone(ctx, knee.x, knee.y, foot.x, foot.y, 8, kit.sock);
    ctx.beginPath();
    ctx.arc(knee.x, knee.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = kit.sock;
    ctx.fill();
    drawBoot(ctx, foot);
  }

  function drawHand(ctx, hand) {
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#e2ac86";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#081018";
    ctx.stroke();
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
    ctx.ellipse(0, 8, 42, 42, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fill();
    ctx.restore();

    const leftLeg = makeLeg(pose.hipL, pose.kneeL);
    const rightLeg = makeLeg(pose.hipR, pose.kneeR);
    const hipY = -Math.max(leftLeg.foot.y, rightLeg.foot.y);
    const backLeg = pose.hipL <= pose.hipR ? leftLeg : rightLeg;
    const frontLeg = pose.hipL <= pose.hipR ? rightLeg : leftLeg;
    drawLegParts(ctx, 0, hipY, backLeg, kit);

    ctx.beginPath();
    ctx.moveTo(-18, hipY - 2);
    ctx.lineTo(16, hipY - 2);
    ctx.lineTo(12, hipY + 20);
    ctx.lineTo(-14, hipY + 20);
    ctx.closePath();
    ctx.fillStyle = kit.short;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#081018";
    ctx.stroke();

    ctx.save();
    ctx.translate(0, hipY);
    ctx.rotate((pose.lean * Math.PI) / 180);

    const armA = makeArm(pose.shoulderL);
    const armB = makeArm(pose.shoulderR);
    const backArm = pose.shoulderL <= pose.shoulderR ? armA : armB;
    const frontArm = pose.shoulderL <= pose.shoulderR ? armB : armA;
    drawArm(ctx, -4, -50, backArm, kit);

    ctx.save();
    ctx.translate(-2, -4);
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
      ctx.fillText(String(p.num), 1, -34);
    }
    if (p.band) {
      ctx.fillStyle = "#5ef2e0";
      ctx.fillRect(-22, -48, 10, 7);
    }

    drawHead(ctx);
    if (p.flag) drawFlag(ctx);
    drawArm(ctx, 6, -48, frontArm, kit);
    ctx.restore();

    drawLegParts(ctx, 1, hipY, frontLeg, kit);
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
