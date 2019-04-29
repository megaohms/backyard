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
//
// const square = [
//   [ 0, 0 ],
//   [ 0, 0 ],
// ]
//
// const printer = new Terminal(square)
//
// printer.render([0,0], '.')
// printer.render([0,1], '.')
// printer.render([1,0], '.')
// printer.render([1,1], '.')
// printer.end()

class SquareGrid {
    constructor(width /* number */, height /* number */, holes=new Set()) {
        this.width = width
        this.height = height
        this.holes = holes
        this.table = this.createDataTable(width, height)
    }

    createDataTable(tableWidth, tableHeight) {
      const table = []
      for (let rowIdx = 0; rowIdx < tableHeight; rowIdx++) {
        const row = []
        for (let colIdx = 0; colIdx < tableWidth; colIdx++) {
          if (this.holes.has(makeKey(colIdx, rowIdx))) {
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

class GridWithWeights extends SquareGrid {
    constructor(width, height) {
        super(width, height)
        this.weights = {}
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
    this.id = `${x},${y}`
    this.x = x
    this.y = y
    this.location = location
    this.cost = cost
  }
  setCost(cost) {
    this.cost = cost
  }
}

class PriorityQueue {
  constructor() {
    this.heap = [null]
  }

  hasMore() {
    return this.heap.length > 1
  }

  reorderFromFront() {
    let currentIdx = 1
    let [left, right] = [2*currentIdx, 2*currentIdx + 1]
    let currentChildIdx = this.heap[right] && this.heap[right].cost <= this.heap[left].cost ? right : left
    while (this.heap[currentChildIdx] && this.heap[currentIdx].cost >= this.heap[currentChildIdx].cost) {
      let currentNode = this.heap[currentIdx]
      let currentChildNode = this.heap[currentChildIdx]
      this.heap[currentChildIdx] = currentNode
      this.heap[currentIdx] = currentChildNode
    }
    if (this.heap.length > 1) {
      console.log({ heapPriorities: this.heap.slice(1).map(({ cost, id }) => ({ cost, id })) })
    }
  }

  upsert(location, cost) {
    const nodeKey = makeKey(location)
    let idx = 1
    let node

    for (idx = 1; idx < this.heap.length; idx++) {
      if (this.heap[idx].id === nodeKey) {
        node = this.heap[idx]
        node.setCost(cost)
        console.log({ node })
        this.heap.splice(idx, 1)
        this.heap = [null, node, ...this.heap.slice(1)]
        this.reorderFromFront()
        return
      }
    }
    if (!node) {
      node = new Node(location, cost)
    }
    this.heap.push(node)
    let currentNodeIdx = this.heap.length - 1
    let currentNodeParentIdx = Math.floor(currentNodeIdx / 2)
    while (
      this.heap[currentNodeParentIdx] &&
      node.cost < this.heap[currentNodeParentIdx].cost
    ) {

      const parent = this.heap[currentNodeParentIdx]
      this.heap[currentNodeParentIdx] = node
      this.heap[currentNodeIdx] = parent
      currentNodeIdx = currentNodeParentIdx
      currentNodeParentIdx = Math.floor(currentNodeIdx / 2)
    }
    // if (this.heap.length > 1) {
    //   console.log({ heapPriorities: this.heap.slice(1).map(({ cost, id }) => ({ cost, id })) })
    // }
  }

  remove() {
    if (this.heap.length < 3) {
      const toReturn = this.heap.pop()
      this.heap[0] = null
      return toReturn
    }
    const toRemove = this.heap[1]
    this.heap[1] = this.heap.pop()
    this.reorderFromFront()
    return toRemove
  }
}

function distance(start,end) {
  const [ x1, y1 ] = start
  const [ x2, y2 ] = end
  return Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2))
}

function findAStarPath(graph, start, end, printer) {
  const frontier = new PriorityQueue()
  // keyed by stringified location
  const cameFrom = {}
  const costSoFar = {}
  const endKey = makeKey(end)

  frontier.upsert(start, 0)
  const startKey = makeKey(start)
  costSoFar[startKey] = 0
  cameFrom[startKey] = 0

  while (frontier.hasMore()) {
    const current = frontier.remove()
    if (current.id === endKey) {
      break
    }

    graph.getNeighbors(current).forEach(neighbor => {
      const additionalCost = graph.cost(current, neighbor)
      const newCost = costSoFar[current.id] + additionalCost
      const neighborId = makeKey(neighbor)
      if (!costSoFar.hasOwnProperty(neighborId) || (newCost < costSoFar[neighborId] && neighborId !== startKey)) {
        const priority = newCost + distance(neighbor, end)
        costSoFar[neighborId] = newCost
        cameFrom[neighborId] = current.id
        printer.render(neighbor, costSoFar[neighborId])
        frontier.upsert(neighbor, priority)
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

const wall = new GridWithWeights(10, 10)
const printer = new Terminal(wall.table)

printer.render(start, 'S')
printer.render(end, 'E')
const { cameFrom, costSoFar } = findAStarPath(wall, start, end, printer)
printer.render(start, 'S')
printer.render(end, 'E')
printer.end()
console.log({ start, end, cost: costSoFar[makeKey(end)]})
// console.log({ cameFrom })
