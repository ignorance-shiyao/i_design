/**
 * 示例应用的共用层：确定性随机、可控时钟、共享实体、mock API、版本化存储。
 *
 * ERP 与 OA 共享人员、组织与审批，Agent 读同一批销售数据——
 * 共用层只有一份，各应用不许再造一套自己的「人」或自己的「订单」。
 */
export * from './rng'
export * from './clock'
export * from './entities'
export * from './api'
export * from './store'
