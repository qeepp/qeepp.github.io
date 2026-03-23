(function () {
  "use strict";

  const TIP_POINTS = {
    quality: [50.0, 100.0],
    effectiveness: [20.61, 9.55],
    efficiency: [97.55, 65.45],
    performance: [2.45, 65.45],
    productivity: [79.39, 9.55]
  };

  // Draw order you requested
  const STAR_ORDER = [
    "quality",
    "effectiveness",
    "efficiency",
    "performance",
    "productivity"
  ];

  // Optional thin pentagon around current only
  const PENTAGON_ORDER = [
    "effectiveness",
    "productivity",
    "efficiency",
    "quality",
    "performance"
  ];

  const BASE_OUTLINE_POINTS = [
    [50.0, 100.0],
    [61.23, 65.45],
    [97.55, 65.45],
    [68.16, 44.10],
    [79.39, 9.55],
    [50.0, 30.90],
    [20.61, 9.55],
    [31.84, 44.10],
    [2.45, 65.45],
    [38.77, 65.45]
  ];

  const CENTER = [50, 50];

  function clampScore(value) {
    const n = Math.floor(Number(value));
    if (Number.isNaN(n)) return 1;
    return Math.max(1, Math.min(5, n));
  }

  function interpolatePoint(cx, cy, px, py, factor) {
    return [
      cx + (px - cx) * factor,
      cy + (py - cy) * factor
    ];
  }

  function getNormalizedScores(scores) {
    return {
      quality: clampScore(scores.quality) / 5,
      effectiveness: clampScore(scores.effectiveness) / 5,
      efficiency: clampScore(scores.efficiency) / 5,
      performance: clampScore(scores.performance) / 5,
      productivity: clampScore(scores.productivity) / 5
    };
  }

  function buildScaledTipPoints(scores) {
    const normalized = getNormalizedScores(scores);
    const result = {};

    Object.keys(TIP_POINTS).forEach((key) => {
      const [x, y] = TIP_POINTS[key];
      result[key] = interpolatePoint(CENTER[0], CENTER[1], x, y, normalized[key]);
    });

    return result;
  }

  function pointsString(points) {
    return points.map(([x, y]) => `${x},${y}`).join(" ");
  }

  function pointsStringFromOrder(pointMap, order) {
    return order.map((key) => pointMap[key].join(",")).join(" ");
  }

  function createStarfishMarkup(root, options) {
    const title = options.title === false
      ? ""
      : '<span class="qeepp-label qeepp-title"><b>The QEEPP Starfish</b></span>';

    const zones = options.showZones === false
      ? ""
      : `
        <span class="qeepp-label qeepp-success">SUCCESSFUL<br>TRANSFORMATION</span>
        <span class="qeepp-label qeepp-governance">GOVERNANCE<br>ZONE</span>
        <span class="qeepp-label qeepp-ambition">AMBITION<br>ZONE</span>
        <span class="qeepp-label qeepp-stability1">STABILITY<br>ZONE</span>
        <span class="qeepp-label qeepp-stability2">STABILITY<br>ZONE</span>
      `;

    const dimensionLabels = options.showDimensionLabels === false
      ? ""
      : `
        <span class="qeepp-label qeepp-quality">Quality<br>Stabilized</span>
        <span class="qeepp-label qeepp-effectiveness">Effectiveness<br>Aligned</span>
        <span class="qeepp-label qeepp-efficiency">Efficiency<br>Optimized</span>
        <span class="qeepp-label qeepp-performance">Performance<br>Measured</span>
        <span class="qeepp-label qeepp-productivity">Productivity<br>Scaled</span>
      `;

    root.innerHTML = `
      ${title}
      ${zones}
      ${dimensionLabels}

      <svg viewBox="0 0 100 100" aria-label="QEEPP Starfish Diagram" preserveAspectRatio="xMidYMid meet">
        <g>
          <!-- ideal background starfish -->
          <polygon
            id="qeeppStarfishBase"
            points="${pointsString(BASE_OUTLINE_POINTS)}"
            fill="var(--qeepp-base-fill)">
          </polygon>

          <!-- target state star, behind current -->
          <polygon
            id="qeeppTargetStar"
            points=""
            fill="rgba(125, 211, 252, 0.52)"
            stroke="none"
            display="none">
          </polygon>

          <!-- optional current thin outer pentagon -->
          <polygon
            id="qeeppCurrentPentagon"
            points=""
            fill="none"
            stroke="var(--qeepp-current-pentagon-stroke)"
            stroke-width="0.18"
            display="none">
          </polygon>

          <!-- current state star, top/front layer -->
          <polygon
            id="qeeppCurrentStar"
            points=""
            fill="var(--qeepp-current-fill)"
            stroke="none">
          </polygon>
        </g>
      </svg>
    `;
  }

  function renderStarfish(containerId, options) {
    const root = typeof containerId === "string"
      ? document.getElementById(containerId)
      : containerId;

    if (!root) {
      console.error(`QEEPPCharts.starfish: container "${containerId}" not found.`);
      return;
    }

    if (!options || !options.current) {
      console.error("QEEPPCharts.starfish: options.current is required.");
      return;
    }

    root.classList.add("qeepp-starfish");

    if (!root.querySelector("svg")) {
      createStarfishMarkup(root, options);
    }

    const targetStar = root.querySelector("#qeeppTargetStar");
    const currentStar = root.querySelector("#qeeppCurrentStar");
    const currentPentagon = root.querySelector("#qeeppCurrentPentagon");

    // target first, behind
    if (options.target) {
      const targetPoints = buildScaledTipPoints(options.target);
      targetStar.setAttribute("points", pointsStringFromOrder(targetPoints, STAR_ORDER));
      targetStar.setAttribute("display", "block");

      if (options.targetFill) {
        targetStar.setAttribute("fill", options.targetFill);
      }
    } else {
      targetStar.setAttribute("display", "none");
    }

    // current second, on top
    const currentPoints = buildScaledTipPoints(options.current);
    currentStar.setAttribute("points", pointsStringFromOrder(currentPoints, STAR_ORDER));

    if (options.currentFill) {
      currentStar.setAttribute("fill", options.currentFill);
    }

    // optional current pentagon only
    if (options.showCurrentPentagon) {
      currentPentagon.setAttribute("points", pointsStringFromOrder(currentPoints, PENTAGON_ORDER));
      currentPentagon.setAttribute("display", "block");

      if (options.currentPentagonStroke) {
        currentPentagon.setAttribute("stroke", options.currentPentagonStroke);
      }
    } else {
      currentPentagon.setAttribute("display", "none");
    }
  }

  window.QEEPPCharts = window.QEEPPCharts || {};
  window.QEEPPCharts.starfish = renderStarfish;
})();






