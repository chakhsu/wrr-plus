# Weighted Round Robin Plus (wrr-plus)

<p align="left">
  <a aria-label="NPM version" href="https://www.npmjs.com/package/wrr-plus">
    <img alt="" src="https://badgen.net/npm/v/wrr-plus">
  </a>
  <a aria-label="License" href="https://github.com/chakhsu/wrr-plus/blob/main/LICENSE">
    <img alt="" src="https://badgen.net/npm/license/wrr-plus">
  </a>
</p>

[English](./README.MD) | [中文](./README_CN.MD)

基于加权轮询 (Weighted Round Robin) 算法的负载均衡 Node.js 模块，仿照 Nginx WRR 算法实现。

### 原理介绍

有三个节点 {a, b, c} ，他们的权重分别是 {a=5, b=1, c=1} 。发送7次请求，a会被分配5次，b会被分配1次，c会被分配1次。

**Nginx 加权轮询算法:**

概念解释,每个节点有三个权重变量，分别是：
  1. weight: 约定权重，即在配置文件或初始化时约定好的每个节点的权重;
  2. effectiveWeight: 有效权重，初始化为 weight;
  3. currentWeight: 节点当前权重，初始化为 0。

算法逻辑:
  1. 轮询所有节点，计算当前状态下所有节点的 effectiveWeight 之和 totalWeight；
  2. currentWeight = currentWeight + effectiveWeight;  选出所有节点中 currentWeight 中最大的一个节点作为选中节点；
  3. 选中节点的 currentWeight = currentWeight - totalWeight。

### 模块说明

本模块可以提供两种可用于负载均衡的基于加权的轮询表，一种是正序的轮询表，意思是权重越大，分配次数越多，另外一种是逆序的轮询表，意思是权重越小，分配次数越多。

### 模块安装

```
npm install wrr-plus
// or
yarn add wrr-plus
// or
pnpm add wrr-plus
```

### 使用说明

Example:

```
const WeightedRoundRobin = require('wrr-plus')
const wrr = new WeightedRoundRobin({
  max: 200,
  min: 10
})

for(let i = 1; i <= 50; i++) {
  const key = `172.26.2.${i}`
  const value = {
    server: key,
    weight: parseInt(Math.random()*100) || 1 // add value 必须包含 weight，用于计算权重
  }
  wrr.add(key, value) // 添加 wrr kv 节点
}

wrr.getRoundRobin() // 获取正序的轮询表
wrr.getRoundRobin('server') // 获取正序的轮询表，并只返回 value 中 server 的值
wrr.getRoundRobin('server', { reverse: true }) // 获取逆序的轮询表，并只返回 value 中 server 的值
wrr.getRoundRobin('server', { reverse: true, max: 200, min: 50 }) // 获取逆序的轮询表，并只返回 value 中 server 的值，约束轮询表返回最大长度和最小长度
wrr.get('172.26.2.1') // 获取 wrr 某个 kv 节点
wrr.remove('172.26.2.2') // 移除 wrr 某个 kv 节点
wrr.size() // 获取 wrr kv 节点数量
wrr.reset() // 重新初始化 wrr, 所有之前 add 过的 kv 节点都无效
```

`getRoundRobin(item, options)` 中 `options` 更多参数说明:

```
{
  reverse: false, // 选择正逆序轮询表，true 为返回正序轮询表，false 为返回逆序轮询表，如果没传入则使用实例化时的配置
  max: 100, // 返回轮询表的最大长度，注意：当节点数大于该值时，则选取节点数作为返回的最大长度，如果没传入则使用实例化时的配置
  min: 20, // 返回轮询表的最小长度，如果没传入则使用实例化时的配置
}
```

`new WeightedRoundRobin(options)` 中 `options` 更多参数说明:

```
{
  reverse: false, // 选择正逆序轮询表，true 为返回正序轮询表，false 为返回逆序轮询表，默认为 false
  max: 100, // 返回轮询表的最大长度，注意：当节点数大于该值时，则选取节点数作为返回的最大长度
  min: 20, // 返回轮询表的最小长度
  // 过滤轮询表中某些异常的节点
  filter: {
    enable: false, 是否启用过滤异常节点，默认为 false
    number: 3, // 当节点数大于 3，可以触发过滤，默认为 3
    totalWeight: 100, // 当所有节点数总权重大于 100，可以触发过滤，默认为 100
    ratio: 0.6 // 当某个节点的权重占总权重的 0.6 时，过滤掉改节点，默认 0.6，取值范围在 0.1 ~ 1.0
  }
}
```

### 注意事项

1. `getRoundRobin()` 中的 `options` 的优先级高于 `new WeightedRoundRobin(options)` 中的 `options`
2. 当节点数大于轮询表默认最大返回长度时，会自动选择节点数的最大长度作为轮询表的最大返回长度。

### License

根据 MIT 许可证开源。
