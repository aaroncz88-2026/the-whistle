(function () {
  const LOG = [
    {
      version: "0.1.8",
      date: "2026-10-28",
      notes: "第一关铲球会把人放倒。没碰到、对方还带着球，就继续。开场改成裁判举红牌。",
    },
    {
      version: "0.1.7",
      date: "2026-10-28",
      notes: "跑步按正常步态重做。整个人都在画面里，手臂对侧摆。",
    },
    {
      version: "0.1.6",
      date: "2026-10-28",
      notes: "加上现场助威。哨响的时候看台会再响一截。",
    },
    {
      version: "0.1.5",
      date: "2026-10-28",
      notes: "人改成腿单独弯，不再拧在一起。第一关这一下加快了。",
    },
    {
      version: "0.1.4",
      date: "2026-10-28",
      notes: "开场是一次严重犯规。哨响，比赛被吹停，然后再开始。",
    },
    {
      version: "0.1.3",
      date: "2026-10-28",
      notes: "第一关的接触重做了。铲到脚，人才往前倒。脚没碰到，就是自己倒下去。",
    },
    {
      version: "0.1.2",
      date: "2026-10-28",
      notes: "第一关只留正面。两次判罚，吹停或继续。没有镜头、倒计时和有利。",
    },
    {
      version: "0.1.1",
      date: "2026-10-28",
      notes: "标题画面改为开始。点一下进入比赛。",
    },
    {
      version: "0.1.0",
      date: "2026-10-28",
      notes: "三关可玩 DEMO 公开。接触、有利、出牌。网页和桌面独立窗口是同一版。",
    },
  ];

  const current = LOG[0];
  const button = document.getElementById("ver");
  const panel = document.getElementById("verlog");
  const list = panel.querySelector("ol");

  button.textContent = "v" + current.version;

  list.innerHTML = LOG.map((entry) => {
    return `<li><b>v${entry.version}</b><time>${entry.date}</time><p>${entry.notes}</p></li>`;
  }).join("");

  function setOpen(open) {
    panel.hidden = !open;
    button.setAttribute("aria-expanded", open ? "true" : "false");
  }

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(panel.hidden);
  });

  document.addEventListener("click", (e) => {
    if (panel.hidden) return;
    if (panel.contains(e.target) || e.target === button) return;
    setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
})();
