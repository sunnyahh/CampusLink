<script setup>
/**
 * 校园地图组件（纯 SVG 手绘，不依赖任何地图 SDK）
 *
 * 图层顺序（从下往上）很关键：
 *   背景 → 装饰绿化 → 校园边界 → 暖廊/步道 → 推荐路线 → 建筑 → 起终点标记
 * 这样路线会"藏"在建筑下面，看起来像是从楼里穿过去。
 */
import { computed, ref } from 'vue'
import { BUILDINGS, BUILDING_TYPES, CAMPUS_META } from '../data/buildings.js'
import { CORRIDORS, JUNCTIONS } from '../data/corridors.js'

const props = defineProps({
  startId: { type: String, default: '' },
  endId: { type: String, default: '' },
  selectedId: { type: String, default: '' },
  picking: { type: String, default: '' },
  route: { type: Object, default: null }
})

const emit = defineEmits(['pick', 'clear', 'cancel-pick'])

/* ---------- 坐标工具 ---------- */
const NODE_CENTER = new Map()
for (const b of BUILDINGS) NODE_CENTER.set(b.id, { x: b.x, y: b.y })
for (const j of JUNCTIONS) NODE_CENTER.set(j.id, { x: j.x, y: j.y })

function toPath(points) {
  if (!points || points.length === 0) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}

/* ---------- 所有暖廊/步道的折线（静态数据，算一次就够） ---------- */
const corridorGeometries = CORRIDORS.map((corridor) => {
  const from = NODE_CENTER.get(corridor.from)
  const to = NODE_CENTER.get(corridor.to)
  if (!from || !to) return null
  const via = Array.isArray(corridor.via) ? corridor.via : []
  return {
    id: corridor.id,
    type: corridor.type,
    name: corridor.name,
    d: toPath([from, ...via, to])
  }
}).filter(Boolean)

/* ---------- 当前推荐路线的每一段 ---------- */
const routeSegments = computed(() => {
  if (!props.route || !props.route.ok) return []
  return props.route.steps.map((step, index) => ({
    key: `${step.id}-${index}`,
    type: step.type,
    d: toPath(step.points)
  }))
})

const startBuilding = computed(() => BUILDINGS.find((b) => b.id === props.startId) ?? null)
const endBuilding = computed(() => BUILDINGS.find((b) => b.id === props.endId) ?? null)

/** 起点/终点小图钉的位置：默认放在建筑正上方 */
function pinY(building) {
  return Math.max(16, building.y - building.h / 2 - 13)
}

function typeOf(building) {
  return BUILDING_TYPES[building.type] ?? BUILDING_TYPES.teaching
}

/* ---------- 悬停提示 ---------- */
const shellRef = ref(null)
const hoveredId = ref('')
const tooltip = ref(null)

function onEnter(building) {
  hoveredId.value = building.id
  const type = typeOf(building)
  tooltip.value = { name: building.name, label: type.label, x: 0, y: 0 }
}

function onMove(event) {
  if (!tooltip.value || !shellRef.value) return
  const rect = shellRef.value.getBoundingClientRect()
  tooltip.value = {
    ...tooltip.value,
    x: event.clientX - rect.left + 14,
    y: event.clientY - rect.top + 12
  }
}

function onLeave() {
  hoveredId.value = ''
  tooltip.value = null
}
</script>

