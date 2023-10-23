const WeightedRoundRobin = require('../index.js')
const wrr = new WeightedRoundRobin({
  reverse: false,
  min: 6
})
const { expect } = require('chai')

describe('wrr: test', () => {
  it('wrr add', () => {
    const key = '192.168.1.1'
    const value = {
      server: key,
      weight: parseInt(Math.random() * 100)
    }
    wrr.add(key, value)
    const getValue = wrr.get(key)
    expect(getValue).to.be.an('object')
    expect(getValue.server).to.be.eq(key)
    wrr.reset()
  })

  it('wrr get roundRobin', () => {
    const string = 'ABCDEFGH'
    let a = 1
    for (let i = 0; i <= 4; i++) {
      const key = `${i}`
      if (i === 0) { a = 3 }
      if (i === 1) { a = 5 }
      if (i === 2) { a = 1 }
      if (i === 3) { a = 1 }
      if (i === 4) { a = 1 }
      const value = {
        queue: string[i],
        weight: a
      }
      wrr.add(key, value)
      console.log({ queue: value.queue, tasks: value.weight })
    }
    const roundRobin = wrr.getRoundRobin()
    const roundRobinWithServer = wrr.getRoundRobin('queue', { reverse: true })

    console.log(JSON.stringify(roundRobinWithServer))

    expect(roundRobin).to.be.an('array')
    expect(roundRobinWithServer).to.be.an('array')
    expect(roundRobin.length).to.be.eq(roundRobinWithServer.length)

    wrr.reset()
  })

  it('wrr get reverse roundRobin', () => {
    for (let i = 1; i <= 15; i++) {
      const key = `172.26.2.${i}`
      const value = {
        server: key,
        weight: i
      }
      wrr.add(key, value)
    }
    const roundRobin = wrr.getRoundRobin(null, { reverse: true })
    const roundRobinWithServer = wrr.getRoundRobin('server', { reverse: true })

    expect(roundRobin).to.be.an('array')
    expect(roundRobinWithServer).to.be.an('array')
    expect(roundRobin.length).to.be.eq(roundRobinWithServer.length)

    wrr.reset()
  })
})
