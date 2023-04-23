/**
 * 設定svg及相關的操作
 */
// 定義基礎函數
let scaffoldArray = {
    base: { long: 150, width: 90, height: 180, coordX: 7, coordY: 8, coordZ: 5, scaling: 1 },
    fiveViewGrid: {
        topView: [],
        leftSideView: [],
        rightSideView: [],
        frontView: [],
        rearView: []
    },
    height: [],
    baseGrid: [],
    grid: [], stair: [], anchor: [], rung: [], bracing: [],
    description: { coord: [], text: "" }
}
// 定義長寬高各格子
let baseWidth = {
    x: [],
    y: [],
    z: []
}

// 定義最大座標
let maxborder = {
    x: 0,
    y: 0
}
// 定義模式
let step02DrawMode = "";

// 定義初始座標
let step02StartXY = {
    x: 30,
    y: 30
}

// 輸入框定義值
// 步驟一 base information, 如果數值改變就更新數值
recordBaseinfo()
function recordBaseinfo() {
    scaffoldArray.base.coordX = Number(document.querySelector("#item-x-count").value)
    scaffoldArray.base.coordY = Number(document.querySelector("#item-y-count").value)
    scaffoldArray.base.coordZ = Number(document.querySelector("#item-z-count").value)
    scaffoldArray.base.long = Number(document.querySelector("#item-long").value)
    scaffoldArray.base.width = Number(document.querySelector("#item-width").value)
    scaffoldArray.base.height = Number(document.querySelector("#item-height").value)
}

// 進入步驟二畫方格圖
// 計算方式： 使用步驟1 submit 確認後送出 / 使用步驟2 重新計算產出
const submit = document.querySelector("#step01")
let itemValue = {
    itemX: 30,
    itemY: 0,
    itemZ: 0
}
submit.addEventListener('click', e => {
    recordBaseinfo()
    // 計算呈現中長寬高的比例畫法
    // 設定寬為30px(coordX) 對應的Ｙ及Ｚ的畫法
    // 更正，確保字體最小大小
    if (scaffoldArray.base.long > 0 && scaffoldArray.base.width > 0 && scaffoldArray.base.height > 0) {
        // 都大於0的狀況下啟用計算
        // 長比較短
        if (scaffoldArray.base.long > scaffoldArray.base.width) {
            itemValue.itemX = 30
            itemValue.itemY = scaffoldArray.base.long / scaffoldArray.base.width * 30
            itemValue.itemZ = scaffoldArray.base.height / scaffoldArray.base.width * 30
            scaffoldArray.base.scaling = 30 / scaffoldArray.base.width
        } else if (scaffoldArray.base.long < scaffoldArray.base.width) {
            itemValue.itemY = 30
            itemValue.itemX = scaffoldArray.base.width / scaffoldArray.base.long * 30
            itemValue.itemZ = scaffoldArray.base.height / scaffoldArray.base.long * 30
            scaffoldArray.base.scaling = 30 / scaffoldArray.base.long
        } else {
            itemValue.itemX = 30
            itemValue.itemY = 30
            itemValue.itemZ = scaffoldArray.base.height / scaffoldArray.base.long * 30
            scaffoldArray.base.scaling = 30 / scaffoldArray.base.height
        }
    }
    // 建立基礎長度
    createBaseWidth();
    //createBaseGrid();
    // 產生平面底圖
    //rectangleSvg(step02StartXY.x, step02StartXY.y, itemValue.itemX, itemValue.itemY, scaffoldArray.base.coordY, scaffoldArray.base.coordX)
    arrowDesc() // 產生箭頭
})

// 畫基礎網格
function createBaseWidth() {
    const xCount = scaffoldArray.base.coordX
    const yCount = scaffoldArray.base.coordY
    const zCount = scaffoldArray.base.coordZ
    for (i = 0; i < xCount; i ++) {
        const item = {id: i + 1, width: scaffoldArray.base.width}
        baseWidth.x.push(item)
    }
    for (i = 0; i < yCount; i++) {
        const item = { id: i + 1, width: scaffoldArray.base.long }
        baseWidth.y.push(item)
    }
    for (i = 0; i < zCount; i++) {
        const item = { id: i + 1, width: scaffoldArray.base.height }
        baseWidth.z.push(item)
    }
    drawBaseGrid()
}

// 畫基礎網格
function drawBaseGrid() {
    // 重置所有
    scaffoldArray.baseGrid = []
    let yMax = 0
    baseWidth.y.forEach(el=> {
        yMax += el.width
    })
    console.log(yMax)
    let x = 0 
    baseWidth.x.forEach(el => {
        y = yMax
        baseWidth.y.forEach(ek => {
            z = 0
            y -= ek.width
            baseWidth.z.forEach(ej => {
                const gridItem = {
                    x : el.id,
                    y : ek.id,
                    z : ej.id,
                    startCoor : [x, y, z],
                    border : [el.width, ek.width, ej.width]
                }
                scaffoldArray.baseGrid.push(gridItem)
                z += ej.width
            })
            
        })
        x += el.width
    })
    createRectangleSvg(scaffoldArray.baseGrid)
}

// 畫方格
function createRectangleSvg(coorArray) {
    // 尋找最大Y
    const scale = scaffoldArray.base.scaling;
    let maxY = -0.1
    let maxX = -0.1
    let maxZ = -0.1
    let arrayX = []
    let arrayY = []
    let arrayZ = []
    coorArray.forEach(el => {
        const itemY = el.startCoor[1] * scale + el.border[1] * scale // y只要找最大的那個
        const itemX = el.startCoor[0] * scale + el.border[0] * scale
        const itemZ = el.startCoor[2] * scale + el.border[2] * scale
        if (itemX > maxX) {
            arrayX.push({ id: el.x, startCoor: el.startCoor[0] * scale, border: el.border[0] * scale });
            maxX = itemX
        }
        if (itemY > maxY) {
            arrayY.push({ id: el.y, startCoor: el.startCoor[1] * scale, border: el.border[1] * scale });
            maxY = itemY
        }
        if (itemZ > maxZ) {
            arrayZ.push({ id: el.z, startCoor: el.startCoor[2] * scale, border: el.border[2] * scale });
            maxZ = itemZ
        }
    })
    maxborder.x = maxX
    maxborder.y = maxY

    // 重置所有
    initialStepSvg()

    // 畫邊邊
    arrayX.forEach(el => {
        const coorX = parseInt(el.startCoor + step02StartXY.x)
        const shape = descGridText(coorX, step02StartXY.y, el.border, 30, el.id, "X")
        const shapeRect = descGridRect(coorX, 0, el.border, 25, el.id, "X") 
        desc.appendChild(shapeRect)
        desc.appendChild(shape)
    })
    arrayY.forEach(el => {
        const coordY = parseInt(maxY - el.startCoor + step02StartXY.y - el.border)
        const shape = descGridText(step02StartXY.x, coordY,30, el.border, el.id, "Y")
        const shapeRect = descGridRect(0, coordY, 25, el.border, el.id, "Y") 
        desc.appendChild(shapeRect)
        desc.appendChild(shape)
    })
    // 畫方格
    let newCoordArray = [];
    coorArray.forEach((el) => {
        startCoor = [el.startCoor[0], el.startCoor[1]];
        border = [el.border[0], el.border[1]];
        newCoordArray.push({
            x: el.x,
            y: el.y,
            startCoor: startCoor,
            border: border,
        });
    });

    const XYCoordArray = removeDuplicateObjects(newCoordArray);


    XYCoordArray.forEach(el => {
        const coorX = el.startCoor[0] * scale + step02StartXY.x
        const coorY = el.startCoor[1] * scale + step02StartXY.y
        const width = el.border[0] * scale
        const long = el.border[1] * scale
        const id = `rect_${el.x}_${el.y}`
        const shape = rectangle(coorX, coorY, width, long, id)
        const shapeHigh = rectangleHeight(coorX, coorY, width, long, id)
        rect.appendChild(shape)
        rectHigh.appendChild(shapeHigh)
    })
}

