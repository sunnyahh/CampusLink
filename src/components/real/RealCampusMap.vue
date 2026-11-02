<script setup>
/**
 * 真实校园 · 示意地图（人工标定版）
 * ------------------------------------------------------------
 * ⚠️ 视觉说明：
 *    - 建筑位置是人工按官方截图相对方位排的，非测绘精度；
 *    - 暖廊没有真实走向数据，一律画「示意虚线」；
 *    - 道路/水系只是方位提示，不是测绘底图；
 *    - 没有使用官方 GIS 底图 / 瓦片 / 接口。
 *
 * 本文件的视图逻辑（缩放 / 拖动 / 适应地图）都只影响"相机"，
 * 不改变任何建筑的相对位置。
 */
import { computed, onMounted, ref } from 'vue'
import {
  MAP_CANVAS,
  CAMPUS_BOX,
  MAP_META,
  BUILDING_LAYOUT,
  CONTEXT_BUILDINGS,
  CAMPUS_DECOR
} from '../../data/realCampus/mapLayout.js'

const props = defineProps({
  buildings: { type: Array, required: true },
  nodes: { type: Array, required: true },
  corridors: { type: Array, required: true },
  selection: { type: Object, default: null },
  routeCorridorIds: { type: Array, default: () => [] },
  routeBuildingIds: { type: Array, default: () => [] },
  startBuildingId: { type: String, default: '' },
  endBuildingId: { type: String, default: '' },
  routeActive: { type: Boolean, default: false }
})

const emit = defineEmits(['select'])

const W = MAP_CANVAS.width
const H = MAP_CANVAS.height

const buildingById = computed(() => new Map(props.buildings.map((b) => [b.building_id, b])))
const nodeBuilding = computed(() => new Map(props.nodes.map((n) => [n.node_id, n.building_id])))

/** 能画在图上的建筑 */
const placed = computed(() =>
  BUILDING_LAYOUT.filter(
    (item) => item.status !== 'unplaced' && buildingById.value.has(item.building_id)
  ).map((item) => ({ ...item, building: buildingById.value.get(item.building_id) }))
)

/** 没有位置依据的建筑：不上图，只列清单 */
const unplaced = computed(() =>
  BUILDING_LAYOUT.filter((item) => item.status === 'unplaced').map((item) => ({
    ...item,
    building: buildingById.value.get(item.building_id)
  }))
)

const placedById = computed(() => new Map(placed.value.map((item) => [item.building_id, item])))

/* ---------- 暖廊示意线 ---------- */
function edgePoint(from, to) {
  const dx = to.footprint.x - from.footprint.x
  const dy = to.footprint.y - from.footprint.y
  if (dx === 0 && dy === 0) {
    return { x: from.footprint.x, y: from.footprint.y }
  }
  const halfW = from.footprint.w / 2
  const halfH = from.footprint.h / 2
  const tx = dx === 0 ? Infinity : halfW / Math.abs(dx)
  const ty = dy === 0 ? Infinity : halfH / Math.abs(dy)
  const t = Math.min(tx, ty)
  return { x: from.footprint.x + dx * t, y: from.footprint.y + dy * t }
}

const corridorLines = computed(() => {
  const lines = []

  for (const corridor of props.corridors) {
    const chainIds = corridor.chain_node_ids.length
      ? corridor.chain_node_ids
      : [corridor.from_node_id, corridor.to_node_id]

    const boxes = chainIds
      .map((id) => placedById.value.get(nodeBuilding.value.get(id)))
      .filter(Boolean)

    // 端点没标定就不画 —— 不能凭空画到一个不存在的位置
    if (boxes.length < 2) continue

    const points = []
    for (let i = 0; i < boxes.length - 1; i += 1) {
      points.push(edgePoint(boxes[i], boxes[i + 1]))
      points.push(edgePoint(boxes[i + 1], boxes[i]))
    }

    const d = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ')

    lines.push({
      id: corridor.corridor_id,
      officialNo: corridor.official_no,
      d,
      mid: { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 },
      onRoute: props.routeCorridorIds.includes(corridor.corridor_id)
    })
  }

  return lines
})

