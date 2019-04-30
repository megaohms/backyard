'use strict'

const PriorityQueue = require('fastpriorityqueue')

module.exports = {
  findAStarPath,
  makeKey,
  distance,
  generateIndexInBounds,
}

function findAStarPath(graph, start, end, NodeClass, printer) {
  const frontier = new PriorityQueue(function(nodeA, nodeB) {
    return nodeA.cost < nodeB.cost
  })
  // keyed by stringified location
  const cameFrom = {}
  const costSoFar = {}
  const endKey = makeKey(end)

  const startNode = new NodeClass(start, 0)
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
        const neighborNode = new NodeClass(neighbor, priority)
        frontier.add(neighborNode)
      }
    })
  }
  return { cameFrom, costSoFar }
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

function makeKey(point) {
  return `${point[0]},${point[1]},${point[2]}`
}

function generateIndexInBounds(max) {
  return Math.floor(Math.random()*max)
}
