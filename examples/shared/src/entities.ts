/**
 * ERP 与 OA 共用的实体。
 *
 * 这两个应用共享人员、组织、审批与附件——共享到这个程度，它们更像
 * 「一个应用的两个模块」。所以实体只定义一份，谁都不许再造一套自己的「人」。
 *
 * 所有数据由 seed 决定：同一个 seed 生成同一批人、同一批订单，
 * 截图与快照才不会每跑一次漂一点。名字、公司都是虚构的。
 */
import { createRng, seedFrom } from './rng'
import { DAY, DEMO_NOW, HOUR } from './clock'

export interface Person {
  id: string
  name: string
  title: string
  departmentId: string
  /** 直属上级，审批链按它往上走 */
  managerId?: string
}

export interface Department {
  id: string
  name: string
  parentId?: string
}

export type OrderStatus = 'draft' | 'submitted' | 'approving' | 'approved' | 'rejected' | 'shipped' | 'closed' | 'cancelled'

export interface OrderLine {
  sku: string
  name: string
  quantity: number
  /** 单价（分）。用整数存钱：浮点相加会在第三张单据上凑出 0.01 的差 */
  unitPrice: number
}

export interface Order {
  id: string
  customer: string
  ownerId: string
  status: OrderStatus
  lines: OrderLine[]
  createdAt: number
  updatedAt: number
  /** 乐观锁：详情页停留期间别人改过，提交要报 409 而不是覆盖 */
  revision: number
}

const FAMILY = ['林', '陈', '苏', '周', '何', '徐', '罗', '沈', '曾', '许']
const GIVEN = ['岚', '序', '禾', '迟', '樾', '汀', '珩', '棠', '野', '澜']
const TITLES = ['销售经理', '采购专员', '仓储主管', '财务复核', '区域总监', '项目经理']
const DEPARTMENTS: Department[] = [
  { id: 'd-root', name: '青禾科技' },
  { id: 'd-sales', name: '销售部', parentId: 'd-root' },
  { id: 'd-supply', name: '供应链部', parentId: 'd-root' },
  { id: 'd-finance', name: '财务部', parentId: 'd-root' },
  { id: 'd-rd', name: '研发部', parentId: 'd-root' }
]

const SKUS = [
  { sku: 'HX-1001', name: '工业网关 A1', price: 128_00 },
  { sku: 'HX-1002', name: '工业网关 A2 Pro', price: 268_00 },
  { sku: 'HX-2010', name: '温湿度传感器', price: 39_00 },
  { sku: 'HX-2011', name: '振动传感器', price: 76_00 },
  { sku: 'HX-3300', name: '边缘计算盒', price: 1_980_00 },
  { sku: 'HX-4100', name: '现场总线模块', price: 342_00 }
]

const CUSTOMERS = ['明远制造', '合力重工', '南屿食品', '锦叶新材', '恒川物流', '云栖能源']

export const departments = (): Department[] => DEPARTMENTS.map((d) => ({ ...d }))

export function people(seed: number, count = 12): Person[] {
  const rng = createRng(seed)
  const staffDepartments = DEPARTMENTS.filter((d) => d.parentId)
  const list: Person[] = []
  for (let i = 0; i < count; i += 1) {
    const department = staffDepartments[i % staffDepartments.length]
    list.push({
      id: `p-${String(i + 1).padStart(3, '0')}`,
      name: `${rng.pick(FAMILY)}${rng.pick(GIVEN)}`,
      title: rng.pick(TITLES),
      departmentId: department.id,
      // 前四个人是各部门负责人，其余挂在本部门负责人下面
      managerId: i < staffDepartments.length ? undefined : `p-${String((i % staffDepartments.length) + 1).padStart(3, '0')}`
    })
  }
  return list
}

/** 单据编号由序号决定，不由随机数决定——编号跳号会让人以为丢了单 */
export const orderId = (index: number) => `SO-2026-${String(index + 1).padStart(4, '0')}`

/**
 * 一张订单。内容只由单号派生：要哪一条算哪一条，不必把整棵树生成出来存着，
 * 而且每次算出来都一样。
 */
export function order(index: number, owners: Person[], now = DEMO_NOW): Order {
  const id = orderId(index)
  const rng = createRng(seedFrom(id))
  const lineCount = rng.int(1, 4)
  const lines: OrderLine[] = []
  for (let i = 0; i < lineCount; i += 1) {
    const item = rng.pick(SKUS)
    lines.push({ sku: item.sku, name: item.name, quantity: rng.int(1, 30), unitPrice: item.price })
  }
  const statuses: OrderStatus[] = ['draft', 'submitted', 'approving', 'approved', 'shipped', 'closed', 'rejected', 'cancelled']
  const createdAt = now - rng.int(1, 45) * DAY - rng.int(0, 23) * HOUR
  return {
    id,
    customer: rng.pick(CUSTOMERS),
    ownerId: rng.pick(owners).id,
    status: rng.pick(statuses),
    lines,
    createdAt,
    updatedAt: createdAt + rng.int(0, 72) * HOUR,
    revision: 1
  }
}

export function orders(count: number, owners: Person[], now = DEMO_NOW): Order[] {
  return Array.from({ length: count }, (_, i) => order(i, owners, now))
}

/** 订单金额（分）。金额永远从明细算，不单独存——存了就会和明细对不上 */
export const orderAmount = (value: Order): number =>
  value.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