const routeLines = computed(() => corridorLines.value.filter((line) => line.onRoute))
const skippedCorridors = computed(() => props.corridors.length - corridorLines.value.length)

/* ---------- 相机：缩放 / 拖动 / 适应地图 ---------- */
const svgRef = ref(null)
const view = ref({ scale: 1, x: 0, y: 0 })
const MIN_SCALE = 0.6
const MAX_SCALE = 3.2

let lastPoint = null
let movedDistance = 0
const dragging = ref(false)
const suppressClick = ref(false)

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/** 内容外框（建筑 + 参照物 + 标签），用于"适应地图" */
const contentBox = computed(() => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  const grow = (x, y) => {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }

  for (const item of placed.value) {
    const f = item.footprint
    grow(f.x - f.w / 2, f.y - f.h / 2)
    grow(f.x + f.w / 2, f.y + f.h / 2)
    if (item.label) grow(item.label.x, item.label.y)
  }
  for (const item of CONTEXT_BUILDINGS) {
    grow(item.x - item.w / 2, item.y - item.h / 2)
    grow(item.x + item.w / 2, item.y + item.h / 2)
    if (item.label) grow(item.label.x, item.label.y)
  }

  return { minX, minY, maxX, maxY }
})

function fitView() {
  const box = contentBox.value
  const width = box.maxX - box.minX + 34 * 2
  const height = box.maxY - box.minY + 34 * 2

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return

  const scale = clamp(Math.min(W / width, H / height), MIN_SCALE, MAX_SCALE)
  const centerX = (box.minX + box.maxX) / 2
  const centerY = (box.minY + box.maxY) / 2

  view.value = constrain({
    scale,
    x: W / 2 - centerX * scale,
    y: H / 2 - centerY * scale
  })
}

/**
 * 把相机限制在"内容至少还露出一角"的范围内。
 * 否则用户拖一下就可能把整张图推出视野，看起来像"地图没了"。
 */
function constrain(next) {
  if (!Number.isFinite(next.scale) || !Number.isFinite(next.x) || !Number.isFinite(next.y)) {
    return { scale: 1, x: 0, y: 0 }
  }

  const box = contentBox.value
  if (!Number.isFinite(box.minX)) return next

  const keep = 90
  let x = next.x
  let y = next.y

  const left = box.minX * next.scale + x
  const right = box.maxX * next.scale + x
  if (right < keep) x += keep - right
  if (left > W - keep) x -= left - (W - keep)

  const top = box.minY * next.scale + y
  const bottom = box.maxY * next.scale + y
  if (bottom < keep) y += keep - bottom
  if (top > H - keep) y -= top - (H - keep)

  return { scale: next.scale, x, y }
}

onMounted(fitView)

function clientToSvg(clientX, clientY) {
  const svg = svgRef.value
  const ctm = svg?.getScreenCTM()
  if (!svg || !ctm) return { x: 0, y: 0 }
  const point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY
  return point.matrixTransform(ctm.inverse())
}

function applyZoom(anchor, factor) {
  const current = view.value.scale
  const next = clamp(current * factor, MIN_SCALE, MAX_SCALE)
  if (next === current) return
  const worldX = (anchor.x - view.value.x) / current
  const worldY = (anchor.y - view.value.y) / current
  view.value = constrain({
    scale: next,
    x: anchor.x - worldX * next,
    y: anchor.y - worldY * next
  })
}

function zoomBy(factor) {
  applyZoom({ x: W / 2, y: H / 2 }, factor)
}

function onWheel(event) {
  const point = clientToSvg(event.clientX, event.clientY)
  applyZoom(point, event.deltaY < 0 ? 1.12 : 1 / 1.12)
}

function onPointerDown(event) {
  if (event.button !== 0) return
  dragging.value = true
  movedDistance = 0
  lastPoint = { x: event.clientX, y: event.clientY }
}