// TODO 網格沒有刪乾淨，y座標的方向錯誤

function initialStepSvg() {
    // 重置網格
    const fragment = new DocumentFragment();
    while (rect.firstChild) {
        fragment.appendChild(rect.firstChild)
    }
    while (fragment.firstChild) {
        fragment.removeChild(fragment.firstChild);
    }
    while (rectHigh.firstChild) {
        rectHigh.removeChild(rectHigh.firstChild);
    }
    while (anchor.firstChild) {
        anchor.removeChild(anchor.firstChild);
    }
    while (stair.firstChild) {
        stair.removeChild(stair.firstChild);
    }
    while (desc.firstChild) {
        desc.removeChild(desc.firstChild);
    }
}



// 移除重複的array
function removeDuplicateObjects(array) {
    return array.filter((item, index) => {
        return (
            index ===
            array.findIndex((obj) => {
                return (
                    obj.x === item.x &&
                    obj.y === item.y &&
                    obj.startCoor[0] === item.startCoor[0] &&
                    obj.startCoor[1] === item.startCoor[1] &&
                    obj.border[0] === item.border[0] &&
                    obj.border[1] === item.border[1]
                );
            })
        );
    });
}


/** 步驟二 畫平面圖 */
// ===========step web 畫方格==================
const rect = document.getElementById('rect')
const rectHigh = document.getElementById('rectHigh');
const anchor = document.getElementById('anchor');
const stair = document.getElementById('stair')
const desc = document.getElementById("desc")
const updrawer = document.querySelector("#updrawer")




/**
 * 主要元件 區塊
 */
// ======================================================================================= \\
// ======================================================================================= \\
// 建立平面底格
function rectangle(x, y, width, height, id) {
    var svgns = "http://www.w3.org/2000/svg";
    var shape = document.createElementNS(svgns, "rect");
    shape.setAttributeNS(null, "id", id)
    shape.setAttributeNS(null, "x", x);
    shape.setAttributeNS(null, "y", y); //width="150" height="150"
    shape.setAttributeNS(null, "width", width)
    shape.setAttributeNS(null, "height", height);
    shape.setAttributeNS(null, "fill", "white");
    shape.setAttributeNS(null, "stroke", "blue");
    return shape
}
// 建立平面底格文字
function rectangleHeight(x, y, width, height, id) {
    // 校正
    let newX = x + (width / 2)
    let newY = y + (height / 2)
    var svgns = "http://www.w3.org/2000/svg";
    var shape = document.createElementNS(svgns, "text");
    shape.setAttributeNS(null, "id", "text_" + id)
    shape.setAttributeNS(null, "x", newX);
    shape.setAttributeNS(null, "y", newY); //width="150" height="150"
    shape.setAttributeNS(null, "dominant-baseline", "middle");
    shape.setAttributeNS(null, "text-anchor", "middle");
    shape.setAttributeNS(null, 'font-size', '15');
    shape.innerHTML = scaffoldArray.base.coordZ;
    return shape
}
// 建立錨定點圓形
function circle(cx, cy, id) {
    var svgns = "http://www.w3.org/2000/svg";
    var shape = document.createElementNS(svgns, "circle");
    shape.setAttributeNS(null, "id", id)
    shape.setAttributeNS(null, "cx", cx);
    shape.setAttributeNS(null, "cy", cy); //width="150" height="150"
    shape.setAttributeNS(null, "r", 7)
    shape.setAttributeNS(null, "fill", "rgba(255, 0, 0, 0.5)")
    shape.setAttributeNS(null, "stroke", "red");
    shape.setAttributeNS(null, "stroke-width", "2")
    return shape;
}

// 建立階梯
function makeStair(x, y, long, width, rotate) {
    // 建立一個group
    const childGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    let stairId = `stair_${x}_${y}`
    childGroup.setAttribute('id', stairId);
    // 将子元素添加为父元素的子元素
    stair.appendChild(childGroup);

    // 確認方向
    // 直向
    if (rotate === "x") {
        // 橫向
        line((x - 1) * width + step02StartXY.x, x * width + step02StartXY.x, maxborder.y - y * long, maxborder.y - y * long, stairId)
        for (i = 0; i < 5; i++) {
            let xStart = (x - 1) * width
            let yStart = y * long

            line(xStart + (i * width / 5) + step02StartXY.x, xStart + (i * width / 5) + step02StartXY.x, maxborder.y - yStart, maxborder.y - yStart - 10, stairId)
        }
        line((x - 1) * width + step02StartXY.x, x * width + step02StartXY.x, maxborder.y - y * long - 10, maxborder.y - y * long - 10, stairId)
    } else {
        // 直向
        line((x - 1) * width + step02StartXY.x, (x - 1) * width + step02StartXY.x, maxborder.y - (y - 1) * long - long, maxborder.y - y * long - long, stairId)
        for (i = 0; i < 5; i++) {
            let xStart = (x - 1) * width
            let yStart = (y) * long
            line(xStart + step02StartXY.x, xStart + 10 + step02StartXY.x, maxborder.y - yStart + (i * long / 5) - long, maxborder.y - yStart + (i * long / 5) - long, stairId)
        }
        line((x - 1) * width + 10 + step02StartXY.x, (x - 1) * width + 10 + step02StartXY.x, maxborder.y - (y - 1) * long - long, maxborder.y - y * long - long, stairId)
    }
}

function line(x1, x2, y1, y2, groupid) {
    var svgns = "http://www.w3.org/2000/svg";
    var shape = document.createElementNS(svgns, "line");
    const group = document.getElementById(groupid)
    shape.setAttributeNS(null, "x1", x1);
    shape.setAttributeNS(null, "x2", x2);
    shape.setAttributeNS(null, "y1", y1);
    shape.setAttributeNS(null, "y2", y2);
    shape.setAttributeNS(null, "stroke", "black");
    group.appendChild(shape);
}

