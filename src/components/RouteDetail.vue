<script setup>
/**
 * 路线详情：总距离、预计时间、室内占比、逐段路线
 * 数据全部来自 routePlanner.js 返回的结果对象
 */
import { computed } from 'vue'
import { BUILDING_MAP } from '../data/buildings.js'

const props = defineProps({
  route: { type: Object, required: true }
})

const indoorPercent = computed(() => {
  if (!props.route.ok) return 0
  return Math.round(props.route.totals.indoorRatio * 100)
})

const ringStyle = computed(() => ({
  background: `conic-gradient(#1d4ed8 ${indoorPercent.value}%, #e6eefb 0)`
}))

/** 途经建筑（按顺序去重） */
const passedBuildings = computed(() => {
  if (!props.route.ok) return []
  return props.route.buildingIds
    .map((id) => BUILDING_MAP.get(id))
    .filter(Boolean)
    .map((b) => b.name)
})

/** 每段路线的简短描述 */
function stepKind(step) {
  return step.type === 'indoor' ? '室内暖廊' : '室外路段'
}
</script>

<template>
  <section class="card detail">
    <div class="card-title">
      <h2>路线详情</h2>
      <span v-if="route.ok" class="card-sub">{{ route.steps.length }} 段路程</span>
    </div>

    <!-- 没有可用路线 -->
    <div v-if="!route.ok" class="empty">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
      </div>
      <p class="empty-title">{{ route.reason }}</p>
      <p class="empty-text">换一组起点和终点，或切换路线偏好试试。</p>
    </div>

    <template v-else>
      <!-- 汇总 -->
      <div class="summary">
        <div class="summary-top">
          <p class="distance">
            <span class="num">{{ route.totals.meters }}</span>
            <span class="unit">米</span>
          </p>
          <p class="time">约 <b>{{ route.totals.minutes }}</b> 分钟步行</p>
        </div>

        <div class="ratio">
          <div class="ring" :style="ringStyle">
            <span>{{ indoorPercent }}%</span>
          </div>
          <div class="ratio-text">
            <b>室内里程占比</b>
            <span>室内 {{ route.totals.indoorMeters }} m · 室外 {{ route.totals.outdoorMeters }} m</span>
          </div>
        </div>
      </div>

      <!-- 途经建筑 -->
      <div class="passed">
        <span class="passed-label">途经</span>
        <template v-for="(name, i) in passedBuildings" :key="name">
          <span class="passed-item">{{ name }}</span>
          <span v-if="i < passedBuildings.length - 1" class="passed-arrow">›</span>
        </template>
      </div>

      <!-- 分段步骤 -->
      <ol class="steps">
        <li v-for="(step, index) in route.steps" :key="`${step.id}-${index}`" class="step" :class="step.type">
          <span class="step-dot"></span>
          <div class="step-body">
            <div class="step-head">
              <span class="step-title">{{ step.fromName }} → {{ step.toName }}</span>
              <span class="chip" :class="step.type === 'indoor' ? 'chip-indoor' : 'chip-outdoor'">
                {{ stepKind(step) }}
              </span>
            </div>
            <p class="step-meta">
              <span>{{ step.name }}</span>
              <span class="sep">·</span>
              <span>{{ step.meters }} m</span>
            </p>
          </div>
        </li>
      </ol>

      <!-- 算法说明 -->
      <p class="algo-note">
        <span class="note-dot"></span>
        {{ route.preference.hint }}<br />
        本路线室外权重 ×{{ route.preference.outdoorWeight }}，由本地 Dijkstra 算法计算。
      </p>
    </template>
  </section>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 16px;
  text-align: center;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  margin-bottom: 12px;
  background: #fdf3e3;
  border-radius: 14px;
}

.empty-icon svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: #d9a13a;
  stroke-width: 1.8;
  stroke-linecap: round;
}

.empty-title {
  font-size: 13.5px;
  font-weight: 600;
  color: #5b6b82;
}

.empty-text {
  margin-top: 5px;
  font-size: 11.5px;
  color: #94a3b8;
}

/* ---------- 汇总 ---------- */
.summary {
  padding: 14px;
  background: linear-gradient(135deg, #f3f8ff, #eaf3ff);
  border: 1px solid #dfeafd;
  border-radius: 13px;
}

.summary-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.distance {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.num {
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  color: #12386f;
}

.unit {
  font-size: 13px;
  font-weight: 600;
  color: #5c7492;
}

.time {
  font-size: 12px;
  color: #5c7492;
}

.time b {
  font-size: 15px;
  color: var(--blue-700);
}

.ratio {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed #d3e2f8;
}

.ring {
  position: relative;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
}

.ring::before {
  content: '';
  position: absolute;
  inset: 6px;
  background: #fff;
  border-radius: 50%;
}

.ring span {
  position: relative;
  z-index: 1;
  font-size: 12px;
  font-weight: 800;
  color: var(--blue-700);
}

.ratio-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ratio-text b {
  font-size: 12px;
  font-weight: 700;
  color: #2c4569;
}

.ratio-text span {
  font-size: 11px;
  color: #7b8ca6;
}

/* ---------- 途经建筑 ---------- */
.passed {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  margin-top: 12px;
  padding: 9px 11px;
  background: #f9fbff;
  border: 1px solid #eaf1fc;
  border-radius: 10px;
}

.passed-label {
  margin-right: 2px;
  font-size: 11px;
  color: #94a3b8;
}

.passed-item {
  font-size: 11.5px;
  font-weight: 600;
  color: #3d5a80;
}

.passed-arrow {
  font-size: 11px;
  color: #b9c8dc;
}

/* ---------- 分段步骤 ---------- */
.steps {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 9px;
  min-height: 40px;
  margin-top: 14px;
  overflow-y: auto;
}

.step {
  position: relative;
  display: flex;
  gap: 11px;
  padding-left: 4px;
}

.step:not(:last-child)::before {
  content: '';
  position: absolute;
  top: 15px;
  bottom: -9px;
  left: 8px;
  width: 2px;
  background: #e7effb;
}

.step-dot {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  margin-top: 4px;
  background: var(--blue-700);
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 2px #cfe0fa;
}

.step.outdoor .step-dot {
  background: #f59e0b;
  box-shadow: 0 0 0 2px #fbe3bc;
}

.step-body {
  flex: 1;
  min-width: 0;
  padding-bottom: 2px;
}

.step-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.step-title {
  overflow: hidden;
  font-size: 12.5px;
  font-weight: 600;
  color: #22344d;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-meta {
  display: flex;
  gap: 5px;
  margin-top: 2px;
  font-size: 11px;
  color: #8ea0b8;
}

.sep {
  color: #cbd6e4;
}

/* ---------- 算法说明 ---------- */
.algo-note {
  margin-top: 14px;
  padding: 10px 12px;
  font-size: 11px;
  line-height: 1.6;
  color: #6b7f99;
  background: #f7faff;
  border: 1px dashed #dbe7f8;
  border-radius: 10px;
}

.note-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 6px;
  vertical-align: middle;
  background: #9dc0ee;
  border-radius: 50%;
}
</style>