function onPointerMove(event) {
  if (!dragging.value || !lastPoint) return
  const dx = event.clientX - lastPoint.x
  const dy = event.clientY - lastPoint.y
  movedDistance += Math.abs(dx) + Math.abs(dy)
  lastPoint = { x: event.clientX, y: event.clientY }

  const ctm = svgRef.value?.getScreenCTM()
  const k = ctm?.a || 1
  view.value = constrain({
    ...view.value,
    x: view.value.x + dx / k,
    y: view.value.y + dy / k
  })
}

function onPointerUp() {
  if (dragging.value && movedDistance > 4) {
    // 拖动结束后紧跟的 click 要吞掉，否则拖地图会误触发选中
    suppressClick.value = true
    setTimeout(() => {
      suppressClick.value = false
    }, 0)
  }
  dragging.value = false
  lastPoint = null
}

function resetView() {
  view.value = { scale: 1, x: 0, y: 0 }
}

/* ---------- 选中 ---------- */
function selectBuilding(id) {
  if (suppressClick.value) return
  emit('select', { type: 'building', id })
}

function selectCorridor(id) {
  if (suppressClick.value) return
  emit('select', { type: 'corridor', id })
}

function onBackgroundClick() {
  if (suppressClick.value) return
  emit('select', null)
}

function buildingClass(item) {
  return {
    'is-selected':
      props.selection?.type === 'building' && props.selection?.id === item.building_id,
    'is-route-building': props.routeBuildingIds.includes(item.building_id),
    'is-start-building': item.building_id === props.startBuildingId,
    'is-end-building': item.building_id === props.endBuildingId,
    'is-estimated': item.status === 'estimated'
  }
}

const transform = computed(
  () => `translate(${view.value.x} ${view.value.y}) scale(${view.value.scale})`
)

const zoomLabel = computed(() => `${Math.round(view.value.scale * 100)}%`)
</script>