// 座標編號
function descGridText(x, y, width, height, number, type) {
    // 校正
    let newX;
    let newY;
    if (type === "Y") {
        newX = step02StartXY.x / 2
        newY = y + (height / 2)
    } else {
        newY = step02StartXY.y / 2
        newX = x + (width / 2)
    }
    var svgns = "http://www.w3.org/2000/svg";
    var shape = document.createElementNS(svgns, "text");
    shape.setAttributeNS(null, "x", newX);
    shape.setAttributeNS(null, "y", newY); //width="150" height="150"
    //shape.setAttributeNS(null, "stroke","#0000FF")
    shape.setAttributeNS(null, "fill", 'red')
    shape.setAttributeNS(null, "dominant-baseline", "middle");
    shape.setAttributeNS(null, "text-anchor", "middle");
    shape.setAttributeNS(null, 'font-size', '8');
    shape.innerHTML = number;
    return shape
}
function descGridRect(x, y, width, height, number, type) {
    let id = ""
    if (type === "Y") {
        id = `descGrid_y_${number}`
    } else {
        id = `descGrid_x_${number}`
    }
    var svgns = "http://www.w3.org/2000/svg";
    var shape = document.createElementNS(svgns, "rect");
    shape.setAttributeNS(null, "id", id)
    shape.setAttributeNS(null, "x", x);
    shape.setAttributeNS(null, "y", y); //width="150" height="150"
    shape.setAttributeNS(null, "width", width)
    shape.setAttributeNS(null, "height", height);
    shape.setAttributeNS(null, "fill", "white");
    shape.setAttributeNS(null, "stroke", "white");
    return shape
}

// 新增drid 點擊事件
desc.addEventListener('click', e => {
    const targetID = e.target.id
    if (targetID.split('_')[0] === 'descGrid') {
        const coord = targetID.split('_')[1]
        const id = targetID.split('_')[2]
        const value = prompt(`修改${coord === 'x'? '寬': '長'}第${id}格，請輸入要更改的數值？`)
        if (value !== "") {
            if (Number(value) > 0) {
                if (coord === 'x') {
                    // 修改x格
                    item = parseInt(id) - 1
                    baseWidth.x[item].width = Number(value)
                } else {
                    item = parseInt(id) - 1
                    baseWidth.y[item].width = Number(value)
                }
                // 重置網格
                drawBaseGrid()
            }
        }
    }
})


/** 畫箭頭 */
function arrowDesc() {
    // 第一組箭頭 Ｘ
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    path.setAttribute("d", `M30,23 L${30 + scaffoldArray.base.width},23`);
    path.setAttributeNS(null, 'stoke', 'red')
    const polyline1 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline1.setAttribute("points", `${30 + itemValue.itemX},20 ${30 + itemValue.itemX - 6},16 ${30 + itemValue.itemX - 6},24`);
    polyline1.setAttributeNS(null, 'fill', 'red')
    const polyline2 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline2.setAttribute("points", `${30},20 ${30 + 6},16 ${30 + 6},24`,);
    polyline2.setAttributeNS(null, 'fill', 'red')
    desc.appendChild(path)
    desc.appendChild(polyline1)
    desc.appendChild(polyline2);
}

// ============================================================================================================ \\
// ============================================================================================================ \\

