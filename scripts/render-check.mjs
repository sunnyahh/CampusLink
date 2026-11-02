/**
 * 渲染自检（运行：npm run check:render）
 *
 * 用真实的 Vue 渲染器把三个视图各渲染一遍：
 *  - 模拟模式（确认没有被打扰）
 *  - 真实模式 · 示意地图（默认视图）
 *  - 真实模式 · 拓扑结构图（单独渲染，验证切换后仍然可用）
 */
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import App from '../src/App.vue'
import RealCampusView from '../src/components/RealCampusView.vue'
import RealTopology from '../src/components/real/RealTopology.vue'
import { BUILDINGS } from '../src/data/realCampus/buildings.js'
import { NODES } from '../src/data/realCampus/nodes.js'
import { CORRIDORS } from '../src/data/realCampus/corridors.js'

const appHtml = await renderToString(createSSRApp(App))
const realHtml = await renderToString(createSSRApp(RealCampusView))

// 从真实模式里抠出地图 SVG，统计建筑数量（防止"地图空了"没人发现）
const mapSvg = realHtml.match(/<svg[^>]*viewBox="0 0 1200 800"[\s\S]*?<\/svg>/)?.[0] ?? ''
const mapFootprints = (mapSvg.match(/class="footprint"/g) ?? []).length
const mapCorridors = (mapSvg.match(/<path[^>]*\bcorridor\b(?![-\w])/g) ?? []).length

const topologyHtml = await renderToString(
  createSSRApp({
    render: () =>
      h(RealTopology, {
        buildings: BUILDINGS,
        nodes: NODES,
        corridors: CORRIDORS
      })
  })
)

const checks = [
  ['模拟模式 · 渲染成功', appHtml.length > 5000, `${appHtml.length} 字节`],
  ['模拟模式 · 原地图保留', appHtml.includes('viewBox="0 0 1000 660"')],
  ['模拟模式 · 路线仍在', appHtml.includes('450')],
  ['模拟模式 · 三栏布局仍在', appHtml.includes('class="layout"')],

  ['真实模式 · 示意图画布', realHtml.includes('viewBox="0 0 1200 800"')],
  ['真实模式 · 地图建筑数量', mapFootprints >= 15, `footprint=${mapFootprints}`],
  ['真实模式 · 地图暖廊数量', mapCorridors >= 4, `corridor=${mapCorridors}`],
  ['真实模式 · 标定建筑', realHtml.includes('明德楼') && realHtml.includes('正心楼')],
  ['真实模式 · 非测绘精度标注', realHtml.includes('非测绘精度')],
  ['真实模式 · 未标定清单', realHtml.includes('未标定位置')],
  ['真实模式 · 暖廊示意线', realHtml.includes('4-1') && realHtml.includes('4-3')],
  ['真实模式 · 视图切换', realHtml.includes('示意地图') && realHtml.includes('拓扑结构')],
  ['真实模式 · 路线查询面板', realHtml.includes('暖廊路线查询')],
  ['真实模式 · 默认路径结果', realHtml.includes('2 号暖廊') && realHtml.includes('4 号暖廊')],
  ['真实模式 · 楼内换乘标注', realHtml.includes('建模假设')],
  ['真实模式 · 不显示距离', !realHtml.includes('预估')],

  ['拓扑视图 · 画布', topologyHtml.includes('viewBox="0 0 1100 470"')],
  ['拓扑视图 · 节点胶囊', topologyHtml.includes('东侧2层') && topologyHtml.includes('2.5层')],
  ['拓扑视图 · 楼内连接', topologyHtml.includes('X6')]
]

let failed = 0
for (const [name, ok, extra] of checks) {
  if (!ok) failed += 1
  console.log(`${ok ? '✓' : '✗'} ${name}${extra ? ` (${extra})` : ''}`)
}

console.log(
  `\n模拟模式 ${appHtml.length} 字节 · 真实模式(地图) ${realHtml.length} 字节 · 拓扑 ${topologyHtml.length} 字节`
)
console.log(failed === 0 ? '渲染检查全部通过' : `${failed} 项失败`)

process.exitCode = failed === 0 ? 0 : 1
