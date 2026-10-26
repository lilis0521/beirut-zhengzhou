/* ============================================================
 * Beirut ⇄ Zhengzhou · 相识纪念
 * 世界地图 + 彩虹光桥 + 城市标注 + 相识计时 + 共享相册（预留）
 * ============================================================ */

/* ---------- 可配置项 ---------- */
// 相识起始日期（今天 2026-10-25 显示为第 59 天；如需修改，改这里即可）
const START_DATE = '2026-08-27T00:00:00';

// 两座城市的坐标 [经度, 纬度]
const BEIRUT = [35.5018, 33.8938];      // 黎巴嫩 · 贝鲁特
const ZHENGZHOU = [113.6254, 34.7466];  // 中国 · 郑州

/* ============================================================
 * 1. 星空背景（颜色预生成，避免每帧随机计算）
 * ============================================================ */
(function initStars() {
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  let stars = [];
  let raf = null;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    const count = Math.min(170, Math.floor((window.innerWidth * window.innerHeight) / 11000));
    stars = Array.from({ length: count }, () => {
      const g = 215 + Math.random() * 30;
      const b = 230 + Math.random() * 25;
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.3 + 0.25,
        base: Math.random() * 0.45 + 0.2,
        tw: Math.random() * Math.PI * 2,
        speed: Math.random() * 1.2 + 0.4,
        rgb: `190,${Math.floor(g)},${Math.floor(b)}`,
        glow: Math.random() < 0.3,
      };
    });
  }

  function tick(t) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const s of stars) {
      const alpha = s.base + Math.sin(t / 1000 * s.speed + s.tw) * 0.2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.rgb},${Math.max(0.08, Math.min(1, alpha))})`;
      ctx.fill();
      if (s.glow) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150,180,255,${alpha * 0.1})`;
        ctx.fill();
      }
    }
    raf = requestAnimationFrame(tick);
  }

  resize();
  raf = requestAnimationFrame(tick);
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
})();

/* ============================================================
 * 2. 世界地图 + 彩虹光桥 + 城市标注
 * ============================================================ */
