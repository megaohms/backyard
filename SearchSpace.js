'use strict'

const GridWithWeights = require('./GridWIthWeights')
const { makeKey } = require('./helpers')

module.exports = class SearchSpace extends GridWithWeights{
  constructor(room, start) {
    console.log({ start })
    const surface = room.findSurfaceFromPoint(start)
    console.log({ surface })
    super(surface.width, surface.height)
    this.room = room
    this.start = start
    // outerCoords are for reference when appending new tables
    this.outerCoords = {
      topLeft: 0,
      topRight: surface.width,
      bottomLeft: 0,
      bottomRight: surface.height,
    }
    this.createDataTableFrom3D(surface)
  }
  createDataTableFrom3D(surface) {
    // overwrites RectangularGrid's method to call Surface's transform function instead
    const relativeTable = surface.grid.table
    // true 'x' 'y' or 'z' will be different axis on 2d grid
    // we'll use these to key them to the transformations
    const xAxis = surface.dimensions.axis[1]
    const yAxis = surface.dimensions.axis[0]
    const pointReference = {
      'x': 0,
      'y': 0,
      'z': 0,
      // whichever one is not represented will have a position of 0
      [xAxis]: 'x',
      [yAxis]: 'y',
    }

    const table = []
    for (let rowIdx = 0; rowIdx < surface.height; rowIdx++) {
      const row = []
      for (let colIdx = 0; colIdx < surface.width; colIdx++) {
        const value = relativeTable[rowIdx][colIdx]
        row[surface.dimension.getRelativeX(0, 0, )] = value
      }
      row[surface.dimension.getRelativeY(0, 0, )] = row
    }
    this.table = table
  }

  getNeighbors3d(currentPoint) {
    console.log(this.room.findSurfaceFromPoint(currentPoint))
    //this.getNeighbors

  }
}
