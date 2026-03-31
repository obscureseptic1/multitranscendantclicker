const SAVE_KEY = "mtc_save";
const SAVE_VERSION = 3;

const BUILDINGS = [
  { id: "collector", name: "Energy Collector", baseCost: 15, growth: 1.15, baseProd: 0.2, desc: "Basic passive generation." },
  { id: "reactor", name: "Void Reactor", baseCost: 120, growth: 1.17, baseProd: 1.5, desc: "Converts void pressure into energy." },
  { id: "forge", name: "Singularity Forge", baseCost: 900, growth: 1.19, baseProd: 8, desc: "Shapes compact stars into output." },
  { id: "lab", name: "Exotic Lab", baseCost: 4500, growth: 1.2, baseProd: 30, desc: "Amplifies exotic synthesis." },
  { id: "array", name: "Quantum Array", baseCost: 25000, growth: 1.22, baseProd: 130, desc: "Correlates timelines for throughput." },
  { id: "vault", name: "Dark Vault", baseCost: 130000, growth: 1.235, baseProd: 550, desc: "Stores collapsed universes." },
  { id: "spire", name: "Anomaly Spire", baseCost: 650000, growth: 1.245, baseProd: 2200, desc: "Pins anomalies to a productive state." },
  { id: "engine", name: "Multiverse Engine", baseCost: 3.6e6, growth: 1.26, baseProd: 9500, desc: "Late-game throughput engine." },
  { id: "citadel", name: "Transcendent Citadel", baseCost: 1.9e7, growth: 1.27, baseProd: 43000, desc: "Anchors permanent progression." }
];

const DARK_UPGRADES = [
  { id: "dm_click", name: "Dark Resonance", cost: 3, effect: "Click power x2", apply: s => s.clickMult *= 2 },
  { id: "dm_prod", name: "Collapsed Logistics", cost: 8, effect: "All buildings x2", apply: s => s.prodMult *= 2 },
  { id: "dm_exotic", name: "Null Catalysis", cost: 25, effect: "Exotic gain x2", apply: s => s.exoticMult *= 2 },
  { id: "dm_quantum", name: "Gravitic Echo", cost: 60, effect: "Quantum foam gain x2", apply: s => s.quantumMult *= 2 },
  { id: "dm_discount", name: "Dark Efficiency", cost: 125, effect: "Building costs -10%", apply: s => s.costDiscount *= 0.9 },
  { id: "dm_shards", name: "Shard Compression", cost: 250, effect: "Anomaly shards x2", apply: s => s.shardMult *= 2 },
  { id: "dm_scaling", name: "Singularity Blueprint", cost: 500, effect: "Building scaling softened", apply: s => s.scalingSoftener += 0.04 },
  { id: "dm_loop", name: "Dark Loop Architecture", cost: 900, effect: "Late-game multiplier based on DM", apply: s => s.darkLoop = true }
];

const QUANTUM_SYSTEMS = [
  { id: "q_superposition", name: "Superposition Lattice", cost: 2, effect: "Energy production scales with quantum foam.", apply: s => s.qSuper = true },
  { id: "q_entanglement", name: "Entanglement Network", cost: 5, effect: "Buildings get +1% power each owned total.", apply: s => s.qEntanglement = true },
  { id: "q_tunneling", name: "Probability Tunneling", cost: 12, effect: "10% chance each tick to gain burst energy.", apply: s => s.qTunnel = true },
  { id: "q_temporal", name: "Temporal Folding", cost: 25, effect: "Offline gains boosted to 80% efficiency.", apply: s => s.qOffline = true },
  { id: "q_observer", name: "Observer Anchor", cost: 60, effect: "Prestige retains 1% of energy log-scaled.", apply: s => s.qRetain = true },
  { id: "q_field", name: "Quantum Field Compression", cost: 120, effect: "Exotic infusion is 50% stronger.", apply: s => s.qField = true },
  { id: "q_paradox", name: "Paradox Solver", cost: 260, effect: "Anomaly penalties reduced by half.", apply: s => s.qParadox = true }
];

const EXOTIC_SYSTEMS = [
  { id: "ex_infuse", name: "Infusion Node", cost: 4, effect: "Spend exotic matter for permanent +15% production per level.", repeatable: true },
  { id: "ex_lens", name: "Exotic Lens", cost: 20, effect: "Dark matter gain scales with exotic matter.", repeatable: false },
  { id: "ex_condense", name: "Matter Condenser", cost: 40, effect: "Gain +1 anomaly shard per stabilization.", repeatable: false },
  { id: "ex_fractal", name: "Fractal Crucible", cost: 100, effect: "Unlock late-game exotic overcharge.", repeatable: false },
  { id: "ex_overcharge", name: "Overcharge Pulse", cost: 25, effect: "Repeatable: temporary +30% tick speed for 30s.", repeatable: true }
];

