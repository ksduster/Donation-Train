/***** Donation Train (StreamElements) – field-driven, single smokestack *****/

let SETTINGS = {
  // Durations
  trainDurationSec: 240,     // 4 minutes
  cooldownSec: 3600,         // 60 minutes

  // Visuals
  avatarSizePx: 64,
  nameFontPx: 14,
  amountFontPx: 16,
  amountColor: "#FFD700",
  nameColor: "#FFFFFF",

  // Images (overridden by fields)
  locomotiveUrl: "https://cdn.streamelements.com/uploads/01k2tphph1dhpsyypwfw9kmh0n.png",
  carFrameUrl: "https://cdn.streamelements.com/uploads/01k2tphgfdrwtvbwt0n8wvz3b4.png",
  smokeUrl: "https://cdn.streamelements.com/uploads/01k2v60z0k2zzg27jgkts3wkfx.png",

  // Train rules
  minDonations: 3,           // donations to start the train
  showScoreboardSec: 15,

  // Smoke controls (kept!)
  smokeBaseCount: 3,          // base puffs per emission
  smokeScaleDonations: 3,    // stage every N donations (used with stage logic below)
  smokeScaleAmount: 15,       // stage every $N
  smokeMaxPuffs: 20
};

// ====== STATE ======
let trainActive = false;
let inCooldown = false;
let trainTimer = null;
let cooldownTimer = null;
let scoreboardTimer = null;

const queue = [];            // tips queued before train starts (trigger donors)
const totals = new Map();    // donor -> total during this train

let donationCount = 0;
let donationSum = 0;

let smokeTimeout = null;

// ====== HELPERS ======
function money(n) {
  const num = Number(n);
  return isNaN(num) ? "$0.00" : "$" + num.toFixed(2);
}

function getAvatarFromEvent(evt) {
  return (
    evt.avatar ||
    evt.profileImage ||
    evt.image ||
    "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_150x150.png"
  );
}

function ensureLocomotiveScaffold() {
  const row = document.getElementById("train-row");
  if (!row) return null;

  // Create or reuse #locomotive at the very start
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

  // continuous smoke
  startSmokeLoop();

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

  // Reset counters for the active train (trigger donors still processed next)
  donationCount = 0;
  donationSum = 0;
  totals.clear();

  const row = document.getElementById("train-row");
  if (row) row.innerHTML = "";

  ensureLocomotiveScaffold();

  // Flush queued donors who triggered the train
  for (const t of queue) processTip(t);
  queue.length = 0;

  scheduleTrainEnd();
}

function addOrReplaceCar(tip) {
  const row = document.getElementById("train-row");
  if (!row) return;

  const loco = document.getElementById("locomotive");
  if (loco && row.firstChild !== loco) row.prepend(loco);

  // Remove existing donor car (if updating)
  const existing = row.querySelector(`[data-donor="${CSS.escape(tip.name)}"]`);
  if (existing) existing.remove();

  // Build car
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

  // Insert sorted by donor total (highest → lowest), always after loco
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
  if (!inserted) row.appendChild(car);
}

