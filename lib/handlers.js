import { count } from 'console';
import Drawing from 'dxf-writer';
import fs from 'fs';
//import { max } from 'lodash';

export const start = (req, res) => {
  res.render('start')
}

export const stepMake = (req, res) => {
  res.render('stepMake')
}

export const newPage = (req, res) => {
  res.render('newPage')
}

// 重構網頁
export const step01 = (req, res) => {
  res.render('step01');
}
export const step02 = (req, res) => {
  res.render('step02', {
    title: 'step02',
    data: req.body
  })
}
export const step03 = (req, res) => {
  res.render('step03')
}
export const step04 = (req, res) => {
  res.render('step04')
}

// 測試用
export const built = (req, res) => {
  res.render('build')
}

export const uploadResult = async(req, res) => {
  const requestBodySize = Buffer.byteLength(JSON.stringify(req.body));
  console.log(`Request body size: ${requestBodySize} bytes`);
  // 取得目前日期
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate()
  const content = req.body.data;
  const caseName = JSON.parse(content).fileName;
  // 定義檔案名稱日期
  const fileName = `${caseName}_${year}${month}${day}`
  let filecount = 1;
  fs.readdirSync('./public/dxfFile').forEach(file => {
    if (file.includes(fileName)) {
      filecount += 1
    }
  })
  const newFileName = `${fileName}_${filecount}`

  const converseResult = await makenewDraw(req.body.data, newFileName)
  if (converseResult) {
    res.json({ result: true, message: '檔案成功創建',fileName: newFileName})
  }
  console.log("檔案成功創建")
  console.log(converseResult)
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
let mData = {}
let mDataBase = {}

// 畫dxf圖
function makenewDraw(data, filename) {
  initialData();
  let d = new Drawing();
  mData = JSON.parse(data)
  console.log(mData.base.long, mData.base.width, mData.base.height)

  // 檔案名稱

  const viewGrid = mData.fiveViewGrid
  rungRule = mData.role.rung
  anchorArray = mData.anchor
  topHighArray = mData.height
  stairArray = mData.stair

  // 設定相關圖層
  d.setUnits('Meters');
  //buildThreeView(newData, d)

  // 建立五視圖
  buildFiveViewFrid(viewGrid, d)


  fs.writeFile(`./public/dxfFile/${filename}.dxf`, d.toDxfString(), (err) => {
    if (err) throw err;
  });
  return true

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
    startFront = [40 + maxY + 400, 40] // 間距60
    startRight = [40 + maxY + maxX + 800, 40]
    startRear = [40 + maxY * 2 + maxX + 1200, 40]
    startTop = [40 + maxY + 400, 40 + maxZ + 400]

    // 新增基線
    const totalWidth = maxX * 2 + maxY * 2 + 1200
    // Ground Line
    drawing.addLayer("base_line", Drawing.ACI.WHITE, "CONTINUOUS");
    drawing.setActiveLayer('base_line');
    //drawing.drawLine( -300, 40, 40 + maxX * 2 + maxY * 2 + 1200 + 400 ,40)
    drawing.drawLine( -300, 40, 40 + maxY, 40)
    drawing.drawLine( 40 + maxY + 400, 40, 40 + maxY + 400 + maxX, 40)
    drawing.drawLine( 40 + maxY + 400 + maxX + 400, 40, 40 + maxY + 400 + maxX + 400 + maxY, 40)
    drawing.drawLine( 40 + maxY + 400 + maxX + 400 + maxY + 400, 40, 40 + maxY + 400 + maxX + 400 + maxY + 400 + maxX + 120 , 40)

    // 劃一個箭頭
    drawing.drawPolyline([[1300 + (maxX + maxY) * 2,55],[1300 + (maxX + maxY) * 2, 40]], false, 4, 0.05)
    drawing.drawPolyline([[1300 + (maxX + maxY) * 2, 25 + ( mData.base.height * 100)],[1300 + (maxX + maxY) * 2, 40 + ( mData.base.height * 100)]], false, 4, 0.05)
    drawing.drawLine(1300 + (maxX + maxY) * 2,55, 1300 + (maxX + maxY) * 2, 40 + ( mData.base.height * 100))
    drawing.drawLine(1240 + (maxX + maxY) * 2,40 + ( mData.base.height * 100),1300 + (maxX + maxY) * 2,40 + ( mData.base.height * 100))
    drawing.drawText(1290 + (maxX + maxY) * 2, 40 + ( mData.base.height * 50) , 10, 90, mData.base.height * 100,  'center', 'middle' )

    drawing.drawText( -230, 40, 90, 0, 'G', 'left', 'bottom' )
    drawing.drawLine( -145, 70, -150, 75)
    drawing.drawLine( -145, 80, -150, 75)
    drawing.drawLine( -140, 75, -145, 70)
    drawing.drawText( -120, 40, 90, 0, 'L', 'left', 'bottom' )
    drawing.drawLine( -35, 70, -40, 75)
    drawing.drawLine( -35, 80, -40, 75)
    drawing.drawLine( -30, 75, -35, 70)
    drawing.drawText(( 40 + 40 + maxX * 2 + maxY * 2 + 1200)/2, 10, 15, 0,totalWidth, 'center', 'middle' )

    drawing.drawLine(startTop[0], startTop[1] - 20 , startTop[0] + maxX , startTop[1] - 20)
    drawing.drawText(startTop[0] + maxX / 2, startTop[1] - 30, 10, 0, maxX , 'center', 'middle' )
    drawing.drawLine(startTop[0] - 20, startTop[1], startTop[0] -20, startTop[1] + maxY)
    drawing.drawText(startTop[0] - 30, startTop[1] + maxY / 2, 10, 90, maxY,  'center', 'middle' )

    const startCoor = [-100, - 100]
    //makeTextCustum(startCoor, drawing)

    // 間格
    drawing.addLayer("space_line", Drawing.ACI.WHITE, "DASHED");
    drawing.setActiveLayer('space_line');
    drawing.drawLine(40 + maxY , 40, 40 + maxY + 400 , 40 )
    drawing.drawLine(40 + maxY + 400 + maxX , 40, 40 + maxY + 400 + maxX + 400 , 40 )
    drawing.drawLine(40 + maxY + 400 + maxX + 400 + maxY, 40,40 + maxY + 400 + maxX + 400 + maxY + 400 , 40 )
    drawing.drawLine(40 + maxY , 40 + maxZ, 40 + maxY + 400 + maxX + 400 + maxY + 400, 40 + maxZ )
    // 直向間格
    drawing.drawLine(40 + maxY + 400, 40 + maxZ + 400 , 40 + maxY + 400, 40 )
    drawing.drawLine(40 + maxY + 400 + maxX, 40 + maxZ + 400 , 40 + maxY + 400 + maxX, 40 )

    // 測試
    drawing.drawPolygon(0, 0, 3, 10, 45);
    drawing.drawPolygon(30, 0, 5, 10, 0, true);
    //drawing.drawPolyline([ [0,0], [10, 10, 0.5], [20, 10], [30, 0] ], true, 1.5, 1.5);
    // 箭頭畫法 Example
    drawing.drawPolyline([ [10,10], [10, 0] ], false, 3, 0.05);

    // 建立格子
    drawing.addLayer("rect_polygon", Drawing.ACI.WHITE, "CONTINUOUS");
    drawing.setActiveLayer('rect_polygon');
    makRectangle(startTop, topViewGrid, drawing) // TopView
    makRectText(startTop, topViewGrid, drawing) // top view text
    makRectangleZIndex(startLeft, leftSideViewGrid, drawing) // left side view
    makRectangleZIndex(startFront, frontViewGrid, drawing) // front view
    makRectangleZIndex(startRight, rightSideViewGrid, drawing) // right view
    makRectangleZIndex(startRear, rearViewGrid, drawing) // rear view

    // 建立梯位  
    drawing.addLayer("stair", Drawing.ACI.RED, "CONTINUOUS");
    drawing.setActiveLayer('stair');
    makStairTop(startTop, topViewGrid, drawing) // TopView
    if (mData.base.long > mData.base.width) {
      makStair(startLeft, leftSideViewGrid, drawing) // left side view
      makStairTop(startFront, frontViewGrid, drawing) // front view
      makStair(startRight, rightSideViewGrid, drawing) // right view
      makStairTop(startRear, rearViewGrid, drawing) // rear view
    } else {
      makStairTop(startFront, frontViewGrid, drawing) // front view
      makStair(startLeft, leftSideViewGrid, drawing) // left side view
      makStairTop(startRear, rearViewGrid, drawing) // rear view
      makStair(startRight, rightSideViewGrid, drawing) // right view
    }    

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
    drawing.addLayer("rung", Drawing.ACI.WHITE, "CONTINUOUS");
    drawing.setActiveLayer('rung');
    makRung(startLeft, leftSideViewGrid, drawing) // left side view
    makRung(startFront, frontViewGrid, drawing) // front view
    makRung(startRight, rightSideViewGrid, drawing) // right view
    makRung(startRear, rearViewGrid, drawing) // rear view
  } catch (error) {
    console.log(error)
  }
}

