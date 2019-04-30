
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

const room = new Room({ x, y, z })
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
