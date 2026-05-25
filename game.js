const ROUND_SECONDS = 24;
const TOTAL_ROUNDS = 10;
const players = ["left", "right"];
const playerNames = { left: "左玩家", right: "右玩家" };
const HASH_GROUPS = [
  { key: "red", name: "紅色入口", color: "#e03131", icon: "紅" },
  { key: "orange", name: "橘色入口", color: "#f08c00", icon: "橘" },
  { key: "yellow", name: "黃色入口", color: "#f2c94c", icon: "黃" },
  { key: "lime", name: "萊姆入口", color: "#82c91e", icon: "萊" },
  { key: "green", name: "綠色入口", color: "#2f9e44", icon: "綠" },
  { key: "mint", name: "薄荷入口", color: "#0ca678", icon: "薄" },
  { key: "teal", name: "藍綠入口", color: "#099268", icon: "藍綠" },
  { key: "cyan", name: "青色入口", color: "#1098ad", icon: "青" },
  { key: "sky", name: "天空入口", color: "#228be6", icon: "天" },
  { key: "blue", name: "藍色入口", color: "#4263eb", icon: "藍" },
  { key: "indigo", name: "靛色入口", color: "#5c7cfa", icon: "靛" },
  { key: "violet", name: "紫色入口", color: "#7048e8", icon: "紫" },
  { key: "grape", name: "葡萄入口", color: "#9c36b5", icon: "葡" },
  { key: "pink", name: "粉色入口", color: "#d6336c", icon: "粉" },
  { key: "rose", name: "玫瑰入口", color: "#f06595", icon: "玫" },
  { key: "brown", name: "棕色入口", color: "#8d6e63", icon: "棕" },
  { key: "gray", name: "灰色入口", color: "#868e96", icon: "灰" },
  { key: "black", name: "黑色入口", color: "#212529", icon: "黑" },
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

const state = {
  roundIndex: 0,
  secondsLeft: ROUND_SECONDS,
  timerId: null,
  running: false,
  round: null,
  scores: { left: 0, right: 0 },
  streaks: { left: 0, right: 0 },
  playerRound: {},
  history: [],
  sortDrag: null,
};

const els = {
  roundLabel: document.querySelector("#roundLabel"),
  missionText: document.querySelector("#missionText"),
  methodText: document.querySelector("#methodText"),
  timerText: document.querySelector("#timerText"),
  roundTrack: document.querySelector("#roundTrack"),
  startButton: document.querySelector("#startButton"),
  nextButton: document.querySelector("#nextButton"),
  resetButton: document.querySelector("#resetButton"),
  resultDialog: document.querySelector("#resultDialog"),
  resultTitle: document.querySelector("#resultTitle"),
  resultSummary: document.querySelector("#resultSummary"),
  resultStats: document.querySelector("#resultStats"),
  closeResultButton: document.querySelector("#closeResultButton"),
};

function byPlayer(id, suffix) {
  return document.querySelector(`#${id}${suffix}`);
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
    playerData: makePlayerData(() => ({ tree: makeTreeData(target, 24) })),
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
  state.secondsLeft = state.round.type.id === "binary" ? 40 : ROUND_SECONDS;
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
  const drag = state.sortDrag?.player === player ? state.sortDrag : null;
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
  playerData.groups.forEach((group) => {
    const open = playerState.activeBucket === group.key;
    const groupItems = playerData.groupItems;
    const bucketSolved = playerState.path.includes(`${group.key}:${state.round.target}`);
    const label = open
      ? `${colorSwatch(group)}<div class="bucket-items">${groupItems[
          group.key
        ]
          .map((item) => `<button type="button" data-item="${item}">${item}</button>`)
          .join("")}</div>`
      : colorSwatch(group);
    const bucket = document.createElement("div");
    bucket.className = "bucket";
    bucket.setAttribute("role", "button");
    bucket.setAttribute("aria-label", group.name);
    bucket.tabIndex = 0;
    bucket.innerHTML = label;
    bucket.addEventListener("pointerdown", () => openHashBucket(player, group.key));
    bucket.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") openHashBucket(player, group.key);
    });
    if (open) bucket.classList.add("open");
    if (bucketSolved) bucket.classList.add("correct");
    if (playerState.path.includes(group.key) && group.key !== state.round.targetGroup.key) bucket.classList.add("wrong");
    bucket.querySelectorAll("[data-item]").forEach((itemButton) => {
      itemButton.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        chooseHashItem(player, group.key, Number(itemButton.dataset.item));
      });
    });
    board.append(bucket);
  });
}