const ANOMALIES = [
  { id: "an_minor", name: "Minor Rift", req: 1e4, shard: 1, desc: "Small reward, no penalty." },
  { id: "an_flux", name: "Flux Collapse", req: 2e5, shard: 3, desc: "+shards, -10% production for 25s." },
  { id: "an_paradox", name: "Paradox Bloom", req: 2e6, shard: 8, desc: "Strong reward, temporary click instability." },
  { id: "an_voidstorm", name: "Voidstorm Shear", req: 2e7, shard: 20, desc: "Huge shards + exotic burst, heavy penalty." },
  { id: "an_omega", name: "Omega Divergence", req: 2e8, shard: 50, desc: "End-game anomaly; massive progression spike." }
];

const ACHIEVEMENTS = [
  { id: "a1", name: "First Spark", cond: s => s.energy >= 100 },
  { id: "a2", name: "Machine Age", cond: s => totalBuildings(s) >= 25 },
  { id: "a3", name: "Dark Initiate", cond: s => s.darkMatter >= 10 },
  { id: "a4", name: "Dark Architect", cond: s => s.darkUpgrades.length >= 5 },
  { id: "a5", name: "Quantum Leap", cond: s => s.quantumFoam >= 5 },
  { id: "a6", name: "Entangled Empire", cond: s => s.quantumSystems.includes("q_entanglement") },
  { id: "a7", name: "Exotic Chemist", cond: s => s.exoticMatter >= 30 },
  { id: "a8", name: "Anomaly Wrangler", cond: s => s.anomalyShards >= 20 },
  { id: "a9", name: "Citadel Online", cond: s => s.buildings.citadel >= 1 },
  { id: "a10", name: "Late-Game Orbit", cond: s => s.lateGameScore >= 1e5 },
  { id: "a11", name: "Beyond Collapse", cond: s => s.darkMatter >= 1500 },
  { id: "a12", name: "Foam Sovereign", cond: s => s.quantumFoam >= 300 },
  { id: "a13", name: "Infinite Mesh", cond: s => s.exoticInfusions >= 25 },
  { id: "a14", name: "Shard Banker", cond: s => s.anomalyShards >= 300 },
  { id: "a15", name: "Multitranscendent", cond: s => s.totalEnergy >= 1e12 }
];

const CODEX = [
  { id: "c_intro", title: "On Energy", text: "Energy is the base substrate of every system and naturally amplified by infrastructure." },
  { id: "c_dark", title: "Dark Matter Collapse", text: "Collapse converts current run momentum into persistent Dark Matter upgrades." },
  { id: "c_quantum", title: "Quantum Foam", text: "Quantum transcendence grants foam used in multi-layered strategic systems." },
  { id: "c_exotic", title: "Exotic Matter", text: "Exotic matter drives infusion and overcharge mechanics for long-tail growth." },
  { id: "c_anom", title: "Anomaly Matrix", text: "Anomalies are timed risks that trade temporary penalties for large shard bursts." },
  { id: "c_late", title: "Late-Game Weaving", text: "Endgame progression emerges from combining dark loops, foam, and exotic overcharge." },
  { id: "c_balance", title: "Balancing Principle", text: "Production, click power, and prestige gains are strongly cross-coupled to avoid dead tiers." },
  { id: "c_vault", title: "Dark Vaults", text: "Vault-class buildings reduce stagnation by anchoring production floor multipliers." },
  { id: "c_omega", title: "Omega Divergence", text: "The final anomaly tier is intended as recurring late-run acceleration." },
  { id: "c_save", title: "Save Compatibility", text: "The save format is versioned and migrates old fields forward when possible." }
];

