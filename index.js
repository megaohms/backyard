/*
Tasks
1. Create a 3d gridded structure with three or more connected rooms. Pick an arbitrary point on the grid to act as an input (a) and another placed elsewhere that acts as an electronic device (b). Write an algorithm that finds the minimal path/s along the grid lines between the two points.
2. In some cases it is disadvantageous to pass electronic wiring from wall to floor, or wall to ceiling. Write a function that allows you to specify that the path can should only run through either one or two of the following: floor / ceiling / wall.
3. Most structures have openings on their surfaces that complicate the pathway electrical wiring needs to take. Add a feature that allows you to easily remove or reinstate grid lines.
4. Structures don’t always have the same combination of rooms. Ensure that it is easy to change the size and placement of rooms. Demonstrate that your functions respond dynamically to structure changes.
5. Add another electrical device to the structure (c). Generate the shortest path between all three points.
6. It costs 2x more to run electrical wiring through walls. Introduce the ability to parametrically change the cost of a 1ft increment based on its location in the wall, floor or ceiling. Show that the path adjusts dynamically to the change in input.


const singleCubeSurfaces = [
[ 0, 1, 0, 0 ],
[ 1, 1, 1, 1 ],
[ 0, 1, 0, 0 ],
]

const tenByTenSurface = [
[ 1,1,1,1,1,1,1,1,1,1 ],
[ 1,1,1,1,1,1,1,1,1,1 ],
[ 1,1,1,1,1,1,1,1,1,1 ],
[ 1,1,1,1,1,1,1,1,1,1 ],
[ 1,1,1,1,1,1,1,1,1,1 ],
[ 1,1,1,1,1,1,1,1,1,1 ],
[ 1,1,1,1,1,1,1,1,1,1 ],
[ 1,1,1,1,1,1,1,1,1,1 ],
[ 1,1,1,1,1,1,1,1,1,1 ],
[ 1,1,1,1,1,1,1,1,1,1 ],
]

*/

const PriorityQueue = require('fastpriorityqueue')

class Terminal {
  constructor(dataTable) {
    this.stream = process.stdout
    this.dataTable = dataTable

    // store each stringified row as array so we dont have to rerender every point
    this.stringifiedRows = this.dataTable.map(this.stringifyRow)
  }
  stringifyRow(row) {
    return row.join(' ') + '\n'
  }
  stringifyTable() {
    return this.stringifiedRows.join('')
  }
  render(location, symbol) {
    // mutate existing to save space
    if (location.length && symbol) {
      const currentRowIdx = location[1]
      const currentColumnIdx = location[0]
      this.dataTable[currentRowIdx][currentColumnIdx] = symbol
      this.stringifiedRows[currentRowIdx] = this.stringifyRow(this.dataTable[currentRowIdx])
    }
    this.stream.write(this.stringifyTable())
    this.stream.moveCursor(-this.dataTable[0].length, -this.dataTable.length)
  }
  end() {
    this.stream.moveCursor(-this.dataTable[0].length, this.dataTable.length)
  }
}

class RectangularGrid {
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

class GridWithWeights extends RectangularGrid {
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

class Node {
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

function distance(start,end) {
  // todo: update for wrapping surfaces
  const [ x1, y1, z1 ] = start
  const [ x2, y2, z2 ] = end
  let thirdDistance = 0
  if (z1 && z2) {
    thirdDistance = Math.pow(Math.abs(z1 - z2), 2)
  }
  return Math.sqrt(
    Math.pow(Math.abs(x1 - x2), 2) +
    Math.pow(Math.abs(y1 - y2), 2) +
    thirdDistance
  )
}

function findAStarPath(graph, start, end, printer) {
  const frontier = new PriorityQueue(function(nodeA, nodeB) {
    return nodeA.cost < nodeB.cost
  })
  // keyed by stringified location
  const cameFrom = {}
  const costSoFar = {}
  const endKey = makeKey(end)

  const startNode = new Node(start, 0)
  frontier.add(startNode)

  const startKey = makeKey(start)
  costSoFar[startKey] = 0
  cameFrom[startKey] = 0

  while (!frontier.isEmpty()) {
    // frontier.forEach(({ id, cost }) => console.log({ id, cost }))
    const current = frontier.poll()
    if (current.id === endKey) {
      break
    }

    graph.getNeighbors(current).forEach(neighbor => {
      const neighborId = makeKey(neighbor)
      const newCost = costSoFar[current.id] + graph.cost(current, neighbor)
      const neighborNeedsUpdate = newCost < costSoFar[neighborId]
      if (!costSoFar.hasOwnProperty(neighborId) || neighborNeedsUpdate) {
        costSoFar[neighborId] = newCost
        cameFrom[neighborId] = current.id
        printer.render(current, costSoFar[current.id])
        printer.render(neighbor, costSoFar[neighborId])
        if (neighborNeedsUpdate) {
          const found = frontier.removeOne(function(node){ return node.id === neighborId})
        }
        const priority = newCost + distance(neighbor, end)
        const neighborNode = new Node(neighbor, priority)
        frontier.add(neighborNode)
      }
    })
  }
  return { cameFrom, costSoFar }
}

function makeKey(point) {
  return `${point[0]},${point[1]},${point[2]}`
}

const generateIndexInBounds = max => Math.floor(Math.random()*max)
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
const { cameFrom, costSoFar } = findAStarPath(wall, start, end, printer)
printer.render(end, 'E')
printer.end()
console.log({ start, end, cost: costSoFar[makeKey(end)]})
//*/