(function () {
  "use strict";

  const DEFAULT_DIMS = [
    { key: "quality",       label: "Quality",       letter: "Q", color: "#2563EB" },
    { key: "effectiveness", label: "Effectiveness", letter: "E", color: "#16A34A" },
    { key: "efficiency",    label: "Efficiency",    letter: "E", color: "#F59E0B" },
    { key: "performance",   label: "Performance",   letter: "P", color: "#DC2626" },
    { key: "productivity",  label: "Productivity",  letter: "P", color: "#9333EA" }
  ];

  const DEFAULT_CONFIG = {
    cx: 350,
    cy: 350,
    startAngle: -45,
    axisCount: 8,
    innerRadius: 100,
    ringThickness: 26,
    ringGap: 6,
    showLegend: true,
    showCenterText: true,
    centerTitle: "QEEPP",
    centerSub: "Radar"
  };

  function clampScore(value) {
    const n = Number(value);
    if (Number.isNaN(n)) return 1;
    return Math.max(1, Math.min(5, n));
  }

  function createSvg(tag, attrs = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }

  function polar(cx, cy, r, angleDeg) {
    const rad = angleDeg * Math.PI / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  }

  function arcPath(cx, cy, r, startAngle, endAngle) {
    const start = polar(cx, cy, r, startAngle);
    const end = polar(cx, cy, r, endAngle);
    const delta = endAngle - startAngle;
    const largeArcFlag = delta > 180 ? 1 : 0;

    return [
      "M", start.x, start.y,
      "A", r, r, 0, largeArcFlag, 1, end.x, end.y
    ].join(" ");
  }

  function percentFromScore(score) {
    return clampScore(score) * 20;
  }

  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function buildDims(scores, colors) {
    return DEFAULT_DIMS.map((dim) => ({
      ...dim,
      color: (colors && colors[dim.key]) || dim.color,
      score: clampScore(scores[dim.key])
    }));
  }

  function createRadarMarkup(root) {
    root.innerHTML = `
      <div class="qeepp-radar">
        <svg
          class="qeepp-radar-svg"
          viewBox="0 40 700 620"
          role="img"
          aria-label="QEEPP Radar Diagram"
        ></svg>
        <div class="qeepp-radar-legend"></div>
      </div>
    `;
  }

  function renderLegend(legendEl, dims, targetScores) {
    clearNode(legendEl);

    dims.forEach((dim) => {
      const item = document.createElement("div");
      item.className = "qeepp-radar-legend-item";

      const swatch = document.createElement("span");
      swatch.className = "qeepp-radar-legend-swatch";
      swatch.style.background = dim.color;

      const text = document.createElement("span");
      text.textContent = targetScores
        ? `${dim.label} (${dim.score} / ${clampScore(targetScores[dim.key])})`
        : `${dim.label} (${dim.score})`;

      item.appendChild(swatch);
      item.appendChild(text);
      legendEl.appendChild(item);
    });
  }

  function renderRadar(containerId, options) {
    const root = typeof containerId === "string"
      ? document.getElementById(containerId)
      : containerId;

    if (!root) {
      console.error(`QEEPPCharts.radar: container "${containerId}" not found.`);
      return;
    }

    if (!options || !options.current) {
      console.error("QEEPPCharts.radar: options.current is required.");
      return;
    }

    root.classList.add("qeepp-radar-root");

    if (!root.querySelector(".qeepp-radar")) {
      createRadarMarkup(root);
    }

    const wrapper = root.querySelector(".qeepp-radar");
    const svg = wrapper.querySelector(".qeepp-radar-svg");
    const legend = wrapper.querySelector(".qeepp-radar-legend");

    const config = { ...DEFAULT_CONFIG, ...(options.config || {}) };
    const dims = buildDims(options.current, options.colors);
    const targetScores = options.target || null;

    function ringRadius(index) {
      return config.innerRadius + index * (config.ringThickness + config.ringGap);
    }

    function outerRadius() {
      return ringRadius(dims.length - 1) + config.ringThickness / 2;
    }

    clearNode(svg);

    // guides
    dims.forEach((_, i) => {
      svg.appendChild(createSvg("circle", {
        cx: config.cx,
        cy: config.cy,
        r: ringRadius(i),
        class: "qeepp-radar-guide"
      }));
    });

    // axis spokes
    const outer = outerRadius();
    for (let i = 0; i < config.axisCount; i++) {
      const angle = config.startAngle + i * (360 / config.axisCount);
      const p = polar(config.cx, config.cy, outer, angle);

      svg.appendChild(createSvg("line", {
        x1: config.cx,
        y1: config.cy,
        x2: p.x,
        y2: p.y,
        class: "qeepp-radar-axis"
      }));
    }

    // target rings first, behind current
    if (targetScores) {
      dims.forEach((dim, i) => {
        const r = ringRadius(i);
        const percent = percentFromScore(targetScores[dim.key]);
        const endAngle = config.startAngle + (360 * percent / 100);

        if (percent === 100) {
          svg.appendChild(createSvg("circle", {
            cx: config.cx,
            cy: config.cy,
            r,
            stroke: dim.color,
            "stroke-width": config.ringThickness,
            "stroke-opacity": "0.28",
            fill: "none",
            class: "qeepp-radar-ring"
          }));
        } else {
          svg.appendChild(createSvg("path", {
            d: arcPath(config.cx, config.cy, r, config.startAngle, endAngle),
            stroke: dim.color,
            "stroke-width": config.ringThickness,
            "stroke-opacity": "0.28",
            fill: "none",
            class: "qeepp-radar-ring"
          }));
        }
      });
    }

    // current rings on top
    dims.forEach((dim, i) => {
      const r = ringRadius(i);
      const percent = percentFromScore(dim.score);
      const endAngle = config.startAngle + (360 * percent / 100);

      if (percent === 100) {
        svg.appendChild(createSvg("circle", {
          cx: config.cx,
          cy: config.cy,
          r,
          stroke: dim.color,
          "stroke-width": config.ringThickness,
          fill: "none",
          class: "qeepp-radar-ring"
        }));
      } else {
        svg.appendChild(createSvg("path", {
          d: arcPath(config.cx, config.cy, r, config.startAngle, endAngle),
          stroke: dim.color,
          "stroke-width": config.ringThickness,
          fill: "none",
          class: "qeepp-radar-ring"
        }));
      }

      const letterPos = polar(config.cx, config.cy, r, config.startAngle);
      const letter = createSvg("text", {
        x: letterPos.x,
        y: letterPos.y,
        class: "qeepp-radar-letter"
      });
      letter.textContent = dim.letter;
      svg.appendChild(letter);
    });

    // center text
    if (config.showCenterText) {
      const title = createSvg("text", {
        x: config.cx,
        y: config.cy - 8,
        class: "qeepp-radar-center-title"
      });
      title.textContent = config.centerTitle;

      const sub = createSvg("text", {
        x: config.cx,
        y: config.cy + 18,
        class: "qeepp-radar-center-sub"
      });
      sub.textContent = config.centerSub;

      svg.appendChild(title);
      svg.appendChild(sub);
    }

    if (config.showLegend) {
      legend.style.display = "";
      renderLegend(legend, dims, targetScores);
    } else {
      legend.style.display = "none";
      legend.innerHTML = "";
    }
  }

  window.QEEPPCharts = window.QEEPPCharts || {};
  window.QEEPPCharts.radar = renderRadar;
})();




