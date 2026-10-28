(function () {
  const KITS = {
    mara: { shirt: "#f3efe6", short: "#e3d9c8", sock: "#3c4654", num: "#2a241c", trim: "#d9d0c2" },
    keel: { shirt: "#3e6494", short: "#2c4a70", sock: "#f4efe6", num: "#e7fff8", trim: "#7ea4c8" },
    keep: { shirt: "#1f5c56", short: "#164742", sock: "#f4efe6", num: "#f4efe6", trim: "#8fd0c4" },
    ar: { shirt: "#2a3038", short: "#22272e", sock: "#3a414b", num: "#d7fff6", trim: "#8fd0c4" },
    ref: { shirt: "#2c3138", short: "#24282e", sock: "#343a42", num: "#f4efe6", trim: "#f4efe6" },
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

  const SKIN = "#e7b08a";

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function mixHex(hex, target, t) {
    const a = hexToRgb(hex);
    const b = hexToRgb(target);
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  function clayShade(color) {
    return mixHex(color, "#24180f", 0.42);
  }

  function clayLite(color) {
    return mixHex(color, "#fff6ea", 0.62);
  }

  function clayFill(ctx, color, x0, y0, x1, y1) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, clayLite(color));
    g.addColorStop(0.4, color);
    g.addColorStop(1, clayShade(color));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = clayShade(color);
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function clayBall(ctx, x, y, r, color) {
    const g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.08, x + r * 0.1, y + r * 0.15, r);
    g.addColorStop(0, clayLite(color));
    g.addColorStop(0.45, color);
    g.addColorStop(1, clayShade(color));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = clayShade(color);
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  function torsoPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(-18, -62);
    ctx.quadraticCurveTo(-8, -84, 12, -76);
    ctx.quadraticCurveTo(34, -64, 28, -36);
    ctx.quadraticCurveTo(24, -8, 16, 2);
    ctx.quadraticCurveTo(2, 16, -18, 2);
    ctx.quadraticCurveTo(-28, -16, -18, -62);
    ctx.closePath();
  }

  function drawHead(ctx) {
    clayBall(ctx, 0, -72, 7, SKIN);
    clayBall(ctx, 2, -98, 19, SKIN);
    ctx.save();
    ctx.beginPath();
    ctx.arc(1, -102, 17, Math.PI * 1.05, Math.PI * 1.95);
    ctx.lineTo(1, -102);
    ctx.closePath();
    ctx.clip();
    clayBall(ctx, 0, -108, 16, "#2a241c");
    ctx.restore();
    clayBall(ctx, -14, -96, 4.4, SKIN);
    ctx.beginPath();
    ctx.arc(8, -98, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(42, 28, 20, 0.82)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7.2, -99, 0.9, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 246, 234, 0.7)";
    ctx.fill();
    clayBall(ctx, 16, -92, 3.2, SKIN);
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
        return pose(6, -34, 102, 4, 12, -40, 24);
      case "strike":
        return pose(12, -18, 96, 70, 14, -22, 18);
      case "swept":
        return pose(4, -4, 12, 38, 88, 46, 22);
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

  function limbPath(ctx, x1, y1, x2, y2, w1, w2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len;
    const py = dx / len;
    const a = Math.atan2(py, px);
    const b = Math.atan2(-py, -px);
    ctx.beginPath();
    ctx.moveTo(x1 + px * w1, y1 + py * w1);
    ctx.lineTo(x2 + px * w2, y2 + py * w2);
    ctx.arc(x2, y2, w2, a, b, false);
    ctx.lineTo(x1 - px * w1, y1 - py * w1);
    ctx.arc(x1, y1, w1, b, a, false);
    ctx.closePath();
  }

  function solidLimb(ctx, x1, y1, x2, y2, w1, w2, color) {
    limbPath(ctx, x1, y1, x2, y2, w1, w2);
    const g = ctx.createLinearGradient(x1 - 10, y1 - 16, x2 + 8, y2 + 18);
    g.addColorStop(0, clayLite(color));
    g.addColorStop(0.38, color);
    g.addColorStop(1, clayShade(color));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = clayShade(color);
    ctx.lineWidth = 1.8;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.save();
    limbPath(ctx, x1, y1, x2, y2, w1, w2);
    ctx.clip();
    ctx.strokeStyle = "rgba(255, 246, 234, 0.42)";
    ctx.lineWidth = Math.max(2.4, (w1 + w2) * 0.22);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawArm(ctx, x, y, part, kit) {
    const elbow = { x: x + part.elbow.x, y: y + part.elbow.y };
    const hand = { x: x + part.hand.x, y: y + part.hand.y };
    solidLimb(ctx, x, y, elbow.x, elbow.y, 9, 7.5, kit.shirt);
    solidLimb(ctx, elbow.x, elbow.y, hand.x, hand.y, 6.5, 5.5, SKIN);
    clayBall(ctx, hand.x + 2, hand.y, 6.2, SKIN);
  }

  function drawBoot(ctx, knee, foot) {
    const ang = Math.atan2(foot.x - knee.x, foot.y - knee.y);
    ctx.save();
    ctx.translate(foot.x, foot.y);
    ctx.rotate(ang * 0.45);
    ctx.beginPath();
    ctx.ellipse(6, 0, 16, 8, 0, 0, Math.PI * 2);
    clayFill(ctx, "#2a241c", -8, -10, 18, 10);
    ctx.restore();
  }

  function drawLegParts(ctx, hipX, hipY, part, kit) {
    const knee = { x: hipX + part.knee.x, y: hipY + part.knee.y };
    const foot = { x: hipX + part.foot.x, y: hipY + part.foot.y };
    solidLimb(ctx, hipX, hipY, knee.x, knee.y, 16, 12, kit.short);
    solidLimb(ctx, knee.x, knee.y, foot.x, foot.y, 10, 7.5, kit.sock);
    drawBoot(ctx, knee, foot);
  }

  function makeStraightArm(shoulderDeg) {
    const elbow = tip(UPPER, shoulderDeg);
    const hand = {
      x: elbow.x + tip(FORE + 8, shoulderDeg).x,
      y: elbow.y + tip(FORE + 8, shoulderDeg).y,
    };
    return { elbow, hand };
  }

  function drawRaisedCard(ctx, lift) {
    const u = Math.max(0, Math.min(1, lift || 0));
    const ang = 28 + (168 - 28) * u;
    const arm = makeStraightArm(ang);
    drawArm(ctx, 10, -50, arm, { shirt: "#161b22" });
    if (u < 0.42) return;
    const hand = { x: 10 + arm.hand.x, y: -50 + arm.hand.y };
    ctx.save();
    ctx.translate(hand.x, hand.y);
    ctx.rotate(-0.08);
    ctx.beginPath();
    ctx.roundRect(-11, -38, 24, 36, 4);
    clayFill(ctx, "#d0122a", -10, -40, 8, -4);
    ctx.restore();
  }

  function paintFigure(ctx, p, kit, pose, hipY) {
    const sc = p.s || 1;
    const leftLeg = makeLeg(pose.hipL, pose.kneeL);
    const rightLeg = makeLeg(pose.hipR, pose.kneeR);
    const backLeg = pose.hipL <= pose.hipR ? leftLeg : rightLeg;
    const frontLeg = pose.hipL <= pose.hipR ? rightLeg : leftLeg;
    drawLegParts(ctx, 0, hipY, backLeg, kit);

    ctx.beginPath();
    ctx.moveTo(-24, hipY - 4);
    ctx.quadraticCurveTo(-6, hipY - 20, 18, hipY - 6);
    ctx.quadraticCurveTo(26, hipY + 12, 14, hipY + 28);
    ctx.quadraticCurveTo(0, hipY + 38, -18, hipY + 24);
    ctx.quadraticCurveTo(-30, hipY + 10, -24, hipY - 4);
    ctx.closePath();
    clayFill(ctx, kit.short, -20, hipY - 18, 16, hipY + 34);

    ctx.save();
    ctx.translate(0, hipY);
    ctx.rotate((pose.lean * Math.PI) / 180);

    const armA = makeArm(pose.shoulderL);
    const armB = makeArm(pose.shoulderR);
    const backArm = pose.shoulderL <= pose.shoulderR ? armA : armB;
    const frontArm = pose.shoulderL <= pose.shoulderR ? armB : armA;
    drawArm(ctx, -2, -58, backArm, kit);

    torsoPath(ctx);
    clayFill(ctx, kit.shirt, -16, -82, 20, 8);
    if (p.kit === "ref") {
      ctx.beginPath();
      ctx.roundRect(-16, -64, 32, 9, 4);
      clayFill(ctx, "#f4efe6", -16, -66, 8, -52);
    }

    if (p.num && sc >= 0.72 && p.kit !== "ref") {
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
    if ((p.card || 0) > 0.02) drawRaisedCard(ctx, p.card);
    else drawArm(ctx, 4, -56, frontArm, kit);
    ctx.restore();

    drawLegParts(ctx, 1, hipY, frontLeg, kit);
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
    ctx.ellipse(0, 10, 46, 46, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(28, 22, 16, 0.38)";
    ctx.fill();
    ctx.restore();

    if ((p.slide || 0) > 0.08) {
      const u = Math.max(0, Math.min(1, p.slide));
      ctx.save();
      ctx.translate(u * 10, -56 + u * 32);
      ctx.rotate(-u * 1.18);
      paintFigure(ctx, p, kit, pose, 0);
      ctx.restore();
      ctx.restore();
      return;
    }
    if ((p.pitch || 0) > 0.08) {
      const u = Math.max(0, Math.min(1, p.pitch));
      ctx.save();
      ctx.rotate(u * 1.42);
      const sweptL = makeLeg(pose.hipL, pose.kneeL);
      const sweptR = makeLeg(pose.hipR, pose.kneeR);
      paintFigure(ctx, p, kit, pose, -Math.max(sweptL.foot.y, sweptR.foot.y));
      ctx.restore();
      ctx.restore();
      return;
    }

    const leftLeg = makeLeg(pose.hipL, pose.kneeL);
    const rightLeg = makeLeg(pose.hipR, pose.kneeR);
    paintFigure(ctx, p, kit, pose, -Math.max(leftLeg.foot.y, rightLeg.foot.y));
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
