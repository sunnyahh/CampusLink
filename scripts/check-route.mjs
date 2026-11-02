/**
 * 算法自检脚本（在命令行运行 `npm run check`）
 *
 * 它的作用是：不打开浏览器，直接在终端里打印几条典型路线的计算结果，
 * 方便你确认"暖廊优先"确实比"最短距离"走了更多室内路段。
 *
 * 这个文件只是调试用的，不参与网页构建，删掉也不影响应用运行。
 */
import { planRoute, PREFERENCE_LIST } from '../src/utils/routePlanner.js'
import { BUILDINGS } from '../src/data/buildings.js'

const nameOf = (id) => BUILDINGS.find((b) => b.id === id)?.name ?? id

const CASES = [
  ['tla', 'dorm3'],
  ['center', 'lab'],
  ['north_gate', 'dorm2'],
  ['south_gate', 'center'],
  ['lab', 'canteen'],
  ['gym', 'tlb']
]

for (const [from, to] of CASES) {
  console.log(`\n=== ${nameOf(from)} → ${nameOf(to)} ===`)
  for (const preference of PREFERENCE_LIST) {
    const route = planRoute(from, to, preference.id)
    if (!route.ok) {
      console.log(`  ${preference.label.padEnd(4)}  失败: ${route.reason}`)
      continue
    }
    const t = route.totals
    console.log(
      `  ${preference.label.padEnd(4)} ${String(t.meters).padStart(4)}m  ` +
        `室内${String(t.indoorMeters).padStart(4)} 室外${String(t.outdoorMeters).padStart(4)}  ` +
        `占比${String(Math.round(t.indoorRatio * 100)).padStart(3)}%  ${t.minutes}min  ` +
        `路径: ${route.steps.map((s) => s.name).join(' | ')}`
    )
  }
}

console.log('\n=== 异常输入 ===')
console.log('同点:', planRoute('lib', 'lib').reason)
console.log('空值:', planRoute('', '').reason)
console.log('不存在:', planRoute('lib', 'nope').reason)
