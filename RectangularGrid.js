'use strict'

const { makeKey } = require('./helpers')

module.exports = class RectangularGrid {
    constructor(width /* number */, height /* number */, holes=[] /*[{ topLeft, ?bottomRight }]*/) {
        this.width = width
        this.height = height
        this.holes = new Set()
        this.createOpenings(holes)
        // table is used for printer
        this.table = [] // works for 2d: this.createDataTable(width, height)
    }

    mapOverHoles(holes, callBack) {
      holes.forEach(function(hole) {
        const rowStart = hole.topLeft[1]
        const colStart = hole.topLeft[0]
        const rowEnd = hole.bottomRight ? hole.bottomRight[1] : rowStart + 1
        const colEnd = hole.bottomRight ? hole.bottomRight[0] : colStart + 1
        for (let row = rowStart; row <= rowEnd; row++) {
          for (let col = colStart; col <= colEnd; col++) {
            callBack(col, row)
          }
        }
      })
    }

    createOpenings(holes) {
      const holeSet = this.holes
      this.mapOverHoles(
        holes,
        function(x, y) { holeSet.add(makeKey([x, y])) }
      )
    }

    patchSurface(areas) {
      const holeSet = this.holes
      this.mapOverHoles(
        holes,
        function(x, y) { holeSet.delete(makeKey([x, y])) }
      )
    }

    createDataTable() {
      const table = []
      for (let rowIdx = 0; rowIdx < this.height; rowIdx++) {
        const row = []
        for (let colIdx = 0; colIdx < this.width; colIdx++) {
          if (this.holes.has(makeKey([colIdx, rowIdx]))) {
            row.push('#')
          }
          else {
            row.push('.')
          }
        }
        table.push(row)
      }
      this.table = table
    }

    isPointInBounds(point /* tuple */) {
        const x = point[0]
        const y = point[1]
        return 0 <= x && x < this.width && 0 <= y && y < this.height
    }

    isPointPassable(point /* tuple */) {
        return !this.holes.has(makeKey(point))
    }

    getNeighbors(node /* Node */) {
        const x = node.x
        const y = node.y
        const results = [[x+1, y], [x, y-1], [x-1, y], [x, y+1]]
        return results.filter(point => this.isPointInBounds(point))
                      .filter(point => this.isPointPassable(point))
    }
}
