const ROUND_SECONDS = 24;
const TOTAL_ROUNDS = 10;
const players = ["left", "right"];
const playerNames = { left: "左玩家", right: "右玩家" };
const HASH_GROUPS = [
  { key: "crimson", name: "深紅入口", color: "#d00000", icon: "深紅" },
  { key: "tangerine", name: "橘橙入口", color: "#ff7a00", icon: "橘橙" },
  { key: "gold", name: "金黃入口", color: "#ffd60a", icon: "金黃" },
  { key: "lime", name: "亮綠入口", color: "#70e000", icon: "亮綠" },
  { key: "emerald", name: "翡翠入口", color: "#008f5a", icon: "翡翠" },
  { key: "aqua", name: "水藍入口", color: "#00d4ff", icon: "水藍" },
  { key: "azure", name: "鮮藍入口", color: "#0066ff", icon: "鮮藍" },
  { key: "navy", name: "深藍入口", color: "#001d6e", icon: "深藍" },
  { key: "violet", name: "紫羅蘭入口", color: "#7b2cbf", icon: "紫羅蘭" },
  { key: "magenta", name: "桃紫入口", color: "#ff00a8", icon: "桃紫" },
  { key: "bubblegum", name: "亮粉入口", color: "#ff8fab", icon: "亮粉" },
  { key: "chocolate", name: "巧克力入口", color: "#6f4e37", icon: "巧克力" },
  { key: "sand", name: "沙黃入口", color: "#c2a83e", icon: "沙黃" },
  { key: "slate", name: "石板入口", color: "#607d8b", icon: "石板" },
  { key: "black", name: "黑色入口", color: "#111111", icon: "黑" },
  { key: "white", name: "白色入口", color: "#f8f9fa", icon: "白" },
  { key: "maroon", name: "酒紅入口", color: "#800020", icon: "酒紅" },
  { key: "mint", name: "薄荷入口", color: "#3fffb0", icon: "薄荷" },
];

const roundTypes = [
  {
    id: "linear",
    label: "一張一張翻",
    tip: "資料沒有整理時，只能耐心一個一個找。",
  },
  {
    id: "binary",
    label: "大到小排序",
    tip: "先比較大的數字，把它們換到前面，資料排好後才容易搜尋。",
  },
  {
    id: "hash",
    label: "先看分類入口",
    tip: "先找到正確分類，就不用翻全部的寶箱。",
  },
  {
    id: "tree",
    label: "走分岔路",
    tip: "每個分岔都幫你決定下一步往哪裡走。",
  },
];

const arcadeGames = ["image", "rescue", "bits", "image", "rescue", "bits"];
const imagePatterns = [
  { name: "鴨子", rows: ["001100", "011110", "111101", "111111", "011110", "001100"] },
  { name: "烏龜", rows: ["011110", "111111", "101101", "111111", "011110", "100001"] },
  { name: "星星", rows: ["001000", "101010", "011100", "111110", "011100", "010100"] },
  { name: "愛心", rows: ["010010", "111111", "111111", "011110", "001100", "000000"] },
  { name: "房子", rows: ["001100", "011110", "111111", "101101", "101101", "111111"] },
  { name: "魚", rows: ["001100", "011110", "111101", "111110", "011100", "001010"] },
  { name: "船", rows: ["001000", "001100", "111110", "011110", "001100", "000000"] },
  { name: "樹", rows: ["001100", "011110", "111111", "001100", "001100", "011110"] },
  { name: "笑臉", rows: ["011110", "100001", "101101", "100001", "101101", "011110"] },
  { name: "鑽石", rows: ["001100", "011110", "111111", "111111", "011110", "001100"] },
];
const directions = ["up", "right", "down", "left"];

const state = {
  mode: "home",
  roundIndex: 0,
  secondsLeft: ROUND_SECONDS,
  timerId: null,
  running: false,
  round: null,
  scores: { left: 0, right: 0 },
  streaks: { left: 0, right: 0 },
  playerRound: {},
  history: [],
  sortDrags: new Map(),
  arcade: null,
};

const els = {
  homeMenu: document.querySelector("#homeMenu"),
  treasureModeButton: document.querySelector("#treasureModeButton"),
  arcadeModeButton: document.querySelector("#arcadeModeButton"),
  roundLabel: document.querySelector("#roundLabel"),
  missionText: document.querySelector("#missionText"),
  methodText: document.querySelector("#methodText"),
  timerText: document.querySelector("#timerText"),
  roundTrack: document.querySelector("#roundTrack"),
  startButton: document.querySelector("#startButton"),
  nextButton: document.querySelector("#nextButton"),
  resetButton: document.querySelector("#resetButton"),
  homeButton: document.querySelector("#homeButton"),
  fullscreenButton: document.querySelector("#fullscreenButton"),
  resultDialog: document.querySelector("#resultDialog"),
  resultTitle: document.querySelector("#resultTitle"),
  resultSummary: document.querySelector("#resultSummary"),
  resultStats: document.querySelector("#resultStats"),
  closeResultButton: document.querySelector("#closeResultButton"),
};

function byPlayer(id, suffix) {
  return document.querySelector(`#${id}${suffix}`);
}

function showHome() {
  clearInterval(state.timerId);
  cancelAllSortDrags();
  state.mode = "home";
  state.running = false;
  state.arcade = null;
  els.homeMenu.hidden = false;
  document.body.classList.add("home-active");
  els.startButton.disabled = true;
  els.nextButton.disabled = true;
  els.missionText.textContent = "選擇遊戲模式";
  els.methodText.textContent = "首頁";
  els.roundLabel.textContent = "Home";
  els.timerText.textContent = "--";
}

function enterGameShell() {
  els.homeMenu.hidden = true;
  document.body.classList.remove("home-active");
}

function startTreasureMode() {
  enterGameShell();
  state.mode = "treasure";
  resetGame();
}

