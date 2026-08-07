(() => {
  "use strict";

  // EG2 Ori centers. Order: U, F, R, B, L. D is the remaining opposite center.
  const CASES = [
    { id: 132, label: "H",   family: "H",  centers: ["Y", "B", "R", "G", "O"] },
    { id: 133, label: "Z",   family: "Z",  centers: ["Y", "R", "B", "O", "G"] },
    { id: 134, label: "U1",  family: "U",  centers: ["Y", "G", "R", "O", "B"] },
    { id: 141, label: "U2",  family: "U",  centers: ["Y", "B", "O", "R", "G"] },
    { id: 136, label: "TS1", family: "TS", centers: ["G", "Y", "R", "B", "O"] },
    { id: 135, label: "TS2", family: "TS", centers: ["B", "Y", "O", "G", "R"] },
    { id: 138, label: "ZC1", family: "ZC", centers: ["G", "R", "B", "Y", "O"] },
    { id: 137, label: "ZC2", family: "ZC", centers: ["G", "Y", "B", "O", "R"] },
    { id: 139, label: "O1",  family: "O",  centers: ["R", "Y", "B", "G", "O"] },
    { id: 140, label: "O2",  family: "O",  centers: ["B", "R", "Y", "G", "O"] },
    { id: 142, label: "X1",  family: "X",  centers: ["O", "Y", "G", "B", "R"] },
    { id: 143, label: "X2",  family: "X",  centers: ["G", "O", "Y", "B", "R"] },
    { id: 144, label: "W1",  family: "W",  centers: ["G", "O", "R", "Y", "B"] },
    { id: 145, label: "W2",  family: "W",  centers: ["B", "O", "G", "Y", "R"] },
    { id: 146, label: "S1",  family: "S",  centers: ["O", "R", "G", "Y", "B"] },
    { id: 147, label: "S2",  family: "S",  centers: ["R", "O", "B", "Y", "G"] },
  ];

  const FULL_LABELS = CASES.map((item) => item.label);
  const BASIC_LABELS = ["H", "Z", "U", "TS", "ZC", "O", "X", "W", "S"];
  const KEY_BINDINGS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "q", "w", "e", "r", "t", "y", "u"];

  const COLORS = {
    W: "#FFFFFF",
    Y: "#FFD500",
    B: "#0055FF",
    G: "#00AA00",
    R: "#D40000",
    O: "#FF8800",
  };

  // The four fixed corner stickers on each visible face in EG2 Ori.
  // Order inside each face: NW, NE, SE, SW.
  const FIXED_CORNERS = {
    U: ["Y", "Y", "Y", "Y"],
    F: ["G", "B", "G", "B"],
    R: ["R", "O", "R", "O"],
    B: ["B", "G", "B", "G"],
    L: ["O", "R", "O", "R"],
  };

  const FACE_LAYOUT = [
    { face: "U", centerIndex: 0, x: 119, y: 10 },
    { face: "L", centerIndex: 4, x: 18,  y: 120 },
    { face: "F", centerIndex: 1, x: 119, y: 120 },
    { face: "R", centerIndex: 2, x: 220, y: 120 },
    { face: "B", centerIndex: 3, x: 321, y: 120 },
  ];

  const FACE_SIZE = 92;
  const STORAGE_KEY = "eg2-center-trainer-v1";

  const els = {
    cube: document.querySelector("#cube"),
    answers: document.querySelector("#answers"),
    answerPanel: document.querySelector(".answers-panel"),
    feedback: document.querySelector("#feedback"),
    questionNumber: document.querySelector("#question-number"),
    orientationNote: document.querySelector("#orientation-note"),
    giveUp: document.querySelector("#give-up"),
    next: document.querySelector("#next"),
    statCorrect: document.querySelector("#stat-correct"),
    statRate: document.querySelector("#stat-rate"),
    statStreak: document.querySelector("#stat-streak"),
    statTime: document.querySelector("#stat-time"),
    orientation: document.querySelector("#random-orientation"),
    corners: document.querySelector("#show-corners"),
    sound: document.querySelector("#sound"),
    reset: document.querySelector("#reset-stats"),
    modeButtons: [...document.querySelectorAll("[data-mode]")],
  };

  const saved = loadState();
  const state = {
    mode: saved.mode === "basic" ? "basic" : "full",
    randomOrientation: saved.randomOrientation !== false,
    showCorners: saved.showCorners !== false,
    sound: saved.sound === true,
    stats: {
      correct: Number.isFinite(saved.stats?.correct) ? saved.stats.correct : 0,
      total: Number.isFinite(saved.stats?.total) ? saved.stats.total : 0,
      streak: Number.isFinite(saved.stats?.streak) ? saved.stats.streak : 0,
    },
    questionCount: 0,
    bag: [],
    current: null,
    firstAttempt: true,
    finished: false,
    startTime: performance.now(),
    frozenTime: 0,
    autoNextTimer: null,
  };

  const orientationMaps = createOrientationMaps();
  validateData();
  init();

  function init() {
    els.orientation.checked = state.randomOrientation;
    els.corners.checked = state.showCorners;
    els.sound.checked = state.sound;
    syncModeUI();
    renderStats();
    bindEvents();
    newQuestion();
    window.setInterval(updateTimer, 50);
  }

  function bindEvents() {
    els.giveUp.addEventListener("click", giveUp);
    els.next.addEventListener("click", newQuestion);

    els.modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const nextMode = button.dataset.mode;
        if (nextMode === state.mode) return;
        state.mode = nextMode;
        state.bag = [];
        persist();
        syncModeUI();
        newQuestion();
      });
    });

    els.orientation.addEventListener("change", () => {
      state.randomOrientation = els.orientation.checked;
      persist();
      if (state.current) {
        state.current.orientationIndex = state.randomOrientation ? randomInt(orientationMaps.length) : 0;
        renderCube();
      }
    });

    els.corners.addEventListener("change", () => {
      state.showCorners = els.corners.checked;
      persist();
      renderCube();
    });

    els.sound.addEventListener("change", () => {
      state.sound = els.sound.checked;
      persist();
    });

    els.reset.addEventListener("click", () => {
      state.stats = { correct: 0, total: 0, streak: 0 };
      persist();
      renderStats();
      els.feedback.className = "feedback";
      els.feedback.textContent = "統計已重設；目前這題可以繼續作答";
    });

    document.addEventListener("keydown", handleKeyboard);
  }

  function handleKeyboard(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;

    const key = event.key.toLowerCase();
    if (!state.finished && key === "0") {
      event.preventDefault();
      giveUp();
      return;
    }

    if (state.finished && (key === "arrowright" || key === " " || key === "enter")) {
      event.preventDefault();
      newQuestion();
      return;
    }

    if (state.finished) return;
    const labels = state.mode === "full" ? FULL_LABELS : BASIC_LABELS;
    const index = KEY_BINDINGS.indexOf(key);
    if (index >= 0 && index < labels.length) {
      event.preventDefault();
      const button = els.answers.querySelector(`[data-answer="${labels[index]}"]`);
      if (button && !button.disabled) button.click();
    }
  }

  function newQuestion() {
    window.clearTimeout(state.autoNextTimer);
    state.autoNextTimer = null;

    const item = pullCase();
    state.questionCount += 1;
    state.current = {
      item,
      orientationIndex: state.randomOrientation ? randomInt(orientationMaps.length) : 0,
    };
    state.firstAttempt = true;
    state.finished = false;
    state.startTime = performance.now();
    state.frozenTime = 0;

    els.questionNumber.textContent = `#${String(state.questionCount).padStart(3, "0")}`;
    els.feedback.className = "feedback";
    els.feedback.textContent = "選一個你看到的排列";
    els.giveUp.hidden = false;
    els.next.hidden = true;
    renderAnswers();
    renderCube();
    updateTimer();
  }

  function pullCase() {
    if (state.bag.length === 0) {
      state.bag = shuffle([...(state.mode === "full" ? FULL_LABELS : BASIC_LABELS)]);
    }

    const token = state.bag.pop();
    if (state.mode === "full") return CASES.find((item) => item.label === token);

    const variants = CASES.filter((item) => item.family === token);
    return variants[randomInt(variants.length)];
  }

  function renderAnswers() {
    const labels = state.mode === "full" ? FULL_LABELS : BASIC_LABELS;
    els.answers.replaceChildren();

    labels.forEach((label, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-button";
      button.dataset.answer = label;
      button.setAttribute("aria-label", `回答 ${label}`);
      button.innerHTML = `<span>${label}</span><span class="key">${KEY_BINDINGS[index].toUpperCase()}</span>`;
      button.addEventListener("click", () => answer(label, button));
      els.answers.append(button);
    });
  }

  function answer(label, button) {
    if (state.finished) return;
    const expected = state.mode === "full" ? state.current.item.label : state.current.item.family;

    if (label === expected) {
      if (state.firstAttempt) {
        state.stats.total += 1;
        state.stats.correct += 1;
        state.stats.streak += 1;
      }
      state.finished = true;
      freezeTimer();
      button.classList.add("correct");
      lockAnswers(expected);
      els.feedback.className = "feedback good";
      els.feedback.textContent = state.mode === "full"
        ? `✓ ${state.current.item.label} · ${state.frozenTime.toFixed(2)}s`
        : `✓ ${state.current.item.family} family · 本題是 ${state.current.item.label} · ${state.frozenTime.toFixed(2)}s`;
      els.giveUp.hidden = true;
      els.next.hidden = false;
      persist();
      renderStats();
      playTone(true);
      state.autoNextTimer = window.setTimeout(newQuestion, 650);
      return;
    }

    if (state.firstAttempt) {
      state.stats.total += 1;
      state.stats.streak = 0;
      state.firstAttempt = false;
      persist();
      renderStats();
    }

    button.classList.add("wrong");
    button.disabled = true;
    els.feedback.className = "feedback bad";
    els.feedback.textContent = `× 不是 ${label}，再看一次中心方向`;
    playTone(false);
  }

  function giveUp() {
    if (state.finished) return;
    window.clearTimeout(state.autoNextTimer);
    if (state.firstAttempt) {
      state.stats.total += 1;
      state.stats.streak = 0;
      state.firstAttempt = false;
    }
    state.finished = true;
    freezeTimer();
    const expected = state.mode === "full" ? state.current.item.label : state.current.item.family;
    lockAnswers(expected);
    els.feedback.className = "feedback bad";
    els.feedback.textContent = state.mode === "full"
      ? `答案：${state.current.item.label}`
      : `答案：${state.current.item.family} family（本題 ${state.current.item.label}）`;
    els.giveUp.hidden = true;
    els.next.hidden = false;
    persist();
    renderStats();
  }

  function lockAnswers(expected) {
    [...els.answers.querySelectorAll(".answer-button")].forEach((button) => {
      button.disabled = true;
      if (button.dataset.answer === expected) button.classList.add("correct");
    });
  }

  function renderCube() {
    if (!state.current) return;
    const { item, orientationIndex } = state.current;
    const colorMap = orientationMaps[orientationIndex];
    els.cube.replaceChildren();

    FACE_LAYOUT.forEach((layout) => {
      const cornerColors = FIXED_CORNERS[layout.face].map((color) => colorMap[color]);
      const centerColor = colorMap[item.centers[layout.centerIndex]];
      renderFace(layout, cornerColors, centerColor);
    });

    els.orientationNote.textContent = state.randomOrientation
      ? `Color neutral · orientation ${String(orientationIndex + 1).padStart(2, "0")}`
      : "Fixed scheme · U yellow / F blue";
  }

  function renderFace(layout, cornerColors, centerColor) {
    const { x, y, face } = layout;
    const s = FACE_SIZE;
    const h = s / 2;
    const group = svgEl("g", { "data-face": face });

    group.append(svgEl("rect", {
      x, y, width: s, height: s, rx: 3, class: "face-outline",
    }));

    const cornerPoints = [
      `${x},${y} ${x + h},${y} ${x},${y + h}`,
      `${x + h},${y} ${x + s},${y} ${x + s},${y + h}`,
      `${x + s},${y + h} ${x + s},${y + s} ${x + h},${y + s}`,
      `${x + h},${y + s} ${x},${y + s} ${x},${y + h}`,
    ];

    cornerPoints.forEach((points, index) => {
      group.append(svgEl("polygon", {
        points,
        class: "sticker corner-sticker",
        fill: state.showCorners ? COLORS[cornerColors[index]] : "#0B1822",
      }));
    });

    group.append(svgEl("polygon", {
      points: `${x + h},${y} ${x + s},${y + h} ${x + h},${y + s} ${x},${y + h}`,
      class: "sticker center-sticker",
      fill: COLORS[centerColor],
    }));

    const label = svgEl("text", {
      x: x + 7,
      y: y + 13,
      fill: "rgba(255,255,255,.66)",
      "font-size": "8",
      "font-weight": "800",
      "font-family": "ui-sans-serif, sans-serif",
    });
    label.textContent = face;
    group.append(label);
    els.cube.append(group);
  }

  function renderStats() {
    els.statCorrect.textContent = String(state.stats.correct);
    els.statRate.textContent = state.stats.total === 0
      ? "—"
      : `${Math.round((state.stats.correct / state.stats.total) * 100)}%`;
    els.statStreak.textContent = String(state.stats.streak);
  }

  function updateTimer() {
    if (!state.current) return;
    const seconds = state.finished ? state.frozenTime : (performance.now() - state.startTime) / 1000;
    els.statTime.textContent = `${seconds.toFixed(2)}s`;
  }

  function freezeTimer() {
    state.frozenTime = (performance.now() - state.startTime) / 1000;
    updateTimer();
  }

  function syncModeUI() {
    els.modeButtons.forEach((button) => button.classList.toggle("active", button.dataset.mode === state.mode));
    els.answerPanel.classList.toggle("basic", state.mode === "basic");
  }

  function playTone(success) {
    if (!state.sound) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = success ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(success ? 720 : 185, ctx.currentTime);
    if (success) oscillator.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
    oscillator.addEventListener("ended", () => ctx.close());
  }

  function createOrientationMaps() {
    const axes = [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
    ];
    const colorVector = {
      R: [1, 0, 0], O: [-1, 0, 0], Y: [0, 1, 0], W: [0, -1, 0], B: [0, 0, 1], G: [0, 0, -1],
    };
    const vectorColor = new Map(Object.entries(colorVector).map(([color, vector]) => [vector.join(","), color]));
    const maps = [];

    for (const ex of axes) {
      for (const ey of axes) {
        if (dot(ex, ey) !== 0) continue;
        const ez = cross(ex, ey);
        const map = {};

        for (const [color, vector] of Object.entries(colorVector)) {
          const rotated = [
            vector[0] * ex[0] + vector[1] * ey[0] + vector[2] * ez[0],
            vector[0] * ex[1] + vector[1] * ey[1] + vector[2] * ez[1],
            vector[0] * ex[2] + vector[1] * ey[2] + vector[2] * ez[2],
          ];
          map[color] = vectorColor.get(rotated.join(","));
        }
        maps.push(map);
      }
    }
    return maps;
  }

  function validateData() {
    const labels = new Set(CASES.map((item) => item.label));
    const states = new Set(CASES.map((item) => item.centers.join("")));
    if (CASES.length !== 16 || labels.size !== 16 || states.size !== 16) {
      throw new Error("EG2 case data must contain 16 unique cases.");
    }
    if (orientationMaps.length !== 24) {
      throw new Error(`Expected 24 cube orientations, got ${orientationMaps.length}.`);
    }
    if (orientationMaps.some((map) => Object.values(map).some((value) => !value))) {
      throw new Error("Invalid color rotation generated.");
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode: state.mode,
        randomOrientation: state.randomOrientation,
        showCorners: state.showCorners,
        sound: state.sound,
        stats: state.stats,
      }));
    } catch (_) {
      // The trainer still works if browser storage is blocked.
    }
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = randomInt(i + 1);
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function randomInt(max) {
    return Math.floor(Math.random() * max);
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  function svgEl(tag, attrs = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }
})();