<template>
  <div ref="shellRef" class="map-shell">
    <svg
      class="map"
      :class="{ 'is-picking': !!picking }"
      :viewBox="`0 0 ${CAMPUS_META.width} ${CAMPUS_META.height}`"
      role="img"
      aria-label="校园暖廊模拟地图"
      @click.self="emit('clear')"
    >
      <defs>
        <linearGradient id="routeIndoor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1d4ed8" />
          <stop offset="100%" stop-color="#0ea5e9" />
        </linearGradient>
      </defs>

      <!-- 装饰：湖水与绿地（模拟，不可点击） -->
      <g pointer-events="none">
        <ellipse cx="700" cy="178" rx="82" ry="52" fill="#dceffc" stroke="#c2ddf3" />
        <text x="700" y="182" class="water-label">镜 湖</text>
        <rect x="40" y="372" width="66" height="140" rx="18" fill="#e4f3e7" stroke="#cfe6d6" />
        <rect x="902" y="392" width="54" height="150" rx="18" fill="#e4f3e7" stroke="#cfe6d6" />
        <text x="73" y="446" class="green-label">林</text>
        <text x="929" y="472" class="green-label">林</text>
      </g>

      <!-- 校园边界 -->
      <rect
        x="20"
        y="10"
        width="960"
        height="640"
        rx="26"
        fill="none"
        stroke="#c9dcf3"
        stroke-width="1.6"
        stroke-dasharray="10 9"
        pointer-events="none"
      />

      <!-- 暖廊 / 室外步道 -->
      <g class="corridor-layer" pointer-events="none">
        <path
          v-for="c in corridorGeometries"
          :key="`base-${c.id}`"
          :d="c.d"
          class="corridor-base"
          :class="c.type"
        />
        <path
          v-for="c in corridorGeometries"
          :key="`line-${c.id}`"
          :d="c.d"
          class="corridor-line"
          :class="c.type"
        />
      </g>

      <!-- 暖廊枢纽节点 -->
      <circle
        v-for="j in JUNCTIONS"
        :key="j.id"
        :cx="j.x"
        :cy="j.y"
        r="4.5"
        class="junction"
        pointer-events="none"
      />

      <!-- 推荐路线 -->
      <g v-if="routeSegments.length" class="route-layer" pointer-events="none">
        <path
          v-for="seg in routeSegments"
          :key="`glow-${seg.key}`"
          :d="seg.d"
          class="route-glow"
          :class="seg.type"
        />
        <path
          v-for="seg in routeSegments"
          :key="`case-${seg.key}`"
          :d="seg.d"
          class="route-casing"
        />
        <path
          v-for="seg in routeSegments"
          :key="`seg-${seg.key}`"
          :d="seg.d"
          class="route-seg"
          :class="seg.type"
        />
        <path
          v-for="seg in routeSegments"
          :key="`flow-${seg.key}`"
          :d="seg.d"
          class="route-flow"
        />
      </g>

      <!-- 建筑 -->
      <g class="building-layer">
        <g
          v-for="b in BUILDINGS"
          :key="b.id"
          class="building"
          :class="{
            'is-selected': b.id === selectedId,
            'is-hover': b.id === hoveredId,
            'is-endpoint': b.id === startId || b.id === endId
          }"
          @click.stop="emit('pick', b.id)"
          @mouseenter="onEnter(b)"
          @mousemove="onMove"
          @mouseleave="onLeave"
        >
          <rect
            :x="b.x - b.w / 2"
            :y="b.y - b.h / 2"
            :width="b.w"
            :height="b.h"
            :rx="b.type === 'gate' ? b.h / 2 : 14"
            :fill="typeOf(b).soft"
            :stroke="typeOf(b).color"
            stroke-width="1.6"
          />
          <text
            :x="b.x"
            :y="b.type === 'gate' ? b.y + 4 : b.y + 2"
            class="b-name"
            :fill="typeOf(b).color"
            :style="b.type === 'gate' ? 'font-size: 11.5px' : null"
          >
            {{ b.name }}
          </text>
          <text
            v-if="b.type !== 'gate'"
            :x="b.x"
            :y="b.y + 16"
            class="b-en"
          >
            {{ b.en }}
          </text>
        </g>
      </g>

      <!-- 起点标记 -->
      <g
        v-if="startBuilding"
        class="pin pin-start"
        :transform="`translate(${startBuilding.x} ${pinY(startBuilding)})`"
        pointer-events="none"
      >
        <circle r="13" />
        <text dominant-baseline="central">起</text>
      </g>

      <!-- 终点标记 -->
      <g
        v-if="endBuilding"
        class="pin pin-end"
        :transform="`translate(${endBuilding.x} ${pinY(endBuilding)})`"
        pointer-events="none"
      >
        <circle r="13" />
        <text dominant-baseline="central">终</text>
      </g>

      <!-- 指北针 -->
      <g class="compass" pointer-events="none">
        <path d="M935 50 L943 68 L935 61 L927 68 Z" fill="#8aa9cb" />
        <text x="935" y="82" class="compass-text">N</text>
      </g>

      <!-- 比例尺：200 个地图单位 = 100 米 -->
      <g class="scalebar" pointer-events="none">
        <line x1="60" y1="622" x2="260" y2="622" stroke="#9db7d6" stroke-width="2.5" />
        <line x1="60" y1="616" x2="60" y2="628" stroke="#9db7d6" stroke-width="2.5" />
        <line x1="260" y1="616" x2="260" y2="628" stroke="#9db7d6" stroke-width="2.5" />
        <text x="160" y="612" class="scale-text">100 m</text>
      </g>
    </svg>

    <!-- 左上角：模拟数据声明 -->
    <div class="map-badge">
      <span class="dot"></span>
      模拟校园底图 · 非真实数据
    </div>

    <!-- 左下角：图例 -->
    <div class="legend">
      <span><i class="lg lg-indoor"></i>室内暖廊</span>
      <span><i class="lg lg-outdoor"></i>室外步道</span>
      <span><i class="lg lg-route"></i>推荐路线</span>
    </div>

    <!-- 地图点选提示 -->
    <div v-if="picking" class="pick-banner">
      请在地图上点击一栋建筑，设为{{ picking === 'start' ? '起点' : '终点' }}
      <button @click="emit('cancel-pick')">取消</button>
    </div>

    <!-- 悬停提示 -->
    <div
      v-if="tooltip"
      class="map-tooltip"
      :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
    >
      <strong>{{ tooltip.name }}</strong>
      <span>{{ tooltip.label }} · 点击查看详情</span>
    </div>
  </div>