(function () {
  "use strict";

  const QEEPP_MATRIX_DIMENSIONS = [
    { key: "quality",       short: "Q", title: "Quality",       color: "#2563EB", xClass: "q"  },
    { key: "effectiveness", short: "E", title: "Effectiveness", color: "#16A34A", xClass: "ef" },
    { key: "efficiency",    short: "E", title: "Efficiency",    color: "#F59E0B", xClass: "ec" },
    { key: "performance",   short: "P", title: "Performance",   color: "#DC2626", xClass: "pf" },
    { key: "productivity",  short: "P", title: "Productivity",  color: "#9333EA", xClass: "pr" }
  ];

  function clampScore(value) {
    const n = Number(value);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(5, n));
  }

  function round1(value) {
    return Math.round(value * 10) / 10;
  }

  function totalScore(period) {
    const total = QEEPP_MATRIX_DIMENSIONS.reduce(
      (sum, d) => sum + clampScore(period[d.key]),
      0
    );

    /*return Math.floor(total);*/
    return total;
  }  

   function createMatrixMarkup(root) {
    root.innerHTML = `<div class="qeepp-matrix"></div>`;
  }

  function buildMatrixHtml(period, options = {}) {
    const placeholder = !!options.placeholder;
    const large = !!options.large;
    const showTitle = options.showTitle !== false;
    const showScore = options.showScore !== false;

    let gridHtml = "";

    for (let row = 5; row >= 1; row--) {
      QEEPP_MATRIX_DIMENSIONS.forEach((d) => {
        const filled = clampScore(period[d.key]) >= row;
        gridHtml += `
          <div
            class="qeepp-matrix-cell ${filled ? "filled" : ""}"
            style="${filled ? `background:${d.color};` : ""}"
            title="${d.title}: ${clampScore(period[d.key])}"
          ></div>
        `;
      });
    }

    QEEPP_MATRIX_DIMENSIONS.forEach((d) => {
      gridHtml += `<div class="qeepp-matrix-x-label ${d.xClass}" title="${d.title}">${d.short}</div>`;
    });

    return `
      <article class="qeepp-matrix-card ${placeholder ? "qeepp-matrix-placeholder" : ""} ${large ? "qeepp-matrix-large" : ""}">
        ${(showTitle || showScore) ? `
          <div class="qeepp-matrix-title">
            ${showTitle ? `<h4>${period.label || ""}</h4>` : `<span></span>`}
            ${showScore ? `<div class="qeepp-matrix-score">${totalScore(period)}/25</div>` : ""}
          </div>
        ` : ""}
        <div class="qeepp-matrix-grid">
          ${gridHtml}
        </div>
      </article>
    `;
  }

  function renderMatrix(containerId, options) {
    const root = typeof containerId === "string"
      ? document.getElementById(containerId)
      : containerId;

    if (!root) {
      console.error(`QEEPPCharts.matrix: container "${containerId}" not found.`);
      return;
    }

    if (!options || !options.data) {
      console.error("QEEPPCharts.matrix: options.data is required.");
      return;
    }

    if (!root.querySelector(".qeepp-matrix")) {
      createMatrixMarkup(root);
    }

    const wrapper = root.querySelector(".qeepp-matrix");
    wrapper.innerHTML = buildMatrixHtml(options.data, {
      placeholder: !!options.placeholder,
      large: !!options.large,
      showTitle: options.showTitle !== false,
      showScore: options.showScore !== false
    });
  }

  function analyzeTrendPeriods(savedPeriods) {
    if (!savedPeriods.length) {
      return `
        <div class="qeepp-trends-analysis-grid">
          <div><strong>Historical analysis:</strong> No saved assessments yet.</div>
          <div>Save completed scorecards to enable progression and regression interpretation.</div>
        </div>
      `;
    }

    const first = savedPeriods[0];
    const last = savedPeriods[savedPeriods.length - 1];

    const deltaByDimension = QEEPP_MATRIX_DIMENSIONS.map((d) => ({
      title: d.title,
      delta: clampScore(last[d.key]) - clampScore(first[d.key]),
      current: clampScore(last[d.key])
    }));

    const improving = deltaByDimension.filter((d) => d.delta > 0).map((d) => d.title);
    const regressing = deltaByDimension.filter((d) => d.delta < 0).map((d) => d.title);
    const steady = deltaByDimension.filter((d) => d.delta === 0).map((d) => d.title);

    const totalDelta = totalScore(last) - totalScore(first);
    const allFull = QEEPP_MATRIX_DIMENSIONS.every((d) => clampScore(last[d.key]) === 5);

    let maturitySignal = "Mixed movement across saved assessments.";

    if (allFull) {
      maturitySignal = "Historical progression reached full structural integrity across all five dimensions.";
    } else if (totalDelta > 0 && regressing.length === 0) {
      maturitySignal = "Overall structural progression is positive across the saved assessments.";
    } else if (totalDelta < 0) {
      maturitySignal = "Overall integrity regression is visible across the saved assessments.";
    } else if (totalDelta === 0 && steady.length === QEEPP_MATRIX_DIMENSIONS.length) {
      maturitySignal = "Historical pattern is steady but shows no structural integrity progression.";
    }

    let warningLine = "";
    let suggestionLine = "";

    if (allFull) {
      warningLine = "No immediate structural warning is indicated in the latest saved assessment.";
      suggestionLine = "The latest saved assessment indicates full structural integrity across all five dimensions.";
    } else {
      const lowestCurrent = deltaByDimension.reduce((a, b) => a.current <= b.current ? a : b);

      warningLine = `Primary structural warning remains ${lowestCurrent.title}, currently at ${lowestCurrent.current}/5.`;
      if (lowestCurrent.current < 3) {
        warningLine += " This dimension is constraining structural readiness and should be prioritized.";
      } else if (regressing.length === 0 && totalDelta >= 0) {
        warningLine = "No immediate structural warning is indicated in the latest saved assessment.";
      }

      if (lowestCurrent.current < 3) {
        suggestionLine = `Suggested focus: stabilize and raise ${lowestCurrent.title} before pushing scale in higher-order dimensions.`;
      } else if (regressing.length) {
        suggestionLine = `Suggested focus: investigate regression in ${regressing.join(", ")} and reinforce structural controls before further expansion.`;
      } else if (steady.length === QEEPP_MATRIX_DIMENSIONS.length) {
        suggestionLine = "Suggested focus: re-establish forward integrity progression while preserving structural balance.";
      } else {
        suggestionLine = "Suggested focus: continue balanced progression while protecting lower-dimension integrity.";
      }
    }

    return `
      <div class="qeepp-trends-analysis-grid">
        <div><strong>Historical analysis:</strong> ${maturitySignal}</div>
        <div><strong>Improving:</strong> ${improving.length ? improving.join(", ") : "None"}</div>
        <div><strong>Regressing:</strong> ${regressing.length ? regressing.join(", ") : "None"}</div>
        <div><strong>Steady:</strong> ${steady.length ? steady.join(", ") : "None"}</div>
        <div><strong>Warning signs:</strong> ${warningLine}</div>
        <div><strong>Suggested action:</strong> ${suggestionLine}</div>
      </div>
    `;
  }

  function createTrendsMarkup(root) {
    root.innerHTML = `
      <div class="qeepp-trends-board"></div>
      <div class="qeepp-trends-legend"></div>
      <div class="qeepp-trends-analysis"></div>
    `;
  }

  function renderLegend(legendEl) {
    legendEl.innerHTML = QEEPP_MATRIX_DIMENSIONS.map((d) => `
      <div class="qeepp-trends-legend-item">
        <span class="qeepp-trends-swatch" style="background:${d.color}"></span>${d.title}
      </div>
    `).join("");
  }

  function normalizePeriods(data, maxItems = 4, fillEmpty = true) {
    const periods = (data || []).slice(-maxItems).map((item, index) => ({
      label: item.label || item.name || item.shortLabel || `A${index + 1}`,
      quality: clampScore(item.quality),
      effectiveness: clampScore(item.effectiveness),
      efficiency: clampScore(item.efficiency),
      performance: clampScore(item.performance),
      productivity: clampScore(item.productivity),
      placeholder: false
    }));

    if (fillEmpty) {
      while (periods.length < maxItems) {
        periods.push({
          label: "Empty",
          quality: 0,
          effectiveness: 0,
          efficiency: 0,
          performance: 0,
          productivity: 0,
          placeholder: true
        });
      }
    }

    return periods;
  }

  function renderTrends(containerId, options) {
    const root = typeof containerId === "string"
      ? document.getElementById(containerId)
      : containerId;

    if (!root) {
      console.error(`QEEPPCharts.trends: container "${containerId}" not found.`);
      return;
    }

    if (!options || !Array.isArray(options.data)) {
      console.error("QEEPPCharts.trends: options.data must be an array.");
      return;
    }

    if (!root.querySelector(".qeepp-trends-board")) {
      createTrendsMarkup(root);
    }

    const board = root.querySelector(".qeepp-trends-board");
    const legend = root.querySelector(".qeepp-trends-legend");
    const analysis = root.querySelector(".qeepp-trends-analysis");

    const maxItems = options.maxItems || 4;
    const fillEmpty = options.fillEmpty !== false;
    const showLegend = options.showLegend !== false;
    const showAnalysis = options.showAnalysis !== false;

    const periods = normalizePeriods(options.data, maxItems, fillEmpty);

    board.innerHTML = periods.map((p) => buildMatrixHtml(p, {
      placeholder: !!p.placeholder,
      large: false,
      showTitle: true,
      showScore: true
    })).join("");

    if (showLegend) {
      legend.style.display = "";
      renderLegend(legend);
    } else {
      legend.style.display = "none";
      legend.innerHTML = "";
    }

    if (showAnalysis) {
      analysis.style.display = "";
      analysis.innerHTML = analyzeTrendPeriods(periods.filter((p) => !p.placeholder));
    } else {
      analysis.style.display = "none";
      analysis.innerHTML = "";
    }
  }

  window.QEEPPCharts = window.QEEPPCharts || {};
  window.QEEPPCharts.matrix = renderMatrix;
  window.QEEPPCharts.trends = renderTrends;
})();



