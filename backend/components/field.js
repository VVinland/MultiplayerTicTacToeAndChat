class Field {
    constructor() {
        this.field = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
    }
    getCell(x, y) {
        return this.field[x][y];
    }

    setCell(x, y, value) {
        return this.field[x][y] = value;
    }

    checkRow(rowIdx, id) {
        return this.field[rowIdx].every((cell) => cell === id);
    }

    checkColumn(columnIdx, id) {
        const column = [];
        this.field.forEach((row) => { column.push(row[columnIdx]) })
        return column.every((cell) => cell === id)
    }
 
    checkDiagonal(diagLine, id) {
        const diagLineIdxes = diagLine ? [0, 1, 2] : [2, 1, 0]
        let diagLineIdx = 0;
        const diagonal = [];
        this.field.forEach((row) => {
            diagonal.push(row[diagLineIdxes[diagLineIdx]]);
            diagLineIdx++;
        })
        return diagonal.every((cell) =>  cell === id );
    }

    checkWin(id) {
        const rowWin = this.checkRow(0, id) || this.checkRow(1, id) || this.checkRow(2, id);
        const columnWin = this.checkColumn(0, id) || this.checkColumn(1, id) || this.checkColumn(2, id);
        const diagonalWim = this.checkDiagonal(true, id) || this.checkDiagonal(false, id);

        return rowWin || columnWin || diagonalWim;
    }


    checkGameOver(id) {
        const fieldFull =
            this.field[0].every((cell) => cell !== 0) &&
            this.field[1].every((cell) => cell !== 0) &&
            this.field[2].every((cell) => cell !== 0);
        const win = this.checkWin(id);
        return { 'result': fieldFull || win, 'id': win ? id : 0 };
    }

    getField() {
        return this.field;
    }

    resetField() {
        this.field = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    }
}

export{
    Field
}