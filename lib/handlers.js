const Drawing = require('dxf-writer');
const fs = require('fs');

exports.start = (req, res) => {
  res.render('start')
}

exports.stepMake = (req, res) => {
  res.render('stepMake')
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
  makenewDraw(result.data.data)
}

let drawData;

// 畫dxf圖
function makenewDraw(data) {
  let d = new Drawing();
  const newData = JSON.parse(data)
  drawData = newData
  
  let beginX = 0
  let beginY = 0


  d.setUnits('Meters');
  d.addLayer("rect_polygon", 0, "CONTINUOUS");
  d.setActiveLayer('rect_polygon');
  buildThreeView(newData, d)


  fs.writeFile('./public/success' + '.dxf', d.toDxfString(), (err) => {
    if (err) throw err;
    console.log("檔案已成功創建")
  });

}


// 建立三視圖
function buildThreeView(data, d) {
  const threeViewCoord = {
    x: 0,
    y: 0,
    z: 0
  };
  const baseLong = data.base.long;
  const baseWidth = data.base.width;
  const baseheight = data.base.height;
  const grid = data.grid;
  const size = data.base;
  const threeViewCount = grid.reduce((acc, item) => {
    if (item.x > acc.x) {
      acc.x = item.x;
    }
    if (item.y > acc.y) {
      acc.y = item.y;
    }
    if (item.z > acc.z) {
      acc.z = item.z;
    }
    return acc;
  }, {
    x: -Infinity,
    y: -Infinity,
    z: -Infinity
  });
  threeViewCoord.x = threeViewCount.x * baseWidth;
  threeViewCoord.y = threeViewCount.y * baseLong;
  threeViewCoord.z = threeViewCount.z * baseheight;
  console.log(`threeviewZ ${threeViewCount.z} * ${baseheight}`)
  console.log(`threeviewX ${threeViewCount.x} * ${baseWidth}`)
  console.log(`threeviewY ${threeViewCount.y} * ${baseLong}`)

  const [xzArr, yzArr, xyArr] = grid.reduce((acc, obj) => {
    acc[0].push({ x: obj.x, z: obj.z });
    acc[1].push({ y: obj.y, z: obj.z });
    acc[2].push({ x: obj.x, y: obj.y });
    return acc;
  }, [[], [], []]);

  // 去除重複的元素
  const uniqueXZArr = [...new Set(xzArr.map(JSON.stringify))].map(JSON.parse);
  const uniqueYZArr = [...new Set(yzArr.map(JSON.stringify))].map(JSON.parse);
  const uniqueXYArr = [...new Set(xyArr.map(JSON.stringify))].map(JSON.parse);


  // 合併重複 x 值的對象，選擇 z 值最大的對象
  const mergedXZArr = uniqueXZArr.reduce((acc, obj) => {
    const idx = acc.findIndex(el => el.x === obj.x);
    if (idx === -1) {
      acc.push(obj);
    } else if (acc[idx].z < obj.z) {
      acc[idx] = obj;
    }
    return acc;
  }, []);

  // 合併重複 y 值的對象，選擇 z 值最大的對象
  const mergedYZArr = uniqueYZArr.reduce((acc, obj) => {
    const idy = acc.findIndex(el => el.y === obj.y);
    if (idy === -1) {
      acc.push(obj);
    } else if (acc[idy].z < obj.z) {
      acc[idy] = obj;
    }
    return acc;
  }, []);

  // 合併重複 x 值的對象，選擇 y 值最大的對象
  const mergedXYArr = uniqueXYArr.reduce((acc, obj) => {
    const idx = acc.findIndex(el => el.x === obj.x);
    if (idx === -1) {
      acc.push(obj);
    } else if (acc[idx].y < obj.y) {
      acc[idx] = obj;
    }
    return acc;
  }, []);

  const frontViewArray = mergedXZArr.map(item => item.z);
  const leftSideViewArray = mergedYZArr.map(item => item.z).reverse();
  const rightSideViewArray = mergedYZArr.map(item => item.z);
  const rearViewArray = mergedXZArr.map(item => item.z).reverse();
  const topViewArray = mergedXYArr.map(item => item.y);
  const sizeXZ = { x: baseWidth, y: baseheight }
  const sizeYZ = { x: baseLong, y: baseheight }
  const sizeXY = { x: baseWidth, y: baseLong }
  setTopViewRect(data, 10+ threeViewCoord.y , threeViewCoord.z + 5,d)
  getRectArray(5, 2, sizeYZ, leftSideViewArray, 'leftSideView', d)
  getRectArray(5 + threeViewCoord.y + 5, 2, sizeXZ, frontViewArray, 'frontView', d)
  getRectArray(5 + threeViewCoord.y + threeViewCoord.x + 10, 2, sizeYZ, rightSideViewArray, 'rightSideView', d)
  getRectArray(5 + threeViewCoord.y * 2 + threeViewCoord.x + 15, 2, sizeXZ, rearViewArray, 'rearView', d)
}