function colorSwatch(group) {
  const shine = "linear-gradient(135deg, rgba(255, 255, 255, 0.32), transparent 48%)";
  return `<span class="color-swatch" style="background:${shine}, ${group.color}" aria-label="${group.name}"></span>`;
}

function renderTreeBoard(board, player) {
  const tree = state.round.playerData[player].tree;
  const playerState = state.playerRound[player];
  tree.nodes.forEach((node) => {
    const available = isTreeNodeAvailable(player, node.id);
    const seen = playerState.path.includes(node.id);
    const label = available || seen ? `${node.value}<small>${nodeHint(node)}</small>` : `?<small>蓋牌</small>`;
    const item = makeButton("tree-node", label, () => chooseTree(player, node.id));
    item.style.gridColumn = `${treeColumn(node)} / span 1`;
    item.style.gridRow = `${node.depth + 1}`;
    if (!available && !seen) {
      item.disabled = true;
      item.classList.add("covered");
    }
    if (seen) item.classList.add(node.value === state.round.target ? "correct" : "visited");
    board.append(item);
  });
}

function treeColumn(node) {
  const columns = 16;
  const slots = 2 ** node.depth;
  return Math.max(1, Math.min(columns, Math.round(((node.position + 0.5) * columns) / slots)));
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
  const round = state.playerRound[player];
  const value = state.round.playerData[player].values[index];
  round.sortDragIndex = index;
  state.sortDrag = {
    player,
    fromIndex: index,
    overIndex: index,
    pointerId: event.pointerId,
    ghost: makeDragGhost(event.currentTarget, value),
  };
  guide(player, "拖到空位放開");
  renderBoard(player);
  moveDragGhost(event);

  window.addEventListener("pointermove", moveSortDrag);
  window.addEventListener("pointerup", finishSortDrag, { once: true });
  window.addEventListener("pointercancel", cancelSortDrag, { once: true });
}

function moveSortDrag(event) {
  const drag = state.sortDrag;
  if (!drag || event.pointerId !== drag.pointerId) return;
  event.preventDefault();
  moveDragGhost(event);

  const nextOverIndex = getSortInsertIndex(event.clientX, event.clientY, drag.player);
  if (nextOverIndex !== drag.overIndex) {
    drag.overIndex = nextOverIndex;
    renderBoard(drag.player);
  }
}