selectModeMouse()
// 滑鼠監聽事件
function selectModeMouse() {
    var mouseStopId;
    var mouseOn = false;
    var startX = 0;
    var startY = 0;
    // 雙擊事件
    const dblclickEvent = document.querySelector(".svg-container-step02")

    // 切換模式
    const selectMode = document.getElementById("selectMode")
    let value;
    selectMode.addEventListener('change', e => {
        value = document.querySelector('input[name="inputMode"]:checked').value
        const alert = document.querySelector(".alert")
        // 傳入模式
        step02DrawMode = value
        alert.innerHTML = `選擇${value}模式！`
        $(".alert").addClass("show")
        window.setTimeout(function () {
            $(".alert").removeClass("show")
        }, 1000)

        if (typeof value !== "undefined") {
            dblclickEvent.addEventListener('click', onMouseDbClick);
            document.addEventListener("mousemove", onMouseMoveMode)
            if (value.includes("梯位")) {
                //document.addEventListener("mousedown", onMouseDownMode)
                //document.addEventListener("mousemove", onMouseMoveMode)
                document.addEventListener("mouseup", onMouseUpMode)
                //document.removeEventListener("mousedown", onMouseDownModeAnchor)
                //document.removeEventListener("mousemove", onMouseMoveModeAnchor)
                document.removeEventListener("mouseup", onMouseUpModeAnchor)
                //document.removeEventListener("mousedown", onMouseDownModeHigh)
                //document.removeEventListener("mousemove", onMouseMoveModeHigh)
                document.removeEventListener("mouseup", onMouseUpModeHigh)
            } else if (value.includes("樓高")) {
                // 取得長方形點
                //document.addEventListener("mousedown", onMouseDownModeHigh)
                //document.addEventListener("mousemove", onMouseMoveModeHigh)
                document.addEventListener("mouseup", onMouseUpModeHigh)
                //document.removeEventListener("mousedown", onMouseDownMode)
                //document.removeEventListener("mousemove", onMouseMoveMode)
                document.removeEventListener("mouseup", onMouseUpMode)
                //document.removeEventListener("mousedown", onMouseDownModeAnchor)
                //document.removeEventListener("mousemove", onMouseMoveModeAnchor)
                document.removeEventListener("mouseup", onMouseUpModeAnchor)
                const reg = document.getElementById("rect")

            } else if (value.includes("錨定點")) {
                //document.removeEventListener("mousedown", onMouseDownMode)
                //document.removeEventListener("mousemove", onMouseMoveMode)
                document.removeEventListener("mouseup", onMouseUpMode)
                //document.addEventListener("mousedown", onMouseDownModeAnchor)
                //document.addEventListener("mousemove", onMouseMoveModeAnchor)
                document.addEventListener("mouseup", onMouseUpModeAnchor)
                //document.removeEventListener("mousedown", onMouseDownModeHigh)
                //document.removeEventListener("mousemove", onMouseMoveModeHigh)
                document.removeEventListener("mouseup", onMouseUpModeHigh)
            } else {
                //document.removeEventListener("mousedown", onMouseDownMode)
                document.removeEventListener("mousemove", onMouseMoveMode)
                document.removeEventListener("mouseup", onMouseUpMode)
                //document.removeEventListener("mousedown", onMouseDownModeAnchor)
                //document.removeEventListener("mousemove", onMouseMoveModeAnchor)
                document.removeEventListener("mouseup", onMouseUpModeAnchor)
                //document.removeEventListener("mousedown", onMouseDownModeHigh)
                //document.removeEventListener("mousemove", onMouseMoveModeHigh)
                document.removeEventListener("mouseup", onMouseUpModeHigh)
            }
        }
    })

    // 滑鼠雙擊事件
    function onMouseDbClick(e) {
        clearEventBubble(e);
        const svgContainer = this;
        if (svgContainer.classList.contains('clicked')) {
            svgContainer.classList.remove('clicked');
            svgContainer.classList.add('dblclick')
            console.log("hello")
            mouseStopId = setTimeout(function () {
                mouseOn = true;
                startX = e.clientX;
                startY = e.clientY;
                var selDiv = document.createElement('div');
                selDiv.style.cssText = 'position:absolute;width:0;height:0;margin:0;padding:0;border:1px dashed #eee;background-color:#aaa;z-index:1000;opacity:0.6;display:none;';
                selDiv.id = 'selectDiv';
                document.body.appendChild(selDiv);
                selDiv.style.left = startX + 'px';
                selDiv.style.top = startY + 'px';
            }, 300);
            //here is your code for double click
        } else {
            svgContainer.classList.add('clicked');
            setTimeout(function () {
                if (svgContainer.classList.contains('clicked')) {
                    svgContainer.classList.remove('clicked');

                }
            }, 500);
        }
    }

    function onMouseUpMode(e) {

        if (dblclickEvent.classList.contains('dblclick')) {
            if (!mouseOn) return;
            clearEventBubble(e);
            mouseOn = false;
            var selDiv = document.getElementById('selectDiv');
            var fileDivs = document.getElementsByTagName('rect')
            var selectedEls = [];
            dblclickEvent.classList.remove('dblclick')
            // 获取参数
            var l = selDiv.offsetLeft;
            var t = selDiv.offsetTop;
            var w = selDiv.offsetWidth;
            var h = selDiv.offsetHeight;
            console.log(fileDivs.length)
            console.log(l, t, w, h, "選擇區塊高")
            for (var i = 0; i < fileDivs.length; i++) {
                var sl = fileDivs[i].offsetWidth + fileDivs[i].offsetLeft;
                var st = fileDivs[i].offsetHeight + fileDivs[i].offsetTop;
                if (fileDivs[i].getBoundingClientRect().right > l && fileDivs[i].getBoundingClientRect().bottom > t
                    && fileDivs[i].getBoundingClientRect().left < l + w && fileDivs[i].getBoundingClientRect().top < t + h) {
                    // 该DOM元素被选中，进行处理
                    selectedEls.push(fileDivs[i]);
                    makeStairtags(fileDivs[i].id)
                    // 加上顏色
                    fileDivs[i].classList.add('select-stair')
                }
            }
            // 打印被选中DOM元素
            console.log(selectedEls);
            // ===============選擇梯位===================== 確認儲存
            // 恢复参数
            selDiv.style.display = 'none';
            stairSelectClose();
        }


    }

    function onMouseMoveMode(e) {
        if (dblclickEvent.classList.contains('dblclick')) {
            if (!mouseOn) return;
            clearEventBubble(e);
            var _x = e.clientX;
            var _y = e.clientY;
            var selDiv = document.getElementById('selectDiv');
            selDiv.style.display = 'block';
            selDiv.style.left = Math.min(_x, startX) + 'px';
            selDiv.style.top = Math.min(_y, startY) + 'px';
            selDiv.style.width = Math.abs(_x - startX) + 'px';
            selDiv.style.height = Math.abs(_y - startY) + 'px';
        }
    }

    function onMouseDownMode(e) {
        clearEventBubble(e);
        if (e.buttons !== 1 || e.which !== 1) return;
        if (e.shiftKey) {
            mouseStopId = setTimeout(function () {
                mouseOn = true;
                startX = e.clientX;
                startY = e.clientY;
                var selDiv = document.createElement('div');
                selDiv.style.cssText = 'position:absolute;width:0;height:0;margin:0;padding:0;border:1px dashed #eee;background-color:#aaa;z-index:1000;opacity:0.6;display:none;';
                selDiv.id = 'selectDiv';
                document.body.appendChild(selDiv);
                selDiv.style.left = startX + 'px';
                selDiv.style.top = startY + 'px';
            }, 300);
        }
    }

    function onMouseUpModeAnchor(e) {
        if (dblclickEvent.classList.contains('dblclick')) {
            if (!mouseOn) return;
            clearEventBubble(e);
            mouseOn = false;
            var selDiv = document.getElementById('selectDiv');
            var fileDivs = document.getElementsByTagName('rect')
            var selectedEls = [];
            dblclickEvent.classList.remove('dblclick')
            // 获取参数
            var l = selDiv.offsetLeft;
            var t = selDiv.offsetTop;
            var w = selDiv.offsetWidth;
            var h = selDiv.offsetHeight;
            for (var i = 0; i < fileDivs.length; i++) {
                let selectItemX = fileDivs[i].getBoundingClientRect().left
                let selectItemY = fileDivs[i].getBoundingClientRect().top
                if (selectItemX > l && selectItemY > t && selectItemX < l + w && selectItemY < t + h) {
                    let anchorId = `anchor_${fileDivs[i].id.split('_')[1]}_${fileDivs[i].id.split('_')[2]}`
                    try {
                        let anchorItem = document.getElementById(anchorId)
                        console.log(anchorItem.id)
                    } catch (e) {
                        const shape = circle(fileDivs[i].getAttribute('x'), fileDivs[i].getAttribute('y'), anchorId)
                        anchor.appendChild(shape);
                        // 该DOM元素被选中，进行处理
                        makeAnchortags(anchorId)
                    }

                    // 加上顏色
                    //fileDivs[i].classList.add('select-stair')
                }
            }
            // 打印被选中DOM元素
            console.log(selectedEls);
            // ===============選擇梯位===================== 確認儲存
            // 恢复参数
            selDiv.style.display = 'none';
            anchorSelectClose();
        }


    }

    function onMouseMoveModeAnchor(e) {
        if (!mouseOn) return;
        clearEventBubble(e);
        var _x = e.clientX;
        var _y = e.clientY;
        var selDiv = document.getElementById('selectDiv');
        selDiv.style.display = 'block';
        selDiv.style.left = Math.min(_x, startX) + 'px';
        selDiv.style.top = Math.min(_y, startY) + 'px';
        selDiv.style.width = Math.abs(_x - startX) + 'px';
        selDiv.style.height = Math.abs(_y - startY) + 'px';
    }

    function onMouseDownModeAnchor(e) {
        clearEventBubble(e);
        if (e.buttons !== 1 || e.which !== 1) return;
        if (e.shiftKey) {
            mouseStopId = setTimeout(function () {
                mouseOn = true;
                startX = e.clientX;
                startY = e.clientY;
                var selDiv = document.createElement('div');
                selDiv.style.cssText = 'position:absolute;width:0;height:0;margin:0;padding:0;border:1px dashed #eee;background-color:#aaa;z-index:1000;opacity:0.6;display:none;';
                selDiv.id = 'selectDiv';
                document.body.appendChild(selDiv);
                selDiv.style.left = startX + 'px';
                selDiv.style.top = startY + 'px';
            }, 300);
        }
    }

    function onMouseUpModeHigh(e) {
        if (dblclickEvent.classList.contains('dblclick')) {
            if (!mouseOn) return;
            clearEventBubble(e);
            mouseOn = false;
            var selDiv = document.getElementById('selectDiv');
            var fileDivs = document.getElementsByTagName('rect')
            var selectedEls = [];
            dblclickEvent.classList.remove('dblclick')
            // 获取参数
            var l = selDiv.offsetLeft;
            var t = selDiv.offsetTop;
            var w = selDiv.offsetWidth;
            var h = selDiv.offsetHeight;
            console.log(fileDivs.length)
            console.log(l, t, w, h, "選擇區塊高")
            for (var i = 0; i < fileDivs.length; i++) {
                var sl = fileDivs[i].offsetWidth + fileDivs[i].offsetLeft;
                var st = fileDivs[i].offsetHeight + fileDivs[i].offsetTop;
                if (fileDivs[i].getBoundingClientRect().right > l && fileDivs[i].getBoundingClientRect().bottom > t
                    && fileDivs[i].getBoundingClientRect().left < l + w && fileDivs[i].getBoundingClientRect().top < t + h) {
                    // 该DOM元素被选中，进行处理
                    selectedEls.push(fileDivs[i]);
                    // 跳出彈框
                    // 加上顏色
                }
            }
            // 打印被选中DOM元素
            selDiv.style.display = 'none';

            console.log(selectedEls);

            // ===============選擇梯位===================== 確認儲存
            // 恢复参数
            setTimeout(setRectHighInput(selectedEls), 400)
        }


    }

    function onMouseMoveModeHigh(e) {
        if (!mouseOn) return;
        clearEventBubble(e);
        var _x = e.clientX;
        var _y = e.clientY;
        var selDiv = document.getElementById('selectDiv');
        selDiv.style.display = 'block';
        selDiv.style.left = Math.min(_x, startX) + 'px';
        selDiv.style.top = Math.min(_y, startY) + 'px';
        selDiv.style.width = Math.abs(_x - startX) + 'px';
        selDiv.style.height = Math.abs(_y - startY) + 'px';
    }

    function onMouseDownModeHigh(e) {
        clearEventBubble(e);
        if (e.buttons !== 1 || e.which !== 1) return;
        if (e.shiftKey) {
            mouseStopId = setTimeout(function () {
                mouseOn = true;
                startX = e.clientX;
                startY = e.clientY;
                var selDiv = document.createElement('div');
                selDiv.style.cssText = 'position:absolute;width:0;height:0;margin:0;padding:0;border:1px dashed #eee;background-color:#aaa;z-index:1000;opacity:0.6;display:none;';
                selDiv.id = 'selectDiv';
                document.body.appendChild(selDiv);
                selDiv.style.left = startX + 'px';
                selDiv.style.top = startY + 'px';
            }, 300);
        }
    }


    function clearEventBubble(e) {
        if (e.stopPropagation) e.stopPropagation();
        else e.cancelBubble = true;
        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;
    }
}

