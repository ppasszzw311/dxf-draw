const Drawing = require('dxf-writer');
const fs = require('fs');
const { max } = require('lodash');

exports.start = (req, res) => {
  res.render('start')
}

exports.stepMake = (req, res) => {
  res.render('stepMake')
}

exports.newPage = (req, res) => {
  res.render('newPage')
}

// 重構網頁
exports.step01 = (req, res) => {
  res.render('step01');
}
exports.step02 = (req, res) => {
  res.render('step02', {
    title: 'step02',
    data: req.body
  })
}
exports.step03 = (req, res) => {
  res.render('step03')
}
exports.step04 = (req, res) => {
  res.render('step04')
}

// 測試用
exports.built = (req, res) => {
  res.render('build')
}

module.exports.uploadResult = (req, res) => {
  const result = {
    data: req.body
  }
  res.json('success')
  const content = '這是一個公開的檔案！';
  makenewDraw(req.body)
}

let drawData;

// 定義全域函數
let startLeft = [] // 最初的原始點
let startFront = [] // 間距60
let startRight = []
let startRear = []
let startTop = []
let frontViewGrid, leftSideViewGrid, rightSideViewGrid, rearViewGrid, topViewGrid;
let rungRule = []
let anchorArray = []
let topHighArray = []
let stairArray = []

// 畫dxf圖
function makenewDraw(data) {
  initialData();
  let d = new Drawing();
  const mData = data

  // 檔案名稱
  const filename = mData.fileName

  const viewGrid = mData.fiveViewGrid
  rungRule = mData.role.rung
  anchorArray = mData.anchor
  topHighArray = mData.height
  stairArray = mData.stair

  // 設定相關圖層
  d.setUnits('Meters');
  d.addLayer("rect_polygon", 0, "CONTINUOUS");
  d.setActiveLayer('rect_polygon');
  //buildThreeView(newData, d)

  // 建立五視圖
  buildFiveViewFrid(viewGrid, d)


  fs.writeFile(`./public/${filename}.dxf`, d.toDxfString(), (err) => {
    if (err) throw err;
    console.log("檔案已成功創建")
  });


}

// 重置參數
function initialData() {
  startLeft = [], startFront = [], startRight = [], startRear = [], startTop = []
  frontViewGrid = [], leftSideViewGrid = [], rightSideViewGrid = [], rearViewGrid = [], topViewGrid = [];
}

