import { WeightedRoundRobin } from '../src'

describe('WeightedRoundRobin', () => {
  const wrr = new WeightedRoundRobin({
    reverse: false,
    min: 6
  })

  test('Should add', () => {
    const key = '192.168.1.1'
    const value = {
      server: key,
      weight: Math.round(Math.random() * 100)
    }
    wrr.add(key, value)
    const getValue = wrr.get(key)
    expect(!!getValue).toBeTruthy
    expect(getValue.server).toBe(key)
    wrr.reset()
  })

  test('Should get roundRobin', () => {
    const string = 'ABCDEFGH'
    for (let i = 1; i <= 8; i++) {
      const key = `${i}`
      const value = {
        server: string[i - 1],
        weight: i * 10
      }
      wrr.add(key, value)
    }
    const roundRobin = wrr.getRoundRobin()
    expect(Array.isArray(roundRobin)).toBeTruthy
    expect(roundRobin.length > 0).toBeTruthy

    const roundRobinWithServer = wrr.getRoundRobin('server')
    expect(Array.isArray(roundRobinWithServer)).toBeTruthy
    expect(roundRobinWithServer.length > 0).toBeTruthy

    expect(roundRobin.length).toBe(roundRobinWithServer.length)

    wrr.reset()
  })

  test('Should get reverse roundRobin', () => {
    for (let i = 1; i <= 15; i++) {
      const key = `172.26.2.${i}`
      const value = {
        server: key,
        weight: i
      }
      wrr.add(key, value)
    }
    const roundRobin = wrr.getRoundRobin(null, { reverse: true })
    expect(Array.isArray(roundRobin)).toBeTruthy
    expect(roundRobin.length > 0).toBeTruthy

    const roundRobinWithServer = wrr.getRoundRobin('server', { reverse: true })
    expect(Array.isArray(roundRobinWithServer)).toBeTruthy
    expect(roundRobinWithServer.length > 0).toBeTruthy

    expect(roundRobin.length).toBe(roundRobinWithServer.length)

    wrr.reset()
  })
})