</template>

<style scoped>
.map-shell {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  /* 地图底色 + 40px 网格，铺满整张卡片，
     这样 SVG 等比缩放留下的边距看起来也是"地图的一部分" */
  background-color: #eef5ff;
  background-image:
    repeating-linear-gradient(0deg, rgba(203, 222, 245, 0.42) 0 1px, transparent 1px 40px),
    repeating-linear-gradient(90deg, rgba(203, 222, 245, 0.42) 0 1px, transparent 1px 40px),
    linear-gradient(180deg, #f7fbff, #e8f1fc);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.map {
  display: block;
  width: 100%;
  height: 100%;
}

/* ---------- 暖廊 / 步道 ---------- */
.corridor-base,
.corridor-line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.corridor-base.indoor {
  stroke: #c2d9f8;
  stroke-width: 13;
}

.corridor-line.indoor {
  stroke: #eef6ff;
  stroke-width: 6;
}

.corridor-base.outdoor {
  stroke: #dde5ef;
  stroke-width: 9;
}

.corridor-line.outdoor {
  stroke: #b3c4d9;
  stroke-width: 3;
  stroke-dasharray: 2 7;
}

.junction {
  fill: #fff;
  stroke: #7aa7e8;
  stroke-width: 2;
}

/* ---------- 推荐路线 ---------- */
.route-glow {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 15;
  opacity: 0.28;
}

.route-glow.indoor {
  stroke: #3b82f6;
}

.route-glow.outdoor {
  stroke: #f59e0b;
}

.route-casing {
  fill: none;
  stroke: #ffffff;
  stroke-width: 12.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.92;
}

.route-seg {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 7.5;
}

.route-seg.indoor {
  stroke: url(#routeIndoor);
}

.route-seg.outdoor {
  stroke: #f59e0b;
  stroke-dasharray: 13 8;
}

.route-flow {
  fill: none;
  stroke: #ffffff;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 9 17;
  opacity: 0.95;
  animation: flow 1.15s linear infinite;
}

@keyframes flow {
  to {
    stroke-dashoffset: -26;
  }
}

/* ---------- 建筑 ---------- */
.building {
  cursor: pointer;
}

.building rect {
  transition: stroke-width 0.18s, filter 0.18s;
}

.building.is-hover rect {
  stroke-width: 2.6;
  filter: drop-shadow(0 4px 9px rgba(37, 99, 235, 0.22));
}

.building.is-selected rect {
  stroke-width: 3;
  filter: drop-shadow(0 6px 14px rgba(37, 99, 235, 0.3));
}

.is-picking .building {
  cursor: crosshair;
}

.b-name {
  font-size: 15px;
  font-weight: 700;
  text-anchor: middle;
  user-select: none;
}

.b-en {
  font-size: 7px;
  letter-spacing: 1.1px;
  text-anchor: middle;
  fill: #8b9ab3;
  user-select: none;
}

/* ---------- 起终点图钉 ---------- */
.pin circle {
  fill: #1d4ed8;
  stroke: #fff;
  stroke-width: 3;
  filter: drop-shadow(0 4px 8px rgba(29, 78, 216, 0.35));
}

.pin-end circle {
  fill: #0ea5e9;
}

.pin text {
  fill: #fff;
  font-size: 12.5px;
  font-weight: 800;
  text-anchor: middle;
  user-select: none;
}

/* ---------- 装饰文字 ---------- */
.water-label {
  fill: #7fb6de;
  font-size: 11px;
  letter-spacing: 5px;
  text-anchor: middle;
}

.green-label {
  fill: #93c5a8;
  font-size: 13px;
  text-anchor: middle;
}

.compass-text {
  fill: #8aa9cb;
  font-size: 10px;
  font-weight: 700;
  text-anchor: middle;
}

.scale-text {
  fill: #8aa9cb;
  font-size: 10px;
  text-anchor: middle;
}

/* ---------- HTML 浮层 ---------- */
.map-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  font-size: 11.5px;
  font-weight: 600;
  color: #7c5a12;
  background: rgba(255, 248, 231, 0.94);
  border: 1px solid #f2dfae;
  border-radius: 8px;
  pointer-events: none;
}

.map-badge .dot {
  width: 6px;
  height: 6px;
  background: #e0a92e;
  border-radius: 50%;
}

.legend {
  position: absolute;
  left: 12px;
  bottom: 12px;
  display: flex;
  gap: 14px;
  padding: 7px 12px;
  font-size: 11.5px;
  color: var(--ink-2);
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--line);
  border-radius: 10px;
  backdrop-filter: blur(6px);
  pointer-events: none;
}