function finishSortDrag(event) {
  const drag = state.sortDrag;
  if (!drag || event.pointerId !== drag.pointerId) return;
  event.preventDefault();
  cleanupSortDragListeners();
  const player = drag.player;
  const round = state.playerRound[player];
  const first = drag.fromIndex;
  const second = getSortInsertIndex(event.clientX, event.clientY, player);
  round.sortDragIndex = null;
  state.sortDrag = null;
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

function cancelSortDrag(player) {
  const drag = state.sortDrag;
  cleanupSortDragListeners();
  if (drag) {
    removeDragGhost(drag);
    const dragPlayer = drag.player;
    state.sortDrag = null;
    if (state.playerRound[dragPlayer]) {
      state.playerRound[dragPlayer].sortDragIndex = null;
      renderBoard(dragPlayer);
    }
    return;
  }
  if (!state.playerRound[player]) return;
  state.playerRound[player].sortDragIndex = null;
  renderBoard(player);
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

function moveDragGhost(event) {
  const ghost = state.sortDrag?.ghost;
  if (!ghost) return;
  ghost.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
}

function removeDragGhost(drag) {
  drag?.ghost?.remove();
}

function cleanupSortDragListeners() {
  window.removeEventListener("pointermove", moveSortDrag);
}

function openHashBucket(player, key) {
  if (!canChoose(player)) return;
  const round = state.playerRound[player];
  if (round.activeBucket === key) return;
  countStep(player);
  round.activeBucket = key;
  if (key !== state.round.targetGroup.key) {
    round.path.push(key);
    miss(player, "分類不對，換一個入口");
  } else {
    byPlayer(player, "State").textContent = "入口對了，點寶物";
  }
  renderBoard(player);
}

function chooseHashItem(player, key, item) {
  if (!canChoose(player)) return;
  const round = state.playerRound[player];
  const marker = `${key}:${item}`;
  if (round.path.includes(marker)) return;
  countStep(player);
  round.path.push(marker);
  key === state.round.targetGroup.key && item === state.round.target
    ? solve(player)
    : miss(player, "寶物編號不對");
  renderBoard(player);
}

function chooseTree(player, nodeIndex) {
  if (!canChoose(player)) return;
  if (!isTreeNodeAvailable(player, nodeIndex)) return;
  const round = state.playerRound[player];
  if (round.path.includes(nodeIndex)) return;
  countStep(player);
  round.path.push(nodeIndex);
  const tree = state.round.playerData[player].tree;
  const node = tree.nodes.find((item) => item.id === nodeIndex);
  if (node.value === state.round.target) {
    solve(player);
  } else if (!isTreeChoiceOnSearchPath(player, node)) {
    miss(player, "方向不對，回到已翻開的分岔再試");
  } else {
    revealTreeChildren(player, node);
    guide(player, node.value < state.round.target ? "目標比較大，翻右邊" : "目標比較小，翻左邊");
  }
  renderBoard(player);
}

function isTreeNodeAvailable(player, nodeIndex) {
  const round = state.playerRound[player];
  return round.treeAvailable.includes(nodeIndex);
}

function isTreeChoiceOnSearchPath(player, node) {
  if (node.parentId === null) return true;
  const tree = state.round.playerData[player].tree;
  const parent = tree.nodes.find((item) => item.id === node.parentId);
  if (!parent || !state.playerRound[player].path.includes(parent.id)) return false;
  const correctChildId = state.round.target < parent.value ? parent.leftId : parent.rightId;
  return node.id === correctChildId;
}

function revealTreeChildren(player, node) {
  const round = state.playerRound[player];
  [node.leftId, node.rightId].forEach((childId) => {
    if (childId !== null && !round.treeAvailable.includes(childId)) {
      round.treeAvailable.push(childId);
    }
  });
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
    if (state.secondsLeft <= 0) endRound();
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
  if (els.resultDialog.open) els.resultDialog.close();
  if (state.roundIndex >= TOTAL_ROUNDS - 1) return;
  clearInterval(state.timerId);
  removeDragGhost(state.sortDrag);
  cleanupSortDragListeners();
  state.sortDrag = null;
  state.running = false;
  state.roundIndex += 1;
  renderRound();
}

function resetGame() {
  clearInterval(state.timerId);
  removeDragGhost(state.sortDrag);
  cleanupSortDragListeners();
  state.roundIndex = 0;
  state.secondsLeft = ROUND_SECONDS;
  state.running = false;
  state.round = null;
  state.scores = { left: 0, right: 0 };
  state.streaks = { left: 0, right: 0 };
  state.playerRound = {};
  state.history = [];
  state.sortDrag = null;
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

els.startButton.addEventListener("click", renderRound);
els.nextButton.addEventListener("click", nextRound);
els.resetButton.addEventListener("click", resetGame);
els.closeResultButton.addEventListener("click", () => {
  els.resultDialog.close();
  state.roundIndex >= TOTAL_ROUNDS - 1 ? resetGame() : nextRound();
});

resetGame();