function startArcadeMode() {
  enterGameShell();
  clearInterval(state.timerId);
  cancelAllSortDrags();
  state.mode = "arcade";
  state.roundIndex = 0;
  state.secondsLeft = 60;
  state.running = false;
  state.scores = { left: 0, right: 0 };
  state.streaks = { left: 0, right: 0 };
  state.history = [];
  state.arcade = { index: 0, player: {} };
  els.startButton.disabled = false;
  els.nextButton.disabled = true;
  els.closeResultButton.textContent = "下一回合";
  els.roundLabel.textContent = `Game 1 / ${arcadeGames.length}`;
  els.methodText.textContent = "程式思維闖關";
  els.missionText.textContent = "準備開始闖關！";
  els.timerText.textContent = state.secondsLeft;

  els.roundTrack.innerHTML = "";
  for (let i = 0; i < arcadeGames.length; i += 1) {
    const dot = document.createElement("span");
    dot.className = "round-dot";
    if (i === 0) dot.classList.add("active");
    els.roundTrack.append(dot);
  }

  players.forEach((player) => {
    byPlayer(player, "Score").textContent = state.scores[player];
    byPlayer(player, "Streak").textContent = `完成 0 / ${arcadeGames.length}`;
    byPlayer(player, "Steps").textContent = "步數 0";
    byPlayer(player, "State").textContent = "等待開始";
    const board = byPlayer(player, "Board");
    board.innerHTML = "";
    board.className = "board arcade";
  });
}

async function toggleFullscreen() {
  document.body.classList.add("play-mode");
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await document.documentElement.requestFullscreen({ navigationUI: "hide" });
  } catch {
    byPlayer("left", "State").textContent = "Safari 若無法全螢幕，請加入主畫面後開啟";
    byPlayer("right", "State").textContent = "Safari 若無法全螢幕，請加入主畫面後開啟";
  } finally {
    syncFullscreenButton();
  }
}

function syncFullscreenButton() {
  const active = Boolean(document.fullscreenElement) || document.body.classList.contains("play-mode");
  els.fullscreenButton.textContent = active ? "退出全螢幕" : "全螢幕";
}