function makeStairtags(id) {
    const stairSelect = document.getElementById("stairSelect");
    const controlBar = document.getElementById("control-bar");
    let item = `
        <div class="stairList">
          <span data-id="${id}" class="label label-default">
            ${id}  
            <button type="button" class="close" data-dismiss="alert">
              <span>&times;</span>
            </button>
          </span>
        </div>`;

    // 使用 querySelectorAll 获取所有具有 "stairList" 类名的元素
    const stairTags = document.querySelectorAll('.stairList');

    if (stairTags.length > 0) {
        let check = true;
        stairTags.forEach(tag => {
            let arrId = tag.firstElementChild.dataset.id;
            if (arrId === id) {
                check = false;
            }
        });
        if (check) {
            stairSelect.innerHTML += item;
        }
    } else {
        stairSelect.innerHTML += item;
    }

    if (stairSelect.childElementCount > 0) {
        controlBar.classList.remove("selecter-close");
        console.log(stairSelect.childElementCount);
    }
}

function stairSelectClose() {
    const stairSelect = document.getElementById("stairSelect")
    const anchorSelect = document.getElementById("anchorSelect")
    const controlBar = document.getElementById("control-bar")
    stairSelect.addEventListener('click', e => {
        const target = e.target
        if (target.innerHTML === "×") {
            // 取得刪除目標
            let targetId = target.parentElement.parentElement.dataset.id
            // 取消目標長方形顏色
            let rectTarget = document.getElementById(targetId)
            rectTarget.classList.remove("select-stair")
            // 取消目標列表內容
            let targetItem = target.parentElement.parentElement.parentElement
            targetItem.remove();
            //刪除梯子
            const str = targetId.split("_")
            const stairId = `stair_${str[1]}_${str[2]}`
            deleteStair(stairId)
        }
        if (stairSelect.childElementCount === 0 && anchorSelect.childElementCount === 0) {
            controlBar.classList.add("selecter-close")
        }
    })
}

// 設定anchor tags
function makeAnchortags(id) {
    const anchorSelect = document.getElementById("anchorSelect");
    const controlBar = document.getElementById("control-bar");
    let item = `
        <div class="anchorList">
          <span data-id="${id}" class="label label-default">
            ${id}  
            <button type="button" class="close" data-dismiss="alert">
              <span>&times;</span>
            </button>
          </span>
        </div>`;

    // 使用 querySelectorAll 获取所有具有 "anchorList" 类名的元素
    const anchorTags = document.querySelectorAll('.anchorList');

    if (anchorTags.length > 0) {
        let check = true;
        anchorTags.forEach(tag => {
            let arrId = tag.firstElementChild.dataset.id;
            if (arrId === id) {
                check = false;
            }
        });
        if (check) {
            anchorSelect.innerHTML += item;
        }
    } else {
        anchorSelect.innerHTML += item;
    }

    if (anchorSelect.childElementCount > 0) {
        controlBar.classList.remove("selecter-close");
    }
}

// 關閉 anchor tags 
function anchorSelectClose() {
    const stairSelect = document.getElementById("stairSelect")
    const anchorSelect = document.getElementById("anchorSelect")
    const controlBar = document.getElementById("control-bar")
    anchorSelect.addEventListener('click', e => {
        const target = e.target
        if (target.innerHTML === "×") {
            // 取得刪除目標
            let targetId = target.parentElement.parentElement.dataset.id
            stairList = stairList.filter(item => item !== targetId);
            // 取消目標長方形顏色
            let circleTarget = document.getElementById(targetId)
            circleTarget.remove();
            // 取消目標列表內容
            let targetItem = target.parentElement.parentElement.parentElement
            targetItem.remove();

        }
        if (stairSelect.childElementCount === 0 && anchorSelect.childElementCount === 0) {
            controlBar.classList.add("selecter-close")
        }
    })
}


// 重設座標
const btnResetSvg = document.querySelector("#btnResetSvg")
btnResetSvg.addEventListener('click', e => {
    e.preventDefault()
    let viewBox = `${0} ${0} ${maxborder.x} ${maxborder.y}`
    //	設定 SVG viewBox 屬性值
    svg.setAttribute('viewBox', viewBox)
})
// 取消、儲存
const btnCancelSelect = document.querySelector("#btnCancelSelect")
btnCancelSelect.addEventListener('click', e => {
    e.preventDefault()
})
const btnSaveSelect = document.querySelector("#btnSaveSelect")
const stairList = [];
btnSaveSelect.addEventListener('click', e => {
    e.preventDefault()
    const stairSelectList = document.querySelector("#stairSelect")
    const stairTags = document.querySelectorAll('.stairList');

    stairTags.forEach(tag => {
        let arrId = tag.firstElementChild.dataset.id;
        if (!stairList.includes(arrId)) {
            stairList.push(arrId)
            let target = document.getElementById(arrId);
            const targetWidth = target.getAttribute('width');
            const targetHeight = target.getAttribute('height');
            let rotate = "";
            if (targetWidth > targetHeight) {
                rotate = "x";
            } else {
                rotate = "y";
            }
            makeStair(arrId.split('_')[1], arrId.split('_')[2], targetHeight, targetWidth, rotate);
        }
    });
})

