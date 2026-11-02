<script setup>
/**
 * 真实校园 · 暖廊路线查询（建筑到建筑）
 * ------------------------------------------------------------
 * 学生只需要选「起点建筑 / 终点建筑」，不用管楼层。
 * 楼层只在路线详情里作为提示出现。
 *
 * 计算用 0-1 BFS：
 *   官方暖廊段 = 1 段，楼内换乘 = 0 段（课程建模假设）。
 * 所以"段数"指的是**官方暖廊段数**，楼内换乘单独统计。
 */
import { computed } from 'vue'

const props = defineProps({
  buildings: { type: Array, required: true },
  nodes: { type: Array, required: true },
  startBuildingId: { type: String, default: '' },
  endBuildingId: { type: String, default: '' },
  route: { type: Object, required: true }
})

const emit = defineEmits(['change-start', 'change-end', 'swap'])

const nodeById = computed(() => new Map(props.nodes.map((n) => [n.node_id, n])))
const buildingById = computed(
  () => new Map(props.buildings.map((b) => [b.building_id, b]))
)

/** 只有录入了楼层节点的建筑才能查询 */
const selectableBuildings = computed(() =>
  props.buildings.filter((b) => props.nodes.some((n) => n.building_id === b.building_id))
)

/** 途经建筑（按顺序） */
const passedBuildings = computed(() => {
  if (!props.route.ok) return []
  return props.route.buildingIds.map(
    (id) => buildingById.value.get(id)?.official_name ?? id
  )
})

/** 把每一步翻译成人话 */
const stepViews = computed(() => {
  if (!props.route.ok) return []
  return props.route.steps.map((step, index) => {
    const from = nodeById.value.get(step.fromNodeId)
    const to = nodeById.value.get(step.toNodeId)

    if (step.kind === 'corridor') {
      return {
        key: `corridor-${index}`,
        kind: 'corridor',
        index: index + 1,
        title: `${from?.display_name ?? step.fromNodeId} → ${to?.display_name ?? step.toNodeId}`,
        badge: `${step.corridor.official_no} 号暖廊`,
        floor: step.corridor.floors ?? '楼层未标注',
        tag: '官方暖廊'
      }
    }

    return {
      key: `transfer-${index}`,
      kind: 'transfer',
      index: index + 1,
      title: `${from?.display_name ?? step.fromNodeId} → ${to?.display_name ?? step.toNodeId}`,
      badge: '楼内换乘',
      floor: `${from?.floor ?? '?'} → ${to?.floor ?? '?'}`,
      tag: '建模假设'
    }
  })
})

const failTitle = computed(() => {
  if (props.route.reason === 'same_building') return '起点和终点是同一栋建筑'
  return '当前数据尚未覆盖完整路线'
})
</script>

<template>
  <section class="card route-card">
    <div class="card-title">
      <h2>暖廊路线查询</h2>
      <span class="card-sub">选建筑即可 · BFS</span>
    </div>

    <label class="field">
      <span class="label"><i class="dot start"></i>起点建筑</span>
      <select
        :value="startBuildingId"
        @change="emit('change-start', $event.target.value)"
      >
        <option v-for="b in selectableBuildings" :key="b.building_id" :value="b.building_id">
          {{ b.official_name }}
        </option>
      </select>
    </label>

    <button class="swap" @click="emit('swap')">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4v13M7 17l-3-3M7 17l3-3M17 20V7M17 7l-3 3M17 7l3 3" />
      </svg>
      交换起点和终点
    </button>

    <label class="field">
      <span class="label"><i class="dot end"></i>终点建筑</span>
      <select :value="endBuildingId" @change="emit('change-end', $event.target.value)">
        <option v-for="b in selectableBuildings" :key="b.building_id" :value="b.building_id">
          {{ b.official_name }}
        </option>
      </select>
    </label>

    <!-- 成功 -->
    <div v-if="route.ok" class="result ok">
      <p class="result-head">
        <span class="mark"></span>
        找到暖廊路线 · <b>{{ route.segments }}</b> 段官方暖廊<template
          v-if="route.transferCount > 0"
        >，另有 <b>{{ route.transferCount }}</b> 次楼内换乘</template>
      </p>

      <div class="building-chain">
        <template v-for="(name, i) in passedBuildings" :key="name">
          <span class="bname">{{ name }}</span>
          <span v-if="i < passedBuildings.length - 1" class="arrow">→</span>
        </template>
      </div>

      <ol class="steps">
        <li v-for="step in stepViews" :key="step.key" class="step" :class="step.kind">
          <span class="step-index">{{ step.index }}</span>
          <div class="step-body">
            <p class="step-title">{{ step.title }}</p>
            <p class="step-meta">
              <span class="badge" :class="step.kind">{{ step.badge }}</span>
              <span class="floor">{{ step.floor }}</span>
              <span class="tag" :class="step.kind">{{ step.tag }}</span>
            </p>
          </div>
        </li>
      </ol>

      <p v-if="route.transferCount > 0" class="assume">
        楼内换乘按课程建模假设处理：同一栋建筑里已录入的楼层节点视为可以互相到达，
        <b>不是官方确认的连接</b>，也没有核实楼梯/电梯位置。
      </p>
    </div>

    <!-- 失败 -->
    <div v-else class="result fail">
      <p class="result-head">
        <span class="mark"></span>
        {{ failTitle }}
      </p>
      <p v-if="route.reason === 'unreachable'" class="note">
        已录入的暖廊里没有把它们串起来，<b>不代表现实校园无法通行</b>，
        只是这部分数据还没采集到。
      </p>
      <p v-if="route.reason === 'same_building'" class="note">
        同一栋建筑内部不需要走暖廊，直接走楼内通道即可。
      </p>
    </div>

    <p class="caveat">
      只沿已录入的官方暖廊规划；未计算距离与步行时间（距离未实测），
      通行状态为课程项目假设。起点/终点建筑内会自动选择最合适的已录入节点上下暖廊。
    </p>
  </section>