function exitPlayMode() {
  document.body.classList.remove("play-mode");
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  syncFullscreenButton();
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function sample(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function makeNumberSet(count, min = 8, max = 92) {
  const values = new Set();
  while (values.size < count) {
    values.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return [...values];
}

function makePlayerNumberSet(target, count, min = 1, max = 99) {
  const values = new Set([target]);
  while (values.size < count) {
    values.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return shuffle([...values]);
}

function makePlayerData(factory) {
  return Object.fromEntries(players.map((player) => [player, factory(player)]));
}

function buildRound(roundIndex) {
  const type = roundTypes[roundIndex % roundTypes.length];
  if (type.id === "linear") {
    const target = Math.floor(Math.random() * 90) + 10;
    return {
      type,
      target,
      playerData: makePlayerData(() => ({ values: makePlayerNumberSet(target, 36, 1, 99) })),
      mission: `找到編號 ${target} 的寶石`,
    };
  }

  if (type.id === "binary") {
    return {
      type,
      playerData: makePlayerData(() => ({
        values: shuffle(makeNumberSet(10, 1, 100)),
      })),
      mission: "拖拉 10 張數字卡，由大到小排好",
    };
  }

  if (type.id === "hash") {
    const groups = HASH_GROUPS;
    const targetGroup = sample(groups);
    const target = Math.floor(Math.random() * 24) + 1;
    return {
      type,
      target,
      targetGroup,
      groups,
      playerData: makePlayerData(() => ({
        groups: shuffle(groups),
        groupItems: makeHashItems(groups, targetGroup, target),
      })),
      mission: `找到 ${targetGroup.name} 裡的 ${target} 號寶物`,
      missionHtml: `找到 ${colorSwatch(targetGroup)} 裡的 ${target} 號寶物`,
    };
  }

  const target = Math.floor(Math.random() * 90) + 10;
  return {
    type,
    target,
    playerData: makePlayerData(() => ({ tree: makeTreeData(target, 15) })),
    mission: `沿著分岔路找到 ${target}`,
  };
}

function makeHashItems(groups, targetGroup, target) {
  const groupItems = Object.fromEntries(
    groups.map((group) => {
      const items = new Set();
      const needsTarget = group.key === targetGroup.key;
      const targetSize = needsTarget ? 23 : 24;
      while (items.size < targetSize) {
        const value = Math.floor(Math.random() * 99) + 1;
        if (value !== target) items.add(value);
      }
      const list = needsTarget ? shuffle([...items, target]) : shuffle([...items]);
      return [group.key, list];
    }),
  );
  return groupItems;
}

function makeTreeData(target, count, attempt = 0) {
  const values = makePlayerNumberSet(target, count, 1, 99).sort((a, b) => a - b);
  const nodes = [];
  let id = 0;

  function build(start, end, depth = 0, position = 0, parentId = null, branch = "root") {
    if (start > end) return null;
    const mid = Math.floor((start + end) / 2);
    const node = {
      id: id,
      value: values[mid],
      depth,
      position,
      parentId,
      branch,
      leftId: null,
      rightId: null,
    };
    id += 1;
    nodes.push(node);
    node.leftId = build(start, mid - 1, depth + 1, position * 2, node.id, "left");
    node.rightId = build(mid + 1, end, depth + 1, position * 2 + 1, node.id, "right");
    return node.id;
  }

  const rootId = build(0, values.length - 1);
  const targetNode = nodes.find((node) => node.value === target);
  if (targetNode && targetNode.depth < 3 && attempt < 40) {
    return makeTreeData(target, count, attempt + 1);
  }
  return { nodes, rootId };
}

function initPlayerRound(player) {
  const data = state.round.playerData?.[player];
  state.playerRound[player] = {
    steps: 0,
    solved: false,
    finishMs: null,
    wrong: 0,
    path: [],
    activeBucket: null,
    low: 0,
    high: data?.values ? data.values.length - 1 : 0,
    sortDragIndex: null,
    treeAvailable: data?.tree ? [data.tree.rootId] : [],
  };
}

function renderShell() {
  els.roundLabel.textContent = `Round ${Math.min(state.roundIndex + 1, TOTAL_ROUNDS)} / ${TOTAL_ROUNDS}`;
  els.timerText.textContent = state.secondsLeft;

  els.roundTrack.innerHTML = "";
  for (let i = 0; i < TOTAL_ROUNDS; i += 1) {
    const dot = document.createElement("span");
    dot.className = "round-dot";
    if (i < state.roundIndex) dot.classList.add("done");
    if (i === state.roundIndex) dot.classList.add("active");
    els.roundTrack.append(dot);
  }

  players.forEach((player) => {
    byPlayer(player, "Score").textContent = state.scores[player];
    byPlayer(player, "Streak").textContent = `連擊 ${state.streaks[player]}`;
    const round = state.playerRound[player];
    byPlayer(player, "Steps").textContent = `步數 ${round?.steps ?? 0}`;
  });
}

function renderRound() {
  state.round = buildRound(state.roundIndex);
  state.secondsLeft = getRoundSeconds(state.round.type.id);
  state.running = true;
  players.forEach(initPlayerRound);

  els.missionText.innerHTML = state.round.missionHtml ?? state.round.mission;
  els.methodText.textContent = state.round.type.label;
  els.startButton.disabled = true;
  els.nextButton.disabled = state.roundIndex >= TOTAL_ROUNDS - 1;
  els.closeResultButton.textContent =
    state.roundIndex === TOTAL_ROUNDS - 1 ? "看戰報" : "下一回合";

  players.forEach((player) => {
    byPlayer(player, "State").textContent = "開始尋寶";
    byPlayer(player, "Board").className = `board ${state.round.type.id}`;
    renderBoard(player);
  });
  renderShell();
  startTimer();
}

function renderBoard(player) {
  const board = byPlayer(player, "Board");
  board.innerHTML = "";
  const { type } = state.round;
  if (type.id === "linear") renderLinearBoard(board, player);
  if (type.id === "binary") renderBinaryBoard(board, player);
  if (type.id === "hash") renderHashBoard(board, player);
  if (type.id === "tree") renderTreeBoard(board, player);
}

function getRoundSeconds(typeId) {
  if (typeId === "binary") return 40;
  if (typeId === "tree") return 60;
  return ROUND_SECONDS;
}

function makeButton(className, label, onClick) {
  const button = document.createElement("button");
  button.className = className;
  button.type = "button";
  button.innerHTML = label;
  button.addEventListener("pointerdown", onClick);
  return button;
}

function renderLinearBoard(board, player) {
  state.round.playerData[player].values.forEach((value, index) => {
    const playerState = state.playerRound[player];
    const seen = playerState.path.includes(index);
    const label = seen ? value : value;
    const tile = makeButton("tile hidden-value", label, () => chooseLinear(player, index));
    if (seen) tile.classList.remove("hidden-value");
    if (seen && value === state.round.target) tile.classList.add("correct");
    if (seen && value !== state.round.target) tile.classList.add("revealed");
    board.append(tile);
  });
}

function renderBinaryBoard(board, player) {
  const playerState = state.playerRound[player];
  const values = state.round.playerData[player].values;
  const sortedValues = [...values].sort((a, b) => b - a);
  const correctCount = values.filter((value, index) => value === sortedValues[index]).length;
  const drag = getPlayerSortDrag(player);
  const helper = document.createElement("div");
  helper.className = "binary-helper";
  helper.innerHTML = `<strong>由大到小排序：${correctCount} / 10 已在正確位置</strong><small>按住數字卡拖曳，放到空位完成排序。</small>`;
  board.append(helper);

  getSortDisplayItems(values, drag).forEach((item, index) => {
    if (item.placeholder) {
      const placeholder = document.createElement("div");
      placeholder.className = "sort-placeholder";
      placeholder.dataset.dropSlot = index;
      board.append(placeholder);
      return;
    }

    const tile = document.createElement("button");
    tile.className = "tile sort-card";
    tile.type = "button";
    tile.dataset.sortIndex = item.originalIndex;
    tile.dataset.dropSlot = index;
    tile.innerHTML = `${item.value}<small>${index + 1}</small>`;
    tile.addEventListener("pointerdown", (event) => startSortDrag(event, player, item.originalIndex));
    if (playerState.sortDragIndex === item.originalIndex) tile.classList.add("selected");
    if (item.value === sortedValues[index]) tile.classList.add("placed");
    board.append(tile);
  });
}

function getSortDisplayItems(values, drag) {
  if (!drag) {
    return values.map((value, originalIndex) => ({ value, originalIndex }));
  }
  const remaining = values
    .map((value, originalIndex) => ({ value, originalIndex }))
    .filter((item) => item.originalIndex !== drag.fromIndex);
  const insertIndex = Math.max(0, Math.min(drag.overIndex, remaining.length));
  return [
    ...remaining.slice(0, insertIndex),
    { placeholder: true },
    ...remaining.slice(insertIndex),
  ];
}

function renderHashBoard(board, player) {
  const playerState = state.playerRound[player];
  const playerData = state.round.playerData[player];
  const activeGroup = playerData.groups.find((group) => group.key === playerState.activeBucket);
  if (activeGroup) {
    const tray = document.createElement("div");
    tray.className = "bucket-tray";
    tray.innerHTML = `${colorSwatch(activeGroup)}<div class="bucket-items">${playerData.groupItems[activeGroup.key]
      .map((item) => {
        const found = playerState.foundHashItem === `${activeGroup.key}:${item}`;
        return `<button class="${found ? "found" : ""}" type="button" data-item="${item}">${item}</button>`;
      })
      .join("")}</div>`;
    tray.querySelectorAll("[data-item]").forEach((itemButton) => {
      itemButton.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        chooseHashItem(player, activeGroup.key, Number(itemButton.dataset.item));
      });
    });
    board.append(tray);
  }

  const bucketGrid = document.createElement("div");
  bucketGrid.className = "bucket-grid";
  playerData.groups.forEach((group) => {
    const open = playerState.activeBucket === group.key;
    const bucket = document.createElement("div");
    bucket.className = "bucket";
    bucket.setAttribute("role", "button");
    bucket.setAttribute("aria-label", group.name);
    bucket.tabIndex = 0;
    bucket.innerHTML = colorSwatch(group);
    bucket.addEventListener("pointerdown", () => openHashBucket(player, group.key));
    bucket.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") openHashBucket(player, group.key);
    });
    if (open) bucket.classList.add("open");
    bucketGrid.append(bucket);
  });
  board.append(bucketGrid);
}

