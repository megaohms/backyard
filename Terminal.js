'use strict'

module.exports = class Terminal {
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
