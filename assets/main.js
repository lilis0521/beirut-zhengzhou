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

  const WORD_STROKE = [
    [0.5, 22.1], [0.9, 21.7], [1.5, 20.8], [2.4, 19], [3.4, 16.7],
    [4.3, 14.2], [5.2, 12.1], [6, 11.3], [6.7, 11.2], [7.4, 12.1],
    [8, 13.2], [8.8, 13.7], [9.6, 14.2], [10.4, 13.6], [11.3, 13.4],
    [12.2, 12.9], [13.2, 13.5], [14.2, 14.3], [15.4, 15.6], [16.4, 16.9],
    [17.4, 17.4], [18.1, 17.5], [18.8, 16.4], [19.5, 15.8], [20.2, 15.4],
    [20.9, 16.1], [21.6, 16.9], [22.3, 18], [23, 18.5], [23.7, 18.4],
    [24.3, 18.2], [25, 17.6], [25.7, 17.2], [26.4, 16.8], [27, 16.3],
    [27.6, 15.8], [28.3, 15.8], [28.9, 16.6], [29.5, 17.3], [30.2, 17.8],
    [30.8, 17.4], [31.5, 17], [32.1, 16.7], [32.8, 16.3], [33.5, 16.4],
    [34.2, 16.4], [34.9, 16.8], [35.6, 16.9], [36.2, 17.1], [37, 17.4],
    [37.9, 17.4], [38.8, 17.5], [39.8, 17.6], [40.6, 17.8], [41.4, 18.1],
    [42.1, 18.3], [42.7, 18.2], [43.3, 18.2], [44, 17.8], [44.6, 17.2],
    [45.2, 16.6], [45.9, 16], [46.5, 16], [47.2, 16.3], [47.8, 16.8],
    [48.4, 17], [49.1, 17.1], [49.9, 17.2], [50.6, 17.4], [51.4, 17.4],
    [52.1, 17.3], [52.7, 16.6], [53.3, 15.9], [54, 15.4], [54.7, 15.4],
    [55.4, 15.5], [56.1, 15.6], [56.9, 15.8], [57.6, 16.1], [58.2, 16.1],
    [58.9, 16.3], [59.5, 16.4], [60.2, 16.7], [60.8, 17.3], [61.4, 17.4],
    [62.1, 17.2], [62.7, 16.2], [63.3, 15.2], [64, 14.6], [64.6, 14.9],
    [65.2, 16.3], [65.9, 17.3], [66.5, 18], [67.2, 18], [67.9, 17.5],
    [68.5, 17.1], [69.2, 16.9], [69.8, 16.8], [70.5, 17.1], [71.1, 17.9],
    [71.7, 18.4], [72.4, 19.1], [73, 19.1], [73.6, 19.4], [74.3, 19.4],
    [75, 18.7], [75.8, 17.6], [76.6, 16], [77.2, 15], [77.6, 14.5],
  ];

  // 单词局部坐标 → 经纬度（地图中部上空，随地图缩放拖拽）
  function wordToGeo(pt) {
    const lon = 55 + (pt[0] / 78) * 52;
    const lat = 40 - ((pt[1] - 8) / 16) * 16;
    return [lon, lat];
  }

  // 两条线沿笔迹中线两侧缠绕，交织书写 Memories：
  // 线1（暖色）从贝鲁特来，走笔迹上侧，去郑州；
  // 线2（冷色）从郑州来，反向走笔迹下侧，去贝鲁特 —— 双线缠绕笔迹
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
    const OFFSET = 0.85; // 缠绕偏移（纬度）
    const geoA = WORD_STROKE.map(([x, y]) => {
      const [lon, lat] = wordToGeo([x, y]);
      return [Math.round(lon * 100) / 100, Math.round((lat + OFFSET) * 100) / 100];
    });
    const geoB = WORD_STROKE.map(([x, y]) => {
      const [lon, lat] = wordToGeo([x, y]);
      return [Math.round(lon * 100) / 100, Math.round((lat - OFFSET) * 100) / 100];
    }).reverse();
    // 平滑弧线（多点圆弧），连接城市与单词两端
    function arc(from, to, bend, n) {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const lon = from[0] + (to[0] - from[0]) * t;
        const lat = from[1] + (to[1] - from[1]) * t + Math.sin(Math.PI * t) * bend;
        pts.push([Math.round(lon * 100) / 100, Math.round(lat * 100) / 100]);
      }
      return pts;
    }
    return [
      {
        coords: [
          [BEIRUT[0], BEIRUT[1]],
          ...arc([BEIRUT[0], BEIRUT[1]], [55, 39], 3.5, 8),
          ...geoA,
          ...arc([107, 31.5], [ZHENGZHOU[0], ZHENGZHOU[1]], 3, 8),
          [ZHENGZHOU[0], ZHENGZHOU[1]],
        ],
        lineStyle: {
          color: gradWarm,
          width: 2.4,
          opacity: 0.95,
          shadowBlur: 4,
          shadowColor: 'rgba(255,150,120,0.45)',
        },
      },
      {
        coords: [
          [ZHENGZHOU[0], ZHENGZHOU[1]],
          ...arc([ZHENGZHOU[0], ZHENGZHOU[1]], [104, 39.5], -3, 8),
          ...geoB,
          ...arc([55, 31], [BEIRUT[0], BEIRUT[1]], -3.5, 8),
          [BEIRUT[0], BEIRUT[1]],
        ],
        lineStyle: {
          color: gradCool,
          width: 2.4,
          opacity: 0.95,
          shadowBlur: 4,
          shadowColor: 'rgba(140,120,255,0.45)',
        },
      },
    ];
  }


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
      // 初始聚焦贝鲁特-郑州航线（单词清晰可见），可缩小看全球、放大看细节
      center: [74.5, 34.5],
      zoom: 4,
      scaleLimit: { min: 0.4, max: 12 },
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
      // 两条彩色渐变弧线（上暖下冷，弧顶围绕中央的 Memories 单词）
      {
        type: 'lines',
        coordinateSystem: 'geo',
        zlevel: 2,
        polyline: true,
        silent: true,
        effect: {
          show: true,
          period: 4.5,
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