function colorSwatch(group) {
  const shine = "linear-gradient(135deg, rgba(255, 255, 255, 0.32), transparent 48%)";
  return `<span class="color-swatch" style="background:${shine}, ${group.color}" aria-label="${group.name}"></span>`;
}

function renderTreeBoard(board, player) {
  const tree = state.round.playerData[player].tree;
  const playerState = state.playerRound[player];
  tree.nodes.forEach((node) => {
    const visible = isTreeNodeVisible(player, node);
    const selected = playerState.path.includes(node.id);
    const locked = visible && !selected && isTreeNodeLocked(player, node);
    const label = visible ? `${node.value}<small>${nodeHint(node)}</small>` : `?<small>蓋牌</small>`;
    const item = makeButton("tree-node", label, () => chooseTree(player, node.id));
    item.style.gridColumn = `${treeColumn(node)} / span 1`;
    item.style.gridRow = `${node.depth + 1}`;
    if (!visible) {
      item.disabled = true;
      item.classList.add("covered");
    }
    if (locked) {
      item.disabled = true;
      item.classList.add("locked");
    }
    if (selected) item.classList.add(node.value === state.round.target ? "correct" : "visited");
    board.append(item);
  });
}

function treeColumn(node) {
  const columns = 15;
  const maxDepth = 3;
  const spacing = 2 ** (maxDepth - node.depth);
  return Math.max(1, Math.min(columns, (2 * node.position + 1) * spacing));
}

function canChoose(player) {
  return state.running && !state.playerRound[player].solved;
}

function countStep(player) {
  const round = state.playerRound[player];
  round.steps += 1;
  byPlayer(player, "Steps").textContent = `步數 ${round.steps}`;
}

function chooseLinear(player, index) {
  if (!canChoose(player)) return;
  const round = state.playerRound[player];
  if (round.path.includes(index)) return;
  countStep(player);
  round.path.push(index);
  const value = state.round.playerData[player].values[index];
  value === state.round.target ? solve(player) : guide(player, "不是這張，繼續翻");
  renderBoard(player);
}

function startSortDrag(event, player, index) {
  if (!canChoose(player)) return;
  event.preventDefault();
  const existingDrag = getPlayerSortDrag(player);
  if (existingDrag) cancelSortDrag(existingDrag.pointerId);

  const round = state.playerRound[player];
  const value = state.round.playerData[player].values[index];
  round.sortDragIndex = index;
  const drag = {
    player,
    fromIndex: index,
    overIndex: index,
    pointerId: event.pointerId,
    ghost: makeDragGhost(event.currentTarget, value),
  };
  state.sortDrags.set(event.pointerId, drag);
  guide(player, "拖到空位放開");
  renderBoard(player);
  moveDragGhost(event, drag);

  window.addEventListener("pointermove", moveSortDrag, { passive: false });
  window.addEventListener("pointerup", finishSortDrag);
  window.addEventListener("pointercancel", cancelSortDrag);
}

function moveSortDrag(event) {
  const drag = state.sortDrags.get(event.pointerId);
  if (!drag) return;
  event.preventDefault();
  moveDragGhost(event, drag);

  const nextOverIndex = getSortInsertIndex(event.clientX, event.clientY, drag.player);
  if (nextOverIndex !== drag.overIndex) {
    drag.overIndex = nextOverIndex;
    renderBoard(drag.player);
  }
}

function finishSortDrag(event) {
  const drag = state.sortDrags.get(event.pointerId);
  if (!drag) return;
  event.preventDefault();
  state.sortDrags.delete(event.pointerId);
  cleanupSortDragListeners();
  const player = drag.player;
  const round = state.playerRound[player];
  const first = drag.fromIndex;
  const second = getSortInsertIndex(event.clientX, event.clientY, player);
  round.sortDragIndex = null;
  removeDragGhost(drag);
  if (!state.running) {
    renderBoard(player);
    return;
  }
  if (first === null || first === undefined) {
    renderBoard(player);
    return;
  }

  const values = state.round.playerData[player].values;
  const moved = values[first];
  const remaining = values.filter((_, index) => index !== first);
  const insertIndex = Math.max(0, Math.min(second, remaining.length));
  if (insertIndex === first) {
    guide(player, "沒有移動，繼續拖拉排序");
    renderBoard(player);
    return;
  }

  remaining.splice(insertIndex, 0, moved);
  state.round.playerData[player].values = remaining;
  countStep(player);
  round.path.push(`${first}->${insertIndex}`);
  if (isDescending(remaining)) {
    renderBoard(player);
    solve(player);
    return;
  }
  guide(player, "移動完成，繼續拖拉排序");
  renderBoard(player);
}

function isDescending(values) {
  return values.every((value, index) => index === 0 || values[index - 1] >= value);
}

function cancelSortDrag(eventOrPointerId) {
  const pointerId = typeof eventOrPointerId === "number" ? eventOrPointerId : eventOrPointerId?.pointerId;
  const drag = state.sortDrags.get(pointerId);
  if (!drag) return;
  state.sortDrags.delete(pointerId);
  removeDragGhost(drag);
  if (state.playerRound[drag.player]) {
    state.playerRound[drag.player].sortDragIndex = null;
    renderBoard(drag.player);
  }
  cleanupSortDragListeners();
}

function getPlayerSortDrag(player) {
  return [...state.sortDrags.values()].find((drag) => drag.player === player) ?? null;
}

function cancelAllSortDrags() {
  [...state.sortDrags.keys()].forEach(cancelSortDrag);
}

