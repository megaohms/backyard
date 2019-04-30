'use strict'
const { makeKey } = require('./helpers')

module.exports = class Node {
  constructor(location /* tuple */, cost /* number */) {
    const x = location[0]
    const y = location[1]
    const z = location[2]
    this.id = makeKey(location)
    this.x = x
    this.y = y
    this.z = z
    this.location = location
    this.cost = cost
  }
}