(function initMap() {
  const el = document.getElementById('map');
  const chart = echarts.init(el, null, { renderer: 'canvas' });
  echarts.registerMap('world', window.WORLD_JSON);

  function rand(a, b) { return a + Math.random() * (b - a); }

  // "Memories" 草书连笔笔画关键点（归一化坐标：x 0~78，y 基线 22 / 顶部 8）
  const WORD_STROKES = [
    // M（两峰）
    [0, 22], [1, 8], [7, 18], [13, 8], [13, 22],
    // e（小环 + 右上出笔）
    [15, 22], [16, 15], [20, 12.5], [24, 15], [21, 19.5], [20, 22], [24, 17], [27, 17],
    // m（两拱）
    [25, 22], [25, 14], [28, 18], [31, 14], [31, 22], [34, 22],
    // o（环 + 出笔）
    [34, 22], [34, 14], [38, 12], [42, 14], [42, 22], [38, 24], [34, 22], [45, 17],
    // r（尖拱 + 竖）
    [42.5, 22], [43.5, 13], [46.5, 13], [43.5, 14.5], [43.5, 22], [46, 22],
    // i（竖上挑 + 点）
    [46, 22], [48, 14], [51, 15], [51, 7.5], [52, 6.5], [53, 7.5], [52, 8.5], [51, 7.5], [51, 15],
    // e（环 + 出笔）
    [53, 22], [53, 16], [57, 13], [60, 16], [57, 19.5], [56, 22], [60, 19], [63, 16], [64, 17],
    // s（蛇形收尾）
    [62, 22], [64, 15], [69, 15], [65, 22], [61, 23], [65, 19], [69, 16], [74, 15],
  ];

  // Catmull-Rom 平滑采样
  function smoothPath(pts, perSeg) {
    const out = [];
    const n = pts.length;
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(n - 1, i + 2)];
      for (let s = 0; s < perSeg; s++) {
        const t = s / perSeg;
        const t2 = t * t;
        const t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    out.push(pts[n - 1]);
    return out;
  }

  // 单词局部坐标 → 经纬度（地图中部上空：55E~97E, 26N~39N）
  function wordToGeo(pt) {
    const lon = 55 + (pt[0] / 78) * 42;
    const lat = 39 - ((pt[1] - 8) / 16) * 13;
    return [lon, lat];
  }

  // 两条线：线1 暖色渐变写前半 "Mem"，线2 冷色渐变反向写后半 "ories"，
  // 两线在单词两端上下交错（X 形编织），各自连接两座城市
  function buildWordLines() {
    const gradWarm = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
      { offset: 0, color: '#ff5c8a' },
      { offset: 0.5, color: '#ffc53d' },
      { offset: 1, color: '#4ade80' },
    ]);
    const gradCool = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
      { offset: 0, color: '#38bdf8' },
      { offset: 0.5, color: '#818cf8' },
      { offset: 1, color: '#e879f9' },
    ]);

    const smooth = smoothPath(WORD_STROKES, 6);
    const splitIdx = 16 * 6; // "Mem" 结束、"ories" 开始的衔接点
    const geoFirst = smooth.slice(0, splitIdx + 1).map(wordToGeo);
    const geoSecond = smooth.slice(splitIdx).map(wordToGeo).reverse();

    return [
      {
        coords: [
          [BEIRUT[0], BEIRUT[1]],
          [46, 40], [55, 38.5],
          ...geoFirst,
          [97, 31.5], [106, 31],
          [ZHENGZHOU[0], ZHENGZHOU[1]],
        ],
        lineStyle: {
          color: gradWarm,
          width: 3,
          opacity: 0.95,
          shadowBlur: 8,
          shadowColor: 'rgba(255,150,120,0.5)',
        },
      },
      {
        coords: [
          [ZHENGZHOU[0], ZHENGZHOU[1]],
          [106, 39.5], [97, 38.5],
          ...geoSecond,
          [55, 32], [46, 31.5],
          [BEIRUT[0], BEIRUT[1]],
        ],
        lineStyle: {
          color: gradCool,
          width: 3,
          opacity: 0.95,
          shadowBlur: 8,
          shadowColor: 'rgba(140,120,255,0.5)',
        },
      },
    ];
  }

  // 其他城市参照标注
  const OTHER_CITIES = [
    { name: 'Beijing', value: [116.4, 39.9] },
    { name: 'Paris', value: [2.35, 48.85] },
    { name: 'London', value: [-0.13, 51.5] },
    { name: 'New York', value: [-74.0, 40.7] },
    { name: 'Istanbul', value: [29.0, 41.0] },
    { name: 'Moscow', value: [37.6, 55.75] },
    { name: 'Cairo', value: [31.2, 30.0] },
    { name: 'Dubai', value: [55.3, 25.2] },
    { name: 'Tokyo', value: [139.7, 35.7] },
    { name: 'Singapore', value: [103.8, 1.35] },
    { name: 'Sydney', value: [151.2, -33.9] },
    { name: 'Rio de Janeiro', value: [-43.2, -22.9] },
  ];

  const isNarrow = () => window.innerWidth < 720;

  const option = {
    backgroundColor: 'transparent',
    animationDuration: 1400,
    animationEasing: 'cubicOut',
    animationDurationUpdate: 0, // 缩放/更新时不播动画，保持丝滑
    geo: {
      map: 'world',
      roam: true,
      scaleLimit: { min: 1, max: 10 },
      silent: true,
      layoutCenter: ['50%', '52%'],
      layoutSize: isNarrow() ? '106%' : '122%',
      itemStyle: {
        areaColor: '#131f3e',
        borderColor: 'rgba(140,180,255,0.28)',
        borderWidth: 0.5,
      },
      emphasis: { disabled: true },
      select: { disabled: true },
      regions: [
        { name: 'Lebanon', itemStyle: { areaColor: 'rgba(255,150,160,0.22)' } },
        { name: 'China', itemStyle: { areaColor: 'rgba(120,170,255,0.20)' } },
      ],
    },
    series: [
      // 两条彩色线交织书写单词 Memories（带流动光点）
      {
        type: 'lines',
        coordinateSystem: 'geo',
        zlevel: 2,
        polyline: true,
        silent: true,
        effect: {
          show: true,
          period: 5,
          trailLength: 0.5,
          symbol: 'circle',
          symbolSize: 3,
          color: '#ffffff',
        },
        data: buildWordLines(),
      },
      // 主城市：Lea / lils（发光涟漪 + 名字标签）
      {
        type: 'effectScatter',
        coordinateSystem: 'geo',
        zlevel: 4,
        symbolSize: 13,
        labelLayout: { hideOverlap: false },
        rippleEffect: { period: 3, scale: 3.4, brushType: 'stroke' },
        itemStyle: { shadowBlur: 8, shadowColor: 'rgba(255,190,110,0.8)' },
        label: {
          show: true,
          position: 'top',
          distance: 14,
          formatter: (p) => p.name,
          color: '#f7e9c8',
          fontSize: 15,
          fontWeight: 600,
          fontFamily: 'Georgia, "PingFang SC", serif',
          backgroundColor: 'rgba(7, 12, 28, 0.72)',
          borderColor: 'rgba(255, 214, 150, 0.32)',
          borderWidth: 1,
          borderRadius: 7,
          padding: [5, 12],
          textShadowColor: 'rgba(0,0,0,0.65)',
          textShadowBlur: 4,
        },
        data: [
          { name: 'Lea · Beirut', value: [BEIRUT[0], BEIRUT[1]], itemStyle: { color: '#ff8787' } },
          { name: 'lils · Zhengzhou', value: [ZHENGZHOU[0], ZHENGZHOU[1]], itemStyle: { color: '#4dabf7' } },
        ],
      },
      // 其他城市参照标注（小点 + 小字，随地图缩放自动移动）
      {
        type: 'scatter',
        coordinateSystem: 'geo',
        zlevel: 3,
        symbol: 'circle',
        symbolSize: 4.5,
        silent: true,
        itemStyle: {
          color: 'rgba(190,210,255,0.8)',
          borderColor: 'rgba(255,255,255,0.55)',
          borderWidth: 0.6,
        },
        label: {
          show: true,
          position: 'right',
          distance: 6,
          formatter: (p) => p.name,
          color: 'rgba(185,202,240,0.9)',
          fontSize: 11,
          fontFamily: 'Georgia, "PingFang SC", serif',
          backgroundColor: 'rgba(7, 12, 28, 0.5)',
          borderRadius: 4,
          padding: [2, 6],
        },
        data: OTHER_CITIES,
      },
    ],
  };

  try {
    chart.setOption(option);
  } catch (err) {
    console.error('chart init failed:', err);
  }
  window.addEventListener('resize', () => {
    chart.resize();
    // 横竖屏切换/窗口变化时，按宽度调整地图初始尺寸
    chart.setOption({ geo: { layoutSize: isNarrow() ? '106%' : '122%' } });
  });
})();