// 刪除椅子
function deleteStair(id) {
    const target = document.getElementById(id);
    if (!target) {
        return;
    }
    const parent = target.parentElement;
    parent.removeChild(target);
}

/**
 * 回到上一步 ，刪除節點下所有的nodes
 * */
const backTostep02 = document.getElementById("step02back")
backTostep02.addEventListener('click', e => {
    while (rect.firstChild) {
        rect.removeChild(rect.firstChild);
    }
    while (rectHigh.firstChild) {
        rectHigh.removeChild(rectHigh.firstChild);
    }
    while (anchor.firstChild) {
        anchor.removeChild(anchor.firstChild);
    }
    while (stair.firstChild) {
        stair.removeChild(stair.firstChild);
    }
    const desc = document.getElementById("desc")
    while (desc.firstChild) {
        desc.removeChild(desc.firstChild);
    }
})

// 儲存步驟2
const submit2 = document.getElementById("step02")
submit2.addEventListener('click', e => {
    let children = rectHigh.childNodes;
    scaffoldArray.height = []

    for (i = 0; i < children.length; i++) {
        if (children[i].nodeType === Node.ELEMENT_NODE) {
            let str = children[i].id.split('_')
            let x = parseInt(str[2])
            let y = parseInt(str[3])
            let z = parseInt(children[i].textContent)
            if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                let item = {
                    x: parseInt(str[2]),
                    y: parseInt(str[3]),
                    z: parseInt(children[i].textContent)
                }
                scaffoldArray.height.push(`${x}_${y}_${z}`)
                scaffoldArray.grid.push(item)
            }
        }
    }

    // 計算梯位位置
    recordStair()
    // 計算錨定點位置
    recordAnchor()
    // 建立三視圖
    buildThreeView()
})

// 計算梯位位置
function recordStair() {
    const children = stair.childNodes;
    for (i = 0; i < children.length; i++) {
        if (children[i].nodeType === Node.ELEMENT_NODE) {
            let str = children[i].id.split('_')
            let x = parseInt(str[1])
            let y = parseInt(str[2])
            if (!isNaN(x) && !isNaN(y)) {
                let item = {
                    x: parseInt(x),
                    y: parseInt(y)
                }
                scaffoldArray.stair.push(item)
            }
        }
    }
}
// 計算錨定點位置
function recordAnchor() {
    const children = anchor.childNodes;
    for (i = 0; i < children.length; i++) {
        if (children[i].nodeType === Node.ELEMENT_NODE) {
            let str = children[i].id.split('_')
            let x = parseInt(str[1])
            let y = parseInt(str[2])
            if (!isNaN(x) && !isNaN(y)) {
                const anchorZ = getAnchorZ(x, y) // 之後要改
                anchorZ.forEach(el => {
                    let item = {
                        x: parseInt(x),
                        y: parseInt(y), // 計算各個xy的z值
                        z: parseInt(el)
                    }
                    scaffoldArray.anchorPoint.push(item)
                })

            }
        }
    }
}

