(function () {
  "use strict";

  const config = window.QEEPP_FDA_CONFIG || {
    dataUrl: "assets/data/qeepp-fda.json",
    storageKey: "qeepp-fda-session-v1"
  };

  const state = {
    framework: null,
    session: {
      meta: {},
      controls: {}
    }
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function slug(input) {
    return String(input).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function getMetaElementMap() {
    return {
      title: document.getElementById("assessment-title"),
      organization: document.getElementById("assessment-organization"),
      scope: document.getElementById("assessment-scope"),
      assessor: document.getElementById("assessment-assessor"),
      date: document.getElementById("assessment-date"),
      type: document.getElementById("assessment-type")
    };
  }

  function getDimensionById(dimensionId) {
    return state.framework.dimensions.find(function (dimension) {
      return dimension.id === dimensionId;
    });
  }

  function getControlKey(dimensionId, controlId) {
    return dimensionId + "." + controlId;
  }

  function getControlState(dimensionId, controlId) {
    const key = getControlKey(dimensionId, controlId);
    if (!state.session.controls[key]) {
      state.session.controls[key] = {
        answers: { existence: "", consistency: "", operational: "" },
        note: "",
        evidenceBasis: "",
        confidence: "",
        derivedScore: null,
        flags: []
      };
    }
    return state.session.controls[key];
  }

  function answerOptionsHtml() {
    return state.framework.meta.answerScale.map(function (option) {
      return '<option value="' + option.value + '">' + escapeHtml(option.label) + "</option>";
    }).join("");
  }

  function genericOptionsHtml(options) {
    return options.map(function (option) {
      return '<option value="' + escapeHtml(option.value) + '">' + escapeHtml(option.label) + "</option>";
    }).join("");
  }

  function renderDimensions() {
    const root = document.getElementById("fda-dimensions");
    if (!root || !state.framework) return;

    const answerOptions = answerOptionsHtml();
    const basisOptions = genericOptionsHtml(state.framework.meta.evidenceBasisOptions);
    const confidenceOptions = genericOptionsHtml(state.framework.meta.confidenceOptions);

    root.innerHTML = state.framework.dimensions.map(function (dimension, dimensionIndex) {
      const controlsHtml = dimension.controls.map(function (control) {
        const controlKey = getControlKey(dimension.id, control.id);
        return `
          <article class="panel fda-control" data-control-key="${escapeHtml(controlKey)}">
            <div class="fda-control-head">
              <div>
                <h4>${escapeHtml(control.label)}</h4>
                <p>${escapeHtml(control.description)}</p>
              </div>
              <div class="pill fda-score" data-score-pill="${escapeHtml(controlKey)}">Pending</div>
            </div>

            ${control.questions.map(function (question) {
              const inputId = slug(controlKey + "-" + question.id);
              const helpId = inputId + "-help";
              return `
                <div class="fda-question">
                  <div class="fda-question-head">
                    <label for="${escapeHtml(inputId)}"><strong>${escapeHtml(question.text)}</strong></label>
                    <button
                      type="button"
                      class="fda-help-toggle"
                      data-help-toggle="${escapeHtml(helpId)}"
                      aria-expanded="false"
                      aria-controls="${escapeHtml(helpId)}"
                    >?</button>
                  </div>
                  <div id="${escapeHtml(helpId)}" class="fda-help fda-hidden">${escapeHtml(question.help)}</div>
                  <select
                    id="${escapeHtml(inputId)}"
                    class="input fda-answer"
                    data-control-key="${escapeHtml(controlKey)}"
                    data-axis="${escapeHtml(question.axis)}"
                  >
                    <option value="">Select evidence level</option>
                    ${answerOptions}
                  </select>
                  <div class="fda-scale-hint">
                    Use the answer that best matches visible evidence across the assessed scope.
                  </div>
                </div>
              `;
            }).join("")}

            <div class="fda-control-grid">
              <div>
                <label for="${escapeHtml(slug(controlKey + "-note"))}"><strong>Evidence note</strong></label>
                <textarea
                  id="${escapeHtml(slug(controlKey + "-note"))}"
                  class="input fda-note"
                  rows="5"
                  data-control-key="${escapeHtml(controlKey)}"
                  placeholder="What evidence supports the selected answers?"
                ></textarea>
              </div>

              <div class="fda-control-side">
                <div>
                  <label for="${escapeHtml(slug(controlKey + "-basis"))}"><strong>Evidence basis</strong></label>
                  <select
                    id="${escapeHtml(slug(controlKey + "-basis"))}"
                    class="input fda-basis"
                    data-control-key="${escapeHtml(controlKey)}"
                  >
                    <option value="">Select</option>
                    ${basisOptions}
                  </select>
                </div>

                <div>
                  <label for="${escapeHtml(slug(controlKey + "-confidence"))}"><strong>Confidence</strong></label>
                  <select
                    id="${escapeHtml(slug(controlKey + "-confidence"))}"
                    class="input fda-confidence"
                    data-control-key="${escapeHtml(controlKey)}"
                  >
                    <option value="">Select</option>
                    ${confidenceOptions}
                  </select>
                </div>

                <div class="mini fda-result" data-result-text="${escapeHtml(controlKey)}">
                  Complete all three diagnostic questions to calculate the control score.
                </div>
              </div>
            </div>

            <div class="cards2">
              <div class="card">
                <h3>Observable checkpoints</h3>
                <p>${escapeHtml(control.checkpoints)}</p>
              </div>
              <div class="card">
                <h3>Assessment action</h3>
                <p>${escapeHtml(control.assessmentActions)}</p>
              </div>
            </div>

            <div class="card">
              <h3>Scoring guidance</h3>
              <ul class="fda-hint-list">
                ${control.scoringGuidance.map(function (line) {
                  return "<li>" + escapeHtml(line) + "</li>";
                }).join("")}
              </ul>
            </div>
          </article>
        `;
      }).join("");

      return `
        <details class="fda-dimension" ${dimensionIndex === 0 ? "open" : ""} data-dimension-id="${escapeHtml(dimension.id)}">
          <summary>
            <div class="fda-dimension-title">
              <h3>${escapeHtml(dimension.label)} <span class="badge primary">${escapeHtml(dimension.sequenceLabel)}</span></h3>
              <p>${escapeHtml(dimension.tagline)}</p>
            </div>
            <div class="fda-dimension-meta">
              <span class="fda-pill-soft" data-dimension-progress="${escapeHtml(dimension.id)}">0 / ${dimension.controls.length} complete</span>
              <span class="fda-pill-soft" data-dimension-score="${escapeHtml(dimension.id)}">Pending</span>
            </div>
          </summary>
          <div class="fda-dimension-body">
            ${controlsHtml}
          </div>
        </details>
      `;
    }).join("");

    bindControlEvents();
    hydrateFormFromState();
    recalculate(false);
  }

  function deriveControlScore(payload) {
    const E = Number(payload.answers.existence);
    const C = Number(payload.answers.consistency);
    const O = Number(payload.answers.operational);

    if ([E, C, O].some(function (value) { return Number.isNaN(value); })) {
      return { score: null, flags: ["Incomplete"], summary: "Complete all three questions to calculate the control score." };
    }

    let score;
    if (E <= 1) {
      score = 1;
    } else if (E >= 2 && C <= 1) {
      score = 2;
    } else if (E >= 5 && C >= 5 && O >= 4) {
      score = 5;
    } else if (E >= 4 && C >= 4 && O >= 3) {
      score = 4;
    } else if (Math.min(E, C, O) >= 3) {
      score = 3;
    } else if (E >= 2) {
      score = 2;
    } else {
      score = 1;
    }

    const flags = [];
    const weakNote = !payload.note || payload.note.trim().length < 20;
    const assumedEvidence = payload.evidenceBasis === "assumed";
    const lowConfidence = payload.confidence === "low";

    if (weakNote) flags.push("Limited evidence note");
    if (assumedEvidence) flags.push("Evidence not verified");
    if (lowConfidence) flags.push("Low confidence");

    if (score >= 4 && (weakNote || assumedEvidence || lowConfidence)) {
      score -= 1;
      flags.push("Score moderated due to evidence quality");
    }

    let summary = "Derived control score " + score + " from existence, consistency, and operational reality.";
    if (flags.length) {
      summary += " Flags: " + flags.join(", ") + ".";
    }

    return { score: score, flags: flags, summary: summary };
  }

  function collectMeta() {
    const fields = getMetaElementMap();
    state.session.meta = {
      title: fields.title.value.trim(),
      organization: fields.organization.value.trim(),
      scope: fields.scope.value.trim(),
      assessor: fields.assessor.value.trim(),
      date: fields.date.value,
      type: fields.type.value,
      updatedAt: new Date().toISOString()
    };
  }

  function hydrateFormFromState() {
    const fields = getMetaElementMap();
    const meta = state.session.meta || {};
    Object.keys(fields).forEach(function (key) {
      if (meta[key] != null && fields[key]) {
        fields[key].value = meta[key];
      }
    });

    document.querySelectorAll(".fda-answer").forEach(function (element) {
      const control = getControlStateFromElement(element);
      element.value = control.answers[element.dataset.axis] ?? "";
    });

    document.querySelectorAll(".fda-note").forEach(function (element) {
      const control = getControlStateByKey(element.dataset.controlKey);
      element.value = control.note || "";
    });

    document.querySelectorAll(".fda-basis").forEach(function (element) {
      const control = getControlStateByKey(element.dataset.controlKey);
      element.value = control.evidenceBasis || "";
    });

    document.querySelectorAll(".fda-confidence").forEach(function (element) {
      const control = getControlStateByKey(element.dataset.controlKey);
      element.value = control.confidence || "";
    });
  }

  function getControlStateByKey(controlKey) {
    if (!state.session.controls[controlKey]) {
      state.session.controls[controlKey] = {
        answers: { existence: "", consistency: "", operational: "" },
        note: "",
        evidenceBasis: "",
        confidence: "",
        derivedScore: null,
        flags: []
      };
    }
    return state.session.controls[controlKey];
  }

  function getControlStateFromElement(element) {
    return getControlStateByKey(element.dataset.controlKey);
  }

  function bindControlEvents() {
    document.querySelectorAll(".fda-help-toggle").forEach(function (button) {
      button.addEventListener("click", function () {
        const helpId = button.dataset.helpToggle;
        const help = document.getElementById(helpId);
        const expanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!expanded));
        help.classList.toggle("fda-hidden");
      });
    });

    document.querySelectorAll(".fda-answer").forEach(function (element) {
      element.addEventListener("change", function () {
        const control = getControlStateFromElement(element);
        control.answers[element.dataset.axis] = element.value;
        recalculate(false);
      });
    });

    document.querySelectorAll(".fda-note").forEach(function (element) {
      element.addEventListener("input", function () {
        const control = getControlStateByKey(element.dataset.controlKey);
        control.note = element.value;
        recalculate(false);
      });
    });

    document.querySelectorAll(".fda-basis").forEach(function (element) {
      element.addEventListener("change", function () {
        const control = getControlStateByKey(element.dataset.controlKey);
        control.evidenceBasis = element.value;
        recalculate(false);
      });
    });

    document.querySelectorAll(".fda-confidence").forEach(function (element) {
      element.addEventListener("change", function () {
        const control = getControlStateByKey(element.dataset.controlKey);
        control.confidence = element.value;
        recalculate(false);
      });
    });
  }

  function isControlComplete(control) {
    return Boolean(control.answers.existence !== "" && control.answers.consistency !== "" && control.answers.operational !== "");
  }

  function updateControlDisplay(controlKey, derived) {
    const pill = document.querySelector('[data-score-pill="' + controlKey + '"]');
    const result = document.querySelector('[data-result-text="' + controlKey + '"]');

    if (!pill || !result) return;

    if (derived.score == null) {
      pill.textContent = "Pending";
      result.innerHTML = "Complete all three diagnostic questions to calculate the control score.";
      return;
    }

    pill.textContent = "Score " + derived.score;
    result.innerHTML = "<strong>Score " + derived.score + ".</strong> " + escapeHtml(derived.summary);
  }

  function recalculate(shouldRenderResults) {
    collectMeta();

    const dimensionResults = [];
    let completedControls = 0;
    let totalControls = 0;

    state.framework.dimensions.forEach(function (dimension) {
      const controlScores = [];
      let dimensionCompleted = 0;

      dimension.controls.forEach(function (controlDef) {
        totalControls += 1;
        const controlKey = getControlKey(dimension.id, controlDef.id);
        const control = getControlStateByKey(controlKey);
        const derived = deriveControlScore(control);
        control.derivedScore = derived.score;
        control.flags = derived.flags;

        updateControlDisplay(controlKey, derived);

        if (isControlComplete(control)) {
          dimensionCompleted += 1;
          completedControls += 1;
        }

        if (derived.score != null) {
          controlScores.push(derived.score);
        }
      });

      const average = controlScores.length
        ? Number((controlScores.reduce(function (sum, value) { return sum + value; }, 0) / controlScores.length).toFixed(1))
        : null;

      dimensionResults.push({
        id: dimension.id,
        label: dimension.label,
        score: average,
        completed: dimensionCompleted,
        total: dimension.controls.length,
        weakestControl: weakestControlForDimension(dimension.id)
      });

      const progressEl = document.querySelector('[data-dimension-progress="' + dimension.id + '"]');
      const scoreEl = document.querySelector('[data-dimension-score="' + dimension.id + '"]');
      if (progressEl) progressEl.textContent = dimensionCompleted + " / " + dimension.controls.length + " complete";
      if (scoreEl) scoreEl.textContent = average == null ? "Pending" : "Score " + average.toFixed(1);
    });

    updateTopPills(completedControls, totalControls, dimensionResults);

    if (shouldRenderResults) {
      renderResults(dimensionResults);
    }
  }

  function weakestControlForDimension(dimensionId) {
    const dimension = getDimensionById(dimensionId);
    const entries = dimension.controls
      .map(function (controlDef) {
        const key = getControlKey(dimensionId, controlDef.id);
        const control = getControlStateByKey(key);
        return { label: controlDef.label, score: control.derivedScore };
      })
      .filter(function (item) { return typeof item.score === "number"; })
      .sort(function (a, b) { return a.score - b.score; });

    return entries[0] || null;
  }

  function updateTopPills(completed, total, dimensionResults) {
    const progressPill = document.getElementById("fda-progress-pill");
    const overallPill = document.getElementById("fda-overall-pill");
    if (progressPill) progressPill.textContent = "Progress: " + completed + " / " + total + " controls complete";

    const completeDimensions = dimensionResults.filter(function (dimension) { return typeof dimension.score === "number"; });
    if (overallPill) {
      if (!completeDimensions.length) {
        overallPill.textContent = "Overall: pending";
      } else {
        const overall = completeDimensions.reduce(function (sum, item) { return sum + item.score; }, 0) / completeDimensions.length;
        overallPill.textContent = "Overall: " + overall.toFixed(1);
      }
    }
  }

  function getDependencyAlerts(dimensionResults) {
    const alerts = [];
    const map = {};
    dimensionResults.forEach(function (dimension) { map[dimension.id] = dimension; });

    if (map.quality && typeof map.quality.score === "number" && map.quality.score < 3) {
      alerts.push("Quality is below Level 3. Higher-dimension scale claims should be treated as constrained until lower-dimension structural integrity is stabilized.");
    }
    if (map.effectiveness && typeof map.effectiveness.score === "number" && map.effectiveness.score < 3) {
      alerts.push("Effectiveness is below Level 3. Efficiency, Performance, and Productivity interpretation should be treated cautiously until alignment is stronger.");
    }
    if (map.efficiency && typeof map.efficiency.score === "number" && map.efficiency.score < 3) {
      alerts.push("Efficiency is below Level 3. Performance and Productivity claims may reflect premature scaling without sufficient operating discipline.");
    }
    if (map.performance && typeof map.performance.score === "number" && map.performance.score < 3) {
      alerts.push("Performance is below Level 3. Productivity claims should be treated as weakly evidenced until measurement and governance visibility are stronger.");
    }

    return alerts;
  }

  function overallProfile(overallScore, alerts) {
    if (overallScore == null) return "Pending";
    if (alerts.length && overallScore >= 3) return "Distorted integrity profile";
    if (overallScore < 2.5) return "Weak structural integrity profile";
    if (overallScore < 3.5) return "Uneven but progressing";
    if (overallScore < 4.5) return "Managed structural profile";
    return "Strong and balanced structural profile";
  }

  function renderResults(dimensionResults) {
    const summaryRoot = document.getElementById("fda-results-summary");
    const alertsRoot = document.getElementById("fda-results-alerts");
    const detailsRoot = document.getElementById("fda-results-details");

    const scoredDimensions = dimensionResults.filter(function (dimension) { return typeof dimension.score === "number"; });
    const overall = scoredDimensions.length
      ? Number((scoredDimensions.reduce(function (sum, dimension) { return sum + dimension.score; }, 0) / scoredDimensions.length).toFixed(1))
      : null;
    const alerts = getDependencyAlerts(dimensionResults);

    summaryRoot.innerHTML = [
      card("Overall profile", overall == null ? "Pending" : overall.toFixed(1), overallProfile(overall, alerts)),
      card("Completed controls", String(Object.values(state.session.controls).filter(isControlComplete).length), "Controls with all three questions answered"),
      card("Dependency warnings", String(alerts.length), alerts.length ? "Structural sequencing issues detected" : "No dependency warnings triggered")
    ].join("");

    alertsRoot.innerHTML = alerts.length
      ? alerts.map(function (alert) { return '<div class="fda-alert">' + escapeHtml(alert) + "</div>"; }).join("")
      : '<div class="panel"><p class="fda-empty">No dependency warnings are currently triggered by the calculated dimension scores.</p></div>';

    detailsRoot.innerHTML = scoredDimensions.map(function (dimension) {
      const detailDimension = getDimensionById(dimension.id);
      const rows = detailDimension.controls.map(function (controlDef) {
        const key = getControlKey(dimension.id, controlDef.id);
        const control = getControlStateByKey(key);
        return `
          <tr>
            <td><strong>${escapeHtml(controlDef.label)}</strong></td>
            <td>${control.derivedScore == null ? "Pending" : control.derivedScore}</td>
            <td>${escapeHtml(control.flags.join(", ") || "None")}</td>
          </tr>
        `;
      }).join("");

      return `
        <div class="panel">
          <h3>${escapeHtml(dimension.label)} summary</h3>
          <p style="margin:0 0 8px;">Dimension score: <strong>${dimension.score.toFixed(1)}</strong></p>
          <p style="margin:0; color:var(--muted); font-size:14px;">
            Weakest scored control: ${dimension.weakestControl ? "<strong>" + escapeHtml(dimension.weakestControl.label) + "</strong> (" + dimension.weakestControl.score + ")" : "pending"}
          </p>
          <table class="fda-dimension-table">
            <thead>
              <tr>
                <th>Control</th>
                <th>Score</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
    }).join("");
  }

  function card(title, value, note) {
    return `
      <div class="panel">
        <h3>${escapeHtml(title)}</h3>
        <p style="font-size:28px; font-weight:700; margin:0 0 8px;">${escapeHtml(value)}</p>
        <p style="margin:0; color:var(--muted); font-size:14px;">${escapeHtml(note)}</p>
      </div>
    `;
  }

  function saveDraft() {
    collectMeta();
    localStorage.setItem(config.storageKey, JSON.stringify(state.session));
    const pill = document.getElementById("fda-save-pill");
    if (pill) pill.textContent = "Local save: saved";
  }

  function exportJson() {
    collectMeta();
    const scoredDimensions = state.framework.dimensions.map(function (dimension) {
      const scores = dimension.controls.map(function (controlDef) {
        const key = getControlKey(dimension.id, controlDef.id);
        return getControlStateByKey(key).derivedScore;
      }).filter(function (score) { return typeof score === "number"; });

      return {
        id: dimension.id,
        label: dimension.label,
        score: scores.length ? Number((scores.reduce(function (sum, score) { return sum + score; }, 0) / scores.length).toFixed(1)) : null
      };
    });

    const payload = {
      frameworkTitle: state.framework.meta.title,
      exportedAt: new Date().toISOString(),
      session: state.session,
      dimensions: scoredDimensions,
      dependencyAlerts: getDependencyAlerts(scoredDimensions)
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "qeepp-fda-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function restoreDraft() {
    const raw = localStorage.getItem(config.storageKey);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw);
      state.session.meta = saved.meta || {};
      state.session.controls = saved.controls || {};
      const pill = document.getElementById("fda-save-pill");
      if (pill) pill.textContent = "Local save: restored";
    } catch (error) {
      console.warn("Unable to restore saved QEEPP FDA session.", error);
    }
  }

  async function loadFramework() {
    const response = await fetch(config.dataUrl, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Unable to load diagnostic framework JSON.");
    }
    state.framework = await response.json();
  }

  function bindTopButtons() {
    document.getElementById("fda-save-btn").addEventListener("click", saveDraft);
    document.getElementById("fda-export-btn").addEventListener("click", exportJson);
    document.getElementById("fda-calc-btn").addEventListener("click", function () {
      recalculate(true);
      saveDraft();
      const results = document.getElementById("fda-results");
      if (results) {
        results.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  async function init() {
    try {
      await loadFramework();
      restoreDraft();
      renderDimensions();
      bindTopButtons();
    } catch (error) {
      console.error(error);
      const root = document.getElementById("fda-dimensions");
      if (root) {
        root.innerHTML = '<div class="panel"><p>Unable to load the full diagnostic framework data.</p></div>';
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
