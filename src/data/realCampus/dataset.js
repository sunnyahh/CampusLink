/**
 * ============================================================
 *  真实校园数据集 · 统一出口
 * ------------------------------------------------------------
 *  任何模块想用真实数据，从这里拿，不要直接 import 三个数组，
 *  因为这里会在加载时跑一次完整校验：
 *  数据一旦不合法，直接抛错，绝不让脏数据悄悄流进路线算法。
 *
 *  ⚠️ 当前尚未接入页面（routePlanner 仍用模拟数据）。
 * ============================================================
 */

import { BUILDINGS } from './buildings.js'
import { NODES } from './nodes.js'
import { CORRIDORS } from './corridors.js'
import { CANDIDATES } from './candidates.js'
import { validateDataset, DATA_VERSION, CAMPUS, DISCLAIMER } from './rules.js'

const report = validateDataset({ buildings: BUILDINGS, nodes: NODES, corridors: CORRIDORS })

if (!report.ok) {
  throw new Error(
    `真实校园数据校验失败（${report.errors.length} 个错误）：\n- ${report.errors.join('\n- ')}`
  )
}

export const REAL_CAMPUS = {
  version: DATA_VERSION,
  campus: CAMPUS,
  disclaimer: DISCLAIMER,
  buildings: BUILDINGS,
  nodes: NODES,
  corridors: CORRIDORS,
  candidates: CANDIDATES,
  stats: {
    ...report.stats,
    candidates: CANDIDATES.length
  },
  warnings: report.warnings
}

export default REAL_CAMPUS