function makeTextCustum(start, drawing) {
  const x = start[0]
  const y = start[1]
  // 範圍100  
  // 畫 "對"
  drawing.drawLine(x + 0, y + 85, x + 15, y + 70)
  drawing.drawLine(x + 45, y + 70, x + 55, y + 90)
  drawing.drawLine(x + 20, y + 67, x + 20, y + 90)
  drawing.drawLine(x + 37, y + 65, x + 37, y + 90)
  drawing.drawLine(x + 0, y + 65, x + 55, y + 65)
  drawing.drawLine(x + 17, y + 65, x + 24, y + 52)
  drawing.drawLine(x + 32, y + 53, x + 45, y + 65)
  drawing.drawLine(x + 7, y + 50, x + 47, y + 50)
  drawing.drawLine(x + 10, y + 30, x + 45, y + 30)
  drawing.drawLine(x + 27.5, y + 50, x + 27.5, y + 10)
  drawing.drawLine(x + 5, y + 5, x + 50, y + 15)
  drawing.drawLine(x + 62, y + 60, x + 95, y + 60)
  drawing.drawLine(x + 80, y + 5, x + 80, y + 95)
  drawing.drawLine(x + 70, y + 10, x + 80, y + 5)
  drawing.drawLine(x + 60, y + 55, x + 67, y + 40)

  const x1 = x + 100
  // 畫 "齊"
  drawing.drawLine(x1 + 5, y + 90, x1 + 95, y + 90)
  drawing.drawLine(x1 + 50, y + 90, x1 + 50, y + 95)
  drawing.drawLine(x1 + 7, y + 80, x1 + 33, y + 80)
  drawing.drawLine(x1 + 70, y + 10, x1 + 80, y + 5) //
  drawing.drawLine(x1 + 70, y + 10, x1 + 80, y + 5) //
  drawing.drawLine(x1 + 70, y + 10, x1 + 80, y + 5) //
  drawing.drawLine(x1 + 45, y + 90, x1 + 50, y + 78)
  drawing.drawLine(x1 + 55, y + 90, x1 + 50, y + 78)
  drawing.drawLine(x1 + 50, y + 47, x1 + 50, y + 78)
  drawing.drawLine(x1 + 70, y + 10, x1 + 80, y + 5) // 
  drawing.drawLine(x1 + 60, y + 82, x1 + 60, y + 47)
  drawing.drawLine(x1 + 72, y + 54, x1 + 60, y + 47)
  drawing.drawLine(x1 + 70, y + 10, x1 + 80, y + 5) //
  drawing.drawLine(x1 + 70, y + 10, x1 + 80, y + 5) //
  drawing.drawLine(x1 + 23, y + 38, x1 + 75, y + 38)
  drawing.drawLine(x1 + 23, y + 27, x1 + 75, y + 27)
  drawing.drawLine(x1 + 75, y + 5, x1 + 75, y + 50)

}