// 建立五視圖
function buildFiveViewFrid(grid, drawing) {
  try {
    // 先定義五視圖
    frontViewGrid = grid.frontView;
    leftSideViewGrid = grid.leftSideView;
    rightSideViewGrid = grid.rightSideView;
    rearViewGrid = grid.rearView;
    topViewGrid = grid.topView;

    // 確認各view的最大寬高，找top, front
    let maxX = 0, maxY = 0, maxZ = 0;
    topViewGrid.forEach(el => {
      const itemX = (el.coord[0] + el.border[0]) * 100
      const itemY = (el.coord[1] + el.border[1]) * 100
      maxX = maxX > itemX ? maxX : itemX
      maxY = maxY > itemY ? maxY : itemY
    })
    frontViewGrid.forEach(el => {
      const itemZ = (el.coord[1] + el.border[1]) * 100
      maxZ = maxZ > itemZ ? maxZ : itemZ
    })

    // 格子規則 : left font right rear top
    startLeft = [40, 40] // 最初的原始點
    startFront = [40 + maxY + 60, 40] // 間距60
    startRight = [40 + maxY + maxX + 120, 40]
    startRear = [40 + maxY * 2 + maxX + 180, 40]
    startTop = [40 + maxY + 60, 40 + maxZ + 60]

    // 新增基線
    const totalWidth = maxX * 2 + maxY * 2 + 180
    drawing.drawLine(40,0,40 + maxX * 2 + maxY * 2 + 180 ,0)
    drawing.drawText((40 + 40 + maxX * 2 + maxY * 2 + 180)/2, 10, 15, 0,totalWidth, 'center', 'middle' )

    drawing.drawLine(startTop[0], startTop[1] - 20 , startTop[0] + maxX , startTop[1] - 20)
    drawing.drawText(startTop[0] + maxX / 2, startTop[1] - 30, 10, 0, maxX , 'center', 'middle' )
    drawing.drawLine(startTop[0] - 20, startTop[1], startTop[0] -20, startTop[1] + maxY)
    drawing.drawText(startTop[0] - 30, startTop[1] + maxY / 2, 10, 90, maxY,  'center', 'middle' )


    // 建立格子
    makRectangle(startTop, topViewGrid, drawing) // TopView
    makRectText(startTop, topViewGrid, drawing) // top view text
    makRectangle(startLeft, leftSideViewGrid, drawing) // left side view
    makRectangle(startFront, frontViewGrid, drawing) // front view
    makRectangle(startRight, rightSideViewGrid, drawing) // right view
    makRectangle(startRear, rearViewGrid, drawing) // rear view

    // 建立梯位  
    drawing.addLayer("stair", Drawing.ACI.RED, "CONTINUOUS");
    drawing.setActiveLayer('stair');
    makStairTop(startTop, topViewGrid, drawing) // TopView
    makStair(startLeft, leftSideViewGrid, drawing) // left side view
    makStair(startFront, frontViewGrid, drawing) // front view
    makStair(startRight, rightSideViewGrid, drawing) // right view
    makStair(startRear, rearViewGrid, drawing) // rear view

    // 建立錨定點
    drawing.addLayer("anchor_point", Drawing.ACI.MAGENTA, "CONTINUOUS");
    drawing.setActiveLayer('anchor_point');
    makAnchorPoint(startTop, topViewGrid, drawing) // TopView
    makAnchorPoint(startLeft, leftSideViewGrid, drawing) // left side view
    makAnchorPoint(startFront, frontViewGrid, drawing) // front view
    makAnchorPoint(startRight, rightSideViewGrid, drawing) // right view
    makAnchorPoint(startRear, rearViewGrid, drawing) // rear view

    // 建立斜撐 => 平面四圖需要
    drawing.addLayer("diagonal_braces", Drawing.ACI.BLUE, "CONTINUOUS");
    drawing.setActiveLayer('diagonal_braces');
    makDiagonalBraces(startLeft, leftSideViewGrid, drawing) // left side view
    makDiagonalBraces(startFront, frontViewGrid, drawing) // front view
    makDiagonalBraces(startRight, rightSideViewGrid, drawing) // right view
    makDiagonalBraces(startRear, rearViewGrid, drawing) // rear view

    // 建立橫桿 => 四周平面需要
    drawing.addLayer("rung", 0, "CONTINUOUS");
    drawing.setActiveLayer('rung');
    makRung(startLeft, leftSideViewGrid, drawing) // left side view
    makRung(startFront, frontViewGrid, drawing) // front view
    makRung(startRight, rightSideViewGrid, drawing) // right view
    makRung(startRear, rearViewGrid, drawing) // rear view
  } catch (error) {
    console.log(error)
  }
}

// 建立格子
function makRectangle(start, grid, drawing) {
  grid.forEach(el => {
    const width = el.border[0] * 100
    const long = el.border[1] * 100
    const x = start[0] + el.coord[0] * 100
    const y = start[1] + el.coord[1] * 100
    drawing.drawRect(x, y, x + width, y + long)
  })
}

// 建立文字
function makRectText(start, grid, drawing) {
  grid.forEach(el => {
    const viewId = `${el.viewId.split('_')[0]}_${el.viewId.split('_')[1]}`
    let topIdArr = topHighArray
    topIdArr = topIdArr.map(item => `${item.split('_')[0]}_${item.split('_')[1]}`)
    console.log(viewId, topIdArr)
    for (i = 0; i < topHighArray.length; i++) {
      if (topIdArr[i] === viewId) {
        const width = el.border[0] * 100
        const long = el.border[1] * 100
        const x = start[0] + el.coord[0] * 100
        const y = start[1] + el.coord[1] * 100
        const text = topHighArray[i].split('_')[2]
        // 尋找中間點
        const centerX = x + width / 2
        const centerY = y + long / 2
        const baseWidth = (width > long ? long : width)
        // 如果是個位數 1/6 , 如果是十位數 1/3
        if (text.length > 1) {
          drawing.drawText(centerX, centerY, baseWidth / 3, 0, text, 'center', 'middle')
        } else {
          drawing.drawText(centerX, centerY, baseWidth / 3, 0, text, 'center', 'middle')
        }
      }
    }
  })
}

