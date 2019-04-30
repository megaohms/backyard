'use strict'

const Surface = require('./Surface')

module.exports = class Room {
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
  }
}