function getRectArray(x, y, size, arr, id, d) {
  for (i = 0; i < arr.length ; i++) {
    let zSize = arr[i]
    d.drawText(x + i * size.x, 0, 1, 0, i, 'center', 'middle')
    for (j = 0; j < zSize ; j++) {
      //console.log(i, j, typeof x,typeof y, size.x, size.y)
      let rectStartX = x + i  * size.x
      let rectStartY = y + j  * size.y
      let rectId = `${id}_${i}_${j}`
      d.drawRect(rectStartX, rectStartY, rectStartX + size.x, rectStartY + size.y)
      // 加上橫桿
      const rung = getrungValue(parseInt(drawData.rung[0]))
      rung.forEach(el => {
        d.drawLine(rectStartX, rectStartY + el, rectStartX + size.x, rectStartY + el)
      })
      //d.drawText(rectStartX + size.x / 3, rectStartY + size.y / 3, size.y / 3, 0, id, 'center', 'middle') // x1, y1, height, rotation, value, horzontalAlignment , 
      if (i % 2 === 0) {
        if (i > arr.length / 2) {
          d.drawLine(rectStartX, rectStartY, rectStartX + size.x,  rectStartY + size.y)
        } else {
          d.drawLine(rectStartX, rectStartY + size.y, rectStartX + size.x, rectStartY)
        }
      }


    }
  }
}

function setTopViewRect(data, startX, startY,d) {
  const baseLong = data.base.long;
  const baseWidth = data.base.width;
  const baseheight = data.base.height;
  let maxCount = {
    x: 0,
    y: 0,
    z: 0
  }
  const grid = data.grid
  if (grid !== undefined) {
    let count = 0
    grid.forEach(element => {

      // 平面圖
      maxCount.z = Math.max(maxCount.z, element.z)
      maxCount.x = Math.max(maxCount.x, element.x)
      maxCount.y = Math.max(maxCount.y, element.y)

      // 平面圖
      const x = (element.x - 1) * baseWidth + startX
      const y = (element.y - 1) * baseLong + startY
      d.drawRect(x, y, x + baseWidth, y + baseLong)
      // 待處理
      if (baseLong > baseWidth) {
        d.drawText(x + baseWidth / 3, y + baseLong / 3, baseLong / 3, 0, element.z, 'center', 'middle')
      } else {
        d.drawText(x + baseLong / 3, y + baseLong / 3, baseWidth / 3, 0, element.z, 'center', 'middle') // x1, y1, height, rotation, value, horzontalAlignment ,
      }
    });
  }

  d.addLayer('anchor', Drawing.ACI.MAGENTA, 'CONTINUOUS');
  d.setActiveLayer('anchor');
  const anchor = data.anchorPoint
  if (anchor !== undefined) {
    anchor.forEach(el => {
      const x = (el.x) * baseWidth + startX
      const y = (el.y) * baseLong + startY
      d.drawCircle(x, y, baseWidth / 3);
    })
  }

  d.addLayer('stair', Drawing.ACI.RED, 'CONTINUOUS');
  d.setActiveLayer('stair')
  const stair = data.stair
  if (stair !== undefined) {
    stair.forEach( el => {
      const x = (el.x -1) * baseWidth + startX
      const y = (el.y -1) * baseLong + startY
      const stairWidth = baseWidth / 4
      const stairLong = baseLong / 5
      d.drawLine(x, y, x, y+ baseLong)
      d.drawLine(x + stairWidth, y, x+ stairWidth, y+baseLong)
      d.drawLine(x, y+ stairLong, x + stairWidth, y+ stairLong)
      d.drawLine(x, y + (stairLong * 2), x + stairWidth, y + (stairLong * 2))
      d.drawLine(x, y + (stairLong * 3), x + stairWidth, y + (stairLong * 3))
      d.drawLine(x, y + (stairLong * 4), x + stairWidth, y + (stairLong * 4))
    })
  }

  d.addLayer('desc', 0, 'CONTINUOUS')
  d.setActiveLayer('desc')
  d.drawText(startX, maxCount.y * baseLong + startY, baseWidth/5, 0, baseWidth, 'center', 'middle')
  d.drawText(startX - baseWidth / 3, (maxCount.y - 1) * baseLong + startY, baseWidth/5, 45.0, baseWidth)
}




function getrungValue(value) {
  switch (value) {
    case 1:
      return[0.45]
      break;
    case 2:
      return [0.45, 0.9]
      break;
    case 3:
      return [0.45, 0.9, 1.35]
      break;
  }
}