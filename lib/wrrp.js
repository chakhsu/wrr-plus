const { gcd, round } = require('mathjs')
const assert = require('assert')
const { isNumber } = require('lodash')
const Joi = require('joi')
const debug = require('debug')('wrr-plus')

class WeightedRoundRobin {
  constructor (options = {}) {
    this._options = this._getParams(options)
    this._totalWeight = 0
    this._weightArray = []
    this._peerMap = new Map()
    this._gcd = 1
  }

  _getParams (options) {
    const schema = Joi.object().keys({
      reverse: Joi.boolean().default(false),
      max: Joi.number().max(10000).min(20).default(100),
      min: Joi.number().max(20).min(1).default(20),
      filter: Joi.object().keys({
        enable: Joi.boolean().default(false),
        number: Joi.number().max(10000).min(1).default(3),
        totalWeight: Joi.number().max(10000).min(1).default(100),
        ratio: Joi.number().max(1).min(0).default(0.6)
      }).default()
    }).default()

    return Joi.attempt(options, schema)
  }

  add (key, value) {
    assert((key && value), 'add(key, value) key and value are required.')
    assert((isNumber(value.weight) && value.weight > 0), `value.weight ${value.weight} must be a required number and it must be larger than 0.`)

    value.currentWeight = value.weight
    value.effectiveWeight = value.weight
    this._weightArray.push(value.weight)
    this._totalWeight += value.weight
    this._peerMap.set(key, value)
    return true
  }

  reset () {
    this._totalWeight = 0
    this._weightArray = []
    this._peerMap = new Map() // 创建一个新的 Map 实例
    this._gcd = 1
  }

  get (key) {
    assert(key, 'get(key) key is required.')
    assert(this._peerMap.has(key), 'get false, because no such key in WeightedRoundRobin map')
    const value = this._peerMap.get(key)
    return this._get(value)
  }

  remove (key) {
    assert(key, 'remove(key) key is required.')
    assert(this._peerMap.has(key), 'delete false, because no such key in WeightedRoundRobin map')
    this._peerMap.delete(key)
  }

  size () {
    return this._peerMap.size
  }

  getRoundRobin (item, { reverse, max, min, filter } = this._options) {
    const roundRobin = []

    const peerMapLength = this._peerMap.size

    if (peerMapLength === 0) {
      return roundRobin
    }

    if (peerMapLength === 1) {
      const value = this._get(this._peerMap.get([...this._peerMap.keys()][0]))
      roundRobin.push(item ? value[item] : value)
      return roundRobin
    }

    this._filter(peerMapLength)

    const peerMapCurrentLength = this._peerMap.size
    max = (peerMapCurrentLength > max) ? peerMapCurrentLength : max

    const roundCount = this._getRoundCount(max, min)
    for (let i = 1; i <= roundCount; i++) {
      const best = reverse ? this._calculateReverse() : this._calculate()
      if (best) {
        const value = this._get(best)
        roundRobin.push(item ? value[item] : value)
      }
    }

    debug(`get roundRobin: ${roundRobin.length}, peerMapLength: ${peerMapLength}, totalWeight: ${this._totalWeight}, gcd: ${this._gcd}`)
    return roundRobin
  }

  _get (value) {
    const newValue = { ...value }
    delete newValue.currentWeight
    delete newValue.effectiveWeight
    return newValue
  }

  _filter (peerMapLength) {
    const { enable, number, totalWeight, ratio } = this._options.filter

    if (!enable || peerMapLength <= number) {
      return
    }

    if (this._totalWeight > totalWeight) {
      let diff = 0
      this._weightArray = []

      for (const [peerKey, peer] of this._peerMap) {
        const radix = peer.weight / this._totalWeight

        if (radix > ratio) {
          diff += peer.weight
          this.remove(peerKey)
        } else {
          this._weightArray.push(peer.weight)
        }
      }

      this._totalWeight -= diff
      this._gcd = gcd(...this._weightArray)
    }
  }

  _getRoundCount (max, min) {
    const radix = round(this._totalWeight / this._gcd)

    if (max > radix > min) {
      return radix
    } else if (radix >= max) {
      return max
    } else if (radix < min) {
      return min
    } else {
      return 100
    }
  }

  _calculate () {
    let bestPeer
    let totalEffectiveWeight = 0

    for (const [, peer] of this._peerMap) {
      totalEffectiveWeight += peer.effectiveWeight
      peer.currentWeight += peer.effectiveWeight

      if (peer.effectiveWeight < peer.weight) {
        peer.effectiveWeight++
      }

      if (!bestPeer || bestPeer.currentWeight < peer.currentWeight) {
        bestPeer = peer
      }
    }

    if (bestPeer) {
      bestPeer.currentWeight -= totalEffectiveWeight
      return bestPeer
    }

    return false
  }

  _calculateReverse () {
    let bestPeer
    let totalEffectiveWeight = 0

    for (const [, peer] of this._peerMap) {
      totalEffectiveWeight += peer.effectiveWeight
      peer.currentWeight += peer.effectiveWeight

      if (peer.effectiveWeight > peer.weight) {
        peer.effectiveWeight--
      }

      if (!bestPeer || bestPeer.currentWeight > peer.currentWeight) {
        bestPeer = peer
      }
    }

    if (bestPeer) {
      bestPeer.currentWeight += totalEffectiveWeight
      return bestPeer
    }

    return false
  }
}

module.exports = WeightedRoundRobin
module.exports.default = WeightedRoundRobin