const defaultState = () => ({
  version: SAVE_VERSION,
  energy: 0,
  totalEnergy: 0,
  darkMatter: 0,
  quantumFoam: 0,
  exoticMatter: 0,
  anomalyShards: 0,
  buildings: Object.fromEntries(BUILDINGS.map(b => [b.id, 0])),
  darkUpgrades: [],
  quantumSystems: [],
  exoticSystems: [],
  exoticInfusions: 0,
  achievements: [],
  codex: ["c_intro"],
  prodMult: 1,
  clickMult: 1,
  exoticMult: 1,
  quantumMult: 1,
  shardMult: 1,
  costDiscount: 1,
  scalingSoftener: 0,
  darkLoop: false,
  qSuper: false,
  qEntanglement: false,
  qTunnel: false,
  qOffline: false,
  qRetain: false,
  qField: false,
  qParadox: false,
  exLens: false,
  exCondense: false,
  exFractal: false,
  anomalyPenaltyUntil: 0,
  anomalyClickPenaltyUntil: 0,
  overchargeUntil: 0,
  lastTick: Date.now(),
  lastSave: Date.now(),
  lateGameScore: 0
});

let state = loadState();
applyDerivedFlags();

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    return migrateSave(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

function migrateSave(data) {
  const base = defaultState();
  const merged = { ...base, ...data };
  merged.buildings = { ...base.buildings, ...(data.buildings || {}) };
  merged.darkUpgrades = Array.isArray(data.darkUpgrades) ? data.darkUpgrades : [];
  merged.quantumSystems = Array.isArray(data.quantumSystems) ? data.quantumSystems : [];
  merged.exoticSystems = Array.isArray(data.exoticSystems) ? data.exoticSystems : [];
  merged.achievements = Array.isArray(data.achievements) ? data.achievements : [];
  merged.codex = Array.isArray(data.codex) ? data.codex : ["c_intro"];

  if (!data.version || data.version < 2) {
    merged.exoticInfusions = data.exoticInfusions || 0;
    merged.lateGameScore = data.lateGameScore || 0;
  }
  if (!data.version || data.version < 3) {
    merged.codex = Array.from(new Set([...(merged.codex || []), "c_save"]));
  }

  merged.version = SAVE_VERSION;
  return merged;
}

function applyDerivedFlags() {
  const reset = {
    prodMult: 1, clickMult: 1, exoticMult: 1, quantumMult: 1, shardMult: 1,
    costDiscount: 1, scalingSoftener: 0, darkLoop: false,
    qSuper: false, qEntanglement: false, qTunnel: false, qOffline: false,
    qRetain: false, qField: false, qParadox: false,
    exLens: false, exCondense: false, exFractal: false
  };
  Object.assign(state, reset);

  state.darkUpgrades.forEach(id => DARK_UPGRADES.find(u => u.id === id)?.apply(state));
  state.quantumSystems.forEach(id => QUANTUM_SYSTEMS.find(q => q.id === id)?.apply(state));
  if (state.exoticSystems.includes("ex_lens")) state.exLens = true;
  if (state.exoticSystems.includes("ex_condense")) state.exCondense = true;
  if (state.exoticSystems.includes("ex_fractal")) state.exFractal = true;
}

function format(n) {
  if (n < 1e3) return n.toFixed(1);
  if (n < 1e6) return (n / 1e3).toFixed(2) + "K";
  if (n < 1e9) return (n / 1e6).toFixed(2) + "M";
  if (n < 1e12) return (n / 1e9).toFixed(2) + "B";
  return n.toExponential(2);
}

function totalBuildings(s) {
  return Object.values(s.buildings).reduce((a, b) => a + b, 0);
}

function buildingCost(def, level) {
  const scaling = Math.max(1.06, def.growth - state.scalingSoftener);
  return def.baseCost * state.costDiscount * Math.pow(scaling, level);
}

function productionPerSecond() {
  const now = Date.now();
  const anomalyPenalty = now < state.anomalyPenaltyUntil ? (state.qParadox ? 0.95 : 0.8) : 1;
  const totalOwned = totalBuildings(state);
  const entanglement = state.qEntanglement ? 1 + totalOwned * 0.01 : 1;
  const superposition = state.qSuper ? 1 + Math.log10(1 + state.quantumFoam) * 0.4 : 1;
  const infusion = 1 + state.exoticInfusions * (state.qField ? 0.225 : 0.15);
  const darkLoopMult = state.darkLoop ? 1 + Math.log10(1 + state.darkMatter) * 0.35 : 1;
  const late = 1 + Math.log10(1 + state.lateGameScore) * 0.25;
  let sum = 0;
  for (const def of BUILDINGS) {
    sum += def.baseProd * state.buildings[def.id];
  }
  return sum * state.prodMult * entanglement * superposition * infusion * darkLoopMult * late * anomalyPenalty;
}

function clickPower() {
  const penalty = Date.now() < state.anomalyClickPenaltyUntil ? 0.5 : 1;
  return (1 + state.buildings.collector * 0.08) * state.clickMult * penalty;
}

function darkMatterGain() {
  const base = Math.pow(state.energy / 5000, 0.55);
  const lens = state.exLens ? (1 + Math.log10(1 + state.exoticMatter) * 0.7) : 1;
  return Math.max(0, Math.floor(base * lens));
}

function quantumGain() {
  const base = Math.pow(state.darkMatter / 30, 0.65) + Math.pow(state.energy / 2e6, 0.3);
  return Math.max(0, Math.floor(base * state.quantumMult));
}

function exoticGainPerSecond() {
  const dmScale = Math.log10(1 + state.darkMatter) * 0.12;
  const qScale = Math.log10(1 + state.quantumFoam) * 0.16;
  const frac = state.exFractal ? 1.8 : 1;
  return (dmScale + qScale) * state.exoticMult * frac;
}

function lateGameScore() {
  return (Math.log10(1 + state.darkMatter) + Math.log10(1 + state.quantumFoam) + Math.log10(1 + state.anomalyShards + state.exoticMatter)) * totalBuildings(state);
}

function tick() {
  const now = Date.now();
  const dt = Math.min(1, (now - state.lastTick) / 1000);
  state.lastTick = now;

  const speed = now < state.overchargeUntil ? 1.3 : 1;
  const prod = productionPerSecond() * dt * speed;
  const exotic = exoticGainPerSecond() * dt * speed;

  state.energy += prod;
  state.totalEnergy += prod;
  state.exoticMatter += exotic;

  if (state.qTunnel && Math.random() < 0.10 * dt) {
    state.energy += productionPerSecond() * (0.2 + Math.random() * 0.4);
  }

  state.lateGameScore = lateGameScore();
  unlockCodex();
  checkAchievements();
  render();
}

function unlockCodex() {
  const unlocks = [
    ["c_dark", () => state.darkMatter >= 1],
    ["c_quantum", () => state.quantumFoam >= 1],
    ["c_exotic", () => state.exoticMatter >= 5],
    ["c_anom", () => state.anomalyShards >= 1],
    ["c_balance", () => state.darkUpgrades.length >= 3],
    ["c_vault", () => state.buildings.vault >= 1],
    ["c_late", () => state.lateGameScore >= 1e3],
    ["c_omega", () => state.anomalyShards >= 100]
  ];
  for (const [id, cond] of unlocks) {
    if (cond() && !state.codex.includes(id)) state.codex.push(id);
  }
}

function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements.includes(a.id) && a.cond(state)) {
      state.achievements.push(a.id);
      status(`Achievement unlocked: ${a.name}`);
    }
  }
}

