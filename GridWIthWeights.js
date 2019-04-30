'use strict'

const RectangularGrid = require('./RectangularGrid')

module.exports = class GridWithWeights extends RectangularGrid {
    constructor(width, height, holes, weights={}) {
        super(width, height, holes)
        this.weights = weights
    }

    cost(fromNode, toNode) {
      if (this.weights.hasOwnProperty(`${toNode.id}`)) {
        return this.weights[`${toNode.id}`]
      }
      return 1
    }
}