// 建立格子
function makRectangle(start, grid, drawing) {
  grid.forEach(el => {
    const width = el.border[0] * 100
    const long = el.border[1] * 100
    const x = start[0] + el.coord[0] * 100
    const y = start[1] + el.coord[1] * 100
    drawing.drawRect(x, y, x + width, y + long)
    drawing.drawRect(x + 2, y + 2, x + width - 2 , y + long - 2 )
  })
}
// 建立格子高度
function makRectangleZIndex(start, grid, drawing) {
  // 先找出每個x最高的y
  let topHighArray = []
  grid.forEach(el => {
    const id = el.viewId.split('_')[0]
    if (topHighArray.length === 0) {
      // 直接加進去
      topHighArray.push({
        id: id, 
        min: parseInt(el.viewId.split('_')[1]),
        x: el.coord[0],
        y: el.coord[1],
        borderX: el.border[0],
      })
    } else {
      // 比較
      const index = topHighArray.findIndex(item => item.id === id)
      if (index === -1) {
        // 沒有
        topHighArray.push({
          id: id, 
          min: parseInt(el.viewId.split('_')[1]),
          x: el.coord[0],
          y: el.coord[1],
          borderX: el.border[0],
        })
      } else {
        // 有
        if (topHighArray[index].min > parseInt(el.viewId.split('_')[1])) {
          topHighArray[index].min = parseInt(el.viewId.split('_')[1])
          topHighArray[index].y = el.coord[1]
        }
      }
    }
  })
  // 畫斜線
  console.log(topHighArray)
  topHighArray.forEach(el => {
    if (el.y > 0) {
      const x = start[0] + el.x * 100
      const y = start[1] + el.y * 100
      const width = el.borderX * 100
      makeDeviceArea(start, x, x + width, y, drawing)
    }

  })

  grid.forEach(el => {
    const width = el.border[0] * 100
    const long = el.border[1] * 100
    const x = start[0] + el.coord[0] * 100
    const y = start[1] + el.coord[1] * 100
    drawing.drawRect(x, y, x + width, y + long)
    drawing.drawRect(x + 2, y + 2, x + width - 2 , y + long - 2 )
  })
}

