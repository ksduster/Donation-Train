/***** Donation Train (StreamElements) – field-driven, single smokestack *****/

let SETTINGS = {
  trainDurationSec: 240,     // 4 minutes
  cooldownSec: 3600,         // 60 minutes
  avatarSizePx: 64,
  nameFontPx: 14,
  amountFontPx: 16,
  amountColor: "#FFD700",
  nameColor: "#FFFFFF",

  locomotiveUrl: "",
  carFrameUrl: "",
  smokeUrl: "",

  minDonations: 3,
  showScoreboardSec: 10,

  smokeBaseCount: 3,          // base puffs per emission
  smokeScaleDonations: 15,    // stage every N donations
  smokeScaleAmount: 15,       // stage every $N
  smokeMaxPuffs: 20
};

// ====== STATE ======
let trainActive = false;
let inCooldown = false;
let trainTimer = null;
let cooldownTimer = null;
let scoreboardTimer = null;
const queue = [];
const totals = new Map();
let donationCount = 0;
let donationSum = 0;
let smokeTimeout = null;

// ====== HELPERS ======
function money(n) {
  const num = Number(n);
  return isNaN(num) ? "$0.00" : "$" + num.toFixed(2);
}

function getAvatarFromEvent(evt) {
  return evt.avatar || evt.profileImage || evt.image || "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_150x150.png";
}

function ensureLocomotiveScaffold() {
  const row = document.getElementById("train-row");
  if (!row) return null;

  let locoContainer = document.getElementById("locomotive");
  if (!locoContainer || !row.contains(locoContainer)) {
    locoContainer = document.createElement("div");
    locoContainer.id = "locomotive";
    row.prepend(locoContainer);
  }

  locoContainer.style.position = "relative";
  locoContainer.style.display = "inline-block";
  locoContainer.innerHTML = "";

  const locoImg = document.createElement("img");
  locoImg.id = "locomotive-img";
  locoImg.className = "locomotive";
  locoImg.src = SETTINGS.locomotiveUrl || "";
  locoImg.style.height = Math.round(SETTINGS.avatarSizePx * 1.8) + "px";
  locoContainer.appendChild(locoImg);

  const smoke = document.createElement("div");
  smoke.id = "smoke-container";
  locoContainer.appendChild(smoke);

  startSmokeLoop(); // start continuous smoke
  return locoContainer;
}

function scheduleTrainEnd() {
  clearTimeout(trainTimer);
  trainTimer = setTimeout(endTrain, SETTINGS.trainDurationSec * 1000);
}

function processTip(tip) {
  totals.set(tip.name, (totals.get(tip.name) || 0) + tip.amount);
  donationCount++;
  donationSum += tip.amount;
  addOrReplaceCar(tip);
  scheduleTrainEnd();
}

function startTrain() {
  trainActive = true;
  donationCount = 0;
  donationSum = 0;
  totals.clear();

  const row = document.getElementById("train-row");
  if (row) row.innerHTML = "";

  ensureLocomotiveScaffold();

  for (const t of queue) processTip(t);
  queue.length = 0;

  scheduleTrainEnd();
}

function addOrReplaceCar(tip) {
  const row = document.getElementById("train-row");
  if (!row) return;

  const loco = document.getElementById("locomotive");
  if (loco && row.firstChild !== loco) row.prepend(loco);

  // Remove existing donor car (if updating amount)
  const existing = row.querySelector(`[data-donor="${CSS.escape(tip.name)}"]`);
  if (existing) existing.remove();

  // Create new car
  const car = document.createElement("div");
  car.className = "train-car";
  car.dataset.donor = tip.name;

  const amount = document.createElement("div");
  amount.className = "amount-badge";
  amount.textContent = money(totals.get(tip.name) || 0);
  amount.style.fontSize = SETTINGS.amountFontPx + "px";
  amount.style.color = SETTINGS.amountColor;
  car.appendChild(amount);

  if (SETTINGS.carFrameUrl) {
    const frame = document.createElement("div");
    frame.className = "car-frame";
    frame.style.setProperty("--car-w", Math.round(SETTINGS.avatarSizePx * 1.7) + "px");
    frame.style.setProperty("--car-h", Math.round(SETTINGS.avatarSizePx * 1.2) + "px");
    frame.style.backgroundImage = `url("${SETTINGS.carFrameUrl}")`;

    const avatar = document.createElement("img");
    avatar.className = "avatar";
    avatar.src = tip.avatar;
    avatar.width = SETTINGS.avatarSizePx;
    avatar.height = SETTINGS.avatarSizePx;

    frame.appendChild(avatar);
    car.appendChild(frame);
  } else {
    const avatar = document.createElement("img");
    avatar.className = "avatar";
    avatar.src = tip.avatar;
    avatar.width = SETTINGS.avatarSizePx;
    avatar.height = SETTINGS.avatarSizePx;
    car.appendChild(avatar);
  }

  const name = document.createElement("div");
  name.className = "donor-name";
  name.style.fontSize = SETTINGS.nameFontPx + "px";
  name.style.color = SETTINGS.nameColor;
  name.textContent = tip.name;
  car.appendChild(name);

  // 🔑 Insert car into the correct position based on donor total
  const donorTotal = totals.get(tip.name) || 0;
  let inserted = false;

  for (let node of row.querySelectorAll(".train-car")) {
    const nodeName = node.dataset.donor;
    const nodeTotal = totals.get(nodeName) || 0;

    if (donorTotal > nodeTotal) {
      row.insertBefore(car, node);
      inserted = true;
      break;
    }
  }

  // If not inserted (lowest donor), append at the end
  if (!inserted) row.appendChild(car);
}