function getSortInsertIndex(x, y, player) {
  const board = byPlayer(player, "Board");
  const slots = [...board.querySelectorAll("[data-drop-slot]")].filter((slot) => slot.offsetParent !== null);
  if (!slots.length) return 0;
  const pointed = document.elementFromPoint(x, y)?.closest("[data-drop-slot]");
  if (pointed && board.contains(pointed)) return Number(pointed.dataset.dropSlot);

  let closestIndex = 0;
  let closestDistance = Infinity;
  slots.forEach((slot) => {
    const rect = slot.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(centerX - x, centerY - y);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = Number(slot.dataset.dropSlot);
    }
  });
  return closestIndex;
}

function makeDragGhost(source, value) {
  const rect = source.getBoundingClientRect();
  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  ghost.textContent = value;
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  document.body.append(ghost);
  return ghost;
}

function moveDragGhost(event, drag = state.sortDrags.get(event.pointerId)) {
  const ghost = drag?.ghost;
  if (!ghost) return;
  ghost.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
}

function removeDragGhost(drag) {
  drag?.ghost?.remove();
}

function cleanupSortDragListeners() {
  if (state.sortDrags.size > 0) return;
  window.removeEventListener("pointermove", moveSortDrag);
  window.removeEventListener("pointerup", finishSortDrag);
  window.removeEventListener("pointercancel", cancelSortDrag);
}

function openHashBucket(player, key) {
  if (!canChoose(player)) return;
  const round = state.playerRound[player];
  if (round.activeBucket === key) return;
  countStep(player);
  round.activeBucket = key;
  round.path.push(key);
  byPlayer(player, "State").textContent = "看看這個色塊裡有沒有寶物";
  renderBoard(player);
}

function chooseHashItem(player, key, item) {
  if (!canChoose(player)) return;
  const round = state.playerRound[player];
  const marker = `${key}:${item}`;
  if (round.path.includes(marker)) return;
  countStep(player);
  round.path.push(marker);
  if (key === state.round.targetGroup.key && item === state.round.target) {
    round.foundHashItem = marker;
    renderBoard(player);
    setTimeout(() => {
      if (state.running && !round.solved) solve(player);
    }, 450);
    return;
  }
  guide(player, "不是這個寶物，繼續找");
  renderBoard(player);
}

function chooseTree(player, nodeIndex) {
  if (!canChoose(player)) return;
  const round = state.playerRound[player];
  const tree = state.round.playerData[player].tree;
  const node = tree.nodes.find((item) => item.id === nodeIndex);
  if (!node || !isTreeNodeVisible(player, node) || isTreeNodeLocked(player, node)) return;

  if (round.path.includes(nodeIndex)) {
    closeTreePathFrom(player, nodeIndex);
    guide(player, "已關閉這條路，可以回頭重選");
    renderBoard(player);
    return;
  }

  countStep(player);
  round.path.push(nodeIndex);
  if (node.value === state.round.target) {
    solve(player);
  } else {
    guide(player, node.value < state.round.target ? "目標比較大，繼續往下找" : "目標比較小，繼續往下找");
  }
  renderBoard(player);
}

function isTreeNodeVisible(player, node) {
  const round = state.playerRound[player];
  return node.parentId === null || round.path.includes(node.parentId);
}

function isTreeNodeLocked(player, node) {
  if (node.parentId === null) return false;
  const selectedSibling = getSelectedChildId(player, node.parentId);
  return selectedSibling !== null && selectedSibling !== node.id;
}

function getSelectedChildId(player, parentId) {
  const tree = state.round.playerData[player].tree;
  const parent = tree.nodes.find((item) => item.id === parentId);
  if (!parent) return null;
  const round = state.playerRound[player];
  return [parent.leftId, parent.rightId].find((childId) => childId !== null && round.path.includes(childId)) ?? null;
}

function closeTreePathFrom(player, nodeId) {
  const tree = state.round.playerData[player].tree;
  const closeIds = new Set([nodeId]);
  let changed = true;
  while (changed) {
    changed = false;
    tree.nodes.forEach((node) => {
      if (node.parentId !== null && closeIds.has(node.parentId) && !closeIds.has(node.id)) {
        closeIds.add(node.id);
        changed = true;
      }
    });
  }
  state.playerRound[player].path = state.playerRound[player].path.filter((id) => !closeIds.has(id));
}

function nodeHint(node) {
  if (node.parentId === null) return "第一棵樹";
  return node.branch === "left" ? "比較小" : "比較大";
}

function miss(player, message) {
  const round = state.playerRound[player];
  round.wrong += 1;
  state.scores[player] = Math.max(0, state.scores[player] - 1);
  state.streaks[player] = 0;
  byPlayer(player, "State").textContent = message;
  byPlayer(player, "Score").textContent = state.scores[player];
  byPlayer(player, "Streak").textContent = "連擊 0";
}

function guide(player, message) {
  byPlayer(player, "State").textContent = message;
}

function solve(player) {
  const round = state.playerRound[player];
  round.solved = true;
  round.finishMs = Date.now();
  const speedBonus = Math.max(0, state.secondsLeft);
  const stepBonus = Math.max(0, 14 - round.steps);
  const streakBonus = state.streaks[player] + 1;
  state.streaks[player] += 1;
  state.scores[player] += 20 + speedBonus + stepBonus + streakBonus;
  byPlayer(player, "State").textContent =
    state.round.type.id === "binary" ? `排好了！${round.steps} 次交換` : `找到了！${round.steps} 步完成`;
  byPlayer(player, "Score").textContent = state.scores[player];
  byPlayer(player, "Streak").textContent = `連擊 ${state.streaks[player]}`;
  document.querySelector(`[data-player="${player}"]`).classList.add("pulse-win");
  setTimeout(() => document.querySelector(`[data-player="${player}"]`).classList.remove("pulse-win"), 540);
  if (players.every((item) => state.playerRound[item].solved)) endRound();
}

function startTimer() {
  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    state.secondsLeft -= 1;
    els.timerText.textContent = state.secondsLeft;
    if (state.secondsLeft <= 0) {
      if (state.mode === "arcade") endArcadeRound();
      else endRound();
    }
  }, 1000);
}