</template>

<style scoped>
.route-card {
  flex: 0 0 auto;
}

.field {
  display: block;
}

.label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--muted);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.start {
  background: #16a34a;
}

.dot.end {
  background: #dc2626;
}

select {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  background: #f7faff;
  border: 1px solid #d8e5fb;
  border-radius: 10px;
  outline: none;
  cursor: pointer;
}

select:focus {
  border-color: #8ab4f8;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.swap {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 7px 0 7px 4px;
  padding: 3px 8px;
  font-size: 11px;
  color: var(--muted);
  border-radius: 7px;
  transition: 0.18s;
}

.swap:hover {
  color: var(--blue-700);
  background: #f1f6ff;
}

.swap svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ---------- 结果 ---------- */
.result {
  margin-top: 12px;
  padding: 11px 12px;
  border-radius: 11px;
}

.result.ok {
  background: #f2fbf5;
  border: 1px solid #c8ecd3;
}

.result.fail {
  background: #fff9ea;
  border: 1px solid #f0dcab;
}

.result-head {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  font-weight: 700;
  color: #1f6b3a;
  line-height: 1.5;
}

.result.fail .result-head {
  color: #8a6a1f;
}

.result-head b {
  color: #15803d;
}

.mark {
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #16a34a;
}

.result.fail .mark {
  background: #e0a92e;
}

.building-chain {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  margin-top: 9px;
  padding: 8px 10px;
  background: #fff;
  border: 1px solid #d9eedf;
  border-radius: 9px;
}

.bname {
  font-size: 12px;
  font-weight: 700;
  color: #1f6b3a;
}

.arrow {
  font-size: 11px;
  color: #9ec9ac;
}

/* ---------- 分段 ---------- */
.steps {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 10px;
}

.step {
  display: flex;
  gap: 9px;
  padding: 7px 9px;
  background: #fff;
  border: 1px solid #e4f0e8;
  border-radius: 9px;
}

.step.transfer {
  background: #fdf8ff;
  border-color: #eadcf8;
}

.step-index {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-size: 10.5px;
  font-weight: 700;
  color: #fff;
  background: #16a34a;
  border-radius: 50%;
}

.step.transfer .step-index {
  background: #a855f7;
}

.step-body {
  flex: 1;
  min-width: 0;
}

.step-title {
  font-size: 11.5px;
  font-weight: 600;
  color: #24513a;
  line-height: 1.5;
  word-break: break-all;
}

.step.transfer .step-title {
  color: #6b3fa0;
}

.step-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.badge {
  padding: 1px 8px;
  font-size: 10.5px;
  font-weight: 700;
  color: #c2410c;
  background: #fff1e6;
  border: 1px solid #fbd0ae;
  border-radius: 999px;
}

.badge.transfer {
  color: #7e3ff2;
  background: #f4ecff;
  border-color: #ddc7fa;
}

.floor {
  font-size: 10.5px;
  color: #94a3b8;
}

.tag {
  padding: 1px 7px;
  font-size: 10px;
  font-weight: 600;
  color: #15803d;
  background: #eafaf0;
  border-radius: 999px;
}

.tag.transfer {
  color: #7e3ff2;
  background: #f3e9ff;
}

.assume {
  margin-top: 9px;
  padding: 8px 10px;
  font-size: 10.5px;
  line-height: 1.6;
  color: #6b4f9c;
  background: #fbf7ff;
  border: 1px dashed #e0cffa;
  border-radius: 8px;
}

.note {
  margin-top: 7px;
  font-size: 11.5px;
  line-height: 1.6;
  color: #8a6a1f;
}

.caveat {
  margin-top: 10px;
  font-size: 10.5px;
  line-height: 1.6;
  color: #94a3b8;
}
</style>