function status(msg) {
  document.getElementById("status").textContent = msg;
}

function buyBuilding(id) {
  const def = BUILDINGS.find(b => b.id === id);
  const cost = buildingCost(def, state.buildings[id]);
  if (state.energy < cost) return;
  state.energy -= cost;
  state.buildings[id]++;
  render();
}

function buyDarkUpgrade(id) {
  if (state.darkUpgrades.includes(id)) return;
  const up = DARK_UPGRADES.find(u => u.id === id);
  if (state.darkMatter < up.cost) return;
  state.darkMatter -= up.cost;
  state.darkUpgrades.push(id);
  applyDerivedFlags();
  render();
}

function buyQuantumSystem(id) {
  if (state.quantumSystems.includes(id)) return;
  const q = QUANTUM_SYSTEMS.find(x => x.id === id);
  if (state.quantumFoam < q.cost) return;
  state.quantumFoam -= q.cost;
  state.quantumSystems.push(id);
  q.apply(state);
  render();
}

function buyExoticSystem(id) {
  const ex = EXOTIC_SYSTEMS.find(x => x.id === id);
  const owned = state.exoticSystems.includes(id);
  if (!ex.repeatable && owned) return;

  let cost = ex.cost;
  if (id === "ex_infuse") cost = ex.cost * Math.pow(1.35, state.exoticInfusions);
  if (id === "ex_overcharge") {
    const uses = (state.exoticOverchargeUses || 0);
    cost = ex.cost * Math.pow(1.45, uses);
  }

  if (state.exoticMatter < cost) return;
  state.exoticMatter -= cost;

  if (id === "ex_infuse") {
    state.exoticInfusions++;
  } else if (id === "ex_overcharge") {
    state.overchargeUntil = Date.now() + 30000;
    state.exoticOverchargeUses = (state.exoticOverchargeUses || 0) + 1;
  } else {
    state.exoticSystems.push(id);
    if (id === "ex_lens") state.exLens = true;
    if (id === "ex_condense") state.exCondense = true;
    if (id === "ex_fractal") state.exFractal = true;
  }
  render();
}

