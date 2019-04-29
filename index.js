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
      const currentRowIdx = location[0]
      const currentColumnIdx = location[1]
      this.dataTable[currentRowIdx][currentColumnIdx] = symbol
      this.stringifiedRows[currentRowIdx] = this.stringifyRow(this.dataTable[currentRowIdx])
      // this.stream.moveCursor(-this.dataTable[0].length, -this.dataTable.length)
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

const square = [
  [ 0, 0 ],
  [ 0, 0 ],
]

const printer = new Terminal(square)

printer.render([0,0], '.')
printer.render([0,1], '.')
printer.render([1,0], '.')
printer.render([1,1], '.')
printer.end()

class SquareGrid {
    constructor(width /* number */, height /* number */, holes=new Set()) {
        this.width = width
        this.height = height
        this.holes = holes
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

class PriorityQueue {
  constructor() {
    this.heap = [null]
  }

  hasMore() {
    return this.heap.length > 0
  }

  insert(newNode /* Node */) {
    this.heap.push(newNode)
    let currentNodeIdx = this.heap.length - 1
    let currentNodeParentIdx = Math.floor(currentNodeIdx / 2)
    while (
      this.heap[currentNodeParentIdx] &&
      newNode.priority > this.heap[currentNodeParentIdx].priority
    ) {
      const parent = this.heap[currentNodeParentIdx]
      this.heap[currentNodeParentIdx] = newNode
      this.heap[currentNodeIdx] = parent
      currentNodeIdx = currentNodeParentIdx
      currentNodeParentIdx = Math.floor(currentNodeIdx / 2)
    }
  }

  remove() {
    if (this.heap.length < 3) {
      const toReturn = this.heap.pop()
      this.heap[0] = null
      return toReturn
    }
    const toRemove = this.heap[1]
    this.heap[1] = this.heap.pop()
    let currentIdx = 1
    let [left, right] = [2*currentIdx, 2*currentIdx + 1]
    let currentChildIdx = this.heap[right] && this.heap[right].priority >= this.heap[left].priority ? right : left
    while (this.heap[currentChildIdx] && this.heap[currentIdx].priority <= this.heap[currentChildIdx].priority) {
      let currentNode = this.heap[currentIdx]
      let currentChildNode = this.heap[currentChildIdx]
      this.heap[currentChildIdx] = currentNode
      this.heap[currentIdx] = currentChildNode
    }
    return toRemove
  }
}

class Node {
  constructor(location /* tuple */, priority /* number */) {
    const x = location[0]
    const y = location[1]
    this.id = `${x},${y}`
    this.x = x
    this.y = y
    this.location = location
    this.priority = priority
  }
}

function distance(start,end) {
  const [ x1, y1 ] = start
  const [ x2, y2 ] = end
  return Math.sqrt(Math.exp(x1 + x2, 2) + Math.exp(y1 + y2, 2))
}

function findAStarPath(graph, start, end) {
  const frontier = new PriorityQueue()
  // keyed by stringified location
  const cameFrom = {}
  const costSoFar = {}
  const endKey = makeKey(end)

  const startNode = new Node(start, 0)
  frontier.insert(startNode, 0)
  costSoFar[startNode.id] = 0
  cameFrom[startNode.id] = 0

  while (frontier.hasMore()) {
    const current = frontier.remove()
    if (current.id === endKey) {
      break
    }

    graph.getNeighbors(current).forEach(neighbor => {

      const additionalCost = graph.cost(current, neighbor)
      const newCost = costSoFar[current.id] + additionalCost
      const neighborId = makeKey(neighbor)
      if (!costSoFar.hasOwnProperty(neighborId) || newCost < costSoFar[neighborId]) {
        costSoFar[neighborId] = newCost
        const priority = costSoFar[current.id] + additionalCost + distance(neighbor, end)
        const neighborNode = new Node(neighbor, priority)
        frontier.insert(neighborNode)
        cameFrom[neighborId] = current.id
        graph.render()
      }
    })
  }
  return { cameFrom, costSoFar }
}

function makeKey(point) {
  return `${point[0]},${point[1]}`
}

const wall = new GridWithWeights(10, 10)
const generateIndexInBounds = () => Math.floor(Math.random()*10)
const start = [ generateIndexInBounds(), generateIndexInBounds()]
const end = [ generateIndexInBounds(), generateIndexInBounds()]

// console.log({ start, end })
// const { cameFrom } = findAStarPath(wall ,start, end)
// console.log({ cameFrom })