<template>
  <div class="map-wrapper">
    <div class="map-stage">
      <svg
        ref="svgRef"
        class="map-svg"
        :class="{ 'is-dragging': dragging }"
        :viewBox="`0 0 ${W} ${H}`"
        role="img"
        aria-label="校园示意地图（人工标定）"
        @wheel.prevent="onWheel"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointerleave="onPointerUp"
      >
        <defs>
          <pattern id="campusDots" width="34" height="34" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.3" fill="#dbe7f6" />
          </pattern>
          <linearGradient id="campusWash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#f4f9ff" />
          </linearGradient>
        </defs>

        <rect :width="W" :height="H" class="canvas-bg" @click="onBackgroundClick" />

        <g :transform="transform">
          <!-- 校园范围 -->
          <rect
            :x="CAMPUS_BOX.x"
            :y="CAMPUS_BOX.y"
            :width="CAMPUS_BOX.width"
            :height="CAMPUS_BOX.height"
            rx="22"
            class="campus-fill"
          />
          <rect
            :x="CAMPUS_BOX.x"
            :y="CAMPUS_BOX.y"
            :width="CAMPUS_BOX.width"
            :height="CAMPUS_BOX.height"
            rx="22"
            fill="url(#campusDots)"
            pointer-events="none"
          />
          <rect
            :x="CAMPUS_BOX.x"
            :y="CAMPUS_BOX.y"
            :width="CAMPUS_BOX.width"
            :height="CAMPUS_BOX.height"
            rx="22"
            class="campus-boundary"
          />

          <!-- 装饰地物（只画截图里有明确街名的，方位提示用） -->
          <g class="decor" pointer-events="none">
            <path
              v-for="road in CAMPUS_DECOR.roads"
              :key="road.name"
              :d="road.d"
              class="deco-road"
            />
            <path
              v-for="river in CAMPUS_DECOR.water"
              :key="river.name"
              :d="river.d"
              class="deco-water"
            />
            <text
              v-for="road in CAMPUS_DECOR.roads"
              :key="`${road.name}-label`"
              :x="road.label.x"
              :y="road.label.y"
              class="deco-label"
              :transform="`rotate(${road.label.rotate} ${road.label.x} ${road.label.y})`"
            >
              {{ road.name }}
            </text>
            <text
              v-for="river in CAMPUS_DECOR.water"
              :key="`${river.name}-label`"
              :x="river.label.x"
              :y="river.label.y"
              class="deco-label water"
              :transform="`rotate(${river.label.rotate} ${river.label.x} ${river.label.y})`"
            >
              {{ river.name }}
            </text>
          </g>

          <!-- 暖廊示意线 -->
          <g class="corridors">
            <path
              v-for="line in routeLines"
              :key="`case-${line.id}`"
              :d="line.d"
              class="corridor-casing"
            />
            <path
              v-for="line in corridorLines"
              :key="line.id"
              :d="line.d"
              class="corridor"
              :class="{
                'is-route': line.onRoute,
                'is-dim': routeActive && !line.onRoute
              }"
              @click.stop="selectCorridor(line.id)"
            />
          </g>

          <!-- 参照物 -->
          <g class="context" pointer-events="none">
            <g v-for="item in CONTEXT_BUILDINGS" :key="item.name">
              <rect
                :x="item.x - item.w / 2"
                :y="item.y - item.h / 2"
                :width="item.w"
                :height="item.h"
                rx="9"
                class="context-box"
              />
              <text :x="item.label.x" :y="item.label.y" class="context-name">{{ item.name }}</text>
            </g>
          </g>

          <!-- 建筑 -->
          <g class="buildings">
            <g
              v-for="item in placed"
              :key="item.building_id"
              class="building"
              :class="buildingClass(item)"
              @click.stop="selectBuilding(item.building_id)"
            >
              <rect
                :x="item.footprint.x - item.footprint.w / 2"
                :y="item.footprint.y - item.footprint.h / 2"
                :width="item.footprint.w"
                :height="item.footprint.h"
                rx="8"
                class="footprint"
              />
              <text
                :x="item.label.x"
                :y="item.label.y"
                :text-anchor="item.label.anchor"
                class="building-name"
              >
                {{ item.building.official_name }}
              </text>
              <text
                v-if="item.status === 'estimated'"
                :x="item.footprint.x"
                :y="item.footprint.y + 5"
                class="estimark"
              >
                位置待核实
              </text>

              <!-- 起终点徽标 -->
              <g
                v-if="item.building_id === startBuildingId || item.building_id === endBuildingId"
                class="marker"
                :class="item.building_id === startBuildingId ? 'start' : 'end'"
                :transform="`translate(${item.footprint.x} ${item.footprint.y})`"
              >
                <circle r="14" />
                <text dominant-baseline="central">
                  {{ item.building_id === startBuildingId ? '起' : '终' }}
                </text>
              </g>
            </g>
          </g>

          <!-- 暖廊编号 -->
          <g class="corridor-labels" pointer-events="none">
            <text
              v-for="line in corridorLines"
              :key="`no-${line.id}`"
              :x="line.mid.x"
              :y="line.mid.y"
              class="corridor-no"
              :class="{ 'is-route': line.onRoute }"
            >
              {{ line.officialNo }}
            </text>
          </g>
        </g>
      </svg>

      <!-- 缩放 / 适应地图 -->
      <div class="zoom-controls">
        <button title="放大" @click="zoomBy(1.25)">+</button>
        <button title="缩小" @click="zoomBy(1 / 1.25)">−</button>
        <button class="zoom-fit" title="适应地图" @click="fitView">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" />
          </svg>
          适应
        </button>
        <button class="zoom-reset" title="恢复到 100%" @click="resetView">
          {{ zoomLabel }}
        </button>
      </div>
    </div>

    <!-- 图例移到画布外，避免遮挡建筑 -->
    <div class="map-legend-bar">
      <span class="lg"><i class="sw-building"></i>已标定建筑</span>
      <span class="lg"><i class="sw-estimated"></i>位置待核实</span>
      <span class="lg"><i class="sw-corridor"></i>暖廊示意线</span>
      <span class="lg"><i class="sw-route"></i>推荐路线</span>
      <span class="lg"><i class="sw-start"></i>起点</span>
      <span class="lg"><i class="sw-end"></i>终点</span>
      <span class="lg-sep"></span>
      <span class="lg lg-muted">
        未标定位置：{{ unplaced.map((item) => item.building?.official_name).join('、') || '无' }}
      </span>
    </div>

    <p class="map-foot">
      <b>{{ MAP_META.disclaimer }}</b>
      ｜暖廊走向为示意，非真实路径；{{ skippedCorridors }} 条暖廊因端点未标定未绘制；
      道路与水系仅作方位提示。
    </p>
  </div>