function triggerAnomaly() {
  const unlocked = ANOMALIES.filter(a => state.energy >= a.req);
  if (!unlocked.length) {
    status("Insufficient energy for any anomaly tier.");
    return;
  }

  const a = unlocked[unlocked.length - 1];
  const shardGain = Math.floor(a.shard * state.shardMult + (state.exCondense ? 1 : 0));
  state.anomalyShards += shardGain;
  state.exoticMatter += a.shard * 0.7;

  if (a.id === "an_flux") state.anomalyPenaltyUntil = Date.now() + 25000;
  if (a.id === "an_paradox") state.anomalyClickPenaltyUntil = Date.now() + 30000;
  if (a.id === "an_voidstorm") {
    state.anomalyPenaltyUntil = Date.now() + 40000;
    state.anomalyClickPenaltyUntil = Date.now() + 40000;
  }
  if (a.id === "an_omega") {
    state.anomalyPenaltyUntil = Date.now() + 30000;
    state.overchargeUntil = Math.max(state.overchargeUntil, Date.now() + 20000);
    state.darkMatter += Math.floor(Math.sqrt(state.anomalyShards));
  }

  status(`Stabilized ${a.name}: +${shardGain} shards`);
  render();
}

function doDarkPrestige() {
  const gain = darkMatterGain();
  if (gain < 1) return status("Need more energy before collapse.");

  state.darkMatter += gain;
  const retained = state.qRetain ? Math.log10(1 + state.energy) * 25 : 0;
  state.energy = retained;
  Object.keys(state.buildings).forEach(k => (state.buildings[k] = 0));
  status(`Collapse complete. +${gain} Dark Matter`);
  render();
}

function doQuantumPrestige() {
  const gain = quantumGain();
  if (gain < 1) return status("Need more dark matter to transcend.");
  state.quantumFoam += gain;

  state.darkMatter = Math.floor(state.darkMatter * 0.15);
  state.energy = 0;
  Object.keys(state.buildings).forEach(k => (state.buildings[k] = 0));
  state.exoticMatter *= 0.3;

  status(`Quantum transcendence complete. +${gain} foam`);
  render();
}

function renderList(target, items, renderItem) {
  const el = document.getElementById(target);
  el.innerHTML = "";
  items.forEach(item => el.appendChild(renderItem(item)));
}

