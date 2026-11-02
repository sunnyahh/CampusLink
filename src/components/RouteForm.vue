<script setup>
/**
 * 路线规划表单：起点 / 终点 / 路线偏好
 * 只负责"显示"和"把用户操作告诉父组件"，路线计算在 App.vue 里做。
 */
import { computed } from 'vue'
import { BUILDINGS } from '../data/buildings.js'
import { PREFERENCE_LIST } from '../utils/routePlanner.js'

const props = defineProps({
  startId: { type: String, default: '' },
  endId: { type: String, default: '' },
  preference: { type: String, default: 'warm' },
  picking: { type: String, default: '' }
})

const emit = defineEmits([
  'change-start',
  'change-end',
  'change-preference',
  'toggle-pick',
  'swap'
])

const activeHint = computed(
  () => PREFERENCE_LIST.find((p) => p.id === props.preference)?.hint ?? ''
)
</script>

<template>
  <section class="card">
    <div class="card-title">
      <h2>路线规划</h2>
      <span class="card-sub">选择起点与终点</span>
    </div>

    <!-- 起点 -->
    <div class="field">
      <label class="field-label">
        <span class="dot dot-start">起</span>起点
      </label>
      <div class="field-row">
        <div class="select-wrap">
          <select :value="startId" @change="emit('change-start', $event.target.value)">
            <option v-for="b in BUILDINGS" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
          <span class="chev"></span>
        </div>
        <button
          class="pick-btn"
          :class="{ on: picking === 'start' }"
          title="在地图上点选起点"
          @click="emit('toggle-pick', 'start')"
        >
          地图点选
        </button>
      </div>
    </div>

    <!-- 交换按钮 -->
    <button class="swap-btn" @click="emit('swap')">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4v13M7 17l-3-3M7 17l3-3M17 20V7M17 7l-3 3M17 7l3 3" />
      </svg>
      交换起点和终点
    </button>

    <!-- 终点 -->
    <div class="field">
      <label class="field-label">
        <span class="dot dot-end">终</span>终点
      </label>
      <div class="field-row">
        <div class="select-wrap">
          <select :value="endId" @change="emit('change-end', $event.target.value)">
            <option v-for="b in BUILDINGS" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
          <span class="chev"></span>
        </div>
        <button
          class="pick-btn"
          :class="{ on: picking === 'end' }"
          title="在地图上点选终点"
          @click="emit('toggle-pick', 'end')"
        >
          地图点选
        </button>
      </div>
    </div>

    <!-- 路线偏好 -->
    <div class="pref">
      <label class="field-label"><span class="dot dot-pref">⇢</span>路线偏好</label>
      <div class="seg">
        <button
          v-for="p in PREFERENCE_LIST"
          :key="p.id"
          class="seg-item"
          :class="{ on: p.id === preference }"
          @click="emit('change-preference', p.id)"
        >
          <b>{{ p.label }}</b>
          <small>{{ p.short }}</small>
        </button>
      </div>
      <p class="hint">{{ activeHint }}</p>
    </div>
  </section>
</template>

<style scoped>
.field + .field {
  margin-top: 4px;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

.dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  border-radius: 50%;
}

.dot-start {
  background: #1d4ed8;
}

.dot-end {
  background: #0ea5e9;
}

.dot-pref {
  background: #94a3b8;
}

.field-row {
  display: flex;
  gap: 8px;
}

.select-wrap {
  position: relative;
  flex: 1;
}

.select-wrap select {
  width: 100%;
  height: 38px;
  padding: 0 32px 0 12px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
  background: #f7faff;
  border: 1px solid #d8e5fb;
  border-radius: 10px;
  outline: none;
  appearance: none;
  cursor: pointer;
}

.select-wrap select:focus {
  border-color: #8ab4f8;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.chev {
  position: absolute;
  top: 50%;
  right: 13px;
  width: 7px;
  height: 7px;
  border-right: 2px solid #7f9dc0;
  border-bottom: 2px solid #7f9dc0;
  transform: translateY(-70%) rotate(45deg);
  pointer-events: none;
}

.pick-btn {
  flex: 0 0 auto;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 600;
  color: #4a6b96;
  background: #f4f8ff;
  border: 1px dashed #c6d8f2;
  border-radius: 10px;
  transition: 0.18s;
}

.pick-btn:hover {
  color: #1d4ed8;
  border-color: #8ab4f8;
  background: #eaf2ff;
}

.pick-btn.on {
  color: #fff;
  background: #1d4ed8;
  border-style: solid;
  border-color: #1d4ed8;
}

.swap-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 8px 0 8px 24px;
  padding: 4px 9px;
  font-size: 11.5px;
  color: var(--muted);
  border-radius: 8px;
  transition: 0.18s;
}

.swap-btn:hover {
  color: var(--blue-700);
  background: #f1f6ff;
}

.swap-btn svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.pref {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed var(--line);
}

.seg {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 4px;
  background: #f2f7ff;
  border: 1px solid #e2ecfa;
  border-radius: 12px;
}

.seg-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 7px 4px;
  border-radius: 9px;
  transition: 0.18s;
}

.seg-item b {
  font-size: 12.5px;
  font-weight: 700;
  color: #587099;
}

.seg-item small {
  font-size: 10.5px;
  color: #93a6c2;
}

.seg-item:hover {
  background: #e7f0ff;
}

.seg-item.on {
  background: #fff;
  box-shadow: 0 3px 10px rgba(37, 99, 235, 0.16);
}

.seg-item.on b {
  color: var(--blue-700);
}

.seg-item.on small {
  color: #6f8ab4;
}

.hint {
  margin-top: 9px;
  padding: 8px 10px;
  font-size: 11.5px;
  line-height: 1.55;
  color: #4f6b93;
  background: #f4f9ff;
  border-left: 3px solid #a9c8f5;
  border-radius: 0 8px 8px 0;
}
</style>
