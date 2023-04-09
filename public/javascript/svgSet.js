// 關於svg draw的操作

//	取得當前的 viewBox 資訊
function showViewBox() {
  const currentViewBox = document.getElementById('currentViewBox')
  let viewBox = svg.getAttribute('viewBox').split(' ').map( n => parseFloat(n))
  currentViewBox.textContent = `現在的 viewBox 為：(${viewBox[0].toFixed(0)}, ${viewBox[1].toFixed(0)}, ${viewBox[2].toFixed(0)}, ${viewBox[3].toFixed(0)})`
}

let coor = {
  clientX: 0,
  clientY: 0
}

//	讓使用者可以設定 viewBox
function setViewBox() {
  //	取得使用者輸入的 viewBox 值
  const xMin = document.querySelector('[name="viewBox-x-min"]')
  const yMin = document.querySelector('[name="viewBox-y-min"]')
  const width = document.querySelector('[name="viewBox-width"]')
  const height = document.querySelector('[name="viewBox-height"]')
  let viewBox = `${xMin.value} ${yMin.value} ${width.value} ${height.value}`

  //	設定 SVG viewBox 屬性值
  svg.setAttribute('viewBox', viewBox)

  //	顯示最新的 viewBox 資訊
  showViewBox()
}
/* 
 *	開始：回報當前滑鼠座標資訊
 */
function reportCurrentPoint(e) {
  //	選取 HTML 各元素
  const info = document.getElementById('info')
  const offset = document.getElementById('offset')
  const client = document.getElementById('client')
  const showSvg = document.getElementById('showSvg')

  //	取得 viewport 座標系統中的 offset 和 client 座標值，並顯示於視窗上
  offset.textContent = `offset (${e.offsetX}, ${e.offsetY})`
  client.textContent = `client (${e.clientX}, ${e.clientY})`

  coor.clientX = e.clientX
  coor.clientY = e.clientY
  //console.log(coor)
  //	建立 SVG 座標點（0, 0）
  const clientPoint = svg.createSVGPoint()
    //	取得 CTM
  const CTM = svg.getScreenCTM()
    //  將 SVG 座標點的 x, y 設成 client(x, y)
  clientPoint.x = e.clientX
  clientPoint.y = e.clientY
    //	將 client 的座標點轉成 SVG 座標點
  SVGPoint = clientPoint.matrixTransform(CTM.inverse())
    //  將資訊顯示於視窗上
  showSvg.textContent = `svg (${SVGPoint.x.toFixed(0)}, ${SVGPoint.y.toFixed(0)})`
} //	結束：回報當前滑鼠座標資訊

/*	
開始：滑鼠拖拉的效果
*/
let moving
//	滑鼠點下，開始拖拉
function mouseDown(e){
	moving = true
}
//	拖拉的移動過程
function drag(e){
	if(moving === true && e.buttons === 4){
    
     //	1. 取得一開始的 viewBox 值，原本是字串，拆成陣列，方便之後運算
    let startViewBox = svg.getAttribute('viewBox').split(' ').map( n => parseFloat(n))

    //	2. 取得滑鼠當前 viewport 中 client 座標值
    let startClient = {
      x: e.clientX,
      y: e.clientY
    }

    //	3. 計算對應回去的 SVG 座標值
    let newSVGPoint = svg.createSVGPoint()
    let CTM = svg.getScreenCTM()
    newSVGPoint.x = startClient.x
    newSVGPoint.y = startClient.y
    let startSVGPoint = newSVGPoint.matrixTransform(CTM.inverse())
    
    //	4. 計算拖曳後滑鼠所在的 viewport client 座標值
    let moveToClient = {
    	x: e.clientX + e.movementX,	//	movement 可以取得滑鼠位移量
      y: e.clientY + e.movementY
    }
    
    //	5. 計算對應回去的 SVG 座標值
    newSVGPoint = svg.createSVGPoint()
    CTM = svg.getScreenCTM()
    newSVGPoint.x = moveToClient.x
    newSVGPoint.y = moveToClient.y
    let moveToSVGPoint = newSVGPoint.matrixTransform(CTM.inverse())
    
    //	6. 計算位移量
    let delta = {
    	dx: startSVGPoint.x - moveToSVGPoint.x,
      dy: startSVGPoint.y - moveToSVGPoint.y
    }
    
    //	7. 設定新的 viewBox 值
    let moveToViewBox = `${startViewBox[0] + delta.dx} ${startViewBox[1] + delta.dy} ${startViewBox[2]} ${startViewBox[3]}` 
    svg.setAttribute('viewBox', moveToViewBox)
    console.log(moveToViewBox)
  }
}
//	滑鼠點擊結束（拖曳結束）
function mouseUp(){
	moving = false
  showViewBox()
}	//	結束：滑鼠拖拉的效果