// 建立設備區斜線區塊
function makeDeviceArea(start, startX, endX, endY, drawing) {
  // 定義總共要畫的長寬
  const width = endX - startX;
  const long =  endY - start[1]
  for (let i = 0; i < (width + long) / 10; i++) {
    if (i % 3 !== 0) {
      console.log(`要畫線 ${startX + i * 10}, ${start[1]}, ${startX}, ${start[1] + i * 10 }`)
      drawing.drawLine(
        (startX + i * 10 < endX ? startX + i * 10 : endX), 
        (startX + i * 10 < endX ? start[1] : start[1] + i * 10 - width), 
        (start[1] + i * 10 < endY ? startX : startX + i * 10 - long), 
        (start[1] + i * 10 < endY ? start[1] + i * 10 : endY) )
    }
  }
  
}

// 建立文字
function makRectText(start, grid, drawing) {
  grid.forEach(el => {
    const viewId = `${el.viewId.split('_')[0]}_${el.viewId.split('_')[1]}`
    let topIdArr = topHighArray
    topIdArr = topIdArr.map(item => `${item.split('_')[0]}_${item.split('_')[1]}`)
    for (let i = 0; i < topHighArray.length; i++) {
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
    for (let i = 0; i < stairArray.length; i++) {
      if (stairArray[i] === id) {
        const x = start[0] + el.coord[0] * 100 + 2
        const y = start[1] + el.coord[1] * 100 + 2
        const stairWidth = el.border[0] / 4 * 100 // 寬度不影響
        // 決定要幾個梯子
        const stairCount = Math.floor(el.border[1] * 100 / 10) 
        for (let j = 1; j < stairCount - 1; j++) {
          //console.log("Ao")
          drawing.drawLine(x, y + 10 * j, x + stairWidth, y + 10 * j )
          //console.log(`AA${j}`)
        }
        drawing.drawLine(x, y, x, y + el.border[1] * 100)
        drawing.drawLine(x + stairWidth, y, x + stairWidth, y + el.border[1] * 100 - 4)
        
      }
    }

  })
}

// 建立梯位
function makStair(start, grid, drawing) {
  grid.forEach(el => {
    const id = el.id
    for (let i = 0; i < stairArray.length; i++) {      
      if (stairArray[i] === id) {
        const x1 = start[0] + el.coord[0] * 100
        const y1 = start[1] + el.coord[1] * 100
        const x2 = x1 + el.border[0] * 100
        const y2 = y1 + el.border[1] * 100
        const step = Math.floor(el.border[1] * 100 / 10)
        const width = Math.floor( el.border[0] * 100 / step)
        drawing.drawLine(x1, y1, x2, y2)
        for (let j = 1; j < step; j++) {
          drawing.drawLine(x1 + j * width - 7, y1 + j * 10, x1 + j * width + 7, y1 + j * 10)
        }
      }
    }

  })
}


// 建立錨定點
function makAnchorPoint(start, grid, drawing) {
  grid.forEach(el => {
    const id = el.id
    for (let i = 0; i < anchorArray.length; i++) {
      if (id === anchorArray[i]) {
        const x = start[0] + el.coord[0] * 100
        const y = start[1] + el.coord[1] * 100
        drawing.drawCircle(x, y, 15)
        drawing.drawCircle(x, y, 20)
        drawing.drawCircle(x, y, 25)
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
        drawing.drawPolyline([ [x1,y2], [x2, y1] ], false, 2, 2);
      } else if (Id_x <= max / 2 && braceArray[Id_x - 1]) {
        drawing.drawPolyline([ [x1,y1], [x2, y2] ], false, 2, 2);
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
    for (let i = 0; i < rungArray.length; i++) {
      const y1 = start[1] + (el.coord[1] + rungArray[i]) * 100
      drawing.drawLine(x1 + 2 , y1, x2 -2, y1)
      drawing.drawLine(x1 + 2 , y1 + 2, x2 -2, y1 + 2 )
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