'use strict'

const GridWithWeights = require('./GridWIthWeights')

module.exports = class SearchSpace extends GridWithWeights{
  constructor(room, start) {
    console.log({ start })
    const surface = room.findSurfaceFromPoint(start)
    console.log({ surface })
    super(surface.width, surface.height)
    this.room = room
    this.start = start
    this.createDataTable(surface)
  }
  createDataTable(surface) {

  }
  getNeighbors3d(currentPoint) {
    console.log(this.room.findSurfaceFromPoint(currentPoint))
    //this.getNeighbors

  }
}
