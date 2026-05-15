/* =======================================================
   QEEPP Integrity Calculator
   Version: 1.0

   Purpose:
   Calculates the QEEPP Integrity Level from the five
   QEEPP dimension scores using weighted progression logic,
   dependency penalties, imbalance penalties, and prerequisite caps.
   ======================================================= */

(function () {
  "use strict";

  const INTEGRITY_LABELS = {
    1: "Fragmented",
    2: "Inconsistent",
    3: "Forming",
    4: "Controlled",
    5: "Resilient"
  };

  const INTEGRITY_MEANINGS = {
    1: "Transformation conditions are reactive, underdeveloped, and structurally unstable.",
    2: "Early structure exists, but controls, alignment, and execution discipline are inconsistent.",
    3: "Core practices are forming and becoming repeatable, but structural balance is not yet reliable.",
    4: "Transformation execution is governed, visible, accountable, and structurally dependable.",
    5: "Transformation capability can scale and adapt without degrading structural integrity."
  };

  function clampQeeppScore(value) {
    const n = Number(value);

    if (Number.isNaN(n)) return 1;

    return Math.max(1, Math.min(5, n));
  }

  function roundToOneDecimal(value) {
    return Math.round(value * 10) / 10;
  }

  function getIntegrityLabel(level) {
    return INTEGRITY_LABELS[level] || INTEGRITY_LABELS[1];
  }

  function getIntegrityMeaning(level) {
    return INTEGRITY_MEANINGS[level] || INTEGRITY_MEANINGS[1];
  }

  function classifyIntegrityScore(score) {
    if (score < 1.8) return 1;
    if (score < 2.6) return 2;
    if (score < 3.4) return 3;
    if (score < 4.2) return 4;
    return 5;
  }

  function normalizeInputScores(inputScores) {
    const source = inputScores || {};

    return {
      quality: clampQeeppScore(source.quality),
      effectiveness: clampQeeppScore(source.effectiveness),
      efficiency: clampQeeppScore(source.efficiency),
      performance: clampQeeppScore(source.performance),
      productivity: clampQeeppScore(source.productivity)
    };
  }

  function calculateWeightedIntegrityBase(scores) {
    const {
      quality,
      effectiveness,
      efficiency,
      performance,
      productivity
    } = scores;

    return (
      quality * 5 +
      effectiveness * 4 +
      efficiency * 3 +
      performance * 2 +
      productivity * 1
    ) / 15;
  }

  function calculateDependencyPenalty(scores) {
    const {
      quality,
      effectiveness,
      efficiency,
      performance,
      productivity
    } = scores;

    return (
      0.30 * Math.max(0, 3 - quality) +
      0.25 * Math.max(0, 3 - effectiveness) +
      0.15 * Math.max(0, 3 - efficiency) +
      0.10 * Math.max(0, 3 - performance) +
      0.05 * Math.max(0, 3 - productivity)
    );
  }

  function calculateImbalancePenalty(scores) {
    const values = Object.values(scores);
    const maxScore = Math.max(...values);
    const minScore = Math.min(...values);
    const spread = maxScore - minScore;

    if (spread >= 4) return 0.75;
    if (spread >= 3) return 0.5;
    if (spread >= 2) return 0.25;

    return 0;
  }

  function calculateIntegrityCap(scores) {
    const {
      quality,
      effectiveness,
      efficiency,
      performance,
      productivity
    } = scores;

    let cap = 5;

    if (quality <= 1) cap = Math.min(cap, 1);
    else if (quality <= 2) cap = Math.min(cap, 3);
    else if (quality <= 3) cap = Math.min(cap, 4);

    if (effectiveness <= 1) cap = Math.min(cap, 2);
    else if (effectiveness <= 2) cap = Math.min(cap, 3);
    else if (effectiveness <= 3) cap = Math.min(cap, 4);

    if (efficiency <= 1) cap = Math.min(cap, 3);
    else if (efficiency <= 2) cap = Math.min(cap, 4);

    if (performance <= 2) cap = Math.min(cap, 4);
    if (productivity <= 2) cap = Math.min(cap, 4);

    return cap;
  }

  function calculateQeeppIntegrity(inputScores) {
    const scores = normalizeInputScores(inputScores);

    const weightedBaseScore = calculateWeightedIntegrityBase(scores);
    const dependencyPenalty = calculateDependencyPenalty(scores);
    const imbalancePenalty = calculateImbalancePenalty(scores);

    const rawIntegrityScore =
      weightedBaseScore -
      dependencyPenalty -
      imbalancePenalty;

    const normalizedIntegrityScore = Math.max(1, Math.min(5, rawIntegrityScore));

    const initialLevel = classifyIntegrityScore(normalizedIntegrityScore);
    const cap = calculateIntegrityCap(scores);
    const finalLevel = Math.min(initialLevel, cap);

    return {
      scores,
      weightedBaseScore: roundToOneDecimal(weightedBaseScore),
      dependencyPenalty: roundToOneDecimal(dependencyPenalty),
      imbalancePenalty: roundToOneDecimal(imbalancePenalty),
      rawIntegrityScore: roundToOneDecimal(rawIntegrityScore),
      normalizedIntegrityScore: roundToOneDecimal(normalizedIntegrityScore),
      initialLevel,
      cap,
      finalLevel,
      levelName: getIntegrityLabel(finalLevel),
      meaning: getIntegrityMeaning(finalLevel)
    };
  }

  function formatQeeppIntegritySummary(result) {
    if (!result) return "";

    return `${result.levelName} - Level ${result.finalLevel}: ${result.meaning}`;
  }

  function renderQeeppIntegritySummary(containerId, inputScores) {
    const container = document.getElementById(containerId);

    if (!container) {
      console.warn(`QEEPP Integrity: container "${containerId}" not found.`);
      return null;
    }

    const result = calculateQeeppIntegrity(inputScores);

    container.innerHTML = `
      <div class="integrity-summary-card">
        <div class="integrity-kicker">QEEPP Integrity Level ${result.finalLevel}: ${result.levelName}</div>

        <p class="integrity-meaning">
          ${result.meaning}
        </p>

        <div class="integrity-score-grid" aria-label="QEEPP Integrity calculation details">
          <div>
            <span>Weighted base</span>
            <strong>${result.weightedBaseScore}</strong>
          </div>

          <div>
            <span>Dependency penalty</span>
            <strong>${result.dependencyPenalty}</strong>
          </div>

          <div>
            <span>Imbalance penalty</span>
            <strong>${result.imbalancePenalty}</strong>
          </div>

          <div>
            <span>Adjusted score</span>
            <strong>${result.normalizedIntegrityScore}</strong>
          </div>

          <div>
            <span>Integrity cap</span>
            <strong>${result.cap}</strong>
          </div>
        </div>

        <p class="integrity-note">
          The Integrity Level is not a simple average. It interprets how the five dimension scores work together, accounting for progression dependencies, structural imbalance, and prerequisite constraints.
        </p>
      </div>
    `;

    return result;
  }

  function renderQeeppIntegrityPending(containerId) {
    const container = document.getElementById(containerId);

    if (!container) return null;

    container.innerHTML = `
      <div class="integrity-summary-card">
        <div class="integrity-kicker">QEEPP Integrity Level</div>

        <h3 class="integrity-title">
          Assessment in progress
        </h3>

        <p class="integrity-meaning">
          Complete all five dimension scores to calculate the QEEPP Integrity Level.
        </p>
      </div>
    `;

    return null;
  }

  window.QEEPPIntegrity = {
    calculate: calculateQeeppIntegrity,
    renderSummary: renderQeeppIntegritySummary,
    renderPending: renderQeeppIntegrityPending,
    formatSummary: formatQeeppIntegritySummary,
    getLabel: getIntegrityLabel,
    getMeaning: getIntegrityMeaning
  };
})();