/*	
開始：滑鼠縮放的效果
*/
function zoom(e){
		//	1.取得一開始的 viewBox。
  	let startViewBox = svg.getAttribute('viewBox').split(' ').map( n => parseFloat(n))
		
    //	2.取得滑鼠執行縮放位置的 viewPort Client 座標，並利用 CTM 對應取得 SVG 座標。
    
    //	2.1 取得滑鼠執行縮放的位置
    let startClient = {
      x: e.clientX,
      y: e.clientY
    }

    //	2.2 轉換成 SVG 座標系統中的 SVG 座標點
    let newSVGPoint = svg.createSVGPoint()
    let CTM = svg.getScreenCTM()
    newSVGPoint.x = startClient.x
    newSVGPoint.y = startClient.y
    let startSVGPoint = newSVGPoint.matrixTransform(CTM.inverse())
    
    
		//	3.進行縮放，如果要讓原本的尺寸縮放兩倍的話。
    //	3.1 設定縮放倍率
    let r 
    if (e.deltaY > 0) {
      r = 1.1  // 更改縮放值
    } else if (e.deltaY < 0) {
      r = 0.9  // 更改縮放值
    } else {
      r = 1
    }
    //	3.2 進行縮放
    svg.setAttribute('viewBox', `${startViewBox[0]} ${startViewBox[1]} ${startViewBox[2] * r} ${startViewBox[3] * r}`)
    
    //	4.將一開始滑鼠的執行縮放位置的 viewPort Client 座標利用新的 CTM ，轉換出對應的 SVG 座標。
    CTM = svg.getScreenCTM()
    let moveToSVGPoint = newSVGPoint.matrixTransform(CTM.inverse())
    
    //	5.取得在縮放過程中該圓點的位移量 `(svgX0 - svgX1)`。
    let delta = {
    	dx: startSVGPoint.x - moveToSVGPoint.x,
      dy: startSVGPoint.y - moveToSVGPoint.y
    }
    
    //	6.設定最終的 viewBox2 
  	let middleViewBox = svg.getAttribute('viewBox').split(' ').map( n => parseFloat(n))
    let moveBackViewBox = `${middleViewBox[0] + delta.dx} ${middleViewBox[1] + delta.dy} ${middleViewBox[2]} ${middleViewBox[3]}` 
    svg.setAttribute('viewBox', moveBackViewBox)
    
    //	更新 viewBox 資訊
    showViewBox()
}	//	結束：滑鼠縮放的效果

const svg = document.getElementById('svg')
const setViewBoxBtn = document.getElementById('setViewBoxBtn')
setViewBoxBtn.addEventListener('click', setViewBox)
showViewBox()
//	回報滑鼠座標事件
svg.addEventListener('mousemove', reportCurrentPoint, false)
//	拖曳的事件
svg.addEventListener('mousedown', mouseDown, false)
svg.addEventListener('mousemove', drag, false)
svg.addEventListener('mouseup', mouseUp, false)
//	縮放的事件
svg.addEventListener('wheel', zoom, false)

// 步驟二的拖拉事件   => 比較單純

// 步驟三的拖拉事件
const svg03 = document.getElementById('step03Svg');

// 滑鼠座標事件
svg03.addEventListener('mousemove', reportCurrentPoint03, false)
// 拖曳的事件
svg03.addEventListener('mousedown', mouseDown03, false)
svg03.addEventListener('mousemove', drag03, false)
svg03.addEventListener('mouseup', mouseUp03, false)
//	縮放的事件
svg03.addEventListener('wheel', zoom03, false)

/* 
 *	開始：回報當前滑鼠座標資訊
 */
let coor03 = {
  offsetX: 0,
  offsetY: 0,
  clientX: 0,
  clientY: 0,
  svgX: 0,
  svgY: 0
}
function reportCurrentPoint03(e) {
  //	取得 viewport 座標系統中的 offset 和 client 座標值，並儲存
  coor03.offsetX = e.offsetX
  coor03.offsetY = e.offsetY
  coor03.clientX = e.clientX
  coor03.clientY = e.clientY

  // TODO 先放著
  coor.clientX = e.clientX
  coor.clientY = e.clientY
  //console.log(coor)
  //	建立 SVG 座標點（0, 0）
  const clientPoint = svg.createSVGPoint()
  //	取得 CTM
  const CTM = svg.getScreenCTM()
  //  將 SVG 座標點的 x, y 設成 client(x, y)
  clientPoint.x = e.clientX
  clientPoint.y = e.clientY
  //	將 client 的座標點轉成 SVG 座標點
  SVGPoint = clientPoint.matrixTransform(CTM.inverse())
  //  將資訊顯示於視窗上
  coor03.svgX = SVGPoint.x.toFixed(0)
  coor03.svgY = SVGPoint.y.toFixed(0)

} //	結束：回報當前滑鼠座標資訊