// ====== SMOKE LOOP (continuous; stage-driven) ======
function startSmokeLoop() {
  const container = document.getElementById("smoke-container");
  if (!container) return;

  if (smokeTimeout) clearTimeout(smokeTimeout);

  function spawnPuff() {
    // Stage logic:
    // - Donations: hold at stage 0 until minDonations are reached, then step every additional minDonations
    // - Amount: step every smokeScaleAmount dollars
    const stageDonThreshold = Math.max(1, Number(SETTINGS.minDonations) || 1);
    const stageAmtThreshold = Math.max(1, Number(SETTINGS.smokeScaleAmount) || 1);

    const stageDon = Math.max(0, Math.floor((donationCount - stageDonThreshold) / stageDonThreshold));
    const stageAmt = Math.max(0, Math.floor((donationSum  - stageAmtThreshold) / stageAmtThreshold));
    const stage = Math.max(stageDon, stageAmt, 0);

    // Count doubles per stage (capped)
    const count = Math.min(SETTINGS.smokeBaseCount * Math.pow(2, stage), SETTINGS.smokeMaxPuffs);

    // Angle: start ~85° (mostly up), decrease by 10° per stage, floor at 10°
    const angleStart = 85;
    const angleStep = 10;
    const minAngle = 10;
    const angle = Math.max(angleStart - stage * angleStep, minAngle);

    // Opacity ramp: stage 0 → 0.5, stage 1 → 0.75, stage 2 → 1.0, then slightly down to look thicker
    let opacity;
    if (stage <= 2) opacity = 0.5 + stage * 0.25;
    else opacity = Math.max(1.0 - (stage - 2) * 0.1, 0.2);

    // Speed & travel distance
    const speedMultiplier = 1 + stage * 0.15;
    const maxDistY = 60 + stage * 10; // upward travel
    // derive horizontal distance from angle (angle measured from vertical)
    const maxDistX = Math.tan((90 - angle) * Math.PI / 180) * maxDistY;

    for (let i = 0; i < count; i++) {
      const puff = document.createElement("div");
      puff.className = "smoke-puff";
      if (SETTINGS.smokeUrl) puff.style.backgroundImage = `url("${SETTINGS.smokeUrl}")`;
      puff.style.left = (5 + Math.random() * 10) + "px";
      puff.style.opacity = opacity;

      const duration = (3 + Math.random()) / speedMultiplier;
      // slight ±2° randomness
      const angleJitter = angle + (Math.random() * 4 - 2);
      const distXRand = Math.tan((90 - angleJitter) * Math.PI / 180) * maxDistY;

      puff.animate(
        [
          { transform: `translate(0,0) scale(0.6)`, opacity: opacity },
          { transform: `translate(${distXRand}px, ${-maxDistY}px) scale(1.4)`, opacity: 0 }
        ],
        { duration: duration * 1000, easing: "linear" }
      );

      container.appendChild(puff);
      setTimeout(() => puff.remove(), duration * 1000);
    }

    // Interval speeds up by stage (min 200ms)
    const baseInterval = 2000; // 1 puff every 2s at stage 0
    const interval = Math.max(200, baseInterval / (1 + stage * 0.5));
    smokeTimeout = setTimeout(spawnPuff, interval);
  }

  spawnPuff();
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

  // ----- Images (named first, numeric fallback) -----
  SETTINGS.locomotiveUrl = fd.locomotiveUrl || fd["0"] || SETTINGS.locomotiveUrl;
  SETTINGS.carFrameUrl   = fd.carUrl        || fd["1"] || SETTINGS.carFrameUrl;
  SETTINGS.smokeUrl      = fd.smokeUrl      || fd["2"] || SETTINGS.smokeUrl;

  // ----- Train rules -----
  SETTINGS.minDonations = Number(fd.minDonations ?? fd["3"] ?? SETTINGS.minDonations);
  SETTINGS.cooldownSec  = Number(fd.cooldownMinutes ?? fd.cooldownDuration ?? fd["4"] ?? (SETTINGS.cooldownSec / 60)) * 60;
  SETTINGS.trainDurationSec = Number(fd.trainDurationMinutes ?? fd.trainDuration ?? fd["5"] ?? (SETTINGS.trainDurationSec / 60)) * 60;

  // ----- Avatar / font sizes -----
  SETTINGS.avatarSizePx = Number(fd.avatarSize ?? fd.carSize ?? fd["6"] ?? SETTINGS.avatarSizePx);
  SETTINGS.nameFontPx   = Number(fd.fontSize ?? fd["7"] ?? SETTINGS.nameFontPx);
  SETTINGS.amountFontPx = Number(fd.fontSize ?? fd["8"] ?? SETTINGS.amountFontPx);

  // ----- Smoke scaling -----
  if (fd.smokeBaseAmount != null) SETTINGS.smokeBaseCount = Number(fd.smokeBaseAmount ?? fd["7"]);
  if (fd.smokeDonationThreshold != null) {
    const thr = Number(fd.smokeDonationThreshold ?? fd["8"]);
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
    // queue trigger donors until threshold is met
    queue.push(tip);
    if (queue.length >= SETTINGS.minDonations) startTrain();
  } else {
    processTip(tip);
  }
});
