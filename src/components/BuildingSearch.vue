<script setup>
/**
 * 建筑搜索：支持中文名、英文名、拼音别名模糊匹配
 * 数据来自 buildings.js 里每栋楼的 aliases 字段
 */
import { computed, ref } from 'vue'
import { BUILDINGS, BUILDING_TYPES } from '../data/buildings.js'

const emit = defineEmits(['select'])

const query = ref('')

const QUICK = ['lib', 'dorm1', 'canteen', 'tla']
  .map((id) => BUILDINGS.find((b) => b.id === id))
  .filter(Boolean)

const results = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return []
  return BUILDINGS.filter((b) => {
    const haystack = [
      b.name,
      b.en,
      BUILDING_TYPES[b.type]?.label ?? '',
      ...(b.aliases ?? [])
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(keyword)
  }).slice(0, 6)
})

function colorOf(building) {
  return BUILDING_TYPES[building.type]?.color ?? '#2563eb'
}

function typeLabel(building) {
  return BUILDING_TYPES[building.type]?.label ?? '建筑'
}
</script>

<template>
  <section class="card">
    <div class="card-title">
      <h2>建筑搜索</h2>
      <span class="card-sub">{{ BUILDINGS.length }} 栋建筑</span>
    </div>

    <div class="search-box">
      <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16 16l4.2 4.2" />
      </svg>
      <input
        v-model="query"
        type="search"
        placeholder="搜索：图书馆 / 宿舍 / library"
        @keydown.esc="query = ''"
      />
      <button v-if="query" class="clear" title="清空" @click="query = ''">×</button>
    </div>

    <!-- 搜索结果 -->
    <ul v-if="query.trim()" class="results">
      <li v-for="b in results" :key="b.id">
        <button class="result" @click="emit('select', b.id)">
          <span class="type-dot" :style="{ background: colorOf(b) }"></span>
          <span class="r-main">
            <b>{{ b.name }}</b>
            <small>{{ b.en }}</small>
          </span>
          <span class="r-type">{{ typeLabel(b) }}</span>
        </button>
      </li>
      <li v-if="!results.length" class="empty">没有匹配的建筑，试试「图书馆」或「宿舍」</li>
    </ul>

    <!-- 未输入时：快捷入口 -->
    <div v-else class="quick">
      <span class="quick-label">快速查看</span>
      <button v-for="b in QUICK" :key="b.id" class="quick-chip" @click="emit('select', b.id)">
        {{ b.name }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box .ico {
  position: absolute;
  left: 11px;
  width: 15px;
  height: 15px;
  fill: none;
  stroke: #8aa3c4;
  stroke-width: 2;
  stroke-linecap: round;
}

.search-box input {
  width: 100%;
  height: 38px;
  padding: 0 32px 0 33px;
  font-size: 13px;
  background: #f7faff;
  border: 1px solid #d8e5fb;
  border-radius: 10px;
  outline: none;
  transition: 0.18s;
}

.search-box input::placeholder {
  color: #a3b4cd;
}

.search-box input:focus {
  border-color: #8ab4f8;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.search-box input::-webkit-search-cancel-button {
  display: none;
}

.clear {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 15px;
  line-height: 1;
  color: #8aa3c4;
  border-radius: 50%;
}

.clear:hover {
  color: #1d4ed8;
  background: #e8f0ff;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 218px;
  margin-top: 8px;
  overflow-y: auto;
}

.result {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 8px;
  text-align: left;
  border-radius: 9px;
  transition: 0.15s;
}

.result:hover {
  background: #f2f7ff;
}

.type-dot {
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.r-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.r-main b {
  font-size: 13px;
  font-weight: 600;
}

.r-main small {
  font-size: 10px;
  letter-spacing: 0.6px;
  color: #94a3b8;
}

.r-type {
  font-size: 10.5px;
  color: #7c8ba4;
  background: #f0f4fa;
  padding: 2px 7px;
  border-radius: 999px;
}

.empty {
  padding: 14px 6px;
  font-size: 12px;
  color: var(--muted);
  text-align: center;
}

.quick {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
}

.quick-label {
  font-size: 11.5px;
  color: #94a3b8;
}

.quick-chip {
  padding: 4px 9px;
  font-size: 11.5px;
  color: #4a6b96;
  background: #f4f8ff;
  border: 1px solid #e2ecfa;
  border-radius: 999px;
  transition: 0.15s;
}

.quick-chip:hover {
  color: #1d4ed8;
  background: #e9f1ff;
  border-color: #bdd6f8;
}
</style>