/*	
開始：滑鼠拖拉的效果
*/
let moving03
//	滑鼠點下，開始拖拉
function mouseDown03(e) {
  moving03 = true
}
//	拖拉的移動過程
function drag03(e){
	if(moving03 === true && e.buttons === 4){
    
     //	1. 取得一開始的 viewBox 值，原本是字串，拆成陣列，方便之後運算
    let startViewBox = svg03.getAttribute('viewBox').split(' ').map( n => parseFloat(n))

    //	2. 取得滑鼠當前 viewport 中 client 座標值
    let startClient = {
      x: e.clientX,
      y: e.clientY
    }

    //	3. 計算對應回去的 SVG 座標值
    let newSVGPoint = svg03.createSVGPoint()
    let CTM = svg03.getScreenCTM()
    newSVGPoint.x = startClient.x
    newSVGPoint.y = startClient.y
    let startSVGPoint = newSVGPoint.matrixTransform(CTM.inverse())
    
    //	4. 計算拖曳後滑鼠所在的 viewport client 座標值
    let moveToClient = {
    	x: e.clientX + e.movementX,	//	movement 可以取得滑鼠位移量
      y: e.clientY + e.movementY
    }
    
    //	5. 計算對應回去的 SVG 座標值
    newSVGPoint = svg03.createSVGPoint()
    CTM = svg03.getScreenCTM()
    newSVGPoint.x = moveToClient.x
    newSVGPoint.y = moveToClient.y
    let moveToSVGPoint = newSVGPoint.matrixTransform(CTM.inverse())
    
    //	6. 計算位移量
    let delta = {
    	dx: startSVGPoint.x - moveToSVGPoint.x,
      dy: startSVGPoint.y - moveToSVGPoint.y
    }
    
    //	7. 設定新的 viewBox 值
    let moveToViewBox = `${startViewBox[0] + delta.dx} ${startViewBox[1] + delta.dy} ${startViewBox[2]} ${startViewBox[3]}` 
    svg03.setAttribute('viewBox', moveToViewBox)
    console.log(moveToViewBox)
  }
}
//	滑鼠點擊結束（拖曳結束）
function mouseUp03() {
  moving03 = false
  showViewBox03()
}	//	結束：滑鼠拖拉的效果

//	取得當前的 viewBox 資訊
function showViewBox03() {
  let viewBox = svg03.getAttribute('viewBox').split(' ').map(n => parseFloat(n))
  console.log(`現在的 viewBox 為：(${viewBox[0].toFixed(0)}, ${viewBox[1].toFixed(0)}, ${viewBox[2].toFixed(0)}, ${viewBox[3].toFixed(0)})`)
}

/*	
開始：滑鼠縮放的效果
*/
function zoom03(e) {
  //	1.取得一開始的 viewBox。
  let startViewBox = svg03.getAttribute('viewBox').split(' ').map(n => parseFloat(n))

  //	2.取得滑鼠執行縮放位置的 viewPort Client 座標，並利用 CTM 對應取得 SVG 座標。

  //	2.1 取得滑鼠執行縮放的位置
  let startClient = {
    x: e.clientX,
    y: e.clientY
  }

  //	2.2 轉換成 SVG 座標系統中的 SVG 座標點
  let newSVGPoint = svg03.createSVGPoint()
  let CTM = svg03.getScreenCTM()
  newSVGPoint.x = startClient.x
  newSVGPoint.y = startClient.y
  let startSVGPoint = newSVGPoint.matrixTransform(CTM.inverse())


  //	3.進行縮放，如果要讓原本的尺寸縮放兩倍的話。
  //	3.1 設定縮放倍率
  let r
  if (e.deltaY > 0) {
    r = 0.9
  } else if (e.deltaY < 0) {
    r = 1.1
  } else {
    r = 1
  }
  //	3.2 進行縮放
  svg03.setAttribute('viewBox', `${startViewBox[0]} ${startViewBox[1]} ${startViewBox[2] * r} ${startViewBox[3] * r}`)

  //	4.將一開始滑鼠的執行縮放位置的 viewPort Client 座標利用新的 CTM ，轉換出對應的 SVG 座標。
  CTM = svg03.getScreenCTM()
  let moveToSVGPoint = newSVGPoint.matrixTransform(CTM.inverse())

  //	5.取得在縮放過程中該圓點的位移量 `(svgX0 - svgX1)`。
  let delta = {
    dx: startSVGPoint.x - moveToSVGPoint.x,
    dy: startSVGPoint.y - moveToSVGPoint.y
  }

  //	6.設定最終的 viewBox2 
  let middleViewBox = svg03.getAttribute('viewBox').split(' ').map(n => parseFloat(n))
  let moveBackViewBox = `${middleViewBox[0] + delta.dx} ${middleViewBox[1] + delta.dy} ${middleViewBox[2]} ${middleViewBox[3]}`
  svg03.setAttribute('viewBox', moveBackViewBox)

  //	更新 viewBox 資訊
  showViewBox03()
}	//	結束：滑鼠縮放的效果