function endRound() {
  if (!state.running) return;
  state.running = false;
  clearInterval(state.timerId);
  players.forEach((player) => {
    if (!state.playerRound[player].solved) {
      state.streaks[player] = 0;
      byPlayer(player, "State").textContent = "時間到";
      byPlayer(player, "Streak").textContent = "連擊 0";
    }
  });
  recordRound();
  showRoundResult();
  els.nextButton.disabled = state.roundIndex >= TOTAL_ROUNDS - 1;
}

function renderArcadeRound() {
  const gameId = arcadeGames[state.arcade.index];
  state.secondsLeft = 60;
  state.running = true;
  state.arcade.player = makePlayerData(() => buildArcadePlayer(gameId));
  els.roundLabel.textContent = `Game ${state.arcade.index + 1} / ${arcadeGames.length}`;
  els.methodText.textContent = arcadeTitle(gameId);
  els.missionText.textContent = arcadeMission(gameId);
  els.timerText.textContent = state.secondsLeft;
  els.startButton.disabled = true;
  els.nextButton.disabled = state.arcade.index >= arcadeGames.length - 1;
  els.roundTrack.innerHTML = "";
  for (let i = 0; i < arcadeGames.length; i += 1) {
    const dot = document.createElement("span");
    dot.className = "round-dot";
    if (i < state.arcade.index) dot.classList.add("done");
    if (i === state.arcade.index) dot.classList.add("active");
    els.roundTrack.append(dot);
  }
  players.forEach((player) => {
    byPlayer(player, "Score").textContent = state.scores[player];
    byPlayer(player, "Streak").textContent = `完成 ${state.arcade.index} / ${arcadeGames.length}`;
    byPlayer(player, "Steps").textContent = "步數 0";
    byPlayer(player, "State").textContent = "開始";
    const board = byPlayer(player, "Board");
    board.className = `board arcade ${gameId}`;
    renderArcadeBoard(player);
  });
  startTimer();
}

function buildArcadePlayer(gameId) {
  if (gameId === "image") {
    const pattern = sample(imagePatterns);
    return { gameId, pattern, grid: Array.from({ length: 6 }, () => Array(6).fill(0)), row: 0, steps: 0, solved: false };
  }
  if (gameId === "rescue") return makeRescueState();
  return { gameId, questions: shuffle([...Array(15)].map((_, index) => index + 1)).slice(0, 5), index: 0, lights: [0, 0, 0, 0], steps: 0, solved: false };
}

function arcadeTitle(gameId) {
  return { image: "Image Representation", rescue: "Rescue Mission", bits: "How Binary Digits Work" }[gameId];
}

function arcadeMission(gameId) {
  if (gameId === "image") return "依照 0/1 題目完成 6x6 黑白圖";
  if (gameId === "rescue") return "控制機器人回家";
  return "點亮 8、4、2、1";
}

function renderArcadeBoard(player) {
  const data = state.arcade.player[player];
  const board = byPlayer(player, "Board");
  board.innerHTML = "";
  if (data.gameId === "image") renderImageGame(board, player, data);
  if (data.gameId === "rescue") renderRescueGame(board, player, data);
  if (data.gameId === "bits") renderBitsGame(board, player, data);
}

function renderImageGame(board, player, data) {
  const prompt = document.createElement("div");
  prompt.className = "arcade-helper";
  prompt.innerHTML = data.solved ? `<strong>${data.pattern.name} 完成</strong>` : `<strong>第 ${data.row + 1} 行：${data.pattern.rows[data.row]}</strong>`;
  board.append(prompt);
  const grid = document.createElement("div");
  grid.className = "pixel-grid";
  data.grid.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = `pixel-cell ${value ? "on" : "off"}`;
      cell.textContent = value;
      cell.disabled = data.solved || rowIndex !== data.row;
      if (rowIndex < data.row) cell.classList.add("done");
      cell.addEventListener("pointerdown", () => togglePixel(player, rowIndex, colIndex));
      grid.append(cell);
    });
  });
  board.append(grid);
}

function togglePixel(player, row, col) {
  const data = state.arcade.player[player];
  if (!state.running || data.solved || row !== data.row) return;
  data.grid[row][col] = data.grid[row][col] ? 0 : 1;
  data.steps += 1;
  byPlayer(player, "Steps").textContent = `步數 ${data.steps}`;
  if (data.grid[row].join("") === data.pattern.rows[row]) {
    data.row += 1;
    if (data.row >= 6) solveArcadePlayer(player);
  }
  renderArcadeBoard(player);
}

function makeRescueState() {
  const size = 10;
  const startOptions = [
    { r: 0, c: 0 },
    { r: 0, c: size - 1 },
    { r: size - 1, c: 0 },
    { r: size - 1, c: size - 1 },
  ];
  const robot = sample(startOptions);
  let home = sample(startOptions.filter((spot) => Math.abs(spot.r - robot.r) + Math.abs(spot.c - robot.c) >= size + 4));
  if (!home) {
    home = { r: Math.floor(Math.random() * size), c: Math.floor(Math.random() * size) };
    while (home.r === robot.r && home.c === robot.c) home = { r: Math.floor(Math.random() * size), c: Math.floor(Math.random() * size) };
  }
  let walls = new Set();
  do {
    walls = new Set();
    while (walls.size < 22) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      if ((r === robot.r && c === robot.c) || (r === home.r && c === home.c)) continue;
      walls.add(`${r}:${c}`);
    }
  } while (shortestMazePath(robot, home, walls, size) < 18);
  return { gameId: "rescue", size, robot, home, walls, dir: Math.floor(Math.random() * 4), steps: 0, solved: false };
}