// ====== SCOREBOARD ======
function buildScoreboardHtml() {
  const entries = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, total]) => `<div class="entry">${name} — ${money(total)}</div>`)
    .join("");
  return `<h2>Top Donors This Train</h2>${entries || "<div class='entry'>No donors</div>"}`;
}

function endTrain() {
  trainActive = false;

  const row = document.getElementById("train-row");
  if (row) row.innerHTML = "";

  const sb = document.getElementById("scoreboard");
  if (sb) {
    sb.innerHTML = buildScoreboardHtml();
    sb.classList.remove("hidden");
    clearTimeout(scoreboardTimer);
    scoreboardTimer = setTimeout(() => sb.classList.add("hidden"), SETTINGS.showScoreboardSec * 1000);
  }

  inCooldown = true;
  clearTimeout(cooldownTimer);
  cooldownTimer = setTimeout(() => { inCooldown = false; }, SETTINGS.cooldownSec * 1000);
}

// ====== STREAMELEMENTS HOOKS ======
window.addEventListener("onWidgetLoad", (obj) => {
  const fd = (obj && obj.detail && obj.detail.fieldData) || {};

  if (fd.locomotiveUrl) SETTINGS.locomotiveUrl = String(fd.locomotiveUrl);
  if (fd.carUrl)        SETTINGS.carFrameUrl   = String(fd.carUrl);
  if (fd.smokeUrl)      SETTINGS.smokeUrl      = String(fd.smokeUrl);
  if (!SETTINGS.locomotiveUrl && typeof fd["0"] === "string") SETTINGS.locomotiveUrl = fd["0"];
  if (!SETTINGS.carFrameUrl   && typeof fd["1"] === "string") SETTINGS.carFrameUrl   = fd["1"];
  if (!SETTINGS.smokeUrl      && typeof fd["2"] === "string") SETTINGS.smokeUrl      = fd["2"];

  if (fd.minDonations != null) SETTINGS.minDonations = Number(fd.minDonations);
  if (fd.cooldownMinutes != null) SETTINGS.cooldownSec = Number(fd.cooldownMinutes) * 60;
  else if (fd.cooldownDuration != null) SETTINGS.cooldownSec = Number(fd.cooldownDuration) * 60;

  if (fd.trainDurationMinutes != null)  SETTINGS.trainDurationSec = Number(fd.trainDurationMinutes) * 60;
  else if (fd.trainDuration != null)    SETTINGS.trainDurationSec = Number(fd.trainDuration) * 60;

  if (fd.avatarSize != null) SETTINGS.avatarSizePx = Number(fd.avatarSize);
  else if (fd.carSize != null) SETTINGS.avatarSizePx = Number(fd.carSize);

  if (fd.fontSize != null) {
    SETTINGS.nameFontPx = Number(fd.fontSize);
    SETTINGS.amountFontPx = Number(fd.fontSize);
  }

  if (fd.smokeBaseAmount != null) SETTINGS.smokeBaseCount = Number(fd.smokeBaseAmount);
  if (fd.smokeDonationThreshold != null) {
    const thr = Number(fd.smokeDonationThreshold);
    SETTINGS.smokeScaleDonations = thr;
    SETTINGS.smokeScaleAmount = thr;
  }

  console.log("[Donation Train] Loaded settings:", SETTINGS);
});

window.addEventListener("onEventReceived", (obj) => {
  const detail = obj && obj.detail;
  if (!detail) return;

  const { listener, event } = detail;
  if (listener !== "tip-latest" || !event) return;

  if (inCooldown) {
    console.log("[Donation Train] Tip ignored (cooldown active).");
    return;
  }

  const tip = {
    name: event.name || "Anonymous",
    amount: parseFloat(event.amount || 0) || 0,
    avatar: getAvatarFromEvent(event)
  };

  if (!trainActive) {
    queue.push(tip);
    if (queue.length >= SETTINGS.minDonations) startTrain();
  } else {
    processTip(tip);
  }
});
