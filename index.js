'use strict'

const Terminal = require('./Terminal')

const Node = require('./Node')
const RectangularGrid = require('./RectangularGrid')
const GridWithWeights = require('./GridWithWeights')
const Surface = require('./SurfaceNode')
const Room = require('./RoomNode')

const SearchSpace = require('./SearchSpace')

const {
  findAStarPath,
  makeKey,
  generateIndexInBounds,
} = require('./helpers')

/*

Find shortest path along prism

My approach to the problem was to break down in smaller
pieces, and iterate on that.
First, we can find the shortest path along a 2d surface.
This allowed me to get search working properly
without worrying about other aspects of the problem.
Adding complexity, my next step is to "unfold" rooms so adjacent
surfaces are transposed and projected onto the same 2d surface as the start,
for a single room.
Finally, we can connect more floors and walls to make multiple rooms.


The search algorithm I chose to work with is A*, because we know the
end destination and it's a location-based graph search! This allows us to
narrow the search space significantly so we don't have to iterate over all
possible paths.


Uncomment the 2d portion and see the costs get plotted over the search space
*/

///*
// Unfolded 3d space search

// wall dimensions, we'll start with a cube
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

const room = new Room({ x, y, z })
const searchSpace = new SearchSpace(room, start)
const printer = new Terminal(searchSpace.table)
//*/

/*
// 2D Search with dropped nodes

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
*/