// 指定三視圖位置
let threeViewBorder = []
const threeViewCoord = {
    x: 0,
    y: 0,
    z: 0
};
let threeViewCount;
let xyArray = []
// 建立三視圖
function buildThreeView() {

    const grid = scaffoldArray.grid;
    const size = scaffoldArray.base;
    threeViewCount = grid.reduce((acc, item) => {
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
    threeViewCoord.x = threeViewCount.x * itemValue.itemX;
    threeViewCoord.y = threeViewCount.y * itemValue.itemY;
    threeViewCoord.z = threeViewCount.z * itemValue.itemZ;
    console.log(`threeviewZ ${threeViewCount.z} * ${itemValue.itemZ}`)
    console.log(`threeviewX ${threeViewCount.x} * ${itemValue.itemX}`)
    console.log(`threeviewY ${threeViewCount.y} * ${itemValue.itemY}`)

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
    const sizeXZ = { x: itemValue.itemX, y: itemValue.itemZ }
    const sizeYZ = { x: itemValue.itemY, y: itemValue.itemZ }
    const sizeXY = { x: itemValue.itemX, y: itemValue.itemY }
    getRectArray(30 + threeViewCoord.y + 50, threeViewCoord.y, sizeXY, topViewArray, 'topView')
    threeViewBorder.push({ name: "topView", x: 30 + threeViewCoord.y + 50, y: 0, size: sizeXY })
    getRectArray(30, threeViewCoord.z + threeViewCoord.y + 140, sizeYZ, leftSideViewArray, 'leftSideView')
    threeViewBorder.push({ name: "leftSideView", x: 30, y: threeViewCoord.y, size: sizeYZ })
    getRectArray(30 + threeViewCoord.y + 50, threeViewCoord.z + threeViewCoord.y + 140, sizeXZ, frontViewArray, 'frontView')
    threeViewBorder.push({ name: "frontView", x: 30 + threeViewCoord.y + 50, y: threeViewCoord.y, size: sizeXZ })
    getRectArray(30 + threeViewCoord.y + threeViewCoord.x + 100, threeViewCoord.z + threeViewCoord.y + 140, sizeYZ, rightSideViewArray, 'rightSideView')
    threeViewBorder.push({ name: "rightSideView", x: 30 + threeViewCoord.y + threeViewCoord.x + 100, y: threeViewCoord.y, size: sizeYZ })
    getRectArray(30 + threeViewCoord.y * 2 + threeViewCoord.x + 150, threeViewCoord.z + threeViewCoord.y + 140, sizeXZ, rearViewArray, 'rearView')
    threeViewBorder.push({ name: "rearView", x: 30 + threeViewCoord.y * 2 + threeViewCoord.x + 150, y: threeViewCoord.y, size: sizeXZ })

    xyArray = [
        { type: 'topView', x: 30 + threeViewCoord.y + 50, y: threeViewCoord.y },
        { type: 'leftSideView', x: 30, y: threeViewCoord.z + threeViewCoord.y + 140 },
        { type: 'frontView', x: 30 + threeViewCoord.y + 50, y: threeViewCoord.z + threeViewCoord.y + 140 },
        { type: 'rightSideView', x: 30 + threeViewCoord.y + threeViewCoord.x + 100, y: threeViewCoord.z + threeViewCoord.y + 140 },
        { type: 'rearView', x: 30 + threeViewCoord.y * 2 + threeViewCoord.x + 150, y: threeViewCoord.z + threeViewCoord.y + 140 }
    ]
    getAnchorArray(xyArray)
}

function getRectArray(x, y, size, arr, id) {
    console.log(y, id)
    const target = document.getElementById(id)
    for (i = 0; i < arr.length; i++) {
        let zSize = arr[i]
        for (j = 0; j < zSize; j++) {
            let rectStartX = x + i * size.x
            let rectStartY = y - (j + 1) * size.y
            let rectId = `${id}_${i + 1}_${j + 1}`
            if (id !== 'topView') {
                let shape = rectangle(rectStartX, rectStartY, size.x, size.y, rectId)
                target.appendChild(shape);
                if (i % 2 === 0) {
                    if (i > arr.length / 2) {
                        line(rectStartX, rectStartX + size.x, rectStartY, rectStartY + size.y, id)
                    } else {
                        line(rectStartX, rectStartX + size.x, rectStartY + size.y, rectStartY, id)
                    }
                }
            } else {
                // 建立高的名稱
                const textValue = `text_rect_${i + 1}_${j + 1}`
                const textItem = document.getElementById(textValue).innerHTML
                if (parseInt(textItem) > 0) {
                    let shape = rectangle(rectStartX, rectStartY, size.x, size.y, rectId)
                    target.appendChild(shape);
                    const shapeHigh = rectangleHeight(rectStartX, rectStartY, size.x, size.y, textItem)
                    target.appendChild(shapeHigh)
                }
            }
        }
    }
}

function getAnchorArray(xyArr) {
    const target = document.getElementById("anchorFiveView")
    const anchorList = scaffoldArray.anchorPoint
    const topViewAnchor = xyArr[0]
    const leftSideViewAnchor = xyArr[1]
    const frontViewAnchor = xyArr[2]
    const rightViewAnchor = xyArr[3]
    const rearViewAnchor = xyArr[4]
    let circleX
    let circleY
    let anchorId

    anchorList.forEach(el => {
        const anchorId3D = `anchor3D_${el.x}_${el.y}_${el.z}`
        makeAnchortags3D(anchorId3D)
        // topView
        circleX = topViewAnchor.x + (el.x - 1) * itemValue.itemX
        circleY = topViewAnchor.y - (el.y) * itemValue.itemY
        console.log(threeViewCount.z, el.z)
        anchorId = `anchor_topView_${el.x}_${el.y}_${el.z}`
        let shapeT = circle(circleX, circleY, anchorId)
        target.appendChild(shapeT);
        // left side view
        circleX = leftSideViewAnchor.x + (threeViewCount.y - el.y) * itemValue.itemY
        circleY = leftSideViewAnchor.y - (el.z) * itemValue.itemZ
        anchorId = `anchor_leftSideView_${el.x}_${el.y}_${el.z}`
        let shapeL = circle(circleX, circleY, anchorId)
        target.appendChild(shapeL);
        // front view
        circleX = frontViewAnchor.x + (el.x - 1) * itemValue.itemX
        circleY = frontViewAnchor.y - (el.z) * itemValue.itemZ
        anchorId = `anchor_frontView_${el.x}_${el.y}_${el.z}`
        let shapeF = circle(circleX, circleY, anchorId)
        target.appendChild(shapeF);
        // right side view
        circleX = rightViewAnchor.x + (el.y) * itemValue.itemY
        circleY = rightViewAnchor.y - (el.z) * itemValue.itemZ
        anchorId = `anchor_rightSideView_${el.x}_${el.y}_${el.z}`
        let shapeR = circle(circleX, circleY, anchorId)
        target.appendChild(shapeR);

        // rear view
        circleX = rearViewAnchor.x + (threeViewCount.x - el.x) * itemValue.itemX
        circleY = rearViewAnchor.y - (el.z) * itemValue.itemZ
        anchorId = `anchor_rearView_${el.x}_${el.y}_${el.z}`
        let shapeB = circle(circleX, circleY, anchorId)
        target.appendChild(shapeB);
    })
}


// 設定anchor tags
function makeAnchortags3D(id) {
    const anchorSelect3D = document.getElementById("anchorSelect3D");
    const controlBar = document.getElementById("control-bar");
    const div = document.createElement("div");
    div.className = "anchorList";
    div.innerHTML =
        `<span data-id="${id}" class="label label-default">
            ${id}  
            <button type="button" class="close" data-dismiss="alert">
              <span>&times;</span>
            </button>
          </span>`

    // 使用 querySelectorAll 获取所有具有 "anchorList" 类名的元素
    const anchorTags = document.querySelectorAll('.anchorList');

    if (anchorTags.length > 0) {
        let check = true;
        anchorTags.forEach(tag => {
            let arrId = tag.firstElementChild.dataset.id;
            if (arrId === id) {
                check = false;
            }
        });
        if (check) {
            anchorSelect3D.appendChild(div);
        }
    } else {
        anchorSelect3d.appendChild(div);
    }

    if (anchorSelect.childElementCount > 0) {
        controlBar.classList.remove("selecter-close");
    }
    anchorSelectClose3D();
}
// 關閉 anchor tags 
function anchorSelectClose3D() {
    const anchorSelect3D = document.getElementById("anchorSelect3D")
    anchorSelect3D.addEventListener('click', e => {
        const target = e.target
        if (target.innerHTML === "×") {
            // 取得刪除目標
            let targetId = target.parentElement.parentElement.dataset.id
            let arr = targetId.split('_')
            // 取消目標長方形顏色
            let circleTargetT = document.getElementById(`anchor_topView_${arr[1]}_${arr[2]}_${arr[3]}`)
            circleTargetT.remove();
            let circleTargetL = document.getElementById(`anchor_leftSideView_${arr[1]}_${arr[2]}_${arr[3]}`)
            circleTargetL.remove();
            let circleTargetF = document.getElementById(`anchor_frontView_${arr[1]}_${arr[2]}_${arr[3]}`)
            circleTargetF.remove();
            let circleTargetR = document.getElementById(`anchor_rightSideView_${arr[1]}_${arr[2]}_${arr[3]}`)
            circleTargetR.remove();
            let circleTargetB = document.getElementById(`anchor_rearView_${arr[1]}_${arr[2]}_${arr[3]}`)
            circleTargetB.remove();
            // 取消目標列表內容
            let targetItem = target.parentElement.parentElement.parentElement
            targetItem.remove();
        }
    })
}

function getAnchorZ(x, y) {
    const targetText = `text_rect_${x}_${y}`
    const target = document.getElementById(targetText)
    let value = target.innerHTML
    value = parseInt(value)
    let arr = []
    let count = 0
    while (value > 2) {
        count += 3
        value -= 3
        arr.push(count)
    }
    return arr
}


// 
const selectView = document.getElementById("selectMode2")
selectView.addEventListener('change', e => {
    let selectViewValue;
    selectViewValue = document.querySelector('input[name="inputMode"]:checked').value
    const alert = document.querySelector(".alert")
    // 傳入模式
    alert.innerHTML = `移動到${selectViewValue}區塊！`
    $(".alert").addClass("show")
    window.setTimeout(function () {
        $(".alert").removeClass("show")
    }, 1000)
    if (typeof selectViewValue !== "undefined") {
        if (selectViewValue.includes("平面圖")) {
            resetViewBox(threeViewCoord.y + 50, 0, threeViewCoord.x, threeViewCoord.y, "step03Svg")
        } else if (selectViewValue.includes("左側視圖")) {
            resetViewBox(0, threeViewCoord.y + 100, threeViewCoord.y, threeViewCoord.z + 60, "step03Svg")
        } else if (selectViewValue.includes("正面圖")) {
            resetViewBox(100 + threeViewCoord.y, threeViewCoord.y + 100, threeViewCoord.x, threeViewCoord.z + 60, "step03Svg")
        } else if (selectViewValue.includes("右側視圖")) {
            resetViewBox(150 + threeViewCoord.x + threeViewCoord.y, threeViewCoord.y + 100, threeViewCoord.y, threeViewCoord.z + 60, "step03Svg")
        } else if (selectViewValue.includes("後視圖")) {
            resetViewBox(200 + threeViewCoord.x + threeViewCoord.y * 2, threeViewCoord.y + 100, threeViewCoord.x, threeViewCoord.z + 60, "step03Svg")
        }
    }
})

// 重設步驟三座標
function resetViewBox(x1, y1, maxborderX, maxborderY, target) {
    const targetSvg = document.getElementById(target)
    const viewBox = `${x1} ${y1} ${maxborderX} ${maxborderY}`
    targetSvg.setAttribute('viewBox', viewBox)
}


// 建立正面立圖
function buildStant(arr) {
    console.log(maxborder)
    let x = 30
    let y = maxborder.y + 140
    // 找出最大x, z
    let grid = scaffoldArray.grid
    let itemMaxX = 0
    let itemMaxZ = 0
    grid.forEach(item => {
        let itemX = item.x
        let itemZ = item.z
        if (itemMaxX < itemX) {
            itemMaxX = itemX
        }
        if (itemMaxZ < itemZ) {
            itemMaxZ = itemZ
        }
    })
    for (i = 0; i < itemMaxX; i++) {
        let coordX = 0;
    }

    console.log(arr)
    console.log(itemValue)
    console.log(scaffoldArray)
}

// 建立樓高
function setRectHighInput(rectArray) {
    const selDiv = document.getElementById("selectDiv")
    selDiv.style.display = 'none'
    let str = ``

    rectArray.forEach(el => {
        const coord = el.id.split('_')
        str += `, (${coord[1]}, ${coord[2]})`
    })
    str = str.substring(1, str.length)
    if (rectArray.length > 0) {
        inputValue = prompt(`座標組[${str}] 請輸入數值`)
        if (inputValue !== "") {
            if (inputValue === '0') {
                rectArray.forEach(el => {
                    const coord = el.id.split('_')
                    rectHigh.removeChild(document.getElementById(`text_rect_${coord[1]}_${coord[2]}`))
                    el.remove();
                    try {
                        stair.removeChild(document.getElementById(`stair_${coord[1]}_${coord[2]}`))
                    } catch (e) {
                    }
                })
            } else if (Number(inputValue) > 0) {
                rectArray.forEach(el => {
                    const coord = el.id.split('_')
                    document.querySelector(`#text_rect_${coord[1]}_${coord[2]}`).innerHTML = inputValue
                })
            }
        }
    }
}

/** 
 * 回到步驟二
 */
const backToStep03 = document.getElementById("backTostep03")
backToStep03.addEventListener("click", e => {
    const topView03 = document.getElementById("topView")
    const frontView03 = document.getElementById("frontView03")
    const rearView03 = document.getElementById("rearView")
    const leftSideView03 = document.getElementById("leftSideView")
    const rightSideView03 = document.getElementById("rightSideView")
    const anchor3D_view = document.getElementById("anchorFiveView")
    while (topView03.firstChild) {
        topView03.removeChild(topView03.firstChild)
    }
    while (frontView03.firstChild) {
        frontView03.removeChild(frontView03.firstChild)
    }
    while (rearView03.firstChild) {
        rearView03.removeChild(rearView03.firstChild)
    }
    while (leftSideView03.firstChild) {
        leftSideView03.removeChild(leftSideView03.firstChild)
    }
    while (rightSideView03.firstChild) {
        rightSideView03.removeChild(rightSideView03.firstChild)
    }
    while (anchor3D_view.firstChild) {
        anchor3D_view.removeChild(anchor3D_view.firstChild)
    }
})

// 取得滑鼠滾動

// 取得長方形點part02
rectHigh.addEventListener("click", e => {
    console.log(step02DrawMode)
    if (step02DrawMode === "樓高") {
        let target = e.target
        let targetId = target.getAttribute('id')
        let str = targetId.split('_')
        let inputValue;
        if (str.length === 3) {
            inputValue = prompt(`座標(${parseInt(str[2])}, ${parseInt(str[1])})請輸入數值`)
            targetId = `text_${targetId}`
        } else {
            inputValue = prompt(`座標(${parseInt(str[3])}, ${parseInt(str[2])})請輸入數值`)
        }
        try {
            inputValue = inputValue.trim();
            if (inputValue === "0") {
                // 移除長方形
                rectHigh.removeChild(document.getElementById(`${targetId}`))
                targetId = targetId.substring(5, targetId.length)
                rect.removeChild(document.getElementById(`${targetId}`))
            } else if (inputValue === "") {
                console.log("inputValue")
            } else {
                document.querySelector(`#${targetId}`).innerHTML = inputValue
            }
        } catch (e) {
            console.error(e)
        }
    }
})

// 關閉並儲存
const textDesc = document.getElementById("saveDescText")
textDesc.addEventListener('click', e => {
    e.preventDefault();
    const text = document.getElementById("descText").value
    if (text.length > 0) {
        scaffoldArray.description = text
        console.log(text)
    }
    $("#exampleModal").modal('hide')
})

// 關閉並儲存
const saveAddAnchor = document.getElementById("saveAddAnchor")
saveAddAnchor.addEventListener('click', e => {
    e.preventDefault();
    const addAnchorInfoX = document.getElementById("addAnchorInfoX").value
    const addAnchorInfoY = document.getElementById("addAnchorInfoY").value
    const addAnchorInfoZ = document.getElementById("addAnchorInfoZ").value
    if (addAnchorInfoX === "" && addAnchorInfoY === "" && addAnchorInfoZ === "") {
        console.log("str是空字串");
    } else {
        scaffoldArray.anchorPoint.push({ x: parseInt(addAnchorInfoX), y: parseInt(addAnchorInfoY), z: parseInt(addAnchorInfoZ) })
        console.log(xyArray)
        getAnchorArray(xyArray)
    }
    $("#addAnchorModal").modal('hide')
})



// 上傳並下載

const finishAndDownload = document.getElementById('finishAndDownload')
finishAndDownload.addEventListener('click', e => {
  const svgData = document.getElementById('svg').outerHTML;
  convertSvgToDxf(svgData);
})


const convertSvgToDxf = (svgData) => {
    const newJson = getNewJson(scaffoldArray)
    return axios.post('/api', {
        data: JSON.stringify(newJson)
    })
        .then(response => {
            const res = response.data
            if (res === "success") {
                location.href = "/success.dxf"
            }
            console.log(response.data)
        })
        .catch(error => {
            console.error(error);
        });
};