function shortestMazePath(start, home, walls, size = 8) {
  const queue = [{ ...start, distance: 0 }];
  const seen = new Set([`${start.r}:${start.c}`]);
  while (queue.length) {
    const current = queue.shift();
    if (current.r === home.r && current.c === home.c) return current.distance;
    [{ r: -1, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 0, c: -1 }].forEach((delta) => {
      const next = { r: current.r + delta.r, c: current.c + delta.c };
      const key = `${next.r}:${next.c}`;
      if (next.r < 0 || next.r >= size || next.c < 0 || next.c >= size || walls.has(key) || seen.has(key)) return;
      seen.add(key);
      queue.push({ ...next, distance: current.distance + 1 });
    });
  }
  return -1;
}

function renderRescueGame(board, player, data) {
  const controls = document.createElement("div");
  controls.className = "robot-controls";
  [["left", "左轉"], ["forward", "前進"], ["right", "右轉"]].forEach(([action, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("pointerdown", () => moveRobot(player, action));
    controls.append(button);
  });
  const grid = document.createElement("div");
  grid.className = "maze-grid";
  grid.style.setProperty("--maze-size", data.size ?? 8);
  for (let r = 0; r < (data.size ?? 8); r += 1) {
    for (let c = 0; c < (data.size ?? 8); c += 1) {
      const cell = document.createElement("div");
      cell.className = "maze-cell";
      if (data.walls.has(`${r}:${c}`)) cell.classList.add("wall");
      if (data.home.r === r && data.home.c === c) cell.textContent = "🏠";
      if (data.robot.r === r && data.robot.c === c) {
        cell.classList.add("robot");
        cell.dataset.dir = robotDirection(data.dir);
        cell.textContent = "🤖";
      }
      grid.append(cell);
    }
  }
  board.append(controls, grid);
}

function robotDirection(dir) {
  return ["↑", "→", "↓", "←"][dir];
}

function moveRobot(player, action) {
  const data = state.arcade.player[player];
  if (!state.running || data.solved) return;
  if (action === "left") data.dir = (data.dir + 3) % 4;
  if (action === "right") data.dir = (data.dir + 1) % 4;
  if (action === "forward") {
    const delta = [{ r: -1, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 0, c: -1 }][data.dir];
    const next = { r: data.robot.r + delta.r, c: data.robot.c + delta.c };
    const size = data.size ?? 8;
    if (next.r >= 0 && next.r < size && next.c >= 0 && next.c < size && !data.walls.has(`${next.r}:${next.c}`)) data.robot = next;
  }
  data.steps += 1;
  byPlayer(player, "Steps").textContent = `步數 ${data.steps}`;
  if (data.robot.r === data.home.r && data.robot.c === data.home.c) solveArcadePlayer(player);
  renderArcadeBoard(player);
}

function renderBitsGame(board, player, data) {
  const target = data.questions[data.index] ?? 0;
  const helper = document.createElement("div");
  helper.className = "arcade-helper";
  helper.innerHTML = data.correctFlash
    ? `<strong>答對！</strong><small>${target} = ${data.lights.map((bit, index) => bit * [8, 4, 2, 1][index]).filter(Boolean).join(" + ") || 0}</small>`
    : `<strong>${target}</strong><small>${data.index + 1} / 5</small>`;
  const lights = document.createElement("div");
  lights.className = "bits-grid";
  [8, 4, 2, 1].forEach((weight, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `bit-light ${data.lights[index] ? "on" : ""}`;
    button.innerHTML = `<strong>${weight}</strong><span>${data.lights[index]}</span>`;
    button.disabled = data.correctFlash;
    button.addEventListener("pointerdown", () => toggleBit(player, index));
    lights.append(button);
  });
  board.append(helper, lights);
}

function toggleBit(player, index) {
  const data = state.arcade.player[player];
  if (!state.running || data.solved || data.correctFlash) return;
  data.lights[index] = data.lights[index] ? 0 : 1;
  data.steps += 1;
  const value = data.lights.reduce((sum, bit, bitIndex) => sum + bit * [8, 4, 2, 1][bitIndex], 0);
  if (value === data.questions[data.index]) {
    data.correctFlash = true;
    window.setTimeout(() => advanceBitsQuestion(player), 500);
  }
  byPlayer(player, "Steps").textContent = `步數 ${data.steps}`;
  renderArcadeBoard(player);
}

function advanceBitsQuestion(player) {
  const data = state.arcade.player[player];
  if (!data || data.solved) return;
  data.index += 1;
  data.lights = [0, 0, 0, 0];
  data.correctFlash = false;
  if (data.index >= 5) solveArcadePlayer(player);
  renderArcadeBoard(player);
}

function solveArcadePlayer(player) {
  const data = state.arcade.player[player];
  if (data.solved) return;
  data.solved = true;
  const bonus = Math.max(0, state.secondsLeft);
  state.scores[player] += 50 + bonus;
  byPlayer(player, "Score").textContent = state.scores[player];
  byPlayer(player, "State").textContent = "完成！";
  if (players.every((item) => state.arcade.player[item].solved)) endArcadeRound();
}

function endArcadeRound() {
  if (!state.running) return;
  state.running = false;
  clearInterval(state.timerId);
  const final = state.arcade.index >= arcadeGames.length - 1;
  if (final) showArcadeFinal();
  else showArcadeRoundResult();
}

function showArcadeRoundResult() {
  els.resultTitle.textContent = "小關完成";
  els.resultSummary.textContent = `總分：左 ${state.scores.left}：右 ${state.scores.right}`;
  els.resultStats.innerHTML = `<div class="stat-box"><strong>下一關</strong>${arcadeTitle(arcadeGames[state.arcade.index + 1])}</div>`;
  els.closeResultButton.textContent = "下一回合";
  els.resultDialog.showModal();
}

function showArcadeFinal() {
  const winner = state.scores.left === state.scores.right ? "平手" : state.scores.left > state.scores.right ? "左玩家獲勝" : "右玩家獲勝";
  els.resultTitle.textContent = winner;
  els.resultSummary.textContent = `總分：左玩家 ${state.scores.left}：右玩家 ${state.scores.right}`;
  els.resultStats.innerHTML = `<div class="fireworks" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
  els.closeResultButton.textContent = "回首頁";
  els.resultDialog.showModal();
}

function nextArcadeRound() {
  if (els.resultDialog.open) els.resultDialog.close();
  if (!state.arcade || state.arcade.index >= arcadeGames.length - 1) {
    showHome();
    return;
  }
  clearInterval(state.timerId);
  state.arcade.index += 1;
  renderArcadeRound();
}

function recordRound() {
  const left = state.playerRound.left;
  const right = state.playerRound.right;
  const winner =
    left.solved && right.solved
      ? left.finishMs <= right.finishMs
        ? "left"
        : "right"
      : left.solved
        ? "left"
        : right.solved
          ? "right"
          : "none";
  state.history.push({
    type: state.round.type.id,
    label: state.round.type.label,
    winner,
    left: { ...left },
    right: { ...right },
  });
}

function showRoundResult() {
  const latest = state.history[state.history.length - 1];
  const left = latest.left;
  const right = latest.right;
  const isFinal = state.roundIndex === TOTAL_ROUNDS - 1;
  if (isFinal) {
    showFinalResult();
    return;
  }
  els.resultTitle.textContent =
    latest.winner === "none" ? "這回合平手" : `${latest.winner === "left" ? "左玩家" : "右玩家"}搶先找到`;
  els.resultSummary.textContent = state.round.type.tip;
  els.resultStats.innerHTML = `
    <div class="stat-box"><strong>左玩家</strong>${left.solved ? `${left.steps} 步找到` : "時間到"}</div>
    <div class="stat-box"><strong>右玩家</strong>${right.solved ? `${right.steps} 步找到` : "時間到"}</div>
  `;
  els.resultDialog.showModal();
}

function showFinalResult() {
  const winner =
    state.scores.left === state.scores.right
      ? "平手"
      : state.scores.left > state.scores.right
        ? "左玩家獲勝"
        : "右玩家獲勝";
  els.resultTitle.textContent = winner;
  els.resultSummary.textContent = `總分：左玩家 ${state.scores.left}：右玩家 ${state.scores.right}`;
  els.resultStats.innerHTML = `
    <div class="fireworks" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span>
      <span></span><span></span><span></span><span></span><span></span>
      <span></span><span></span>
    </div>
  `;
  els.closeResultButton.textContent = "再玩一次";
  els.resultDialog.showModal();
}

function bestPlayerBy(metric) {
  const totals = { left: [], right: [] };
  state.history.forEach((round) => {
    players.forEach((player) => {
      if (round[player].solved) totals[player].push(round[player][metric]);
    });
  });
  const avg = (items) => items.reduce((sum, item) => sum + item, 0) / Math.max(1, items.length);
  if (!totals.left.length && !totals.right.length) return "還沒有人找到";
  if (avg(totals.left) === avg(totals.right)) return "兩人一樣棒";
  return avg(totals.left) < avg(totals.right) ? "左玩家" : "右玩家";
}

function bestMethod() {
  const methods = {};
  state.history.forEach((round) => {
    const solvedSteps = players
      .map((player) => round[player])
      .filter((item) => item.solved)
      .map((item) => item.steps);
    if (!solvedSteps.length) return;
    methods[round.label] ??= [];
    methods[round.label].push(Math.min(...solvedSteps));
  });
  const ranked = Object.entries(methods)
    .map(([label, steps]) => ({
      label,
      avg: steps.reduce((sum, item) => sum + item, 0) / steps.length,
    }))
    .sort((a, b) => a.avg - b.avg);
  return ranked[0]?.label ?? "再玩一次看看";
}

function nextRound() {
  if (state.mode === "arcade") {
    nextArcadeRound();
    return;
  }
  if (els.resultDialog.open) els.resultDialog.close();
  if (state.roundIndex >= TOTAL_ROUNDS - 1) return;
  clearInterval(state.timerId);
  cancelAllSortDrags();
  state.running = false;
  state.roundIndex += 1;
  renderRound();
}

function resetGame() {
  clearInterval(state.timerId);
  cancelAllSortDrags();
  state.mode = "treasure";
  state.arcade = null;
  state.roundIndex = 0;
  state.secondsLeft = ROUND_SECONDS;
  state.running = false;
  state.round = null;
  state.scores = { left: 0, right: 0 };
  state.streaks = { left: 0, right: 0 };
  state.playerRound = {};
  state.history = [];

  els.startButton.disabled = false;
  els.nextButton.disabled = true;
  els.closeResultButton.textContent = "繼續";
  els.missionText.textContent = "準備開始尋寶！";
  els.methodText.textContent = "一張一張翻";
  players.forEach((player) => {
    byPlayer(player, "Board").innerHTML = "";
    byPlayer(player, "Board").className = "board linear";
    byPlayer(player, "State").textContent = "等待開始";
  });
  renderShell();
}

els.treasureModeButton.addEventListener("click", startTreasureMode);
els.arcadeModeButton.addEventListener("click", startArcadeMode);
els.startButton.addEventListener("click", () => {
  if (state.mode === "arcade") renderArcadeRound();
  else renderRound();
});
els.nextButton.addEventListener("click", nextRound);
els.resetButton.addEventListener("click", () => {
  if (state.mode === "arcade") startArcadeMode();
  else resetGame();
});
els.homeButton.addEventListener("click", showHome);
els.fullscreenButton.addEventListener("click", () => {
  if (document.body.classList.contains("play-mode") || document.fullscreenElement) {
    exitPlayMode();
  } else {
    toggleFullscreen();
  }
});
document.addEventListener("fullscreenchange", syncFullscreenButton);
["gesturestart", "gesturechange", "gestureend"].forEach((eventName) => {
  document.addEventListener(
    eventName,
    (event) => {
      if (document.body.classList.contains("play-mode")) event.preventDefault();
    },
    { passive: false },
  );
});
els.closeResultButton.addEventListener("click", () => {
  els.resultDialog.close();
  if (state.mode === "arcade") {
    state.arcade && state.arcade.index >= arcadeGames.length - 1 ? showHome() : nextArcadeRound();
    return;
  }
  state.roundIndex >= TOTAL_ROUNDS - 1 ? resetGame() : nextRound();
});

showHome();