.legend span {
  display: inline-flex;
  align-items: center;
}

.legend .lg {
  display: inline-block;
  width: 16px;
  margin-right: 5px;
  border-radius: 2px;
}

.lg-indoor {
  height: 7px;
  background: #c2d9f8;
  border-radius: 4px;
}

.lg-outdoor {
  height: 0;
  border-top: 2px dotted #b3c4d9;
}

.lg-route {
  height: 5px;
  background: linear-gradient(90deg, #1d4ed8, #0ea5e9);
}

.pick-banner {
  position: absolute;
  top: 14px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px 8px 14px;
  font-size: 12.5px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  background: rgba(29, 78, 216, 0.94);
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(29, 78, 216, 0.3);
  transform: translateX(-50%);
}

.pick-banner button {
  padding: 3px 9px;
  font-size: 11.5px;
  font-weight: 600;
  color: #1d4ed8;
  background: #fff;
  border-radius: 6px;
}

.map-tooltip {
  position: absolute;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 10px;
  color: #fff;
  white-space: nowrap;
  background: rgba(11, 42, 91, 0.92);
  border-radius: 9px;
  box-shadow: 0 8px 20px rgba(11, 42, 91, 0.25);
  pointer-events: none;
}

.map-tooltip strong {
  font-size: 12.5px;
}

.map-tooltip span {
  font-size: 11px;
  color: #c3d7f4;
}

@media (max-width: 1100px) {
  .map-shell {
    min-height: 56vh;
  }
}
</style>