// 建立梯位
function makStairTop(start, grid, drawing) {
  grid.forEach(el => {
    const id = el.id
    for (i = 0; i < stairArray.length; i++) {
      if (stairArray[i] === id) {
        const x = start[0] + el.coord[0] * 100
        const y = start[1] + el.coord[1] * 100
        const stairWidth = el.border[0] / 4 * 100
        const stairLong = el.border[1] / 5 * 100

        drawing.drawLine(x, y, x, y + el.border[1] * 100)
        drawing.drawLine(x + stairWidth, y, x + stairWidth, y + el.border[1] * 100)
        drawing.drawLine(x, y + stairLong, x + stairWidth, y + stairLong)
        drawing.drawLine(x, y + (stairLong * 2), x + stairWidth, y + (stairLong * 2))
        drawing.drawLine(x, y + (stairLong * 3), x + stairWidth, y + (stairLong * 3))
        drawing.drawLine(x, y + (stairLong * 4), x + stairWidth, y + (stairLong * 4))
      }
    }

  })
}

// 建立梯位
function makStair(start, grid, drawing) {
  grid.forEach(el => {
    const id = el.id
    for (i = 0; i < stairArray.length; i++) {      
      if (stairArray[i] === id) {
        console.log(id, stairArray[i])
        const x1 = start[0] + el.coord[0] * 100
        const y1 = start[1] + el.coord[1] * 100
        const x2 = x1 + el.border[0] * 100
        const y2 = y1 + el.border[1] * 100
        const step = el.border[1] * 100 / 5
        const width = el.border[0] * 100 
        drawing.drawLine(x1, y1, x2, y2)
        drawing.drawLine(x1 + width / 5 - width / 10, y1 + step, x1 + width / 5 + width / 10, y1 + step)
        drawing.drawLine(x1 + width / 5 * 2 - width / 10, y1 + step * 2, x1 + width / 5 * 2 + width / 10, y1 + step * 2)
        drawing.drawLine(x1 + width / 5 * 3 - width / 10, y1 + step * 3, x1 + width / 5 * 3 + width / 10, y1 + step * 3)
        drawing.drawLine(x1 + width / 5 * 4 - width / 10, y1 + step * 4, x1 + width / 5 * 4+ width / 10, y1 + step * 4)
      }
    }

  })
}


// 建立錨定點
function makAnchorPoint(start, grid, drawing) {
  grid.forEach(el => {
    const id = el.id
    for (i = 0; i < anchorArray.length; i++) {
      if (id === anchorArray[i]) {
        const x = start[0] + el.coord[0] * 100
        const y = start[1] + el.coord[1] * 100
        drawing.drawCircle(x, y, 20)
      }
    }
  })
}

// 建立斜撐
function makDiagonalBraces(start, grid, drawing) {
  try {
    //需要左右對稱，先取得總共寬數
    let max = 0
    grid.forEach(el => {
      const x = Number(el.viewId.split('_')[0])
      max = max > x ? max : x
    })
    const braceArray = paintSymmetricCells(max)

    grid.forEach(el => {
      const Id_x = parseInt(el.viewId.split('_')[0])
      const x1 = start[0] + el.coord[0] * 100
      const x2 = x1 + el.border[0] * 100
      const y1 = start[1] + el.coord[1] * 100
      const y2 = y1 + el.border[1] * 100
      if (Id_x > max / 2 && braceArray[Id_x - 1]) {
        drawing.drawLine(x1, y2, x2, y1)
      } else if (Id_x <= max / 2 && braceArray[Id_x - 1]) {
        drawing.drawLine(x1, y1, x2, y2)
      }
    })
  } catch (error) {
  }
}

// 判斷間隔格子
function paintSymmetricCells(max) {
  let painted = Array(max).fill(false);

  // 計算中心點
  const center = Math.floor(max / 2);

  // 如果格子數量是偶數，則在中心點兩邊同時塗色，保持對稱
  if (max % 2 === 0) {
    for (let i = 0; i <= center; i += 2) {
      painted[i] = true;
      painted[max - 1 - i] = true;
    }
  } else {
    // 如果格子數量是奇數，從中心點開始向兩邊塗色，保持對稱
    for (let i = 0; i <= center; i += 2) {
      painted[center - i] = true;
      painted[center + i] = true;
    }
  }

  return painted;
}

// 建立橫檔
function makRung(start, grid, drawing) {
  let rungArray = getrungValue(rungRule)

  grid.forEach(el => {
    const x1 = start[0] + el.coord[0] * 100
    const x2 = x1 + el.border[0] * 100
    for (i = 0; i < rungArray.length; i++) {
      const y1 = start[1] + (el.coord[1] + rungArray[i]) * 100
      console.log(x1, x2, y1)
      drawing.drawLine(x1, y1, x2, y1)
    }
  })
}

// 取得橫桿規則
function getrungValue(value) {
  switch (value) {
    case 1:
      return [0.45]
      break;
    case 2:
      return [0.45, 0.9]
      break;
    case 3:
      return [0.45, 0.9, 1.35]
      break;
  }
}