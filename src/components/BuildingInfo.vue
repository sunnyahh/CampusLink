<script setup>
/**
 * 建筑信息卡：点地图上的楼、或搜索列表里的楼，都会显示这里
 */
import { computed } from 'vue'
import { BUILDING_TYPES } from '../data/buildings.js'

const props = defineProps({
  building: { type: Object, default: null }
})

const emit = defineEmits(['set-start', 'set-end'])

const type = computed(() => (props.building ? BUILDING_TYPES[props.building.type] : null))
</script>

<template>
  <section v-if="building" class="card">
    <div class="head">
      <span
        class="glyph"
        :style="{
          color: '#fff',
          background: type?.color ?? '#2563eb',
          boxShadow: `0 6px 14px ${type?.color ?? '#2563eb'}44`
        }"
      >
        {{ building.name.slice(0, 1) }}
      </span>
      <div class="head-text">
        <h2>{{ building.name }}</h2>
        <p>{{ building.en }}</p>
      </div>
      <span
        class="chip"
        :style="{
          color: type?.color ?? '#2563eb',
          background: type?.soft ?? '#e9f0ff'
        }"
      >
        {{ type?.label ?? '建筑' }}
      </span>
    </div>

    <dl class="meta">
      <div>
        <dt>楼层</dt>
        <dd>{{ building.floors ? `${building.floors} 层` : '—' }}</dd>
      </div>
      <div>
        <dt>开放</dt>
        <dd>{{ building.hours }}</dd>
      </div>
      <div>
        <dt>规模</dt>
        <dd>{{ building.scale }}</dd>
      </div>
    </dl>

    <p class="desc">{{ building.desc }}</p>

    <div class="facilities">
      <span v-for="item in building.facilities" :key="item">{{ item }}</span>
    </div>

    <div class="actions">
      <button class="btn btn-primary" @click="emit('set-start', building.id)">设为起点</button>
      <button class="btn btn-ghost" @click="emit('set-end', building.id)">设为终点</button>
    </div>
  </section>

  <section v-else class="card placeholder">
    <div class="ph-icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20V8.6L12 4l8 4.6V20" />
        <path d="M9 20v-5.4h6V20" />
      </svg>
    </div>
    <p class="ph-title">建筑信息</p>
    <p class="ph-text">点击地图上的任意建筑，或在上方搜索框里查找，这里会显示它的详细信息。</p>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  gap: 11px;
}

.glyph {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  font-size: 19px;
  font-weight: 700;
  border-radius: 12px;
}

.head-text {
  flex: 1;
  min-width: 0;
}

.head-text h2 {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
}

.head-text p {
  margin-top: 1px;
  font-size: 10px;
  letter-spacing: 1px;
  color: #94a3b8;
}

.meta {
  display: grid;
  gap: 6px;
  margin: 14px 0 0;
  padding: 10px 12px;
  background: #f7faff;
  border: 1px solid #e6eefb;
  border-radius: 10px;
}

.meta div {
  display: flex;
  gap: 10px;
  font-size: 12px;
}

.meta dt {
  flex: 0 0 34px;
  color: #94a3b8;
}

.meta dd {
  margin: 0;
  color: var(--ink-2);
  font-weight: 500;
}

.desc {
  margin-top: 12px;
  font-size: 12.5px;
  line-height: 1.7;
  color: #4a5b73;
}

.facilities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 11px;
}

.facilities span {
  padding: 3px 9px;
  font-size: 11px;
  color: #4a6b96;
  background: #f1f6ff;
  border: 1px solid #e2ecfa;
  border-radius: 999px;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.actions .btn {
  flex: 1;
}

/* ---------- 未选中时的占位 ---------- */
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 26px 20px;
  text-align: center;
  border-style: dashed;
  background: rgba(255, 255, 255, 0.7);
}

.ph-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  margin-bottom: 10px;
  background: #eef4ff;
  border-radius: 14px;
}

.ph-icon svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: #7aa7e8;
  stroke-width: 1.7;
  stroke-linejoin: round;
}

.ph-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #4a6b96;
}

.ph-text {
  max-width: 240px;
  margin-top: 5px;
  font-size: 11.5px;
  line-height: 1.65;
  color: #94a3b8;
}
</style>
