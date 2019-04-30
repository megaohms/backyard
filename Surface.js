'use strict'

const GridWithWeights = require('./GridWIthWeights')

module.exports = class Surface {
  constructor(type, dimensions, coordinates, neighbors={}) {
    this.type = type
    this.id = `${type}` // todo: add parentRoom name in id
    this.neighbors = neighbors
    const { width, height } = dimensions
    /* dimensions {
      height, width are for creating the relative grid
      getRelativeX, getRelativeY are transformation methods for projecting to search space
      axis ordered string tuple for normalizing the grid surface in 3d space
    }
    */
    this.dimensions = dimensions
    this.grid = new GridWithWeights(width, height)
    /* surfaceBoundCoords {
        x, xMax, y, yMax, z, zMax
        actual coordinates of wall corners
        reference for determining if a
        3d point is on a surface
    }
    */
    this.surfaceBoundCoords = coordinates
  }
  isPointOnSurface(point) {
    return point[0] >= this.surfaceBoundCoords.x &&
      point[0] <= this.surfaceBoundCoords.x + this.surfaceBoundCoords.xMax &&
      point[1] >= this.surfaceBoundCoords.y &&
      point[1] <= this.surfaceBoundCoords.y + this.surfaceBoundCoords.yMax &&
      point[2] >= this.surfaceBoundCoords.z &&
      point[2] <= this.surfaceBoundCoords.z + this.surfaceBoundCoords.zMax
  }
  addNeighbor(sharedEdge, neighbor) {
    // sharedEdge can be
    // 'top': y+, 'bottom': y-, 'left': x-, 'right': x+
    this.neighbors[sharedEdge] = neighbor.id
    this.neighbors[neighbor.id] = sharedEdge
  }
  addNeighbors(neighbors) {
    const thisNeighbors = this.neighbors
    neighbors.forEach(({ neighbor, direction }) => {
      thisNeighbors[neighbor.id] = direction
      thisNeighbors[direction] = neighbor.id
    })
  }
  getNeighborToThe(direction) {
    return this.neighbors[direction]
  }
}