</template>

<style scoped>
.map-wrapper {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.map-stage {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 220px;
  overflow: hidden;
  border-radius: 12px;
}

.map-svg {
  display: block;
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.map-svg.is-dragging {
  cursor: grabbing;
}

/* ---------- 底图 ---------- */
.canvas-bg {
  fill: #e9f1fb;
}

.campus-fill {
  fill: url(#campusWash);
}

.campus-boundary {
  fill: none;
  stroke: #c6dbf2;
  stroke-width: 2.4;
  stroke-dasharray: 12 9;
  pointer-events: none;
}

.deco-road {
  fill: none;
  stroke: #e2e9f3;
  stroke-width: 38;
  stroke-linecap: round;
}

.deco-water {
  fill: none;
  stroke: #c9e6f8;
  stroke-width: 30;
  stroke-linecap: round;
}

.deco-label {
  fill: #9fb0c6;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 3px;
}

.deco-label.water {
  fill: #7fb3d5;
}

/* ---------- 参照物 ---------- */
.context-box {
  fill: #eef3f9;
  stroke: #dbe4ef;
  stroke-width: 1.3;
}

.context-name {
  fill: #96a5ba;
  font-size: 12.5px;
  font-weight: 600;
  text-anchor: middle;
}

/* ---------- 暖廊 ---------- */
.corridor-casing {
  fill: none;
  stroke: #ffffff;
  stroke-width: 12;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.9;
  pointer-events: none;
}

.corridor {
  fill: none;
  stroke: #7aa8dd;
  stroke-width: 3.6;
  stroke-dasharray: 8 7;
  stroke-linecap: round;
  stroke-linejoin: round;
  cursor: pointer;
  transition: stroke 0.16s, stroke-width 0.16s, opacity 0.18s;
}

.corridor:hover {
  stroke: #2563eb;
  stroke-width: 4.8;
}

.corridor.is-route {
  stroke: #f97316;
  stroke-width: 7;
  stroke-dasharray: 13 8;
}

.corridor.is-dim {
  opacity: 0.24;
}

.corridor-no {
  fill: #5b7ba3;
  font-size: 13px;
  font-weight: 700;
  text-anchor: middle;
  paint-order: stroke;
  stroke: #fbfdff;
  stroke-width: 5px;
  stroke-linejoin: round;
}

.corridor-no.is-route {
  fill: #c2410c;
  stroke: #fff6ef;
}

/* ---------- 建筑 ---------- */
.building {
  cursor: pointer;
}

.footprint {
  fill: #ffffff;
  stroke: #a9c4e4;
  stroke-width: 2.2;
  filter: drop-shadow(0 2px 4px rgba(23, 58, 112, 0.12));
  transition: fill 0.16s, stroke 0.16s, filter 0.16s;
}

.building:hover .footprint {
  fill: #f2f8ff;
  stroke: #4b86d4;
  stroke-width: 3;
  filter: drop-shadow(0 5px 12px rgba(37, 99, 235, 0.24));
}

.building.is-route-building .footprint {
  fill: #eef6ff;
  stroke: #7aa8dd;
}

.building.is-selected .footprint {
  stroke: #1d4ed8;
  stroke-width: 3.4;
  filter: drop-shadow(0 6px 14px rgba(37, 99, 235, 0.3));
}

.building.is-start-building .footprint {
  stroke: #16a34a;
  stroke-width: 3.4;
  fill: #f2fdf6;
}

.building.is-end-building .footprint {
  stroke: #dc2626;
  stroke-width: 3.4;
  fill: #fef4f4;
}

.building.is-estimated .footprint {
  fill: #fbfcfe;
  stroke: #9fb4cd;
  stroke-dasharray: 7 6;
}

.building-name {
  fill: #16324f;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.3px;
  paint-order: stroke;
  stroke: #fbfdff;
  stroke-width: 4.5px;
  stroke-linejoin: round;
  user-select: none;
}

.building:hover .building-name {
  fill: #1d4ed8;
}

.building.is-estimated .building-name {
  fill: #6b7f99;
  font-size: 17px;
}

.estimark {
  fill: #b08a3a;
  font-size: 10.5px;
  font-weight: 600;
  text-anchor: middle;
  user-select: none;
}

/* ---------- 起终点徽标 ---------- */
.marker circle {
  fill: #16a34a;
  stroke: #ffffff;
  stroke-width: 3;
  filter: drop-shadow(0 4px 9px rgba(22, 163, 74, 0.4));
}

.marker.end circle {
  fill: #dc2626;
  filter: drop-shadow(0 4px 9px rgba(220, 38, 38, 0.4));
}

.marker text {
  fill: #ffffff;
  font-size: 14px;
  font-weight: 800;
  text-anchor: middle;
  user-select: none;
}

/* ---------- 缩放控制 ---------- */
.zoom-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #dbe7f8;
  border-radius: 10px;
  box-shadow: 0 6px 16px rgba(23, 58, 112, 0.1);
}

.zoom-controls button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 30px;
  height: 27px;
  font-size: 15px;
  font-weight: 700;
  color: #4a6b96;
  border-radius: 7px;
  transition: 0.16s;
}

.zoom-controls button:hover {
  color: var(--blue-700);
  background: #eef4ff;
}

.zoom-controls .zoom-fit {
  width: 30px;
  height: 30px;
  flex-direction: column;
  gap: 0;
  font-size: 9px;
  font-weight: 600;
  color: #5b7ba3;
}

.zoom-fit svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.zoom-controls .zoom-reset {
  width: 30px;
  height: 19px;
  font-size: 9.5px;
  font-weight: 600;
  color: #8ba0bb;
}

/* ---------- 图例（画布外） ---------- */
.map-legend-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  padding: 8px 12px 4px;
  font-size: 11.5px;
  color: #4a6b96;
}