/* ============================================================
 * 3. 相识计时器
 * ============================================================ */
(function initTimer() {
  const start = new Date(START_DATE).getTime();
  const $days = document.getElementById('days');
  const $hours = document.getElementById('stat-hours');
  const $minutes = document.getElementById('stat-minutes');
  const $seconds = document.getElementById('stat-seconds');
  const $startDate = document.getElementById('start-date');
  const $footDays = document.getElementById('foot-days');

  // 起始日期展示为 YYYY.MM.DD
  const d0 = new Date(START_DATE);
  const pad = (n) => String(n).padStart(2, '0');
  $startDate.textContent = `${d0.getFullYear()}.${pad(d0.getMonth() + 1)}.${pad(d0.getDate())}`;

  function fmt(n) { return n.toLocaleString('en-US'); }

  function update() {
    const now = Date.now();
    const diff = Math.max(0, now - start);
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor(diff / 1000);

    $days.textContent = days;
    $hours.textContent = fmt(hours);
    $minutes.textContent = fmt(minutes);
    $seconds.textContent = fmt(seconds);
    $footDays.textContent = `Day ${days} together`;
  }

  update();
  setInterval(update, 1000);
})();

/* ============================================================
 * 4. 共享相册弹窗（预留）
 * ============================================================ */
(function initAlbum() {
  const trigger = document.getElementById('album-trigger');
  const modal = document.getElementById('album-modal');
  const closes = modal.querySelectorAll('[data-close]');

  function open() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  trigger.addEventListener('click', open);
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
  closes.forEach((c) => c.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });
})();
