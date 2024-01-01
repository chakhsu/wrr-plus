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

A Node.js module for load balancing based on the Weighted Round Robin (WRR) algorithm, implemented as a simulation of the Nginx WRR algorithm.

### Principle Overview

Consider three nodes {a, b, c} with respective weights {a=5, b=1, c=1}. If we send 7 requests, node a will be assigned 5 times, node b will be assigned once, and node c will also be assigned once.

**Nginx Weighted Round Robin Algorithm:**

Conceptual explanation, where each node has three weight variables:

1. `weight`: Defined weight, which is the weight assigned to each node in the configuration or initialization.
2. `effectiveWeight`: Effective weight, initially set to `weight`.
3. `currentWeight`: Current weight of the node, initially set to 0.

Algorithm logic:

1. Iterate through all nodes and calculate the sum of `effectiveWeight` for all nodes, which is `totalWeight`.
2. `currentWeight = currentWeight + effectiveWeight`. Select the node with the highest `currentWeight` as the chosen node.
3. `currentWeight` of the selected node is reduced by `totalWeight`.

### Module Description

This module provides two types of weighted round-robin tables for load balancing. One is a forward order table, where nodes with higher weights receive more assignments. The other is a reverse order table, where nodes with lower weights receive more assignments.

### Module Installation

```
npm install wrr-plus
// or
yarn add wrr-plus
// or
pnpm add wrr-plus
```

### Usage Instructions

Example:

```
const { WeightedRoundRobin } = require('wrr-plus')
const wrr = new WeightedRoundRobin({
  max: 200,
  min: 10
})

for(let i = 1; i <= 50; i++) {
  const key = `172.26.2.${i}`
  const value = {
    server: key,
    weight: parseInt(Math.random()*100) || 1 // add value must contain weight for weight calculation
  }
  wrr.add(key, value) // add wrr kv node
}

wrr.getRoundRobin() // get forward order round-robin table
wrr.getRoundRobin('server') // get forward order round-robin table and only return the value of 'server' from each entry
wrr.getRoundRobin('server', { reverse: true }) // get reverse order round-robin table and only return the value of 'server' from each entry
wrr.getRoundRobin('server', { reverse: true, max: 200, min: 50 }) // get reverse order round-robin table, limit the length, and only return the value of 'server' from each entry
wrr.get('172.26.2.1') // get a specific kv node from wrr
wrr.remove('172.26.2.2') // remove a specific kv node from wrr
wrr.size() // get the number of kv nodes in wrr
wrr.reset() // reinitialize wrr, invalidating all previously added kv nodes
```

Additional parameter explanations for `getRoundRobin(item, options)`:

```
{
  reverse: false, // Select between forward and reverse order round-robin tables. Set to true for forward order table and false for reverse order table. If not specified, the configuration from instantiation will be used.
  max: 100, // Maximum length of the round-robin table. If the number of nodes exceeds this value, the number of nodes will be used as the maximum length. If not specified, the configuration from instantiation will be used.
  min: 20, // Minimum length of the round-robin table. If not specified, the configuration from instantiation will be used.
}
```

Additional parameter explanations for `new WeightedRoundRobin(options)`:

```
{
  reverse: false, // Select between forward and reverse order round-robin tables. Set to true for forward order table and false for reverse order table. Default is false.
  max: 100, // Maximum length of the round-robin table. Note: If the number of nodes exceeds this value, the number of nodes will be used as the maximum length.
  min: 20, // Minimum length of the round-robin table.
  // Filter out exceptional nodes from the round-robin table
  filter: {
    enable: false, // Enable node filtering. Default is false.
    number: 3, // Trigger filtering if the number of nodes exceeds 3. Default is 3.
    totalWeight: 100, // Trigger filtering if the total weight of all nodes exceeds 100. Default is 100.
    ratio: 0.6 // Filter out a node if its weight accounts for 60% of the total weight. Default is 0.6, with a range of 0.1 to 1.0.
  }
}
```

### Notes

1. The `options` in `getRoundRobin()` takes priority over the `options` in `new WeightedRoundRobin()`.
2. If the number of nodes exceeds the default maximum length of the round-robin table, the number of nodes will be automatically selected as the maximum length.

### License

Open sourced under the MIT license.
