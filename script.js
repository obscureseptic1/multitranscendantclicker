(() => {
  const TABS = ["overview", "resources", "buildings", "research", "expansion", "conversions", "automation", "prestige", "anomalies", "codex", "stats"];
  const SAVE_KEY = "axiom_save_v1";
  const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

  const makeResource = (name, icon, special, visibleAt = 0) => ({ name, icon, amount: 0, perSec: 0, unlocked: visibleAt === 0, visibleAt, special });
  const game = {
    version: 1,
    t: 0,
    era: "Planetary Ignition",
    tab: "overview",
    lastTick: Date.now(),
    lastSaved: Date.now(),
    log: [],
    codex: [],
    resources: {
      energy: makeResource("Energy", "⚡", "Universal throughput and power routing."),
      plasma: makeResource("Plasma", "🔥", "Enables high-heat industrial synthesis.", 100),
      antimatter: makeResource("Antimatter", "🧨", "Explosive output; destabilizes containment.", 0),
      darkMatter: makeResource("Dark Matter", "🌑", "Improves hidden extraction efficiencies.", 0),
      quantum: makeResource("Quantum Particles", "⚛", "Accelerates research and probability effects.", 0),
      exotic: makeResource("Exotic Matter", "🧬", "Bends production laws and cost curves.", 0),
      flux: makeResource("Spacetime Flux", "🕳", "Controls game speed and temporal science.", 0),
      cores: makeResource("Singularity Cores", "◉", "Powers ultra-dense late structures.", 0),
      vacuum: makeResource("Vacuum Essence", "☄", "Enables permanent reality edits.", 0),
      fragments: makeResource("Multiversal Fragments", "✶", "Deepest transcendence currency.", 0),
      credits: makeResource("Credits", "¤", "Operational economics."),
      alloys: makeResource("Alloys", "⛓", "Construction material for structures."),
      heat: makeResource("Heat", "♨", "Drives plasma pathways, hurts stability if unmanaged."),
      data: makeResource("Data", "⌁", "Research input and scanner output."),
      rp: makeResource("Research Points", "Δ", "Required for unlocking technologies."),
      stabilizers: makeResource("Stabilizers", "🛡", "Reduces antimatter and vacuum instability."),
      qubits: makeResource("Qubits", "⌬", "Quantum computing substrate for entanglement systems."),
      entropy: makeResource("Entropy", "∿", "High entropy reduces conversion efficiency."),
      axioms: makeResource("Axiom Sigils", "⟁", "Late-game law-writing tokens forged from exotic reality work."),
      civMarks: makeResource("Civilization Marks", "✦", "Ascension prestige currency."),
      realityShards: makeResource("Reality Shards", "⬖", "Reality collapse currency."),
    },
    manual: { energy: 1, stabilize: 0.5, plasma: 0, scan: 1, charges: 0 },
    systems: { instability: 0, decoherence: 0, temporalStress: 0, vacuumInstability: 0, entropyPressure: 0, darkPressure: 0, entanglement: 0, exoticDrift: 0 },
    unlocked: { antimatter: false, dark: false, quantum: false, exotic: false, flux: false, singularity: false, vacuum: false, multiversal: false, automation: false },
    buildings: {},
    research: {},
    researchQueue: [],
    currentResearch: null,
    regionsOwned: ["earthGrid"],
    conversions: {},
    anomalies: { cooldown: 20, active: [], discovered: {}, count: 0 },
    automation: { enabled: false, minEnergy: 100, autoCheapestEnergy: false, plasmaAbove: 500, autoResearch: false, pauseAntimatterAt: 60, autoManual: false },
    prestige: { ascensions: 0, collapses: 0, transcends: 0, tree: {} },
    stats: { clicks: 0, buildingsBought: 0, anomaliesSeen: 0, totalEnergy: 0, playSeconds: 0, offlineSeconds: 0 },
    achievements: {},
    hiddenFlags: { precursor: false, falseVacuumSeen: false, forbiddenUnlocked: false, mirrorUnlocked: false }
  };

  const BUILDINGS = [
    ["solarArray", "Solar Array", "early", "Panels that harvest photons into base energy.", { credits: 12, alloys: 5 }, 1.14, "produce", g => ({ energy: 0.9 + g.prestige.ascensions * 0.1 })],
    ["thermalWell", "Thermal Well", "early", "Captures geothermal gradients, creating Heat and Energy.", { credits: 25, alloys: 12 }, 1.15, "produce", () => ({ energy: 1.1, heat: 0.7 })],
    ["capacitorBank", "Capacitor Bank", "early", "Stores charge and boosts manual Channel Energy.", { credits: 40, alloys: 18 }, 1.17, "boost", g => ({ manualEnergyMult: 0.08 })],
    ["groundReactor", "Ground Reactor", "early", "Converts Heat into stable output.", { credits: 65, alloys: 22, energy: 25 }, 1.18, "convert", () => ({ heatToEnergy: 1.2 })],
    ["orbitalCollector", "Orbital Collector", "early", "Orbital mirrors increase total solar throughput.", { credits: 120, alloys: 50, energy: 80 }, 1.2, "boost", () => ({ energyMult: 0.06 })],
    ["fusionReactor", "Fusion Reactor", "early", "Industrial fusion unlocks plasma in bulk.", { credits: 200, alloys: 80, heat: 30 }, 1.22, "unlock", () => ({ plasma: 0.5, energy: 3 })],

    ["plasmaForge", "Plasma Forge", "mid", "Refines heat into plasma and alloys.", { credits: 420, alloys: 140, plasma: 40 }, 1.2, "convert", () => ({ heatToPlasma: 0.8, alloys: 0.6 })],
    ["stellarRefinery", "Stellar Refinery", "mid", "Cracks plasma into antimatter precursor gases.", { credits: 900, alloys: 240, plasma: 120 }, 1.21, "convert", () => ({ plasmaToAntimatter: 0.16 })],
    ["researchNexus", "Research Nexus", "mid", "Computes stellar data into RP.", { credits: 800, alloys: 160, data: 90 }, 1.18, "research", () => ({ rp: 1.5, data: 0.6 })],
    ["dysonNode", "Dyson Swarm Node", "mid", "Modular swarm node for giant energy uplift.", { credits: 1600, alloys: 600, plasma: 200 }, 1.23, "produce", () => ({ energy: 14, heat: 2 })],
    ["asteroidSmelter", "Asteroid Smelter", "mid", "Turns asteroid ore into alloys and credits.", { credits: 1000, energy: 500 }, 1.18, "produce", () => ({ alloys: 1.8, credits: 4 })],
    ["antimatterCondenser", "Antimatter Condenser", "mid", "Containment field for antimatter extraction.", { credits: 2800, alloys: 500, plasma: 350, stabilizers: 15 }, 1.24, "produce", () => ({ antimatter: 0.2, instability: 0.4 })],
    ["neutrinoScoop", "Neutrino Scoop", "mid", "Extracts data from stellar neutrino streams.", { credits: 1900, alloys: 280, energy: 600 }, 1.19, "produce", () => ({ data: 4.2, quantum: 0.05 })],
    ["deepSpaceRelay", "Deep Space Relay", "mid", "Boosts region and anomaly coherence.", { credits: 2400, alloys: 350, data: 220 }, 1.2, "stabilize", () => ({ anomalyRate: 0.03, instabilityReduction: 0.35 })],

    ["darkMatterLens", "Dark Matter Lens", "advanced", "Lens array reveals dark gradients.", { credits: 6000, antimatter: 20, data: 500 }, 1.25, "produce", () => ({ darkMatter: 0.08 })],
    ["quantumCollider", "Quantum Collider", "advanced", "Collides virtual packets into quantum particles.", { credits: 9000, plasma: 800, darkMatter: 10 }, 1.25, "produce", () => ({ quantum: 0.3, entropy: 0.4 })],
    ["probabilityEngine", "Probability Engine", "advanced", "Manipulates event outcomes and crit chances.", { credits: 12000, quantum: 25, data: 700 }, 1.26, "boost", () => ({ anomalyLuck: 0.05, conversionMult: 0.04 })],
    ["vacuumLab", "Vacuum Laboratory", "advanced", "Tests metastable states; unlocks exotic matter.", { credits: 14000, darkMatter: 18, quantum: 20 }, 1.28, "convert", () => ({ exotic: 0.08, vacuumInstability: 0.2 })],
    ["temporalRelay", "Temporal Relay", "advanced", "Localized time manipulation for throughput spikes.", { credits: 16000, flux: 8, quantum: 30 }, 1.27, "boost", () => ({ tickSpeed: 0.02, temporalStress: 0.15 })],
    ["riftAnchor", "Rift Anchor", "advanced", "Stabilizes spacetime ruptures.", { credits: 18000, exotic: 8, darkMatter: 20 }, 1.28, "stabilize", () => ({ flux: 0.1, instabilityReduction: 0.8 })],
    ["gravitonMill", "Graviton Mill", "advanced", "Condenses curvature into spacetime flux.", { credits: 22000, darkMatter: 30, quantum: 35 }, 1.29, "produce", () => ({ flux: 0.35, entropy: 0.25 })],
    ["singularityCrucible", "Singularity Crucible", "advanced", "Micro-singularity forge for core production.", { credits: 45000, exotic: 20, flux: 25 }, 1.3, "produce", () => ({ cores: 0.06, temporalStress: 0.25 })],

    ["eventHorizonFoundry", "Event Horizon Foundry", "late", "Matter-energy inversion at horizon edges.", { credits: 100000, cores: 8, exotic: 35 }, 1.31, "convert", () => ({ vacuum: 0.08, energy: 120 })],
    ["realityLoom", "Reality Loom", "late", "Weaves causal strands into permanent upgrades.", { credits: 130000, vacuum: 10, cores: 12 }, 1.32, "unlock", () => ({ shards: 0.02 })],
    ["vacuumSiphon", "Vacuum Siphon", "late", "Extracts latent zero-point fields.", { credits: 170000, vacuum: 16, flux: 40 }, 1.33, "produce", () => ({ vacuum: 0.18, entropy: -0.2 })],
    ["causalityEngine", "Causality Engine", "late", "Reorders event chains and research time.", { credits: 200000, cores: 20, quantum: 80 }, 1.33, "boost", () => ({ researchSpeed: 0.08, anomalyLuck: 0.06 })],
    ["omegaLattice", "Omega Lattice", "late", "Planet-scale lattice for multiversal resonance.", { credits: 260000, vacuum: 25, exotic: 50 }, 1.34, "produce", () => ({ fragments: 0.03 })],
    ["multiversalTap", "Multiversal Tap", "late", "Taps neighboring cosmologies for fragments.", { credits: 400000, fragments: 8, cores: 45 }, 1.35, "produce", () => ({ fragments: 0.08, vacuumInstability: 0.3 })],
    ["darkHarvester", "Dark Harvest Spire", "late", "Anchored spire that harvests dark pressure gradients.", { credits: 520000, darkMatter: 160, flux: 80 }, 1.36, "produce", () => ({ darkMatter: 0.9, darkPressure: 0.5 })],
    ["voidCompressor", "Void Compressor", "late", "Compresses vacuum noise into exotic quanta.", { credits: 620000, vacuum: 60, darkMatter: 120 }, 1.37, "convert", () => ({ exotic: 0.45, vacuumInstability: 0.6 })],
    ["entanglementArray", "Entanglement Array", "late", "Large-scale qubit coherence lattice.", { credits: 700000, quantum: 140, qubits: 80 }, 1.38, "produce", () => ({ qubits: 1.2, entanglement: 0.8 })],
    ["chronicleVault", "Chronicle Vault", "late", "Stores civilization signatures between collapses.", { credits: 760000, cores: 60, realityShards: 20 }, 1.38, "boost", () => ({ researchSpeed: 0.15, anomalyLuck: 0.1 })],
    ["axiomForge", "Axiom Forge", "late", "Forges Axiom Sigils for reality protocol rewrites.", { credits: 900000, exotic: 130, vacuum: 85, fragments: 35 }, 1.4, "produce", () => ({ axioms: 0.06, entropy: -0.25 })],
    ["mirrorGate", "Mirror Gate", "late", "Connects mirror universes for controlled fragment siphoning.", { credits: 1200000, fragments: 70, axioms: 8 }, 1.42, "unlock", () => ({ fragments: 0.22, darkPressure: 1 })],
  ];

  const REGIONS = [
    ["earthGrid","Earth Surface Grid", "Birthplace of grid power and manual harvesting.", { energy: 0 }, 1, "Starter zone with manual bonuses."],
    ["earthOrbit","Earth Orbit", "Orbital infrastructure and satellite collectors.", { credits: 300, alloys: 120 }, 1.08, "+8% energy, unlocks Orbital Collector."],
    ["lunar","Lunar Foundry", "Low gravity mass-processing facilities.", { credits: 1200, alloys: 300, energy: 900 }, 1.1, "+alloy output."],
    ["mars","Mars Colony", "Distributed industrial ecology.", { credits: 2500, alloys: 500, plasma: 120 }, 1.12, "+plasma and data gains."],
    ["belt","Asteroid Belt Operations", "Autonomous extraction grids.", { credits: 6000, alloys: 1500, energy: 4500 }, 1.13, "Enables Asteroid Smelter efficiencies."],
    ["jovian","Jovian Harvest Ring", "Gas giant scoop networks.", { credits: 12000, plasma: 900, data: 800 }, 1.14, "+heat and plasma conversion."],
    ["saturn","Saturn Cryo Labs", "Cryogenic and antimatter containment labs.", { credits: 22000, antimatter: 15, stabilizers: 25 }, 1.16, "Lowers antimatter instability."],
    ["polar","Solar Polar Array", "Polar collection for constant stellar flux.", { credits: 26000, plasma: 1400 }, 1.18, "+energy multipliers."],
    ["dysonZone","Dyson Construction Zone", "Proto-dyson megastructure assembly orbit.", { credits: 40000, alloys: 5000, plasma: 2200 }, 1.2, "Unlocks deep-space industry tech."],
    ["listening","Interstellar Listening Post", "Analyzes precursor signals in void noise.", { credits: 55000, data: 3200, quantum: 30 }, 1.22, "Higher anomaly rate, hidden research chance."],
    ["darkObs","Dark Sector Observatory", "Dedicated to dark sector mapping.", { credits: 70000, antimatter: 40, quantum: 50 }, 1.25, "Unlock dark matter chains."],
    ["rift","Quantum Rift", "Fractalized spacetime seam.", { credits: 95000, flux: 25, exotic: 15 }, 1.27, "Boost quantum production."],
    ["remnant","Collapsed Star Remnant", "Harvesting ultradense stellar remains.", { credits: 130000, darkMatter: 120, flux: 50 }, 1.3, "Unlock Singularity architecture."],
    ["horizon","Event Horizon Perimeter", "Engineered edge of no-return metrics.", { credits: 190000, cores: 18, exotic: 40 }, 1.33, "Vacuum gain improved."],
    ["voidBreach","Void Breach", "Boundary condition failure region.", { credits: 260000, vacuum: 30, cores: 25 }, 1.37, "Unsettling anomalies enabled."],
    ["fractured","Fractured Continuum", "Causal shards drifting in macrotime.", { credits: 350000, vacuum: 45, realityShards: 8 }, 1.4, "Time and research distortion."],
    ["survey","Multiversal Survey Plane", "Survey lattice spanning neighboring realities.", { credits: 500000, fragments: 25, vacuum: 70 }, 1.45, "Final era unlocked."],
    ["mirrorSea","Mirror Sea", "A reflective vacuum basin full of neighboring timelines.", { credits: 900000, fragments: 80, axioms: 6 }, 1.52, "Unlocks mirror-gate anomaly chains."],
    ["axiomCore","Axiom Core", "A synthetic law-engine where constants are negotiated.", { credits: 1500000, axioms: 15, vacuum: 200 }, 1.6, "Unlocks final axiom protocols."],
  ];

  const RESEARCH = [
    ["power1", "Power Systems I", "Power Systems", { rp: 30, energy: 200 }, 0, [], "Global +12% Energy"],
    ["plasma1", "Plasma Engineering", "Plasma Engineering", { rp: 80, heat: 100, energy: 600 }, 18, ["power1"], "Unlock plasma conversions"],
    ["particle1", "Particle Physics", "Particle Physics", { rp: 120, data: 120 }, 20, ["plasma1"], "Unlock Antimatter Condenser"],
    ["industry1", "Deep Space Industry", "Deep Space Industry", { rp: 220, alloys: 400 }, 30, ["power1"], "+alloy and credits production"],
    ["contain1", "Antimatter Containment", "Antimatter Containment", { rp: 300, antimatter: 5, stabilizers: 8 }, 40, ["particle1"], "Reduce instability growth"],
    ["dark1", "Dark Observation", "Dark Observation", { rp: 420, data: 500, antimatter: 12 }, 50, ["contain1"], "Unlock dark matter lensing"],
    ["quant1", "Quantum Mechanics", "Quantum Mechanics", { rp: 650, darkMatter: 8, data: 600 }, 65, ["dark1"], "Unlock Quantum Collider"],
    ["temp1", "Temporal Science", "Temporal Science", { rp: 900, quantum: 15, flux: 3 }, 70, ["quant1"], "Unlock temporal relays"],
    ["sing1", "Singularity Architecture", "Singularity Architecture", { rp: 1300, exotic: 12, flux: 8 }, 85, ["temp1"], "Unlock Singularity Crucible"],
    ["vac1", "Vacuum Theory", "Vacuum Theory", { rp: 1800, cores: 5, exotic: 20 }, 100, ["sing1"], "Unlock vacuum extraction"],
    ["dim1", "Dimensional Cartography", "Dimensional Cartography", { rp: 2600, vacuum: 8, flux: 15 }, 120, ["vac1"], "Unlock fractured map regions"],
    ["auto1", "Automation Mesh", "Automation", { rp: 500, data: 300 }, 45, ["industry1"], "Unlock automation panel"],
    ["gov1", "Civilization Governance", "Civilization Governance", { rp: 900, credits: 6000 }, 60, ["auto1"], "Ascension improvements"],
    ["forbidden", "Forbidden Axial Rewrite", "Vacuum Theory", { rp: 5000, vacuum: 40, realityShards: 5 }, 200, ["dim1"], "???"],
    ["dark2", "Dark Topology", "Dark Observation", { rp: 3200, darkMatter: 80, data: 2600 }, 140, ["dark1"], "Unlock dark pressure systems"],
    ["quant2", "Entangled Computation", "Quantum Mechanics", { rp: 3600, quantum: 75, qubits: 30 }, 160, ["quant1"], "Unlock qubit synthesis and entanglement bonuses"],
    ["exotic2", "Exotic Rulefields", "Vacuum Theory", { rp: 4800, exotic: 60, vacuum: 20 }, 180, ["vac1"], "Unlock exotic protocols"],
    ["axiom1", "Axiom Protocols", "Dimensional Cartography", { rp: 7000, axioms: 6, fragments: 20 }, 220, ["dim1", "exotic2"], "Unlock final late-game conversions"],
  ];

  const CONVERSIONS = [
    ["energyToPlasma", "Energy → Plasma", "Divert reactor output into plasma excitation.", { energy: 40 }, { plasma: 1 }, "plasma1"],
    ["heatToPlasma", "Heat → Plasma", "Pulse heat reservoirs through plasma lattice.", { heat: 30 }, { plasma: 0.8 }, "plasma1"],
    ["plasmaToAntimatter", "Plasma + Data → Antimatter", "High-risk condensation cycle.", { plasma: 18, data: 12, stabilizers: 1 }, { antimatter: 0.35, entropy: 0.5 }, "particle1"],
    ["antiToDarkWindow", "Antimatter + Stabilizers → Dark Probe", "Short-lived dark observation window.", { antimatter: 0.5, stabilizers: 0.6 }, { darkMatter: 0.18 }, "dark1"],
    ["darkQuantumToExotic", "Dark Matter + Quantum → Exotic", "Exotic synthesis under controlled decoherence.", { darkMatter: 0.3, quantum: 0.4 }, { exotic: 0.12, decoherence: 0.3 }, "quant1"],
    ["quantToRp", "Quantum → Research Focus", "Collapse quantum packets into deterministic insight.", { quantum: 0.6 }, { rp: 4 }, "quant1"],
    ["fluxOverclock", "Flux Overclock", "Spend flux to accelerate time for 30s.", { flux: 3 }, { overclock: 1 }, "temp1"],
    ["coresToFlux", "Singularity Core Shear", "Shear micro-cores into usable flux.", { cores: 0.25 }, { flux: 2.5, entropy: 1 }, "sing1"],
    ["vacuumEdit", "Vacuum Edit: Efficiency Rewrite", "Spend vacuum essence for permanent conversion efficiency.", { vacuum: 2 }, { vacuumEdit: 1 }, "vac1"],
    ["fragmentsToMarks", "Multiversal Reflection", "Collapse fragments for mixed prestige currencies.", { fragments: 0.4 }, { civMarks: 0.8, realityShards: 0.25 }, "dim1"],
    ["dataToStabilizers", "Data + Alloys → Stabilizers", "Build containment stabilizers.", { data: 22, alloys: 18 }, { stabilizers: 1.4 }, "contain1"],
    ["quantumToQubits", "Quantum + Data → Qubits", "Compile probabilistic particles into stable qubits.", { quantum: 1.2, data: 16 }, { qubits: 0.9, decoherence: 0.2 }, "quant2"],
    ["darkPressureTap", "Dark Matter → Dark Pressure", "Push dark material through topological sinks.", { darkMatter: 0.8 }, { darkPressure: 1.5 }, "dark2"],
    ["exoticProtocol", "Exotic Protocol Burn", "Consume exotic matter to write temporary law boosts.", { exotic: 0.6, axioms: 0.05 }, { overclock: 1, entanglement: 0.8 }, "exotic2"],
    ["axiomCondense", "Vacuum + Fragments → Axiom Sigils", "Condense vacuum and multiversal traces into sigils.", { vacuum: 1.8, fragments: 0.5 }, { axioms: 0.08 }, "axiom1"],
  ];

  const ANOMALIES = [
    ["flare", "Solar Flare Cascade", "+50% energy for 40s."],
    ["bloom", "Plasma Bloom", "Plasma production spikes and heat rises."],
    ["breach", "Containment Breach", "Lose some antimatter, gain data burst."],
    ["storm", "Dark Matter Storm", "Dark extraction x2 for 30s."],
    ["resonance", "Quantum Resonance", "Quantum output doubled, decoherence risk."],
    ["echo", "Temporal Echo", "Tick speed +30% for 20s."],
    ["shear", "Gravity Shear", "Core production up, stability down."],
    ["whisper", "Vacuum Whisper", "Unlock unsettling codex entry."],
    ["falsevac", "False Vacuum Shiver", "Large vacuum gain, major instability."],
    ["fracture", "Fracture Window", "Chance to reveal forbidden research."],
    ["mirrorfall", "Mirrorfall Alignment", "A mirrored timeline leaks efficiency and fragments."],
    ["axiomwake", "Axiom Wake", "Core constants stutter, granting sigils but raising exotic drift."],
  ];

  const ACHIEVEMENTS = Array.from({ length: 45 }, (_, i) => ({
    id: `a${i + 1}`,
    name: ["First Spark","Grid Engineer","Orbital Age","Lunar Industry","Martian Systems","Belt Baron","Jovian Heat","Cold Saturn","Polar Light","Dyson Initiate","Interstellar Listener","Dark Cartographer","Rift Walker","Collapsed Starwright","Horizon Architect","Void Intruder","Continuum Diver","Surveyor Prime","100 Clicks","100 Buildings","10 Research","First Anomaly","10 Anomalies","First Ascension","First Collapse","First Transcendence","Entropy Tamer","Containment Master","Forbidden Reader","Shiver Witness","Mark Magnate","Shard Collector","Dark Pressure Online","Entangled","Exotic Lawwriter","Mirror Sailor","Axiom Engineer","20 Research","500 Buildings","50 Anomalies","Sigil Hoard","Infinite Relay","Temporal Veteran","Vacuum Cartographer","Transcendent Architect"][i],
    desc: "Milestone across resources, expansion, anomalies, and prestige.",
    done: false
  }));

  function init() {
    BUILDINGS.forEach(([id, name, cat, desc, cost, scale, type]) => game.buildings[id] = { id, name, cat, desc, baseCost: cost, scale, type, owned: 0 });
    RESEARCH.forEach(([id, name, cat, cost, time, req, effect]) => game.research[id] = { id, name, cat, cost, time, req, effect, done: false, hidden: id === "forbidden" });
    CONVERSIONS.forEach(([id, name, desc, input, output, req]) => game.conversions[id] = { id, name, desc, input, output, req, on: false, rate: 1 });
    ACHIEVEMENTS.forEach(a => game.achievements[a.id] = a);

    bindUI();
    load();
    normalizeState();
    setupTabs();
    addLog("AXIOM core initialized. Earth Surface Grid online.");
    unlockCodex("Ignition", "Humanity's first coherent planetary energy lattice is online.");
    unlockCodex("Dark Matter Program", "Dark matter is not fuel. It is architecture waiting to be measured.");
    unlockCodex("Quantum Charter", "Quantum particles may be domesticated through coherence contracts.");
    unlockCodex("Exotic Directive", "Exotic matter allows non-classical edits to industrial law.");
    loop();
    setInterval(() => tick(1), 1000);
    setInterval(() => { save(); render(); }, 15000);
    render();
  }

  function bindUI() {
    document.getElementById("saveBtn").onclick = () => { save(); addLog("Manual save complete."); };
    document.getElementById("exportBtn").onclick = () => prompt("Copy save string:", btoa(JSON.stringify(game)));
    document.getElementById("importBtn").onclick = () => {
      const x = prompt("Paste save string:"); if (!x) return;
      try { Object.assign(game, JSON.parse(atob(x))); addLog("Import successful."); render(); } catch { addLog("Import failed."); }
    };
    document.getElementById("resetBtn").onclick = () => {
      if (confirm("Hard reset AXIOM? All progress will be lost.")) { localStorage.removeItem(SAVE_KEY); location.reload(); }
    };
  }

  function setupTabs() {
    const nav = document.getElementById("tabs");
    nav.innerHTML = "";
    TABS.forEach(t => {
      const b = document.createElement("button");
      b.textContent = t[0].toUpperCase() + t.slice(1);
      b.className = t === game.tab ? "active" : "";
      b.onclick = () => {
        game.tab = t;
        [...document.querySelectorAll(".tab")].forEach(el => el.classList.toggle("active", el.id === t));
        [...nav.children].forEach(n => n.classList.toggle("active", n.textContent.toLowerCase() === t));
      };
      nav.appendChild(b);
    });
  }

  function tick(dt) {
    const speed = getTickSpeed();
    dt *= speed;
    game.t += dt;
    game.stats.playSeconds += dt;
    baseIncome(dt);
    processBuildings(dt);
    processConversions(dt);
    processResearch(dt);
    processInstability(dt);
    processAnomalies(dt);
    processAutomation(dt);
    checkUnlocks();
    checkAchievements();
    render();
  }

  function baseIncome(dt) {
    gain("energy", (0.6 + game.manual.charges * 0.03) * globalMult("energy") * dt);
    gain("credits", 0.3 * globalMult("credits") * dt);
    gain("data", 0.15 * globalMult("data") * dt);
    gain("rp", 0.12 * (1 + game.resources.quantum.amount * 0.005) * dt);
    gain("entropy", Math.max(0, game.systems.decoherence * 0.01) * dt);
  }

  function processBuildings(dt) {
    for (const row of BUILDINGS) {
      const [id,,,,,,,fn] = row;
      const b = game.buildings[id];
      if (!b || b.owned === 0) continue;
      const eff = fn(game);
      Object.entries(eff).forEach(([k, v]) => {
        if (["manualEnergyMult","energyMult","heatToEnergy","plasmaToAntimatter","anomalyRate","instabilityReduction","tickSpeed","researchSpeed","conversionMult","anomalyLuck","fragments","shards"].includes(k)) return;
        if (k === "instability" || k === "temporalStress" || k === "vacuumInstability" || k === "darkPressure" || k === "entanglement" || k === "exoticDrift") {
          game.systems[k] += v * b.owned * dt * 0.01; return;
        }
        gain(resourceKey(k), v * b.owned * dt * (1 + game.prestige.ascensions * 0.04));
      });
      if (eff.instabilityReduction) game.systems.instability = Math.max(0, game.systems.instability - eff.instabilityReduction * b.owned * dt * 0.01);
      if (eff.manualEnergyMult) game.manual.energy = 1 + b.owned * eff.manualEnergyMult + game.prestige.ascensions * 0.2;
      if (eff.fragments) gain("fragments", eff.fragments * b.owned * dt);
      if (eff.shards) gain("realityShards", eff.shards * b.owned * dt);
      if (eff.heatToEnergy) {
        const take = Math.min(game.resources.heat.amount, b.owned * 0.5 * dt);
        game.resources.heat.amount -= take;
        gain("energy", take * eff.heatToEnergy);
      }
      if (eff.plasmaToAntimatter) {
        const take = Math.min(game.resources.plasma.amount, b.owned * 0.25 * dt);
        game.resources.plasma.amount -= take;
        gain("antimatter", take * eff.plasmaToAntimatter);
      }
    }
  }

  function processConversions(dt) {
    const convMult = 1 + (game.prestige.tree.convEfficiency || 0) * 0.15;
    for (const c of Object.values(game.conversions)) {
      if (!c.on || !game.research[c.req]?.done) continue;
      const factor = dt * c.rate * convMult;
      const can = Object.entries(c.input).every(([k, v]) => game.resources[k].amount >= v * factor);
      if (!can) continue;
      Object.entries(c.input).forEach(([k, v]) => game.resources[k].amount -= v * factor);
      Object.entries(c.output).forEach(([k, v]) => {
        if (k === "overclock") {
          game.anomalies.active.push({ name: "Overclock Window", left: 30, mult: 1.35 });
        } else if (k === "vacuumEdit") {
          game.prestige.tree.convEfficiency = (game.prestige.tree.convEfficiency || 0) + 1;
        } else if (game.systems[k] !== undefined) {
          game.systems[k] += v * factor;
        } else {
          gain(k, v * factor);
        }
      });
    }
  }

  function processResearch(dt) {
    if (!game.currentResearch && game.researchQueue.length) game.currentResearch = game.researchQueue.shift();
    if (!game.currentResearch) return;
    const r = game.research[game.currentResearch];
    if (!r || r.done) { game.currentResearch = null; return; }
    if (!canAfford(r.cost)) return;
    const speed = (1 + game.resources.flux.amount * 0.02 + (game.prestige.tree.researchRetention || 0) * 0.2 + owned("causalityEngine") * 0.08) * dt;
    r.progress = (r.progress || 0) + speed;
    if (r.progress >= r.time) {
      pay(r.cost);
      r.done = true;
      game.currentResearch = null;
      addLog(`Research complete: ${r.name}`);
      unlockCodex(r.name, r.effect);
      if (r.id === "auto1") game.unlocked.automation = true;
      if (r.id === "forbidden") { game.hiddenFlags.forbiddenUnlocked = true; unlockCodex("Forbidden Rewrite", "The vacuum can be instructed."); }
    }
  }

  function processInstability(dt) {
    const anti = game.resources.antimatter.amount;
    game.systems.instability += anti * 0.00015 * dt;
    game.systems.decoherence += game.resources.quantum.amount * 0.00009 * dt;
    game.systems.temporalStress += game.resources.flux.amount * 0.00006 * dt;
    game.systems.vacuumInstability += game.resources.vacuum.amount * 0.00008 * dt;
    game.systems.darkPressure += game.resources.darkMatter.amount * 0.00006 * dt;
    game.systems.entanglement += game.resources.qubits.amount * 0.00008 * dt;
    game.systems.exoticDrift += game.resources.exotic.amount * 0.00007 * dt;
    game.systems.entropyPressure = Math.max(0, game.resources.entropy.amount * 0.02);

    const stab = game.resources.stabilizers.amount * 0.0012 * dt;
    game.systems.instability = Math.max(0, game.systems.instability - stab);
    if (game.systems.instability > 100) {
      game.systems.instability = 65;
      game.resources.antimatter.amount *= 0.75;
      addLog("Containment event! Antimatter reserves partially lost.");
    }
    if (game.systems.darkPressure > 120) {
      game.systems.darkPressure = 80;
      game.resources.darkMatter.amount *= 0.85;
      addLog("Dark pressure inversion: field anchors slipped.");
    }
    if (game.systems.exoticDrift > 100) {
      game.systems.exoticDrift = 60;
      game.resources.exotic.amount *= 0.8;
      addLog("Exotic drift cascade reduced synthesis quality.");
    }
  }

  function processAnomalies(dt) {
    game.anomalies.cooldown -= dt;
    game.anomalies.active.forEach(a => a.left -= dt);
    game.anomalies.active = game.anomalies.active.filter(a => a.left > 0);
    if (game.anomalies.cooldown > 0) return;

    const rate = 0.14 + owned("deepSpaceRelay") * 0.01 + owned("probabilityEngine") * 0.015 + (game.prestige.tree.anomalyBoost || 0) * 0.03;
    if (Math.random() < rate) triggerAnomaly();
    game.anomalies.cooldown = 25 - Math.min(15, owned("deepSpaceRelay") * 0.2);
  }

  function processAutomation(dt) {
    if (!game.unlocked.automation || !game.automation.enabled) return;
    if (game.automation.autoManual) {
      manualAction("channel", 0.6 * dt);
      if (game.resources.heat.amount > 10) manualAction("stabilize", 0.4 * dt);
    }
    if (game.automation.autoCheapestEnergy && game.resources.energy.amount > game.automation.minEnergy) {
      const cheap = ["solarArray", "thermalWell", "groundReactor", "orbitalCollector"].sort((a, b) => buildingPrice(a).credits - buildingPrice(b).credits)[0];
      buyBuilding(cheap);
    }
    if (game.resources.plasma.amount > game.automation.plasmaAbove) game.conversions.plasmaToAntimatter.on = true;
    if (game.systems.instability > game.automation.pauseAntimatterAt) game.conversions.plasmaToAntimatter.on = false;
    if (game.automation.autoResearch) {
      const next = Object.values(game.research).find(r => !r.done && !r.hidden && r.req.every(x => game.research[x]?.done) && canAfford(r.cost));
      if (next && !game.researchQueue.includes(next.id) && game.currentResearch !== next.id) game.researchQueue.push(next.id);
    }
  }

  function triggerAnomaly() {
    const pool = ANOMALIES.filter(([id]) => id !== "falsevac" || game.resources.vacuum.amount > 5);
    const [id, name, desc] = pool[Math.floor(Math.random() * pool.length)];
    game.anomalies.discovered[id] = true;
    game.stats.anomaliesSeen++;
    game.anomalies.count++;
    addLog(`Anomaly detected: ${name} — ${desc}`);
    unlockCodex(name, desc);

    if (id === "flare") game.anomalies.active.push({ name, left: 40, mult: 1.5, target: "energy" });
    if (id === "bloom") { gain("plasma", 25); gain("heat", 30); }
    if (id === "breach") { game.resources.antimatter.amount *= 0.9; gain("data", 120); game.systems.instability += 5; }
    if (id === "storm") game.anomalies.active.push({ name, left: 30, mult: 2, target: "darkMatter" });
    if (id === "resonance") { gain("quantum", 18); game.systems.decoherence += 4; }
    if (id === "echo") game.anomalies.active.push({ name, left: 20, mult: 1.3, tick: true });
    if (id === "shear") { gain("cores", 1.2); game.systems.instability += 6; }
    if (id === "whisper") { game.hiddenFlags.precursor = true; }
    if (id === "falsevac") { gain("vacuum", 8); game.systems.vacuumInstability += 18; game.hiddenFlags.falseVacuumSeen = true; }
    if (id === "fracture" && game.stats.anomaliesSeen > 8) game.research.forbidden.hidden = false;
    if (id === "mirrorfall") {
      gain("fragments", 4);
      gain("quantum", 14);
      game.hiddenFlags.mirrorUnlocked = true;
      unlockCodex("Mirrorfall", "A neighboring timeline agreed to leak power.");
    }
    if (id === "axiomwake") {
      gain("axioms", 0.6);
      game.systems.exoticDrift += 7;
      unlockCodex("Axiom Wake", "Constants shivered. We wrote one down.");
    }
  }

  function manualAction(type, scale = 1) {
    if (type === "channel") { gain("energy", game.manual.energy * scale * (1 + game.prestige.tree.manualBoost * 0.2 || 1)); gain("heat", 0.4 * scale); game.stats.clicks++; }
    if (type === "stabilize") { gain("stabilizers", game.manual.stabilize * scale); game.systems.instability = Math.max(0, game.systems.instability - 1.2 * scale); }
    if (type === "pulse") {
      if (game.resources.energy.amount >= 20) { game.resources.energy.amount -= 20; gain("plasma", (1 + owned("fusionReactor") * 0.12) * scale); }
    }
    if (type === "scan") { gain("data", game.manual.scan * scale); if (Math.random() < 0.05) gain("rp", 3 * scale); }
    game.manual.charges = Math.min(250, game.manual.charges + 1 * scale);
  }

  function checkUnlocks() {
    if (game.resources.antimatter.amount > 0.5) game.unlocked.antimatter = true;
    if (game.resources.darkMatter.amount > 0.2) game.unlocked.dark = true;
    if (game.resources.quantum.amount > 0.2) game.unlocked.quantum = true;
    if (game.resources.exotic.amount > 0.2) game.unlocked.exotic = true;
    if (game.resources.flux.amount > 0.2) game.unlocked.flux = true;
    if (game.resources.cores.amount > 0.1) game.unlocked.singularity = true;
    if (game.resources.vacuum.amount > 0.1) game.unlocked.vacuum = true;
    if (game.resources.fragments.amount > 0.1) game.unlocked.multiversal = true;
    if (game.resources.qubits.amount > 0.1) unlockCodex("Qubit Substrate", "Probability is now inventory.");
    if (game.resources.axioms.amount > 0.1) unlockCodex("Sigil Registry", "Laws can be patched in production.");

    const r = game.resources;
    if (r.energy.amount > 100) r.plasma.unlocked = true;
    if (game.t > 900) game.era = "Interplanetary Industry";
    if (game.t > 2600) game.era = "Stellar Ambition";
    if (game.t > 5400) game.era = "Strange Physics";
    if (game.t > 9200) game.era = "Architects of the Multiversal Edge";
    if (game.regionsOwned.includes("mirrorSea")) game.era = "Mirror Cosmotechnics";
    if (game.regionsOwned.includes("axiomCore")) game.era = "Axiom Authority";
  }

  function checkAchievements() {
    const checks = [
      () => game.resources.energy.amount >= 100,
      () => owned("solarArray") >= 5,
      () => game.regionsOwned.includes("earthOrbit"),
      () => game.regionsOwned.includes("lunar"),
      () => game.regionsOwned.includes("mars"),
      () => game.regionsOwned.includes("belt"),
      () => game.regionsOwned.includes("jovian"),
      () => game.regionsOwned.includes("saturn"),
      () => game.regionsOwned.includes("polar"),
      () => game.regionsOwned.includes("dysonZone"),
      () => game.regionsOwned.includes("listening"),
      () => game.regionsOwned.includes("darkObs"),
      () => game.regionsOwned.includes("rift"),
      () => game.regionsOwned.includes("remnant"),
      () => game.regionsOwned.includes("horizon"),
      () => game.regionsOwned.includes("voidBreach"),
      () => game.regionsOwned.includes("fractured"),
      () => game.regionsOwned.includes("survey"),
      () => game.stats.clicks >= 100,
      () => game.stats.buildingsBought >= 100,
      () => Object.values(game.research).filter(r => r.done).length >= 10,
      () => game.stats.anomaliesSeen >= 1,
      () => game.stats.anomaliesSeen >= 10,
      () => game.prestige.ascensions >= 1,
      () => game.prestige.collapses >= 1,
      () => game.prestige.transcends >= 1,
      () => game.resources.entropy.amount < 10 && game.t > 1200,
      () => game.systems.instability < 10 && game.resources.antimatter.amount > 10,
      () => game.hiddenFlags.forbiddenUnlocked,
      () => game.hiddenFlags.falseVacuumSeen,
      () => game.resources.civMarks.amount >= 50,
      () => game.resources.realityShards.amount >= 25,
      () => game.systems.darkPressure > 10,
      () => game.resources.qubits.amount >= 50,
      () => game.resources.axioms.amount >= 5,
      () => game.regionsOwned.includes("mirrorSea"),
      () => game.regionsOwned.includes("axiomCore"),
      () => Object.values(game.research).filter(r => r.done).length >= 20,
      () => game.stats.buildingsBought >= 500,
      () => game.stats.anomaliesSeen >= 50,
      () => game.resources.axioms.amount >= 25,
      () => owned("deepSpaceRelay") >= 40,
      () => game.stats.playSeconds >= 20000,
      () => game.resources.vacuum.amount >= 500,
      () => game.prestige.transcends >= 10,
    ];
    checks.forEach((fn, i) => {
      const a = game.achievements[`a${i + 1}`];
      if (!a.done && fn()) { a.done = true; addLog(`Achievement unlocked: ${a.name}`); }
    });
  }

  function render() {
    document.getElementById("eraLabel").textContent = `Era: ${game.era}`;
    document.getElementById("timeLabel").textContent = `t = ${format(game.stats.playSeconds)}s`;
    document.getElementById("stabilityLabel").textContent = `Instability: ${format(game.systems.instability)}%`;
    renderOverview(); renderResources(); renderBuildings(); renderResearch(); renderExpansion(); renderConversions(); renderAutomation(); renderPrestige(); renderAnomalies(); renderCodex(); renderStats(); renderLog(); renderAchievements();
  }

  function renderOverview() {
    const el = document.getElementById("overview");
    el.innerHTML = `<div class="metric-grid">
      ${metric("Energy", game.resources.energy.amount, game.resources.energy.perSec)}
      ${metric("Plasma", game.resources.plasma.amount, game.resources.plasma.perSec)}
      ${metric("Antimatter", game.resources.antimatter.amount, game.resources.antimatter.perSec)}
      ${metric("Dark Matter", game.resources.darkMatter.amount, game.resources.darkMatter.perSec)}
      ${metric("Quantum", game.resources.quantum.amount, game.resources.quantum.perSec)}
      ${metric("Exotic", game.resources.exotic.amount, game.resources.exotic.perSec)}
      ${metric("Qubits", game.resources.qubits.amount, game.resources.qubits.perSec)}
      ${metric("Axiom Sigils", game.resources.axioms.amount, game.resources.axioms.perSec)}
    </div>
    <h3>Manual Operations</h3>
    <div class="card-grid">
      <div class="card"><div class="title"><span>Channel Energy</span><button id="m1">Execute</button></div><div class="muted">Core early action. Generates Energy and Heat.</div></div>
      <div class="card"><div class="title"><span>Stabilize Reactor</span><button id="m2">Execute</button></div><div class="muted">Creates stabilizers and lowers instability.</div></div>
      <div class="card"><div class="title"><span>Pulse Plasma</span><button id="m3">Execute</button></div><div class="muted">Spend energy to ignite plasma pulses.</div></div>
      <div class="card"><div class="title"><span>Run Deep Scan</span><button id="m4">Execute</button></div><div class="muted">Collect data; occasional RP spike.</div></div>
    </div>`;
    el.querySelector("#m1").onclick = () => manualAction("channel");
    el.querySelector("#m2").onclick = () => manualAction("stabilize");
    el.querySelector("#m3").onclick = () => manualAction("pulse");
    el.querySelector("#m4").onclick = () => manualAction("scan");
  }

  function renderResources() {
    document.getElementById("resources").innerHTML = `<div class="card-grid">${Object.entries(game.resources).filter(([,r]) => r.unlocked).map(([id,r]) => `<div class="card"><div class="title"><span>${r.icon} ${r.name}</span><span>${format(r.amount)}</span></div><div class="muted">${r.special}</div><div class="small">/s: ${format(calcPerSec(id))}</div></div>`).join("")}</div>`;
  }

  function renderBuildings() {
    document.getElementById("buildings").innerHTML = `<div class="card-grid">${BUILDINGS.map(([id,name,cat,desc]) => {
      const b = game.buildings[id];
      const c = buildingPrice(id);
      const locked = !buildingVisible(id);
      return `<div class="card ${locked ? "locked" : ""}"><div class="title"><span>${name}</span><span>x${b.owned}</span></div><div class="muted">${cat.toUpperCase()} · ${desc}</div><div class="small">Cost: ${costText(c)}</div><button ${locked ? "disabled" : ""} data-buy="${id}">Build</button></div>`;
    }).join("")}</div>`;
    document.querySelectorAll("[data-buy]").forEach(btn => btn.onclick = () => buyBuilding(btn.dataset.buy));
  }

  function renderResearch() {
    document.getElementById("research").innerHTML = `<div class="card-grid">${Object.values(game.research).filter(r => !r.hidden || game.hiddenFlags.forbiddenUnlocked || game.stats.anomaliesSeen > 8).map(r => {
      const ready = r.req.every(x => game.research[x]?.done);
      return `<div class="card ${(!ready || r.done) ? "locked" : ""}"><div class="title"><span>${r.name}</span><span>${r.cat}</span></div><div class="muted">${r.effect}</div><div class="small">Cost: ${costText(r.cost)} · Time: ${r.time}s</div><div class="progress"><div style="width:${Math.min(100, ((r.progress || 0)/r.time)*100)}%"></div></div><button ${(!ready || r.done) ? "disabled" : ""} data-r="${r.id}">${r.done ? "Completed" : "Queue"}</button></div>`;
    }).join("")}</div><p class="small">Current: ${game.currentResearch ? game.research[game.currentResearch].name : "None"}</p>`;
    document.querySelectorAll("[data-r]").forEach(btn => btn.onclick = () => queueResearch(btn.dataset.r));
  }

  function renderExpansion() {
    document.getElementById("expansion").innerHTML = `<div class="card-grid">${REGIONS.map(([id,name,desc,cost,mult,bonus]) => {
      const ownedRegion = game.regionsOwned.includes(id);
      const available = !ownedRegion && canAfford(cost);
      return `<div class="card ${ownedRegion ? "" : "locked"}"><div class="title"><span>${name}</span><span>${ownedRegion ? "Owned" : "Locked"}</span></div><div class="muted">${desc}</div><div class="small">Bonus: ${bonus}</div><div class="small">Cost: ${costText(cost)}</div><button ${ownedRegion ? "disabled" : ""} data-region="${id}">${available ? "Expand" : "Insufficient"}</button></div>`;
    }).join("")}</div>`;
    document.querySelectorAll("[data-region]").forEach(btn => btn.onclick = () => buyRegion(btn.dataset.region));
  }

  function renderConversions() {
    document.getElementById("conversions").innerHTML = `<div class="card-grid">${Object.values(game.conversions).map(c => {
      const available = game.research[c.req]?.done;
      return `<div class="card ${available ? "" : "locked"}"><div class="title"><span>${c.name}</span><label><input type="checkbox" ${c.on ? "checked" : ""} data-conv="${c.id}" ${available ? "" : "disabled"}/> Active</label></div><div class="muted">${c.desc}</div><div class="small">Input: ${costText(c.input)} | Output: ${costText(c.output)}</div></div>`;
    }).join("")}</div>`;
    document.querySelectorAll("[data-conv]").forEach(chk => chk.onchange = () => game.conversions[chk.dataset.conv].on = chk.checked);
  }

  function renderAutomation() {
    document.getElementById("automation").innerHTML = `<div class="card ${game.unlocked.automation ? "" : "locked"}">
      <div class="title"><span>Automation Mesh</span><label><input type="checkbox" ${game.automation.enabled ? "checked" : ""} id="autoEnabled" ${game.unlocked.automation ? "" : "disabled"}/> Enabled</label></div>
      <div class="small">Rules: maintain energy reserve, auto-buy structures, auto-manual operations, conversion throttles, research queueing.</div>
      <div class="small">Min Energy Reserve <input id="minEnergy" type="number" value="${game.automation.minEnergy}"/></div>
      <div class="small">Plasma conversion threshold <input id="plasmaAbove" type="number" value="${game.automation.plasmaAbove}"/></div>
      <div class="small">Pause antimatter when instability > <input id="pauseAnti" type="number" value="${game.automation.pauseAntimatterAt}"/></div>
      <label><input type="checkbox" id="autoBuy" ${game.automation.autoCheapestEnergy ? "checked" : ""}/> Auto-buy cheapest energy structure</label><br/>
      <label><input type="checkbox" id="autoResearch" ${game.automation.autoResearch ? "checked" : ""}/> Prioritize affordable research</label><br/>
      <label><input type="checkbox" id="autoManual" ${game.automation.autoManual ? "checked" : ""}/> Auto manual actions</label>
    </div>`;
    ["autoEnabled","autoBuy","autoResearch","autoManual"].forEach(id => { const el = document.getElementById(id); if(el) el.onchange = () => ({ autoEnabled:"enabled", autoBuy:"autoCheapestEnergy", autoResearch:"autoResearch", autoManual:"autoManual" })[id] && (game.automation[({ autoEnabled:"enabled", autoBuy:"autoCheapestEnergy", autoResearch:"autoResearch", autoManual:"autoManual" })[id]] = el.checked); });
    ["minEnergy","plasmaAbove","pauseAnti"].forEach(id => { const el = document.getElementById(id); if(el) el.onchange = () => ({ minEnergy:"minEnergy", plasmaAbove:"plasmaAbove", pauseAnti:"pauseAntimatterAt" })[id] && (game.automation[({ minEnergy:"minEnergy", plasmaAbove:"plasmaAbove", pauseAnti:"pauseAntimatterAt" })[id]] = Number(el.value)); });
  }

  function renderPrestige() {
    const ascGain = Math.floor(Math.sqrt(game.resources.energy.amount / 50000 + game.resources.plasma.amount / 4000));
    const colGain = Math.floor(Math.sqrt(game.resources.darkMatter.amount + game.resources.exotic.amount));
    const trGain = Math.floor(Math.sqrt(game.resources.vacuum.amount + game.resources.cores.amount / 2));
    document.getElementById("prestige").innerHTML = `<div class="card-grid">
      <div class="card"><div class="title"><span>Civilization Ascension</span><span>+${ascGain} Marks</span></div><div class="muted">Resets most resources/buildings/research. Keeps prestige currencies, codex, achievements.</div><button ${ascGain<=0?"disabled":""} id="ascend">Ascend</button></div>
      <div class="card"><div class="title"><span>Reality Collapse</span><span>+${colGain} Shards</span></div><div class="muted">Deeper reset. Keeps ascension upgrades and unlocks reality tree.</div><button ${colGain<=0?"disabled":""} id="collapse">Collapse</button></div>
      <div class="card"><div class="title"><span>Multiversal Transcendence</span><span>+${trGain} Fragments</span></div><div class="muted">Late-game reset. Unlocks strange mechanics and persistent multipliers.</div><button ${trGain<=0?"disabled":""} id="transcend">Transcend</button></div>
      <div class="card"><div class="title"><span>Meta Upgrades</span><span>Permanent</span></div>
        <button id="uManual">Manual Amplifier (5 Marks)</button>
        <button id="uConv">Conversion Efficiency (8 Marks)</button>
        <button id="uAnom">Anomaly Discovery (4 Shards)</button>
        <button id="uResearch">Research Retention (6 Shards)</button>
      </div>
    </div>`;
    document.getElementById("ascend").onclick = () => doPrestige("asc", ascGain);
    document.getElementById("collapse").onclick = () => doPrestige("col", colGain);
    document.getElementById("transcend").onclick = () => doPrestige("tr", trGain);
    document.getElementById("uManual").onclick = () => buyMeta("manualBoost", "civMarks", 5);
    document.getElementById("uConv").onclick = () => buyMeta("convEfficiency", "civMarks", 8);
    document.getElementById("uAnom").onclick = () => buyMeta("anomalyBoost", "realityShards", 4);
    document.getElementById("uResearch").onclick = () => buyMeta("researchRetention", "realityShards", 6);
  }

  function renderAnomalies() {
    document.getElementById("anomalies").innerHTML = `<div class="card"><div class="title"><span>Active Distortions</span><span>${game.anomalies.active.length}</span></div>${game.anomalies.active.map(a => `<div class="small">${a.name}: ${format(a.left)}s</div>`).join("") || "<div class='small'>None</div>"}</div><div class="card"><div class="title"><span>Discovered Anomalies</span><span>${Object.keys(game.anomalies.discovered).length}/${ANOMALIES.length}</span></div>${ANOMALIES.map(([id, n]) => `<div class="small">${game.anomalies.discovered[id] ? "✓" : "•"} ${n}</div>`).join("")}</div>`;
  }

  function renderCodex() {
    document.getElementById("codex").innerHTML = `<div class="card-grid">${game.codex.slice(-60).reverse().map(c => `<div class="card"><div class="title"><span>${c.title}</span><span class="small">${Math.floor(c.at)}s</span></div><div class="muted">${c.body}</div></div>`).join("")}</div>`;
  }

  function renderStats() {
    document.getElementById("stats").innerHTML = `<div class="metric-grid">
      ${metric("Clicks", game.stats.clicks, 0)}
      ${metric("Buildings Bought", game.stats.buildingsBought, 0)}
      ${metric("Anomalies Seen", game.stats.anomaliesSeen, 0)}
      ${metric("Ascensions", game.prestige.ascensions, 0)}
      ${metric("Collapses", game.prestige.collapses, 0)}
      ${metric("Transcendences", game.prestige.transcends, 0)}
      ${metric("Offline Seconds", game.stats.offlineSeconds, 0)}
    </div>`;
  }

  function renderLog() {
    document.getElementById("log").innerHTML = game.log.slice(-25).reverse().map(x => `<div class="log-item">${x}</div>`).join("");
  }

  function renderAchievements() {
    document.getElementById("achievementList").innerHTML = Object.values(game.achievements).map(a => `<div class="achv ${a.done ? "done" : ""}"><strong>${a.name}</strong><div>${a.desc}</div></div>`).join("");
  }

  function queueResearch(id) {
    const r = game.research[id];
    if (!r || r.done || !r.req.every(x => game.research[x]?.done)) return;
    if (!game.researchQueue.includes(id) && game.currentResearch !== id) game.researchQueue.push(id);
  }

  function buyBuilding(id) {
    if (!buildingVisible(id)) return;
    const c = buildingPrice(id);
    if (!canAfford(c)) return;
    pay(c);
    game.buildings[id].owned++;
    game.stats.buildingsBought++;
  }

  function buildingVisible(id) {
    const idx = BUILDINGS.findIndex(x => x[0] === id);
    if (idx < 6) return true;
    if (idx < 14) return game.research.plasma1.done || game.regionsOwned.includes("mars");
    if (idx < 22) return game.research.dark1.done || game.resources.darkMatter.amount > 0;
    return game.research.vac1.done || game.resources.vacuum.amount > 0 || game.research.exotic2?.done;
  }

  function buildingPrice(id) {
    const b = game.buildings[id];
    const mult = Math.pow(b.scale, b.owned);
    const out = {};
    Object.entries(b.baseCost).forEach(([k,v]) => out[k] = v * mult);
    return out;
  }

  function buyRegion(id) {
    const r = REGIONS.find(x => x[0] === id);
    if (!r || game.regionsOwned.includes(id) || !canAfford(r[3])) return;
    pay(r[3]);
    game.regionsOwned.push(id);
    unlockCodex(r[1], r[5]);
    addLog(`Expansion complete: ${r[1]}`);
  }

  function doPrestige(type, gainAmount) {
    if (gainAmount <= 0) return;
    if (type === "asc") { gain("civMarks", gainAmount); game.prestige.ascensions++; }
    if (type === "col") { gain("realityShards", gainAmount); game.prestige.collapses++; }
    if (type === "tr") { gain("fragments", gainAmount); game.prestige.transcends++; }
    addLog(`Prestige event: ${type} (+${gainAmount})`);
    softReset(type);
  }

  function softReset(type) {
    const keepResearch = game.prestige.tree.researchRetention > 0;
    Object.values(game.resources).forEach(r => {
      if (["civMarks","realityShards","fragments"].includes(Object.keys(game.resources).find(k => game.resources[k] === r))) return;
      r.amount = 0;
    });
    Object.values(game.buildings).forEach(b => b.owned = 0);
    Object.values(game.research).forEach(r => { if (!keepResearch || type === "tr") { if (!r.cat.includes("Governance") && r.id !== "auto1") { r.done = false; r.progress = 0; } } });
    game.researchQueue = [];
    game.currentResearch = null;
    game.regionsOwned = ["earthGrid"];
    game.systems.instability = 0;
    game.systems.decoherence = 0;
    game.systems.temporalStress = 0;
    game.systems.vacuumInstability = 0;
  }

  function buyMeta(key, cur, cost) {
    if (game.resources[cur].amount < cost) return;
    game.resources[cur].amount -= cost;
    game.prestige.tree[key] = (game.prestige.tree[key] || 0) + 1;
    addLog(`Meta upgrade purchased: ${key}`);
  }

  function globalMult(type) {
    let m = 1 + game.prestige.ascensions * 0.06 + game.prestige.collapses * 0.12 + game.prestige.transcends * 0.2;
    const regionBonus = game.regionsOwned.reduce((acc, id) => acc * (REGIONS.find(r => r[0] === id)?.[4] || 1), 1);
    if (["energy","credits","alloys","data","rp"].includes(type)) m *= Math.pow(regionBonus, 0.04);
    if (game.anomalies.active.some(a => a.target === type)) m *= game.anomalies.active.filter(a => a.target === type).reduce((x,a) => x * a.mult, 1);
    if (type === "energy" && game.research.power1.done) m *= 1.12;
    if (type === "alloys" && game.research.industry1.done) m *= 1.25;
    if (type === "darkMatter" && game.research.dark2?.done) m *= 1 + game.systems.darkPressure * 0.006;
    if (type === "quantum" && game.research.quant2?.done) m *= 1 + game.systems.entanglement * 0.004;
    if (type === "exotic" && game.research.exotic2?.done) m *= 1 + game.resources.axioms.amount * 0.03;
    return m;
  }

  function calcPerSec(id) {
    const before = game.resources[id].amount;
    const snapshot = JSON.parse(JSON.stringify(game));
    tickPreview(1);
    const per = game.resources[id].amount - before;
    Object.assign(game, snapshot);
    return per;
  }

  function tickPreview(dt) {
    baseIncome(dt);
    processBuildings(dt);
    processConversions(dt);
  }

  function getTickSpeed() {
    let s = 1 + owned("temporalRelay") * 0.02;
    if (game.anomalies.active.some(a => a.tick)) s *= 1.3;
    return s;
  }

  function canAfford(cost) { return Object.entries(cost).every(([k, v]) => (game.resources[k]?.amount || 0) >= v); }
  function pay(cost) { Object.entries(cost).forEach(([k,v]) => game.resources[k].amount -= v); }
  function gain(k, v) { if (!game.resources[k]) return; game.resources[k].amount += v; game.resources[k].perSec = v; if (k === "energy") game.stats.totalEnergy += v; game.resources[k].unlocked = true; }
  function resourceKey(k) { return { shards: "realityShards" }[k] || k; }
  function owned(id) { return game.buildings[id]?.owned || 0; }

  function addLog(msg) {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    game.log.push(line);
    if (game.log.length > 120) game.log.shift();
  }

  function unlockCodex(title, body) {
    if (game.codex.some(c => c.title === title)) return;
    game.codex.push({ title, body, at: game.stats.playSeconds });
  }

  function save() {
    game.lastSaved = Date.now();
    localStorage.setItem(SAVE_KEY, btoa(JSON.stringify(game)));
  }

  function load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(atob(raw));
      Object.assign(game, data);
      normalizeState();
      offlineProgress();
    } catch { addLog("Save file corrupted, started new timeline."); }
  }

  function offlineProgress() {
    const now = Date.now();
    const secs = Math.min(3600 * 8, Math.max(0, (now - (game.lastSaved || now)) / 1000));
    if (secs < 3) return;
    const efficiency = 0.35 + (game.prestige.tree.offline || 0) * 0.1;
    const mult = secs * efficiency;
    gain("energy", calcPerSec("energy") * mult);
    gain("credits", calcPerSec("credits") * mult);
    gain("alloys", calcPerSec("alloys") * mult);
    gain("data", calcPerSec("data") * mult);
    gain("darkMatter", calcPerSec("darkMatter") * mult * 0.6);
    gain("quantum", calcPerSec("quantum") * mult * 0.6);
    game.stats.offlineSeconds += secs;
    addLog(`Offline progression: ${format(secs)}s simulated at ${Math.floor(efficiency*100)}% efficiency.`);
  }

  function loop() {
    const now = Date.now();
    const dt = Math.min(0.4, (now - game.lastTick) / 1000);
    game.lastTick = now;
    tick(dt);
    requestAnimationFrame(loop);
  }

  function format(n) {
    if (!isFinite(n)) return "∞";
    const sign = n < 0 ? "-" : "";
    n = Math.abs(n);
    if (n < 1000) return sign + n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0);
    const e = Math.floor(Math.log10(n) / 3);
    if (e >= suffixes.length) return sign + n.toExponential(2);
    return sign + (n / Math.pow(1000, e)).toFixed(2) + suffixes[e];
  }

  function costText(cost) { return Object.entries(cost).map(([k,v]) => `${format(v)} ${game.resources[k]?.name || k}`).join(", "); }
  function metric(name, value, per) { return `<div class="metric"><strong>${name}</strong><div>${format(value)}</div>${per ? `<div class='small'>/s ${format(per)}</div>` : ""}</div>`; }

  function normalizeState() {
    BUILDINGS.forEach(([id, name, cat, desc, cost, scale, type]) => {
      if (!game.buildings[id]) game.buildings[id] = { id, name, cat, desc, baseCost: cost, scale, type, owned: 0 };
    });
    RESEARCH.forEach(([id, name, cat, cost, time, req, effect]) => {
      if (!game.research[id]) game.research[id] = { id, name, cat, cost, time, req, effect, done: false, hidden: id === "forbidden" };
    });
    CONVERSIONS.forEach(([id, name, desc, input, output, req]) => {
      if (!game.conversions[id]) game.conversions[id] = { id, name, desc, input, output, req, on: false, rate: 1 };
    });
    Object.entries({
      qubits: makeResource("Qubits", "⌬", "Quantum computing substrate for entanglement systems."),
      axioms: makeResource("Axiom Sigils", "⟁", "Late-game law-writing tokens forged from exotic reality work."),
    }).forEach(([k, v]) => { if (!game.resources[k]) game.resources[k] = v; });
    game.systems.darkPressure ??= 0;
    game.systems.entanglement ??= 0;
    game.systems.exoticDrift ??= 0;
    game.hiddenFlags.mirrorUnlocked ??= false;
    ACHIEVEMENTS.forEach(a => { if (!game.achievements[a.id]) game.achievements[a.id] = a; });
  }

  init();
})();