function render() {
  document.getElementById("energy").textContent = format(state.energy);
  document.getElementById("darkMatter").textContent = format(state.darkMatter);
  document.getElementById("exoticMatter").textContent = format(state.exoticMatter);
  document.getElementById("quantumFoam").textContent = format(state.quantumFoam);
  document.getElementById("anomalyShards").textContent = format(state.anomalyShards);
  document.getElementById("clickPower").textContent = format(clickPower());

  renderList("buildings", BUILDINGS, def => {
    const level = state.buildings[def.id];
    const cost = buildingCost(def, level);
    const d = document.createElement("div");
    d.className = "item";
    d.innerHTML = `<h4>${def.name} <span class="owned">x${level}</span></h4>
      <div>${def.desc}</div>
      <div class="muted">+${format(def.baseProd)} /s each</div>
      <button ${state.energy < cost ? "disabled" : ""}>Buy (${format(cost)} energy)</button>`;
    d.querySelector("button").onclick = () => buyBuilding(def.id);
    return d;
  });

  renderList("darkUpgrades", DARK_UPGRADES, up => {
    const owned = state.darkUpgrades.includes(up.id);
    const d = document.createElement("div");
    d.className = `item ${owned ? "locked" : ""}`;
    d.innerHTML = `<h4>${up.name}</h4><div>${up.effect}</div>
      <button ${owned || state.darkMatter < up.cost ? "disabled" : ""}>${owned ? "Owned" : `Buy (${up.cost} DM)`}</button>`;
    d.querySelector("button").onclick = () => buyDarkUpgrade(up.id);
    return d;
  });

  renderList("quantumSystems", QUANTUM_SYSTEMS, q => {
    const owned = state.quantumSystems.includes(q.id);
    const d = document.createElement("div");
    d.className = `item ${owned ? "locked" : ""}`;
    d.innerHTML = `<h4>${q.name}</h4><div>${q.effect}</div>
      <button ${owned || state.quantumFoam < q.cost ? "disabled" : ""}>${owned ? "Installed" : `Install (${q.cost} foam)`}</button>`;
    d.querySelector("button").onclick = () => buyQuantumSystem(q.id);
    return d;
  });

  renderList("exoticSystems", EXOTIC_SYSTEMS, ex => {
    const owned = state.exoticSystems.includes(ex.id);
    const repeat = ex.id === "ex_infuse" ? state.exoticInfusions : (ex.id === "ex_overcharge" ? (state.exoticOverchargeUses || 0) : 0);
    let cost = ex.cost;
    if (ex.id === "ex_infuse") cost = ex.cost * Math.pow(1.35, state.exoticInfusions);
    if (ex.id === "ex_overcharge") cost = ex.cost * Math.pow(1.45, state.exoticOverchargeUses || 0);

    const d = document.createElement("div");
    d.className = `item ${owned && !ex.repeatable ? "locked" : ""}`;
    d.innerHTML = `<h4>${ex.name} ${repeat ? `<span class="owned">Lv ${repeat}</span>` : ""}</h4><div>${ex.effect}</div>
      <button ${(owned && !ex.repeatable) || state.exoticMatter < cost ? "disabled" : ""}>${owned && !ex.repeatable ? "Completed" : `Activate (${format(cost)} exotic)`}</button>`;
    d.querySelector("button").onclick = () => buyExoticSystem(ex.id);
    return d;
  });

  renderList("anomalies", ANOMALIES, a => {
    const unlocked = state.energy >= a.req;
    const d = document.createElement("div");
    d.className = `item ${!unlocked ? "locked" : ""}`;
    d.innerHTML = `<h4>${a.name}</h4><div>${a.desc}</div><div class="muted">Requires ${format(a.req)} energy, base ${a.shard} shards.</div>`;
    return d;
  });

  renderList("achievements", ACHIEVEMENTS, a => {
    const got = state.achievements.includes(a.id);
    const d = document.createElement("div");
    d.className = `item ${!got ? "locked" : ""}`;
    d.textContent = got ? `✓ ${a.name}` : `• ${a.name}`;
    return d;
  });

  renderList("codex", CODEX.filter(c => state.codex.includes(c.id)), c => {
    const d = document.createElement("div");
    d.className = "item";
    d.innerHTML = `<h4>${c.title}</h4><small>${c.text}</small>`;
    return d;
  });
}

function save() {
  state.lastSave = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function importSave() {
  const raw = prompt("Paste save data:");
  if (!raw) return;
  try {
    state = migrateSave(JSON.parse(atob(raw)));
    applyDerivedFlags();
    save();
    status("Save imported.");
    render();
  } catch {
    status("Import failed.");
  }
}

function exportSave() {
  save();
  const data = btoa(JSON.stringify(state));
  navigator.clipboard?.writeText(data);
  alert("Save copied to clipboard.");
}

function setupEvents() {
  document.getElementById("clickEnergy").onclick = () => {
    const gain = clickPower();
    state.energy += gain;
    state.totalEnergy += gain;
  };
  document.getElementById("prestigeDark").onclick = doDarkPrestige;
  document.getElementById("prestigeQuantum").onclick = doQuantumPrestige;
  document.getElementById("triggerAnomaly").onclick = triggerAnomaly;

  document.getElementById("saveBtn").onclick = () => {
    save();
    status("Saved.");
  };
  document.getElementById("exportBtn").onclick = exportSave;
  document.getElementById("importBtn").onclick = importSave;
  document.getElementById("resetBtn").onclick = () => {
    if (confirm("Hard reset your save?")) {
      state = defaultState();
      save();
      render();
    }
  };
}

function applyOfflineProgress() {
  const now = Date.now();
  const elapsed = Math.max(0, (now - (state.lastTick || now)) / 1000);
  if (elapsed < 3) return;
  const eff = state.qOffline ? 0.8 : 0.35;
  const capped = Math.min(elapsed, 60 * 60 * 8);
  const gain = productionPerSecond() * capped * eff;
  const exotic = exoticGainPerSecond() * capped * eff;
  state.energy += gain;
  state.totalEnergy += gain;
  state.exoticMatter += exotic;
  status(`Offline progress: +${format(gain)} energy`);
}

setupEvents();
applyOfflineProgress();
render();
setInterval(tick, 100);
setInterval(save, 10000);
