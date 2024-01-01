import assert from 'assert'
import { OptionsSchema, OptionsType, attempt } from './schema'
import { gcd, round } from 'mathjs'

export type Value = {
  weight: number
  [key: string]: any
}

export class WeightedRoundRobin {
  private _options: OptionsSchema
  private _totalWeight: number = 0
  private _weightArray: number[] = []
  private _peerMap: Map<string, Value> = new Map()
  private _gcd: number = 1

  constructor(options?: OptionsType) {
    this._options = attempt(options)
  }

  add(key: string, value: Value) {
    assert(value?.weight > 0, `value.weight ${value.weight} must be a required number and it must be larger than 0.`)

    value.currentWeight = value.weight
    value.effectiveWeight = value.weight
    this._weightArray.push(value.weight)
    this._totalWeight += value.weight
    this._peerMap.set(key, value)
    return true
  }

  reset() {
    this._totalWeight = 0
    this._weightArray = []
    this._peerMap = new Map()
    this._gcd = 1
  }

  get(key: string) {
    assert(this._peerMap.has(key), 'get false, because no such key in WeightedRoundRobin map')
    const value = this._peerMap.get(key)
    return this._get(value)
  }

  private _get(value?: Value) {
    const newValue = { ...value }
    delete newValue.currentWeight
    delete newValue.effectiveWeight
    return newValue
  }

  remove(key: string) {
    assert(this._peerMap.has(key), 'delete false, because no such key in WeightedRoundRobin map')
    this._peerMap.delete(key)
  }

  size() {
    return this._peerMap.size
  }

  getRoundRobin(field?: string | null, options?: OptionsType) {
    const { reverse, max, min, filter } = attempt(options)

    const roundRobin: Value[] = []

    const peerMapLength = this._peerMap.size
    if (peerMapLength === 0) {
      return roundRobin
    }

    if (peerMapLength === 1) {
      const value = this._get(this._peerMap.values().next().value)
      roundRobin.push(field ? value[field] : value)
      return roundRobin
    }

    this._filter(peerMapLength, filter)

    const peerMapCurrentLength = this._peerMap.size
    const newMax = peerMapCurrentLength > max ? peerMapCurrentLength : max

    const roundCount = this._getRoundCount(newMax, min)
    for (let i = 1; i <= roundCount; i++) {
      const best = reverse ? this._calculateReverse() : this._calculate()
      if (best) {
        const value = this._get(best)
        roundRobin.push(field ? value[field] : value)
      }
    }

    return roundRobin
  }

  private _filter(peerMapLength: number, filter: OptionsSchema['filter']) {
    const { enable, number, totalWeight, ratio } = Object.assign({}, this._options.filter, filter)

    if (!enable || peerMapLength <= number) {
      return
    }

    if (this._totalWeight > totalWeight) {
      let diff = 0
      this._weightArray = []

      this._peerMap.forEach((peer: Value, peerKey: string) => {
        const radix = peer.weight / this._totalWeight
        if (radix > ratio) {
          diff += peer.weight
          this.remove(peerKey)
        } else {
          this._weightArray.push(peer.weight)
        }
      })

      this._totalWeight -= diff
      this._gcd = gcd(...this._weightArray)
    }
  }

  private _getRoundCount(max: number, min: number) {
    const radix = round(this._totalWeight / this._gcd)
    if (radix >= max) {
      return max
    }
    if (min > radix) {
      return min
    }
    return radix
  }

  private _calculate() {
    let bestPeer: Value | undefined
    let totalEffectiveWeight = 0

    this._peerMap.forEach((peer) => {
      totalEffectiveWeight += peer.effectiveWeight
      peer.currentWeight += peer.effectiveWeight

      if (peer.effectiveWeight < peer.weight) {
        peer.effectiveWeight++
      }

      if (!bestPeer || bestPeer.currentWeight < peer.currentWeight) {
        bestPeer = peer
      }
    })

    if (bestPeer) {
      bestPeer.currentWeight -= totalEffectiveWeight
      return bestPeer
    }

    return false
  }

  private _calculateReverse() {
    let bestPeer: Value | undefined
    let totalEffectiveWeight = 0

    this._peerMap.forEach((peer) => {
      totalEffectiveWeight += peer.effectiveWeight
      peer.currentWeight += peer.effectiveWeight

      if (peer.effectiveWeight > peer.weight) {
        peer.effectiveWeight--
      }

      if (!bestPeer || bestPeer.currentWeight > peer.currentWeight) {
        bestPeer = peer
      }
    })

    if (bestPeer) {
      bestPeer.currentWeight += totalEffectiveWeight
      return bestPeer
    }

    return false
  }
}
