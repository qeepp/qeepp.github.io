(function () {
  "use strict";

  // Original 10-point outer starfish perimeter
  // Indexes 0,2,4,6,8 are the 5 scored ray tips
  // Indexes 1,3,5,7,9 are the inner corners between adjacent dimensions
  const BASE_OUTLINE_POINTS = [
    [50.0, 100.0],  // 0 Quality
    [61.23, 65.45], // 1 between Quality and Efficiency
    [97.55, 65.45], // 2 Efficiency
    [68.16, 44.10], // 3 between Efficiency and Productivity
    [79.39, 9.55],  // 4 Productivity
    [50.0, 30.90],  // 5 between Productivity and Effectiveness
    [20.61, 9.55],  // 6 Effectiveness
    [31.84, 44.10], // 7 between Effectiveness and Performance
    [2.45, 65.45],  // 8 Performance
    [38.77, 65.45]  // 9 between Performance and Quality
  ];

  const AXIS_INDEX = {
    quality: 0,
    efficiency: 2,
    productivity: 4,
    effectiveness: 6,
    performance: 8
  };

  const AXIS_SEQUENCE = [0, 2, 4, 6, 8];

  const CENTER = [50, 50];

  // Optional thin pentagon around current state only
  const PENTAGON_ORDER = [
    "effectiveness",
    "productivity",
    "efficiency",
    "quality",
    "performance"
  ];

  const TIP_POINTS = {
    quality: [50.0, 100.0],
    effectiveness: [20.61, 9.55],
    efficiency: [97.55, 65.45],
    performance: [2.45, 65.45],
    productivity: [79.39, 9.55]
  };

  function clampScore(value) {
    const n = Number(value);
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

  // THIS is the key function.
  // It builds the full 10-point perimeter using the same logic for both current and target.
  function buildScaledOutlinePoints(scores) {
    const normalized = getNormalizedScores(scores);

    return BASE_OUTLINE_POINTS.map((point, index) => {
      const directKey = Object.keys(AXIS_INDEX).find((key) => AXIS_INDEX[key] === index);

      // Main 5 ray tips use their own exact score
      if (directKey) {
        return interpolatePoint(CENTER[0], CENTER[1], point[0], point[1], normalized[directKey]);
      }

      // Inner 5 corners use average of adjacent dimension scores
      const previousAxisIndex = AXIS_SEQUENCE.filter((i) => i < index).slice(-1)[0] ?? 8;
      const nextAxisIndex = AXIS_SEQUENCE.find((i) => i > index) ?? 0;

      const previousKey = Object.keys(AXIS_INDEX).find((key) => AXIS_INDEX[key] === previousAxisIndex);
      const nextKey = Object.keys(AXIS_INDEX).find((key) => AXIS_INDEX[key] === nextAxisIndex);

      const factor = (normalized[previousKey] + normalized[nextKey]) / 2;

      return interpolatePoint(CENTER[0], CENTER[1], point[0], point[1], factor);
    });
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
          <!-- ideal background starfish only -->
          <polygon
            id="qeeppStarfishBase"
            points="${pointsString(BASE_OUTLINE_POINTS)}"
            fill="var(--qeepp-base-fill)">
          </polygon>

          <!-- target contour only -->
          <polygon
            id="qeeppTargetOutline"
            points=""
            fill="none"
            stroke="var(--qeepp-target-stroke)"
            stroke-width="0.18"
            stroke-linejoin="round"
            display="none">
          </polygon>

          <!-- current optional thin pentagon -->
          <polygon
            id="qeeppCurrentPentagon"
            points=""
            fill="none"
            stroke="var(--qeepp-current-pentagon-stroke)"
            stroke-width="0.18">
          </polygon>

          <!-- current filled starfish -->
          <polygon
            id="qeeppCurrentOutline"
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

    const currentOutline = root.querySelector("#qeeppCurrentOutline");
    const currentPentagon = root.querySelector("#qeeppCurrentPentagon");
    const targetOutline = root.querySelector("#qeeppTargetOutline");

    // CURRENT = full 10-point perimeter, filled
    const currentOutlinePoints = buildScaledOutlinePoints(options.current);
    currentOutline.setAttribute("points", pointsString(currentOutlinePoints));

    if (options.currentFill) {
      currentOutline.setAttribute("fill", options.currentFill);
    }

    // Optional current pentagon
    if (options.showCurrentPentagon === false) {
      currentPentagon.setAttribute("display", "none");
    } else {
      const currentTips = buildScaledTipPoints(options.current);
      currentPentagon.setAttribute("points", pointsStringFromOrder(currentTips, PENTAGON_ORDER));
      currentPentagon.setAttribute("display", "block");

      if (options.currentPentagonStroke) {
        currentPentagon.setAttribute("stroke", options.currentPentagonStroke);
      }
    }

    // TARGET = full 10-point perimeter, contour only
    if (options.target) {
      const targetOutlinePoints = buildScaledOutlinePoints(options.target);
      targetOutline.setAttribute("points", pointsString(targetOutlinePoints));
      targetOutline.setAttribute("display", "block");

      if (options.targetStroke) {
        targetOutline.setAttribute("stroke", options.targetStroke);
      }
    } else {
      targetOutline.setAttribute("display", "none");
    }
  }

  window.QEEPPCharts = window.QEEPPCharts || {};
  window.QEEPPCharts.starfish = renderStarfish;
})();