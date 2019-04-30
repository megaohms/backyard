
const Terminal = require('./Terminal')

const Node = require('./Node')
const RectangularGrid = require('./RectangularGrid')
const GridWithWeights = require('./GridWithWeights')

const {
  findAStarPath,
  makeKey,
  generateIndexInBounds,
} = require('./helpers')

class SurfaceNode {
  constructor(type, dimensions, coordinates, neighbors={}) {
    this.type = type
    this.id = `${type}` // todo: add parentRoom name in id
    this.neighbors = neighbors
    const { width, height } = dimensions
    this.grid = new GridWithWeights(width, height)
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

class RoomNode {
  /*
       ___
   ___|_w_|___ ___
  |_w_|_f_|_w_|_c_|
      |_w_|
  */
  constructor(dimensions /* {x, y, x} in feet */){
    // todo: prefer ceil/floor, floor/wall, wall/ceil
    // todo: 2x wall cost
    // transform surfaces to be same orientatin
    this.dimensions = dimensions
    // topLeft of floor is x=0, y=0; z=0
    // bottomLeft of North wall is x=0; y=0; z=0

    // normalize transformations to the floor
    // North wall transformed becomes x=0, y=-z
    // x0 is search space's x; y0 is search space's y
    // x-relative = (x0, y0) => x0 + 0
    // y-relative = (x0, y0) => y0 - this.z
    //

    // all search space should be on relative x and y
    // all distances should be calculated on real coordinates
    // x0 and y0 are search SearchSpace (normalized to floor, or 0,0,0)
    // x, y, z are real coordinates

    // x0, y0 are connecting points where
    // new suface will be added to the search space
    this.wallNorth = new SurfaceNode('wall', {
        width: this.dimensions.x,
        height: this.dimensions.z,
        getRelativeX: function(x0, y0, x, y, z) {
          return x0 + x
        },
        getRelativeY: function(x0, y0, x, y, z) {
          return y0 - z
        },
      },
      { x: 0, xMax: this.dimensions.x, y: 0, yMax: 0, z: 0, zMax: this.dimensions.z }
    )
    this.wallEast = new SurfaceNode('wall', {
        width: this.dimensions.y,
        height: this.dimensions.z,
        getRelativeX: function(x0, y0, x, y, z) {
          return x0 + dimensions.y - y
        },
        getRelativeY: function(x0, y0, x, y, z) {
          return y0 + x
        },
      },
      { x: this.dimensions.x, xMax: this.dimensions.x, y: 0, yMax: this.dimensions.y, z: 0, zMax: this.dimensions.z }
    )
    this.wallSouth = new SurfaceNode('wall', {
        width: this.dimensions.x,
        height: this.dimensions.z,
        getRelativeX: function(x0, y0, x, y, z) {
          return x0 + x
        },
        getRelativeY: function(x0, y0, x, y, z) {
          return y0 + z
        },
      },
      { xMax: this.dimensions.x, x: 0, y: 0, yMax:this.dimensions.y, z: 0, zMax: this.dimensions.z }
    )
    this.wallWest = new SurfaceNode('wall', {
        width: this.dimensions.y,
        height: this.dimensions.z,
        getRelativeX: function(x0, y0, x, y, z) {
          return x0 - dimensions.z - z
        },
        getRelativeY: function(x0, y0, x, y, z) {
          return y0 + y
        },
      },
      { x: 0, xMax: 0, y: 0, yMax: this.dimensions.y, z: 0, zMax: this.dimensions.z }
    )
    this.ceil = new SurfaceNode('ceiling', {
        width: this.dimensions.x,
        height: this.dimensions.y,
        // flipping the ceiling upside-down
        getRelativeX: function(x0, y0, x, y, z) {
          return x0 + dimensions.x - x
        },
        getRelativeY: function(x0, y0, x, y, z) {
          return y0 + y
        },
      },
      { x: 0, xMax: this.dimensions.x, y: 0, yMax: this.dimensions.y, z: this.dimensions.z, zMax: this.dimensions.z }
    )
    this.floor = new SurfaceNode('floor', {
        parentDimensions: dimensions,
        width: this.dimensions.x,
        height: this.dimensions.y,
        getRelativeX: function(x0, y0, x, y, z) {
          return x0 + x
        },
        getRelativeY: function(x0, y0, x, y, z) {
          return y0 + y
        },
      },
      { x: 0, xMax: this.dimensions.x,  y: 0, yMax: this.dimensions.y, z: 0, zMax: 0 }
    )
    this.wallNorth.addNeighbors([
      { neighbor: this.wallEast, direction: 'left' },
      { neighbor: this.wallWest, direction: 'right' },
      { neighbor: this.floor, direction: 'bottom' },
      { neighbor: this.ceil, direction: 'top' },
    ])
    this.wallEast.addNeighbors([
      // this.wallNorth, this.wallSouth, this.floor, this.ceil
      { neighbor: this.wallNorth, direction: 'right' },
      { neighbor: this.wallSouth, direction: 'left' },
      { neighbor: this.floor, direction: 'bottom' },
      { neighbor: this.ceil, direction: 'top' },
    ])
    this.wallSouth.addNeighbors([
      // this.wallEast, this.wallWest, this.floor, this.ceil
      { neighbor: this.wallEast, direction: 'right' },
      { neighbor: this.wallWest, direction: 'left' },
      { neighbor: this.floor, direction: 'bottom' },
      { neighbor: this.ceil, direction: 'top' },
    ])
    this.wallWest.addNeighbors([
      // this.wallSouth, this.wallNorth, this.floor, this.ceil,
      { neighbor: this.wallSouth, direction: 'right' },
      { neighbor: this.wallNorth, direction: 'left' },
      { neighbor: this.floor, direction: 'bottom' },
      { neighbor: this.ceil, direction: 'top' },
    ])
    this.floor.addNeighbors([
      // this.wallNorth, this.wallSouth, this.wallEast, this.wallWest
      { neighbor: this.wallNorth, direction: 'top' },
      { neighbor: this.wallSouth, direction: 'bottom' },
      { neighbor: this.wallEast, direction: 'right' },
      { neighbor: this.wallWest, direction: 'left' },
    ])
    this.ceil.addNeighbors([
      // this.wallNorth, this.wallSouth, this.wallEast, this.wallWest,
      { neighbor: this.wallNorth, direction: 'top' },
      { neighbor: this.wallSouth, direction: 'bottom' },
      { neighbor: this.wallEast, direction: 'right' },
      { neighbor: this.wallWest, direction: 'left' },
    ])
    this.surfaces = [
      this.wallNorth, this.wallEast, this.wallSouth, this.wallWest, this.floor, this.ceil
    ]
    // draws table of room unfolded
    const noWalls = [{topLeft: [0,0]}, {topLeft:[0,2]},{topLeft: [0,1], bottomRight: [2,1]}, {topLeft: [3,1], bottomRight: [3,3]}]
    this.room2d = new GridWithWeights(4, 3, noWalls)
  }
  findSurfaceFromPoint(point) {
    const x = point[0]
    const y = point[1]
    const z = point[2]
    return this.surfaces.filter(surface => surface.isPointOnSurface(point))[0]
    // if (x === 0) {
    //   surfaces.delete(this.wallEast)
    // }
    // if (x === this.dimensions.x) {
    //   surfaces.delete(this.wallWest)
    // }
    // if (y === 0) {
    //   surfaces.delete(this.wallSouth)
    // }
    // if (y === this.dimensions.y) {
    //   surfaces.delete(this.wallNorth)
    // }
    // if (z === 0) {
    //   surfaces.delete(this.floor)
    // }
    // if (z === this.dimensions.z) {
    //   surfaces.delete(this.ceil)
    // }
    // if (x && y) {
    //   return this.floor
    // }
    // if (x && z) {
    //   return this.floor
    // }
  }
}

class SearchSpace extends GridWithWeights{
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


/*
Unfolded 3d space search

const x = 10
const y = 10
const z = 10
const dimensions = [x,y,z]

const start = [generateIndexInBounds(x), generateIndexInBounds(y), generateIndexInBounds(z)]
// one dimension must be 0 or 10
const xYorZ = Math.floor(Math.random()*3)
start[xYorZ] = Math.round(Math.random())*dimensions[xYorZ
]
const end = [generateIndexInBounds(x), generateIndexInBounds(y), generateIndexInBounds(z)]
// one dimension must be 0 or 10
end[Math.floor(Math.random()*3)] = 0

const room = new RoomNode({ x, y, z })
const searchSpace = new SearchSpace(room, start)
const printer = new Terminal(searchSpace.table)
*/

///*
//2D Search with weighted walls and dropped nodes

const x = 10
const y = 12
const start = [generateIndexInBounds(x), generateIndexInBounds(y)]
const end = [generateIndexInBounds(x), generateIndexInBounds(y)]

const window = { topLeft: [2,2], bottomRight: [5,4]}
const wall = new GridWithWeights(x, y, [window])
wall.createDataTable()
const printer = new Terminal(wall.table)
printer.render(start, 'S')
printer.render(end, 'E')
console.log({ start, end })
const { cameFrom, costSoFar } = findAStarPath(wall, start, end, Node, printer)
printer.render(end, 'E')
printer.end()
console.log({ start, end, cost: costSoFar[makeKey(end)]})
//*/