.map-legend-bar .lg {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.map-legend-bar .lg-muted {
  color: #94a3b8;
}

.lg-sep {
  width: 1px;
  height: 12px;
  background: #dbe7f8;
}

.sw-building {
  width: 14px;
  height: 11px;
  background: #fff;
  border: 2.2px solid #a9c4e4;
  border-radius: 3px;
}

.sw-estimated {
  width: 14px;
  height: 11px;
  background: #fbfcfe;
  border: 2px dashed #9fb4cd;
  border-radius: 3px;
}

.sw-corridor {
  width: 16px;
  height: 0;
  border-top: 3.6px dashed #7aa8dd;
}

.sw-route {
  width: 16px;
  height: 0;
  border-top: 5px solid #f97316;
  border-radius: 3px;
}

.sw-start,
.sw-end {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 2px solid #fff;
}

.sw-start {
  background: #16a34a;
}

.sw-end {
  background: #dc2626;
}

/* ---------- 底部说明 ---------- */
.map-foot {
  flex: 0 0 auto;
  padding: 2px 12px 9px;
  font-size: 10.5px;
  line-height: 1.6;
  color: #94a3b8;
}

.map-foot b {
  color: #7c5a12;
}

@media (max-width: 1120px) {
  .map-svg {
    min-height: 360px;
  }
}
</style>
