(() => {
  "use strict";

  const CASES = [
    { label: "H", family: "H", centers: ["Y", "B", "R", "G", "O"] },
    { label: "Z", family: "Z", centers: ["Y", "R", "B", "O", "G"] },
    { label: "U1", family: "U", centers: ["Y", "G", "R", "O", "B"] },
    { label: "U2", family: "U", centers: ["Y", "B", "O", "R", "G"] },
    { label: "TS1", family: "TS", centers: ["G", "Y", "R", "B", "O"] },
    { label: "TS2", family: "TS", centers: ["B", "Y", "O", "G", "R"] },
    { label: "ZC1", family: "ZC", centers: ["G", "R", "B", "Y", "O"] },
    { label: "ZC2", family: "ZC", centers: ["G", "Y", "B", "O", "R"] },
    { label: "O1", family: "O", centers: ["R", "Y", "B", "G", "O"] },
    { label: "O2", family: "O", centers: ["B", "R", "Y", "G", "O"] },
    { label: "X1", family: "X", centers: ["O", "Y", "G", "B", "R"] },
    { label: "X2", family: "X", centers: ["G", "O", "Y", "B", "R"] },
    { label: "W1", family: "W", centers: ["G", "O", "R", "Y", "B"] },
    { label: "W2", family: "W", centers: ["B", "O", "G", "Y", "R"] },
    { label: "S1", family: "S", centers: ["O", "R", "G", "Y", "B"] },
    { label: "S2", family: "S", centers: ["R", "O", "B", "Y", "G"] },
  ];

  const FULL_LABELS = CASES.map((item) => item.label);
  const BASIC_LABELS = ["H", "Z", "U", "TS", "ZC", "O", "X", "W", "S"];
  const CUBE_COLORS = {
    W: "#ffffff",
    Y: "#ffff00",
    B: "#0000ff",
    G: "#00ff00",
    R: "#ff0000",
    O: "#ffa600",
    GRAY: "#7f7f7f",
  };

  // Corner state shared by the 16 EG2 Ori cases.
  const CORNERS = {
    U: ["Y", "Y", "Y", "Y"],
    F: ["G", "B", "G", "B"],
    R: ["R", "O", "R", "O"],
    B: ["B", "G", "B", "G"],
    L: ["O", "R", "O", "R"],
    D: ["W", "W", "W", "W"],
  };

  // Six skewb faces, each represented by four corner stickers + one center.
  // The geometry is rebuilt locally to keep the compact isometric look of the reference trainer.
  const FACE_POLYGONS = [
    [
      "10,10 27.32,20 10,30",
      "27.32,20 44.64,30 44.64,50",
      "27.32,60 44.64,50 44.64,70",
      "10,30 27.32,60 10,50",
      "27.32,20 44.64,50 27.32,60 10,30",
    ],
    [
      "44.64,30 61.96,40 44.64,50",
      "61.96,40 79.28,50 79.28,70",
      "61.96,80 79.28,70 79.28,90",
      "44.64,50 61.96,80 44.64,70",
      "61.96,40 79.28,70 61.96,80 44.64,50",
    ],
    [
      "44.64,70 61.96,80 44.64,90",
      "61.96,80 79.28,90 79.28,110",
      "61.96,120 79.28,110 79.28,130",
      "44.64,90 61.96,120 44.64,110",
      "61.96,80 79.28,110 61.96,120 44.64,90",
    ],
    [
      "79.28,10 96.60,20 61.96,20",
      "96.60,20 113.92,30 96.60,40",
      "96.60,40 79.28,50 61.96,40",
      "61.96,40 44.64,30 61.96,20",
      "61.96,20 96.60,20 96.60,40 61.96,40",
    ],
    [
      "79.28,70 79.28,50 96.60,40",
      "113.92,30 113.92,50 96.60,40",
      "113.92,50 113.92,70 96.60,80",
      "96.60,80 79.28,90 79.28,70",
      "96.60,40 113.92,50 96.60,80 79.28,70",
    ],
    [
      "113.92,50 113.92,30 131.24,20",
      "148.56,10 148.56,30 131.24,20",
      "148.56,30 148.56,50 131.24,60",
      "131.24,60 113.92,70 113.92,50",
      "131.24,20 148.56,30 131.24,60 113.92,50",
    ],
  ];

  const VIEW_FACE_ROLES = {
    updown: ["L", "F", "D", "U", "R", "B"],
    side1: ["D", "F", "R", "L", "U", "B"],
    side2: ["U", "F", "L", "R", "D", "B"],
  };

  const DEFAULT_BINDS = {
    full: {
      Digit1: "H", Digit2: "Z", Digit3: "U1", Digit4: "U2",
      Digit5: "TS1", Digit6: "TS2", Digit7: "ZC1", Digit8: "ZC2",
      Digit9: "O1", KeyQ: "O2", KeyW: "X1", KeyE: "X2",
      KeyR: "W1", KeyT: "W2", KeyY: "S1", KeyU: "S2",
    },
    basic: {
      KeyH: "H", KeyZ: "Z", KeyU: "U", KeyT: "TS", KeyC: "ZC",
      KeyO: "O", KeyX: "X", KeyW: "W", KeyS: "S",
    },
  };

  const el = {
    svg: document.querySelector("#skewb-svg"),
    answers: document.querySelector("#answer-buttons"),
    score: document.querySelector("#score-text"),
    giveUp: document.querySelector("#give-up"),
    mute: document.querySelector("#mute-button"),
    theme: document.querySelector("#theme-button"),
    corners: document.querySelector("#show-corners"),
    randomColors: document.querySelector("#random-colors"),
    keybindToggle: document.querySelector("#keybind-toggle"),
    form: document.querySelector("#options-form"),
  };

  const saved = readJSON("eg2-reference-trainer-options", {});
  const savedBinds = readJSON("eg2-reference-trainer-keybinds", {});
  const state = {
    mode: saved.mode === "basic" ? "basic" : "full",
    showCorners: saved.showCorners !== false,
    randomColors: saved.randomColors !== false,
    view: ["updown", "side1", "side2"].includes(saved.view) ? saved.view : "updown",
    muted: saved.muted === true,
    theme: ["auto", "light", "dark"].includes(saved.theme) ? saved.theme : "auto",
    binds: {
      full: { ...DEFAULT_BINDS.full, ...(savedBinds.full || {}) },
      basic: { ...DEFAULT_BINDS.basic, ...(savedBinds.basic || {}) },
    },
    question: null,
    rotationIndex: 0,
    bag: [],
    wrong: new Set(),
    correctFlash: null,
    correct: 0,
    total: 0,
    showKeybinds: false,
    editingAnswer: null,
  };

  const colorRotations = makeColorRotations();
  validate();
  init();

  function init() {
    el.corners.checked = state.showCorners;
    el.randomColors.checked = state.randomColors;
    document.querySelector(`input[name="trainerMode"][value="${state.mode}"]`).checked = true;
    document.querySelector(`input[name="viewOrientation"][value="${state.view}"]`).checked = true;
    applyTheme();
    updateMuteButton();
    bindEvents();
    nextQuestion();
  }

  function bindEvents() {
    el.giveUp.addEventListener("click", giveUp);
    el.mute.addEventListener("click", () => {
      state.muted = !state.muted;
      updateMuteButton();
      saveOptions();
    });
    el.theme.addEventListener("click", cycleTheme);
    el.keybindToggle.addEventListener("click", () => {
      state.showKeybinds = !state.showKeybinds;
      state.editingAnswer = null;
      el.keybindToggle.textContent = state.showKeybinds ? "Save Changes" : "Show Keybinds";
      renderAnswers();
    });
    el.form.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.name === "trainerMode") {
        state.mode = target.value;
        state.bag = [];
        state.showKeybinds = false;
        state.editingAnswer = null;
        el.keybindToggle.textContent = "Show Keybinds";
        nextQuestion();
      } else if (target.name === "viewOrientation") {
        state.view = target.value;
        renderCube();
      } else if (target.id === "show-corners") {
        state.showCorners = target.checked;
        renderCube();
      } else if (target.id === "random-colors") {
        state.randomColors = target.checked;
        state.rotationIndex = state.randomColors ? randomInt(colorRotations.length) : 0;
        renderCube();
      }
      saveOptions();
    });
    document.addEventListener("keydown", onKeyDown);
  }

  function onKeyDown(event) {
    if (state.editingAnswer) {
      event.preventDefault();
      assignKey(event.code, state.editingAnswer);
      state.editingAnswer = null;
      renderAnswers();
      return;
    }
    if (state.showKeybinds) return;
    const answer = state.binds[state.mode][event.code];
    if (!answer) return;
    event.preventDefault();
    selectAnswer(answer);
  }

  function nextQuestion() {
    if (!state.bag.length) {
      state.bag = shuffle([...(state.mode === "full" ? FULL_LABELS : BASIC_LABELS)]);
    }
    const token = state.bag.pop();
    if (state.mode === "full") {
      state.question = CASES.find((item) => item.label === token);
    } else {
      const choices = CASES.filter((item) => item.family === token);
      state.question = choices[randomInt(choices.length)];
    }
    state.rotationIndex = state.randomColors ? randomInt(colorRotations.length) : 0;
    state.wrong = new Set();
    renderCube();
    renderAnswers();
  }

  function expectedAnswer() {
    return state.mode === "full" ? state.question.label : state.question.family;
  }

  function selectAnswer(answer) {
    if (!state.question) return;
    const expected = expectedAnswer();
    if (answer === expected) {
      tone(true);
      if (state.wrong.size === 0) {
        state.correct += 1;
        state.total += 1;
      }
      state.correctFlash = answer;
      updateScore();
      nextQuestion();
      window.setTimeout(() => {
        state.correctFlash = null;
        renderAnswers();
      }, 300);
      return;
    }

    tone(false);
    if (state.wrong.size === 0) {
      state.total += 1;
      updateScore();
    }
    state.wrong.add(answer);
    state.correctFlash = null;
    renderAnswers();
  }

  function giveUp() {
    if (!state.question) return;
    tone(false);
    if (state.wrong.size === 0) {
      state.total += 1;
      updateScore();
    }
    const expected = expectedAnswer();
    const labels = currentLabels();
    state.wrong = new Set(labels.filter((label) => label !== expected));
    state.correctFlash = null;
    renderAnswers();
  }

  function renderAnswers() {
    const labels = currentLabels();
    el.answers.replaceChildren();

    labels.forEach((label) => {
      const row = document.createElement("div");
      row.className = "answer-row";

      if (state.showKeybinds) {
        const text = document.createElement("span");
        text.className = "bind-label";
        text.textContent = ` ${label}: ${humanKey(keyForAnswer(label))} key `;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "pill-button edit-bind";
        button.textContent = state.editingAnswer === label ? "Press!" : "Edit";
        button.disabled = state.editingAnswer !== null && state.editingAnswer !== label;
        button.addEventListener("click", () => {
          state.editingAnswer = label;
          renderAnswers();
        });
        row.append(text, button);
      } else {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "answer-button";
        button.textContent = label;
        if (state.wrong.has(label)) button.classList.add("wrong");
        if (state.correctFlash === label) button.classList.add("correct");
        button.addEventListener("click", () => selectAnswer(label));
        row.append(button);
      }
      el.answers.append(row);
    });
  }

  function renderCube() {
    if (!state.question) return;
    const colorMap = colorRotations[state.rotationIndex];
    const centerByRole = {
      U: state.question.centers[0],
      F: state.question.centers[1],
      R: state.question.centers[2],
      B: state.question.centers[3],
      L: state.question.centers[4],
      D: "W",
    };
    const roles = VIEW_FACE_ROLES[state.view];
    el.svg.replaceChildren();

    FACE_POLYGONS.forEach((facePolys, faceIndex) => {
      const role = roles[faceIndex];
      const cornerColors = CORNERS[role];
      facePolys.forEach((points, stickerIndex) => {
        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygon.setAttribute("points", points);
        polygon.setAttribute("class", "skewb-sticker");
        let color;
        if (stickerIndex === 4) {
          color = colorMap[centerByRole[role]];
        } else if (state.showCorners) {
          color = colorMap[cornerColors[stickerIndex]];
        } else {
          color = "GRAY";
        }
        polygon.setAttribute("fill", CUBE_COLORS[color]);
        el.svg.append(polygon);
      });
    });
  }

  function currentLabels() {
    return state.mode === "full" ? FULL_LABELS : BASIC_LABELS;
  }

  function updateScore() {
    el.score.textContent = `${state.correct}/${state.total} answered correctly`;
  }

  function updateMuteButton() {
    el.mute.textContent = state.muted ? "Unmute" : "Mute";
  }

  function cycleTheme() {
    state.theme = state.theme === "auto" ? "light" : state.theme === "light" ? "dark" : "auto";
    applyTheme();
    saveOptions();
  }

  function applyTheme() {
    if (state.theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", state.theme);
    el.theme.textContent = state.theme[0].toUpperCase() + state.theme.slice(1);
  }

  function assignKey(code, answer) {
    const binds = state.binds[state.mode];
    const oldCode = Object.keys(binds).find((key) => binds[key] === answer);
    const displaced = binds[code];
    if (oldCode) delete binds[oldCode];
    if (displaced && oldCode) binds[oldCode] = displaced;
    binds[code] = answer;
    writeJSON("eg2-reference-trainer-keybinds", state.binds);
  }

  function keyForAnswer(answer) {
    return Object.keys(state.binds[state.mode]).find((key) => state.binds[state.mode][key] === answer) || "";
  }

  function humanKey(code) {
    if (!code) return "None";
    return code.replace(/^(Key|Digit)/, "").replace("Space", "Space");
  }

  function tone(correct) {
    if (state.muted) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = correct ? 720 : 190;
    osc.type = correct ? "sine" : "triangle";
    gain.gain.setValueAtTime(.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .13);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + .14);
    osc.addEventListener("ended", () => ctx.close());
  }

  function makeColorRotations() {
    const axes = [
      [1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1],
    ];
    const vectors = {
      R:[1,0,0], O:[-1,0,0], Y:[0,1,0], W:[0,-1,0], B:[0,0,1], G:[0,0,-1],
    };
    const byVector = new Map(Object.entries(vectors).map(([color, vector]) => [vector.join(","), color]));
    const maps = [];
    for (const x of axes) {
      for (const y of axes) {
        if (dot(x,y) !== 0) continue;
        const z = cross(x,y);
        const map = {};
        for (const [color, v] of Object.entries(vectors)) {
          const out = [
            v[0]*x[0] + v[1]*y[0] + v[2]*z[0],
            v[0]*x[1] + v[1]*y[1] + v[2]*z[1],
            v[0]*x[2] + v[1]*y[2] + v[2]*z[2],
          ];
          map[color] = byVector.get(out.join(","));
        }
        map.GRAY = "GRAY";
        maps.push(map);
      }
    }
    return maps;
  }

  function validate() {
    if (CASES.length !== 16 || new Set(CASES.map((item) => item.label)).size !== 16) {
      throw new Error("Expected 16 unique EG2 cases.");
    }
    if (new Set(CASES.map((item) => item.centers.join(""))).size !== 16) {
      throw new Error("EG2 center states must be unique.");
    }
    if (colorRotations.length !== 24) throw new Error("Expected 24 cube rotations.");
  }

  function saveOptions() {
    writeJSON("eg2-reference-trainer-options", {
      mode: state.mode,
      showCorners: state.showCorners,
      randomColors: state.randomColors,
      view: state.view,
      muted: state.muted,
      theme: state.theme,
    });
  }

  function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "") || fallback; }
    catch (_) { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (_) {}
  }
  function shuffle(array) {
    for (let i=array.length-1; i>0; i-=1) {
      const j=randomInt(i+1);
      [array[i],array[j]]=[array[j],array[i]];
    }
    return array;
  }
  function randomInt(max) { return Math.floor(Math.random()*max); }
  function dot(a,b) { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
  function cross(a,b) {
    return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  }
})();
