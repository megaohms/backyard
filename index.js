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
    else {
    }
    this.stream.write(this.stringifyTable())
    this.stream.moveCursor(-this.dataTable[0].length, -this.dataTable.length)
  }
  end() {
    this.stream.moveCursor(-this.dataTable[0].length, this.dataTable.length)
  }
}

class RectangularGrid {
    constructor(width /* number */, height /* number */, holes /*[{ topLeft, ?bottomRight }]*/) {
        this.width = width
        this.height = height
        this.holes = new Set()
        this.createOpenings(holes)
        // table is used for printer
        this.table = this.createDataTable(width, height)
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

    createDataTable(tableWidth, tableHeight) {
      const table = []
      for (let rowIdx = 0; rowIdx < tableHeight; rowIdx++) {
        const row = []
        for (let colIdx = 0; colIdx < tableWidth; colIdx++) {
          if (this.holes.has(makeKey([colIdx, rowIdx]))) {
            row.push('#')
          }
          else {
            row.push('.')
          }
        }
        table.push(row)
      }
      return table
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
  setCost(cost) {
    this.cost = cost
  }
}

class SurfaceNode {
  constructor(type, orientation='', neighbors=new Set()) {
    this.type = type
    // orientation is only for vertical surfaces: North, East, South, West
    this.orientation = orientation
    this.id = `${type}${orientation}` // todo: add parentRoom name in id
    this.neighbors = neighbors
  }
  addNeighbor(neighbor) {
    this.neighbors.add(neighbor.id)
  }
  addNeighbors(neighbors) {
    const thisNeighbors = this.neighbors
    neighbors.forEach(neighbor => {
      thisNeighbors.add(neighbor.id)
    })
  }
}

class RoomNode() {
  /*
       ___
   ___|_w_|___ ___
  |_w_|_f_|_w_|_c_|
      |_w_|
  */
  constructor(){
    // todo: prefer ceil/floor, floor/wall, wall/ceil
    // todo: 2x wall cost
    this.wallN = new SurfaceNode('wall', 'North')
    this.wallE = new SurfaceNode('wall', 'East')
    this.wallS = new SurfaceNode('wall', 'South')
    this.wallW = new SurfaceNode('wall', 'West')
    this.ceil = new SurfaceNode('ceiling')
    this.floor= new SurfaceNode('floor')
    this.wallN.addNeighbors([this.wallE, this.wallW, this.floor, this.ceil])
    this.wallE.addNeighbors([this.wallN, this.wallS, this.floor, this.ceil])
    this.wallS.addNeighbors([this.wallE, this.wallW, this.floor, this.ceil])
    this.wallW.addNeighbors([this.wallN, this.wallS, this.floor, this.ceil])
    this.floor.addNeighbors([this.wallN, this.wallE, this.wallS, this.wallW])
    const noWalls = [{topLeft: [0,0]}, {topLeft:[0,2]},{topLeft: [0,1], bottomRight: [2,1]}, {topLeft: [3,1], bottomRight: [3,3]}]
    this.room2d = GridWithWeights(4, 3, noWalls)
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
  return `${point[0]},${point[1]}`
}

const generateIndexInBounds = () => Math.floor(Math.random()*10)
const start = [generateIndexInBounds(), generateIndexInBounds()]
const end = [generateIndexInBounds(), generateIndexInBounds()]

// const wall = new GridWithWeights(10, 10, [{topLeft: [0,0], bottomRight: [1,2]}])
const room = createRoom()
const printer = new Terminal(room.table)

printer.render(start, 'S')
printer.render(end, 'E')
console.log({ start, end })
const { cameFrom, costSoFar } = findAStarPath(wall, start, end, printer)
printer.render(end, 'E')
printer.end()
console.log({ start, end, cost: costSoFar[makeKey(end)]})
