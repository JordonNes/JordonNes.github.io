(() => {
  "use strict";

  const chart = document.getElementById("home-tide-chart");
  if (!chart) return;
  const heightButton = document.getElementById("tide-height");
  const coefficientButton = document.getElementById("tide-coeff");
  const hour = 3600000;
  const day = 24 * hour;
  const timeZone = "America/Los_Angeles";
  const time = new Intl.DateTimeFormat("en-US", {timeZone, weekday: "short", hour: "numeric", minute: "2-digit"});
  const dateKey = new Intl.DateTimeFormat("en-CA", {timeZone, year: "numeric", month: "2-digit", day: "2-digit"});
  const epoch = value => Date.parse(value.replace(" ", "T") + "Z");
  let mode = "height";
  let heights = [];
  let coefficients = {};

  async function predictions(now, days, interval) {
    const utcDate = t => new Date(t).toISOString().slice(0, 10).replaceAll("-", "");
    const params = new URLSearchParams({
      begin_date: utcDate(now - days * day), end_date: utcDate(now + days * day),
      station: "9414863", product: "predictions", datum: "MLLW", time_zone: "gmt",
      units: "english", interval, format: "json", application: "RICHFISH"
    });
    const response = await fetch("https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?" + params);
    const result = await response.json();
    if (!response.ok || !result.predictions?.length) throw new Error(result.error?.message || "NOAA predictions unavailable");
    return result.predictions;
  }

  function localCoefficients(rows) {
    const days = {};
    for (const row of rows.slice(1, -1)) {
      const key = dateKey.format(epoch(row.t));
      (days[key] ??= []).push(Number(row.v));
    }
    const ranges = Object.entries(days).slice(1, -1).filter(([, values]) => values.length >= 2)
      .map(([key, values]) => [key, Math.max(...values) - Math.min(...values)]);
    const sorted = ranges.map(([, range]) => range).sort((a, b) => a - b);
    const low = sorted[Math.floor((sorted.length - 1) * 0.1)];
    const high = sorted[Math.floor((sorted.length - 1) * 0.9)];
    if (!(high > low)) return {};
    return Object.fromEntries(ranges.map(([key, range]) =>
      [key, Math.round(100 * Math.max(0, Math.min(1, (range - low) / (high - low))))]));
  }

  function draw() {
    const isHeight = mode === "height";
    heightButton.setAttribute("aria-pressed", String(isHeight));
    coefficientButton.setAttribute("aria-pressed", String(!isHeight));
    const now = Date.now();
    const start = now - day;
    const end = now + day;
    const points = isHeight
      ? heights.filter(([t]) => t >= start && t <= end)
      : Array.from({length: 289}, (_, i) => {
          const t = start + i * (hour / 6);
          return [t, coefficients[dateKey.format(t)]];
        });
    if (!points.length || points.some(([, value]) => !Number.isFinite(value))) {
      chart.textContent = isHeight ? "Richmond tide height predictions unavailable." : "Richmond tidal coefficient data unavailable.";
      return;
    }

    const values = points.map(([, value]) => value);
    const min = isHeight ? Math.floor(Math.min(...values)) : 0;
    const max = isHeight ? Math.ceil(Math.max(...values)) : 100;
    const title = isHeight ? "48-hour Richmond tide height" : "48-hour Richmond local tidal coefficient";
    const x = t => (50 + 900 * (t - start) / (2 * day)).toFixed(2);
    const y = v => (190 - 150 * (v - min) / (max - min || 1)).toFixed(2);
    let svg = `<svg viewBox="0 0 1000 230" role="img" aria-label="${title}, current time centered"><title>${title}</title>`;
    const step = isHeight ? 1 : 25;
    for (let v = min; v <= max; v += step) {
      svg += `<path d="M50 ${y(v)}H950" stroke="#d2dce0"/><text x="8" y="${Number(y(v)) + 4}" font-size="13" fill="#263c48">${v}${isHeight ? " ft" : ""}</text>`;
    }
    for (let i = 0; i <= 4; i++) {
      const t = start + i * 12 * hour;
      svg += `<text x="${x(t)}" y="212" text-anchor="${i === 0 ? "start" : i === 4 ? "end" : "middle"}" font-size="14" fill="#263c48">${time.format(t)}</text>`;
    }
    const path = points.map(([t, v], i) => {
      if (!i) return `M${x(t)} ${y(v)}`;
      return isHeight ? `L${x(t)} ${y(v)}` : `H${x(t)}V${y(v)}`;
    }).join("");
    svg += `<path d="${path}V190H${x(points[0][0])}Z" fill="#b5ddeb"/><path d="${path}" fill="none" stroke="#2387ae" stroke-width="3"/>`;
    if (isHeight) {
      points.slice(1, -1).forEach(([t, v], i) => {
        const prior = points[i][1], next = points[i + 2][1];
        if ((v > prior && v >= next) || (v < prior && v <= next)) {
          svg += `<circle cx="${x(t)}" cy="${y(v)}" r="4" fill="#1678a0"/><text x="${x(t)}" y="${Number(y(v)) + (v > prior ? -9 : 15)}" text-anchor="middle" font-size="12">${v.toFixed(1)} ft</text>`;
        }
      });
    }
    svg += '<path d="M500 20V190" stroke="#9c1733" stroke-width="3"/><text x="507" y="17" font-size="14" fill="#9c1733">NOW</text></svg>';
    const basis = isHeight ? "Predicted height in feet above MLLW." :
      "RICHFISH local index (0–100). Each Pacific day’s predicted range is scaled between the 10th and 90th percentiles of nearby Richmond tide ranges. NOAA supplies the heights.";
    chart.innerHTML = svg + `<p>NOAA Richmond 9414863 · Pacific time · ±24 hours. ${basis}</p>`;
  }

  function renderSolunar() {
    const out = document.getElementById("home-solunar");
    if (!window.SunCalc) {
      out.textContent = "Astronomical estimates unavailable.";
      return;
    }
    const now = Date.now();
    const end = now + day;
    const lat = 37.935, lng = -122.347;
    const events = [];
    const add = (label, center, duration, type) => {
      if (center + duration >= now && center - duration < end) events.push({label, center, duration, type});
    };
    const utcMidnight = Math.floor(now / day) * day;
    for (let t = utcMidnight - day; t <= end + day; t += day) {
      const moon = SunCalc.getMoonTimes(new Date(t), lat, lng, true);
      if (moon.rise) add("Moonrise", +moon.rise, hour / 2, "Minor");
      if (moon.set) add("Moonset", +moon.set, hour / 2, "Minor");
    }
    const step = 5 * 60000;
    const altitude = t => SunCalc.getMoonPosition(new Date(t), lat, lng).altitude;
    for (let t = now - hour; t <= end + hour; t += step) {
      const value = altitude(t), before = altitude(t - step), after = altitude(t + step);
      if (value > before && value >= after) add("Upper lunar transit", t, hour, "Major");
      if (value < before && value <= after) add("Lower lunar transit", t, hour, "Major");
    }
    out.innerHTML = '<p>Approximate Richmond activity windows for the next 24 hours · Pacific time</p><ul>' +
      events.sort((a, b) => a.center - b.center).map(({label, center, duration, type}) =>
        `<li><strong>${type} · ${label}</strong><br>${time.format(center - duration)} – ${time.format(center + duration)}</li>`).join("") + "</ul>";
  }

  async function refresh() {
    const now = Date.now();
    const results = await Promise.allSettled([predictions(now, 1.5, "6"), predictions(now, 16, "hilo")]);
    if (results[0].status === "fulfilled") {
      heights = results[0].value.map(row => [epoch(row.t), Number(row.v)]).filter(point => point.every(Number.isFinite));
    }
    if (results[1].status === "fulfilled") coefficients = localCoefficients(results[1].value);
    draw();
  }

  heightButton.addEventListener("click", () => {mode = "height"; draw();});
  coefficientButton.addEventListener("click", () => {mode = "coefficient"; draw();});
  document.querySelector(".rwt-tides details").addEventListener("toggle", event => {
    if (event.currentTarget.open) renderSolunar();
  });
  refresh();
  setInterval(() => {draw();}, 60000);
  setInterval(refresh, hour);
})();
