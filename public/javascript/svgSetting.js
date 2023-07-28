/**
 * 設定svg及相關的操作
 */
// 定義基礎函數
let scaffoldArray = {
  base: {
    long: 150,
    width: 90,
    height: 180,
    coordX: 7,
    coordY: 8,
    coordZ: 5,
    scaling: 1,
  },
  fiveViewGrid: {
    topView: [],
    leftSideView: [],
    rightSideView: [],
    frontView: [],
    rearView: [],
  },
  role: {
    acnchor: 1,
    rung: 1,
  },
  height: [],
  baseGrid: [],
  grid: [],
  stair: [],
  anchor: [],
  rung: [],
  bracing: [],
  description: { coord: [], text: "" },
};
// 定義長寬高各格子
let baseWidth = {
  x: [],
  y: [],
  z: [],
};

// 定義最大座標
let maxborder = {
  x: 0,
  y: 0,
  z: 0,
};
// 定義模式
let step02DrawMode = "";

// 定義初始座標
let step02StartXY = {
  x: 30,
  y: 30,
};

// 輸入框定義值
/**
 * 紀錄工程案號
 */
let caseName = "default";
const recordCaseName = (e) => {
  const caseNameTag = document.getElementById("case-name");
  caseName = caseNameTag.value;
};

// 步驟一 base information, 如果數值改變就更新數值
recordBaseinfo();
function recordBaseinfo() {
  scaffoldArray.base.coordX = Number(
    document.querySelector("#item-x-count").value
  );
  scaffoldArray.base.coordY = Number(
    document.querySelector("#item-y-count").value
  );
  scaffoldArray.base.coordZ = Number(
    document.querySelector("#item-z-count").value
  );
  scaffoldArray.base.long = Number(document.querySelector("#item-long").value);
  scaffoldArray.base.width = Number(
    document.querySelector("#item-width").value
  );
  scaffoldArray.base.height = Number(
    document.querySelector("#item-height").value
  );
  scaffoldArray.role.acnchor = Number(
    document.querySelector("#anchor-role").value
  );
}

// 進入步驟二畫方格圖
// 計算方式： 使用步驟1 submit 確認後送出 / 使用步驟2 重新計算產出
const submit = document.querySelector("#step01");
let itemValue = {
  itemX: 30,
  itemY: 0,
  itemZ: 0,
};
submit.addEventListener("click", (e) => {
  recordBaseinfo();
  // 計算呈現中長寬高的比例畫法
  // 設定寬為30px(coordX) 對應的Ｙ及Ｚ的畫法
  // 更正，確保字體最小大小
  if (
    scaffoldArray.base.long > 0 &&
    scaffoldArray.base.width > 0 &&
    scaffoldArray.base.height > 0
  ) {
    // 都大於0的狀況下啟用計算
    // 長比較短
    if (scaffoldArray.base.long > scaffoldArray.base.width) {
      itemValue.itemX = 30;
      itemValue.itemY =
        (scaffoldArray.base.long / scaffoldArray.base.width) * 30;
      itemValue.itemZ =
        (scaffoldArray.base.height / scaffoldArray.base.width) * 30;
      scaffoldArray.base.scaling = 30 / scaffoldArray.base.width;
    } else if (scaffoldArray.base.long < scaffoldArray.base.width) {
      itemValue.itemY = 30;
      itemValue.itemX =
        (scaffoldArray.base.width / scaffoldArray.base.long) * 30;
      itemValue.itemZ =
        (scaffoldArray.base.height / scaffoldArray.base.long) * 30;
      scaffoldArray.base.scaling = 30 / scaffoldArray.base.long;
    } else {
      itemValue.itemX = 30;
      itemValue.itemY = 30;
      itemValue.itemZ =
        (scaffoldArray.base.height / scaffoldArray.base.long) * 30;
      scaffoldArray.base.scaling = 30 / scaffoldArray.base.height;
    }
  }
  // 建立基礎長度
  createBaseWidth();
  // 產生平面底圖
  arrowDesc(); // 產生箭頭
});
//drawBaseGrid
// 畫基礎網格
function createBaseWidth() {
  const xCount = scaffoldArray.base.coordX;
  const yCount = scaffoldArray.base.coordY;
  const zCount = scaffoldArray.base.coordZ;
  // INITIAL baseWidth
  baseWidth.x = [];
  baseWidth.y = [];
  baseWidth.z = [];
  for (i = 0; i < xCount; i++) {
    const item = {
      id: i + 1,
      startCoor: i * scaffoldArray.base.width,
      border: scaffoldArray.base.width,
    };
    baseWidth.x.push(item);
  }
  for (i = 0; i < yCount; i++) {
    const item = {
      id: i + 1,
      startCoor: i * scaffoldArray.base.long,
      border: scaffoldArray.base.long,
    };
    baseWidth.y.push(item);
  }
  for (i = 0; i < zCount; i++) {
    const item = {
      id: i + 1,
      startCoor: i * scaffoldArray.base.height,
      border: scaffoldArray.base.height,
    };
    baseWidth.z.push(item);
  }
  drawBaseGrid();
}

// 畫基礎網格
function drawBaseGrid() {
  // 重置所有
  scaffoldArray.baseGrid = [];
  let yMax = 0;
  baseWidth.y.forEach((el) => {
    yMax += el.border;
  });
  let x = 0;
  baseWidth.x.forEach((el) => {
    y = yMax;
    baseWidth.y.forEach((ek) => {
      z = 0;
      y -= ek.border;
      baseWidth.z.forEach((ej) => {
        const gridItem = {
          x: el.id,
          y: ek.id,
          z: ej.id,
          startCoor: [x, y, z],
          border: [el.border, ek.border, ej.border],
        };
        scaffoldArray.baseGrid.push(gridItem);
        z += ej.border;
      });
    });
    x += el.border;
  });
  createRectangleSvg(scaffoldArray.baseGrid);
}

// 畫方格
function createRectangleSvg(coorArray) {
  // 尋找最大Y
  const scale = scaffoldArray.base.scaling;
  let maxY = -0.1;
  let maxX = -0.1;
  let maxZ = -0.1;
  let arrayX = [];
  let arrayY = [];
  let arrayZ = [];
  let countY = -0.1;
  coorArray.forEach((el) => {
    const itemY = el.startCoor[1] * scale + el.border[1] * scale; // y只要找最大的那個
    const itemX = el.startCoor[0] * scale + el.border[0] * scale;
    const itemZ = el.startCoor[2] * scale + el.border[2] * scale;
    const itemYId = Number(el.y);
    if (itemX > maxX) {
      arrayX.push({
        id: el.x,
        startCoor: el.startCoor[0] * scale,
        border: el.border[0] * scale,
      });
      maxX = itemX;
    }
    if (itemY > maxY) {
      maxY = itemY;
    }
    if (itemYId > countY) {
      countY = itemYId;
      arrayY.push({
        id: el.y,
        startCoor: el.startCoor[1] * scale,
        border: el.border[1] * scale,
      });
    }
    if (itemZ > maxZ) {
      arrayZ.push({
        id: el.z,
        startCoor: el.startCoor[2] * scale,
        border: el.border[2] * scale,
      });
      maxZ = itemZ;
    }
  });
  maxborder.x = maxX;
  maxborder.y = maxY;

  // 重置所有
  initialStepSvg();

  // 定義高寬
  let viewBox = `${0} ${0} ${maxborder.x} ${maxborder.y + 40}`;
  //	設定 SVG viewBox 屬性值
  svg.setAttribute("viewBox", viewBox);

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

  XYCoordArray.forEach((el) => {
    const coorX = el.startCoor[0] * scale + step02StartXY.x;
    const coorY = el.startCoor[1] * scale + step02StartXY.y;
    const width = el.border[0] * scale;
    const long = el.border[1] * scale;
    const id = `rect_${el.x}_${el.y}`;
    const shape = rectangle(coorX, coorY, width, long, id);
    const shapeHigh = rectangleHeight(coorX, coorY, width, long, id);
    rect.appendChild(shape);
    rectHigh.appendChild(shapeHigh);

    createDescText(coorX, coorY, width, long, id);
    // 網格與文字處理
  });
}

// 加入
function createDescText(coorX, coorY, width, long, id) {
  const coordX = document.getElementById(`descGrid_x_${id.split("_")[1]}`);
  const coordY = document.getElementById(`decsGrid_y_${id.split("_")[2]}`);
  if (!coordX) {
    // 新增一個
    const shape = descGridText(coorX, 0, width, 25, id.split("_")[1], "X");
    const shapeRect = descGridRect(coorX, 0, width, 25, id.split("_")[1], "X");
    if (shapeRect !== null) {
      desc.appendChild(shapeRect);
    }
    if (shape !== null) {
      desc.appendChild(shape);
    }
  }
  if (!coordY) {
    // 新增一個
    const shape = descGridText(0, coorY, 25, long, id.split("_")[2], "Y");
    const shapeRect = descGridRect(0, coorY, 25, long, id.split("_")[2], "Y");

    if (shapeRect !== null) {
      desc.appendChild(shapeRect);
    }
    if (shape !== null) {
      desc.appendChild(shape);
    }
  }
}

// 重製svg網格
function initialStepSvg() {
  // 重置網格
  const fragment = new DocumentFragment();
  while (rect.firstChild) {
    fragment.appendChild(rect.firstChild);
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
const rect = document.getElementById("rect");
const rectHigh = document.getElementById("rectHigh");
const anchor = document.getElementById("anchor");
const stair = document.getElementById("stair");
const desc = document.getElementById("desc");
const updrawer = document.querySelector("#updrawer");

/**
 * 主要元件 區塊
 */
// ======================================================================================= \\
// ======================================================================================= \\
// 建立平面底格
function rectangle(x, y, width, height, id) {
  var svgns = "http://www.w3.org/2000/svg";
  var shape = document.createElementNS(svgns, "rect");
  shape.setAttributeNS(null, "id", id);
  shape.setAttributeNS(null, "x", x);
  shape.setAttributeNS(null, "y", y); //width="150" height="150"
  shape.setAttributeNS(null, "width", width);
  shape.setAttributeNS(null, "height", height);
  shape.setAttributeNS(null, "fill", "white");
  shape.setAttributeNS(null, "stroke", "blue");
  return shape;
}
// 建立平面底格文字
function rectangleHeight(x, y, width, height, id) {
  // 校正
  let newX = x + width / 2;
  let newY = y + height / 2;
  var svgns = "http://www.w3.org/2000/svg";
  var shape = document.createElementNS(svgns, "text");
  shape.setAttributeNS(null, "id", "text_" + id);
  shape.setAttributeNS(null, "x", newX);
  shape.setAttributeNS(null, "y", newY); //width="150" height="150"
  shape.setAttributeNS(null, "dominant-baseline", "middle");
  shape.setAttributeNS(null, "text-anchor", "middle");
  shape.setAttributeNS(null, "font-size", "15");
  shape.innerHTML = scaffoldArray.base.coordZ;
  return shape;
}
// 建立錨定點圓形
function circle(cx, cy, id) {
  var svgns = "http://www.w3.org/2000/svg";
  var shape = document.createElementNS(svgns, "circle");
  shape.setAttributeNS(null, "id", id);
  shape.setAttributeNS(null, "cx", cx);
  shape.setAttributeNS(null, "cy", cy); //width="150" height="150"
  shape.setAttributeNS(null, "r", 7);
  shape.setAttributeNS(null, "fill", "rgba(255, 0, 0, 0.5)");
  shape.setAttributeNS(null, "stroke", "red");
  shape.setAttributeNS(null, "stroke-width", "2");
  return shape;
}

// 建立階梯
function makeStair(x, y, long, width, rotate) {
  // 建立一個group
  const childGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  let stairId = `stair_${x}_${y}`;
  childGroup.setAttribute("id", stairId);
  // 將子元素添加為父元素的子元素
  stair.appendChild(childGroup);

  // 取得該網格的起始值跟寬度
  const targetId = `rect_${x}_${y}`;
  const item = document.getElementById(targetId);
  const startX = Number(item.getAttribute("x"));
  const startY = Number(item.getAttribute("y"));
  const borderX = Number(item.getAttribute("width"));
  const borderY = Number(item.getAttribute("height"));

  // 確認方向
  // 直向
  if (rotate === "x") {
    // 橫向
    line(startX, startX + borderX, startY, startY, stairId);
    for (i = 0; i < 5; i++) {
      line(
        startX + (i * borderX) / 5,
        startX + (i * borderX) / 5,
        startY,
        startY - 10,
        stairId
      );
    }
    line(startX, startX + borderX, startY - 10, startY - 10, stairId);
  } else {
    // 直向
    line(startX, startX, startY, startY + borderY, stairId);
    for (i = 0; i < 5; i++) {
      line(
        startX,
        startX + 10,
        startY + (i * borderY) / 5,
        startY + (i * borderY) / 5,
        stairId
      );
    }
    line(startX + 10, startX + 10, startY, startY + borderY, stairId);
  }
}

function line(x1, x2, y1, y2, groupid) {
  var svgns = "http://www.w3.org/2000/svg";
  var shape = document.createElementNS(svgns, "line");
  const group = document.getElementById(groupid);
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
    newX = step02StartXY.x / 2;
    newY = y + height / 2;
    id = `descGrid_y_${number}_text`;
  } else {
    newY = step02StartXY.y / 2;
    newX = x + width / 2;
    id = `descGrid_x_${number}_text`;
  }
  const item = document.getElementById(id);
  if (!item) {
    var svgns = "http://www.w3.org/2000/svg";
    var shape = document.createElementNS(svgns, "text");
    shape.setAttributeNS(null, "id", id);
    shape.setAttributeNS(null, "x", newX);
    shape.setAttributeNS(null, "y", newY); //width="150" height="150"
    //shape.setAttributeNS(null, "stroke","#0000FF")
    shape.setAttributeNS(null, "fill", "red");
    shape.setAttributeNS(null, "dominant-baseline", "middle");
    shape.setAttributeNS(null, "text-anchor", "middle");
    shape.setAttributeNS(null, "font-size", "8");
    shape.innerHTML = number;
    return shape;
  } else {
    return null;
  }
}
function descGridRect(x, y, width, height, number, type) {
  let id = "";
  if (type === "Y") {
    id = `descGrid_y_${number}_rect`;
  } else {
    id = `descGrid_x_${number}_rect`;
  }
  const item = document.getElementById(id);
  if (!item) {
    var svgns = "http://www.w3.org/2000/svg";
    var shape = document.createElementNS(svgns, "rect");
    shape.setAttributeNS(null, "id", id);
    shape.setAttributeNS(null, "x", x);
    shape.setAttributeNS(null, "y", y); //width="150" height="150"
    shape.setAttributeNS(null, "width", width);
    shape.setAttributeNS(null, "height", height);
    shape.setAttributeNS(null, "fill", "white");
    shape.setAttributeNS(null, "stroke", "white");
    return shape;
  } else {
    return null;
  }
}

// 新增drid 點擊事件
desc.addEventListener("click", (e) => {
  const targetID = e.target.id;
  if (targetID.split("_")[0] === "descGrid") {
    const coord = targetID.split("_")[1];
    const id = targetID.split("_")[2];
    const value = prompt(
      `修改${coord === "x" ? "寬" : "長"}第${id}格，請輸入要更改的數值？`
    );
    if (value !== "") {
      if (Number(value) > 0) {
        if (coord === "x") {
          // 修改x格
          item = parseInt(id) - 1;
          baseWidth.x[item].border = Number(value);
          fixArrayCoor();
        } else {
          const targetIndex = parseInt(id);
          const targetObject = baseWidth.y.find(
            (obj) => parseInt(obj.id) === targetIndex
          );
          if (targetObject) {
            targetObject.border = Number(value);
          }
          fixArrayCoor();
        }
        // 重置網格
        drawBaseGrid();
      }
    }
  }
});

// 更改array與之後的值
function fixArrayCoor() {
  const array = scaffoldArray.baseGrid;
  let arrX = [];
  let arrY = [];
  (x = 0), (y = 0);
  baseWidth.x.forEach((el) => arrX.push((x += el.border)));
  baseWidth.y.forEach((el) => arrY.push((y += el.border)));
  // 更新baseWidth
  for (let i = 1; i < baseWidth.x.length; i++) {
    baseWidth.x[i].startCoor = arrX[i - 1];
  }
  for (let i = 1; i < baseWidth.y.length; i++) {
    baseWidth.y[i].startCoor = arrY[i - 1];
  }

  // 更新baseGrid
  let newArr = [];
  array.forEach((el) => {
    const item = {
      x: el.x,
      y: el.y,
      z: el.z,
      border: [
        baseWidth.x[el.x - 1].border,
        baseWidth.y[el.y - 1].border,
        el.border[2],
      ],
      startCoor: [arrX[el.x - 1], arrY[el.y - 1], el.startCoor[2]],
    };
    newArr.push(item);
  });
  scaffoldArray.baseGrid = newArr;
  createRectangleSvg(scaffoldArray.baseGrid);
}

/** 畫箭頭 */
function arrowDesc() {
  // 第一組箭頭 Ｘ
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

  path.setAttribute("d", `M30,23 L${30 + scaffoldArray.base.width},23`);
  path.setAttributeNS(null, "stoke", "red");
  const polyline1 = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polyline"
  );
  polyline1.setAttribute(
    "points",
    `${30 + itemValue.itemX},20 ${30 + itemValue.itemX - 6},16 ${
      30 + itemValue.itemX - 6
    },24`
  );
  polyline1.setAttributeNS(null, "fill", "red");
  const polyline2 = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polyline"
  );
  polyline2.setAttribute("points", `${30},20 ${30 + 6},16 ${30 + 6},24`);
  polyline2.setAttributeNS(null, "fill", "red");
  desc.appendChild(path);
  desc.appendChild(polyline1);
  desc.appendChild(polyline2);
}

// ============================================================================================================ \\
// ============================================================================================================ \\

selectModeMouse();
// 滑鼠監聽事件
function selectModeMouse() {
  var mouseStopId;
  var mouseOn = false;
  var startX = 0;
  var startY = 0;
  // 雙擊事件
  const dblclickEvent = document.querySelector(".svg-container-step02");

  // 切換模式
  const selectMode = document.getElementById("selectMode");
  let value;
  selectMode.addEventListener("change", (e) => {
    value = document.querySelector('input[name="inputMode"]:checked').value;
    const alert = document.querySelector(".alert");
    // 傳入模式
    step02DrawMode = value;
    alert.innerHTML = `選擇${value}模式！`;
    $(".alert").addClass("show");
    window.setTimeout(function () {
      $(".alert").removeClass("show");
    }, 1000);

    if (typeof value !== "undefined") {
      //dblclickEvent.addEventListener('click', onMouseDbClick);
      dblclickEvent.addEventListener("mousedown", onMouseDownMode);
      dblclickEvent.addEventListener("mousemove", onMouseMoveMode);
      if (value.includes("梯位")) {
        dblclickEvent.addEventListener("mouseup", onMouseUpMode);
        dblclickEvent.removeEventListener("mouseup", onMouseUpModeAnchor);
        dblclickEvent.removeEventListener("mouseup", onMouseUpModeHigh);
      } else if (value.includes("樓高")) {
        // 取得長方形點
        dblclickEvent.addEventListener("mouseup", onMouseUpModeHigh);
        dblclickEvent.removeEventListener("mouseup", onMouseUpMode);
        dblclickEvent.removeEventListener("mouseup", onMouseUpModeAnchor);
      } else if (value.includes("錨定點")) {
        dblclickEvent.removeEventListener("mouseup", onMouseUpMode);
        dblclickEvent.addEventListener("mouseup", onMouseUpModeAnchor);
        dblclickEvent.removeEventListener("mouseup", onMouseUpModeHigh);
      } else {
        dblclickEvent.removeEventListener("mousemove", onMouseMoveMode);
        dblclickEvent.removeEventListener("mouseup", onMouseUpMode);
        dblclickEvent.removeEventListener("mouseup", onMouseUpModeAnchor);
        dblclickEvent.removeEventListener("mouseup", onMouseUpModeHigh);
      }
    }
  });

  // 滑鼠雙擊事件
  function onMouseDbClick(e) {
    clearEventBubble(e);
    const svgContainer = this;
    if (svgContainer.classList.contains("clicked")) {
      svgContainer.classList.remove("clicked");
      svgContainer.classList.add("dblclick");
      mouseStopId = setTimeout(function () {
        mouseOn = true;
        startX = e.clientX;
        startY = e.clientY;
        var selDiv = document.createElement("div");
        selDiv.style.cssText =
          "position:absolute;width:0;height:0;margin:0;padding:0;border:1px dashed #eee;background-color:#aaa;z-index:1000;opacity:0.6;display:none;";
        selDiv.id = "selectDiv";
        document.body.appendChild(selDiv);
        selDiv.style.left = startX + "px";
        selDiv.style.top = startY + "px";
      }, 300);
      //here is your code for double click
    } else {
      svgContainer.classList.add("clicked");
      setTimeout(function () {
        if (svgContainer.classList.contains("clicked")) {
          svgContainer.classList.remove("clicked");
        }
      }, 500);
    }
  }

  function onMouseUpMode(e) {
    if (!mouseOn) return;
    clearEventBubble(e);
    mouseOn = false;
    var selDiv = document.getElementById("selectDiv");
    var fileDivs = document.getElementsByTagName("rect");
    var selectedEls = [];
    dblclickEvent.classList.remove("dblclick");
    // 获取参数
    var l = selDiv.offsetLeft;
    var t = selDiv.offsetTop;
    var w = selDiv.offsetWidth;
    var h = selDiv.offsetHeight;
    for (var i = 0; i < fileDivs.length; i++) {
      var sl = fileDivs[i].offsetWidth + fileDivs[i].offsetLeft;
      var st = fileDivs[i].offsetHeight + fileDivs[i].offsetTop;
      if (
        fileDivs[i].getBoundingClientRect().right > l &&
        fileDivs[i].getBoundingClientRect().bottom > t &&
        fileDivs[i].getBoundingClientRect().left < l + w &&
        fileDivs[i].getBoundingClientRect().top < t + h
      ) {
        // 该DOM元素被选中，进行处理
        if (fileDivs[i].id.substring(0, 8) !== "descGrid") {
          selectedEls.push(fileDivs[i]);
          makeStairtags(fileDivs[i].id);
          // 加上顏色
          fileDivs[i].classList.add("select-stair");
        }
      }
    }
    // ===============選擇梯位===================== 確認儲存
    // 恢复参数
    selDiv.style.display = "none";
    stairSelectClose();
  }

  function onMouseMoveMode(e) {
    if (!mouseOn) return;
    clearEventBubble(e);
    var _x = e.clientX;
    var _y = e.clientY;
    var selDiv = document.getElementById("selectDiv");
    selDiv.style.display = "block";
    selDiv.style.left = Math.min(_x, startX) + "px";
    selDiv.style.top = Math.min(_y, startY) + "px";
    selDiv.style.width = Math.abs(_x - startX) + "px";
    selDiv.style.height = Math.abs(_y - startY) + "px";
  }

  function onMouseDownMode(e) {
    clearEventBubble(e);
    if (e.buttons !== 1 || e.which !== 1) return;
    mouseOn = true;
    startX = e.clientX;
    startY = e.clientY;
    var selDiv = document.createElement("div");
    selDiv.style.cssText =
      "position:absolute;width:0;height:0;margin:0;padding:0;border:1px dashed #eee;background-color:#aaa;z-index:1000;opacity:0.6;display:none;";
    selDiv.id = "selectDiv";
    document.body.appendChild(selDiv);
    selDiv.style.left = startX + "px";
    selDiv.style.top = startY + "px";
  }

  function onMouseUpModeAnchor(e) {
    // if (dblclickEvent.classList.contains('dblclick')) {
    // }
    if (!mouseOn) return;
    clearEventBubble(e);
    mouseOn = false;
    var selDiv = document.getElementById("selectDiv");
    var fileDivs = document.getElementsByTagName("rect");
    var selectedEls = [];
    dblclickEvent.classList.remove("dblclick");
    // 获取参数
    var l = selDiv.offsetLeft;
    var t = selDiv.offsetTop;
    var w = selDiv.offsetWidth;
    var h = selDiv.offsetHeight;
    for (var i = 0; i < fileDivs.length; i++) {
      let selectItemX = fileDivs[i].getBoundingClientRect().left;
      let selectItemY = fileDivs[i].getBoundingClientRect().top;
      if (
        selectItemX > l &&
        selectItemY > t &&
        selectItemX < l + w &&
        selectItemY < t + h
      ) {
        let anchorId = `anchor_${fileDivs[i].id.split("_")[1]}_${
          fileDivs[i].id.split("_")[2]
        }`;
        if (fileDivs[i].id.substring(0, 8) !== "descGrid") {
          try {
            let anchorItem = document.getElementById(anchorId);
            if (anchorItem === null) {
              throw "anchorItem is null";
            }
          } catch (e) {
            const shape = circle(
              fileDivs[i].getAttribute("x"),
              fileDivs[i].getAttribute("y"),
              anchorId
            );
            anchor.appendChild(shape);
            // 该DOM元素被选中，进行处理
            makeAnchortags(anchorId);
          }
        }
      }
    }
    // ===============選擇梯位===================== 確認儲存
    // 恢复参数
    selDiv.style.display = "none";
    anchorSelectClose();
  }

  function onMouseUpModeHigh(e) {
    if (!mouseOn) return;
    clearEventBubble(e);
    mouseOn = false;
    var selDiv = document.getElementById("selectDiv");
    var fileDivs = document.getElementsByTagName("rect");
    var selectedEls = [];
    dblclickEvent.classList.remove("dblclick");
    // 获取参数
    var l = selDiv.offsetLeft;
    var t = selDiv.offsetTop;
    var w = selDiv.offsetWidth;
    var h = selDiv.offsetHeight;
    for (var i = 0; i < fileDivs.length; i++) {
      var sl = fileDivs[i].offsetWidth + fileDivs[i].offsetLeft;
      var st = fileDivs[i].offsetHeight + fileDivs[i].offsetTop;
      if (
        fileDivs[i].getBoundingClientRect().right > l &&
        fileDivs[i].getBoundingClientRect().bottom > t &&
        fileDivs[i].getBoundingClientRect().left < l + w &&
        fileDivs[i].getBoundingClientRect().top < t + h
      ) {
        // 该DOM元素被选中，进行处理
        selectedEls.push(fileDivs[i]);
        // 跳出彈框
        // 加上顏色
      }
    }
    // 打印被选中DOM元素
    selDiv.style.display = "none";

    // ===============選擇梯位===================== 確認儲存
    // 恢复参数
    setTimeout(setRectHighInput(selectedEls), 400);
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
  const stairTags = document.querySelectorAll(".stairList");

  if (stairTags.length > 0) {
    let check = true;
    stairTags.forEach((tag) => {
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
  }
}

function stairSelectClose() {
  const stairSelect = document.getElementById("stairSelect");
  const anchorSelect = document.getElementById("anchorSelect");
  const controlBar = document.getElementById("control-bar");
  stairSelect.addEventListener("click", (e) => {
    const target = e.target;
    if (target.innerHTML === "×") {
      // 取得刪除目標
      let targetId = target.parentElement.parentElement.dataset.id;
      // 取消目標長方形顏色
      let rectTarget = document.getElementById(targetId);
      rectTarget.classList.remove("select-stair");
      // 取消目標列表內容
      let targetItem = target.parentElement.parentElement.parentElement;
      targetItem.remove();
      //刪除梯子
      const str = targetId.split("_");
      const stairId = `stair_${str[1]}_${str[2]}`;
      deleteStair(stairId);
    }
    if (
      stairSelect.childElementCount === 0 &&
      anchorSelect.childElementCount === 0
    ) {
      controlBar.classList.add("selecter-close");
    }
  });
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

  // 使用 querySelectorAll 取得所有具有 "anchorList" 的元素
  const anchorTags = document.querySelectorAll(".anchorList");

  if (anchorTags.length > 0) {
    let check = true;
    anchorTags.forEach((tag) => {
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
  const stairSelect = document.getElementById("stairSelect");
  const anchorSelect = document.getElementById("anchorSelect");
  const controlBar = document.getElementById("control-bar");

  anchorSelect.addEventListener("click", (e) => {
    const target = e.target;
    if (target.innerHTML === "×") {
      // 取得刪除目標
      let targetId = target.parentElement.parentElement.dataset.id;
      // 取消目標長方形顏色
      let circleTarget = document.getElementById(targetId);
      circleTarget.remove();
      // 取消目標列表內容
      let targetItem = target.parentElement.parentElement.parentElement;
      targetItem.remove();
    }
    if (
      stairSelect.childElementCount === 0 &&
      anchorSelect.childElementCount === 0
    ) {
      controlBar.classList.add("selecter-close");
    }
  });
}

// 重設座標
const btnResetSvg = document.querySelector("#btnResetSvg");
btnResetSvg.addEventListener("click", (e) => {
  e.preventDefault();
  let viewBox = `${0} ${0} ${maxborder.x} ${maxborder.y + 40}`;
  //	設定 SVG viewBox 屬性值
  svg.setAttribute("viewBox", viewBox);
});
// 取消、儲存
const btnCancelSelect = document.querySelector("#btnCancelSelect");
btnCancelSelect.addEventListener("click", (e) => {
  e.preventDefault();
});
const btnSaveSelect = document.querySelector("#btnSaveSelect");
const stairList = [];
btnSaveSelect.addEventListener("click", (e) => {
  e.preventDefault();
  const stairSelectList = document.querySelector("#stairSelect");
  const stairTags = document.querySelectorAll(".stairList");

  stairTags.forEach((tag) => {
    let arrId = tag.firstElementChild.dataset.id;
    if (!stairList.includes(arrId)) {
      stairList.push(arrId);
      let target = document.getElementById(arrId);
      const targetWidth = target.getAttribute("width");
      const targetHeight = target.getAttribute("height");
      let rotate = "";
      if (targetWidth > targetHeight) {
        rotate = "x";
      } else {
        rotate = "y";
      }
      makeStair(
        arrId.split("_")[1],
        arrId.split("_")[2],
        targetHeight,
        targetWidth,
        rotate
      );
    }
  });
});

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
const backTostep02 = document.getElementById("step02back");
backTostep02.addEventListener("click", (e) => {
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
  const desc = document.getElementById("desc");
  while (desc.firstChild) {
    desc.removeChild(desc.firstChild);
  }
});

// 儲存步驟2
const submit2 = document.getElementById("step02");
submit2.addEventListener("click", (e) => {
  let children = rectHigh.childNodes;
  scaffoldArray.height = [];

  // 取得高
  for (i = 0; i < children.length; i++) {
    if (children[i].nodeType === Node.ELEMENT_NODE) {
      let str = children[i].id.split("_");
      let x = parseInt(str[2]);
      let y = parseInt(str[3]);
      let z = parseInt(children[i].textContent);
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        let item = {
          x: parseInt(str[2]),
          y: parseInt(str[3]),
          z: parseInt(children[i].textContent),
        };
        scaffoldArray.height.push(`${x}_${y}_${z}`);
        scaffoldArray.grid.push(item);
      }
    }
  }

  // 取得梯位
  recordStair();
  // 取得錨定點
  scaffoldArray.anchor = [];
  const anchorList = document.querySelectorAll(".anchorList");
  anchorList.forEach((el) => {
    // 取得各節點
    const arrId = el.firstElementChild.dataset.id;
    const x = Number(arrId.split("_")[1]);
    const y = Number(arrId.split("_")[2]);
    const anchorZ = getAnchorZ(x, y); // 之後要改
    anchorZ.forEach((el) => {
      const newID = `${x}_${y}_${el}`;
      scaffoldArray.anchor.push(newID);
      // 之後棄用
    });
  });

  // 建立五視圖
  buildFiveView();
});

// 計算梯位位置
function recordStair() {
  const children = stair.childNodes;
  for (i = 0; i < children.length; i++) {
    if (children[i].nodeType === Node.ELEMENT_NODE) {
      let str = children[i].id.split("_");
      let x = parseInt(str[1]);
      let y = parseInt(str[2]);
      if (!isNaN(x) && !isNaN(y)) {
        const z = getStairHeight(x, y);
        for (let i = 0; i < z; i++) {
          scaffoldArray.stair.push(`${x}_${y}_${i + 1}`);
        }
      }
    }
  }
}
// 取得樓高
function getStairHeight(x, y) {
  const arrHigh = scaffoldArray.height;
  let hight = 0;
  arrHigh.forEach((el) => {
    const item = el.split("_");
    if (Number(item[0]) == x && Number(item[1] == y)) {
      hight = Number(item[2]);
    }
  });
  return hight;
}

// 計算錨定點位置
function recordAnchor() {
  const children = anchor.childNodes;
  for (i = 0; i < children.length; i++) {
    if (children[i].nodeType === Node.ELEMENT_NODE) {
      let str = children[i].id.split("_");
      let x = parseInt(str[1]);
      let y = parseInt(str[2]);
      if (!isNaN(x) && !isNaN(y)) {
        const anchorZ = getAnchorZ(x, y);
        anchorZ.forEach((el) => {
          let item = {
            x: parseInt(x),
            y: parseInt(y), // 計算各個xy的z值
            z: parseInt(el),
          };
          scaffoldArray.anchorPoint.push(item);
        });
      }
    }
  }
}

// 取得錨定點高度
function getAnchorZ(x, y) {
  const arrHigh = scaffoldArray.height;
  let hight = 0;
  arrHigh.forEach((el) => {
    const item = el.split("_");
    if (Number(item[0]) == x && Number(item[1] == y)) {
      hight = Number(item[2]);
    }
  });

  let arr = [];
  let count = 0;
  let value = Number(getAnchorRole());
  while (hight > value - 1) {
    count += value;
    hight -= value;
    arr.push(count);
  }
  return arr;
}

// 取得錨定點規則
function getAnchorRole() {
  const value = scaffoldArray.role.anchor;
  let answer = 0;
  switch (value) {
    case 1:
      answer = 3;
      break;
    default:
      answer = 3;
      break;
  }
  return answer;
}

const maxWidth = {
  x: 0,
  y: 0,
  z: 0,
};

// 建立五視圖
function buildFiveView() {
  const array = scaffoldArray.baseGrid;
  const xArray = baseWidth.x;
  const yArray = baseWidth.y;
  const zArray = baseWidth.z;
  const scaling = scaffoldArray.base.scaling;
  let startPoint = [];

  // 取得最大XYZ
  xArray.forEach((el) => {
    const value = el.startCoor + el.border;
    if (maxWidth.x < value) {
      maxWidth.x = Number(value);
    }
  });
  yArray.forEach((el) => {
    const value = el.startCoor + el.border;
    if (maxWidth.y < value) {
      maxWidth.y = Number(value);
    }
  });
  zArray.forEach((el) => {
    const value = el.startCoor + el.border;
    if (maxWidth.z < value) {
      maxWidth.z = Number(value);
    }
  });

  // reverse xArray
  const xArrayReverse = [];
  xArray.forEach((item) => {
    const newItem = {
      id: item.id,
      border: item.border,
      startCoor: maxWidth.x - item.startCoor - item.border,
    };
    xArrayReverse.push(newItem);
  });
  // reverse yArray
  const yArrayReverse = [];
  yArray.forEach((item) => {
    const newItem = {
      id: item.id,
      border: item.border,
      startCoor: maxWidth.y - item.startCoor - item.border,
    };
    yArrayReverse.push(newItem);
  });

  // 先分別生成
  // top
  // 重置
  scaffoldArray.fiveViewGrid.topView = [];
  array.forEach((el) => {
    const start_x = xArray.filter((item) => item.id === el.x)[0].startCoor;
    const start_y = yArray.filter((item) => item.id === el.y)[0].startCoor;
    const border_x = xArray.filter((item) => item.id === el.x)[0].border;
    const border_y = yArray.filter((item) => item.id === el.y)[0].border;
    const item = {
      id: `${el.x}_${el.y}_${el.z}`,
      viewId: `${el.x}_${el.y}`,
      coord: [start_x, start_y],
      border: [border_x, border_y],
    };
    scaffoldArray.fiveViewGrid.topView.push(item);
  });
  startPoint = [40 + maxWidth.y * scaling + 60, 40 + maxWidth.y * scaling];
  makRectangle(startPoint, scaffoldArray.fiveViewGrid.topView, "topView");
  makRectText(startPoint, scaffoldArray.fiveViewGrid.topView);
  makStairTop(startPoint, scaffoldArray.fiveViewGrid.topView);
  // left
  // 重置
  scaffoldArray.fiveViewGrid.leftSideView = [];

  array.forEach((el) => {
    const start_y = yArrayReverse.filter((item) => item.id === el.y)[0]
      .startCoor;
    const start_z = zArray.filter((item) => item.id === el.z)[0].startCoor;
    const border_y = yArrayReverse.filter((item) => item.id === el.y)[0].border;
    const border_z = zArray.filter((item) => item.id === el.z)[0].border;
    const item = {
      id: `${el.x}_${el.y}_${el.z}`,
      viewId: `${el.y}_${el.z}`,
      coord: [start_y, start_z],
      border: [border_y, border_z],
    };
    scaffoldArray.fiveViewGrid.leftSideView.push(item);
  });
  // 新增
  startPoint = [40, 40 + 160 + maxWidth.y * scaling + maxWidth.z * scaling];
  makRectangle(
    startPoint,
    scaffoldArray.fiveViewGrid.leftSideView,
    "leftSideView"
  );
  makStairStand(startPoint, scaffoldArray.fiveViewGrid.leftSideView);
  makDiagonalBraces(
    startPoint,
    scaffoldArray.fiveViewGrid.leftSideView,
    "leftSideView"
  );
  makRung(startPoint, scaffoldArray.fiveViewGrid.leftSideView, "leftSideView");

  // front
  // 重置
  scaffoldArray.fiveViewGrid.frontView = [];
  array.forEach((el) => {
    const start_x = xArray.filter((item) => item.id === el.x)[0].startCoor;
    const start_z = zArray.filter((item) => item.id === el.z)[0].startCoor;
    const border_x = xArray.filter((item) => item.id === el.x)[0].border;
    const border_z = zArray.filter((item) => item.id === el.z)[0].border;
    const item = {
      id: `${el.x}_${el.y}_${el.z}`,
      viewId: `${el.x}_${el.z}`,
      coord: [start_x, start_z],
      border: [border_x, border_z],
    };
    scaffoldArray.fiveViewGrid.frontView.push(item);
  });
  startPoint = [
    40 + maxWidth.y * scaling + 60,
    40 + 160 + maxWidth.y * scaling + maxWidth.z * scaling,
  ];
  makRectangle(startPoint, scaffoldArray.fiveViewGrid.frontView, "frontView");
  makStairStand(startPoint, scaffoldArray.fiveViewGrid.frontView);
  makDiagonalBraces(
    startPoint,
    scaffoldArray.fiveViewGrid.frontView,
    "frontView"
  );
  makRung(startPoint, scaffoldArray.fiveViewGrid.frontView, "frontView");

  // right
  // 重置
  scaffoldArray.fiveViewGrid.rightSideView = [];
  array.forEach((el) => {
    const start_y = yArray.filter((item) => item.id === el.y)[0].startCoor;
    const start_z = zArray.filter((item) => item.id === el.z)[0].startCoor;
    const border_y = yArray.filter((item) => item.id === el.y)[0].border;
    const border_z = zArray.filter((item) => item.id === el.z)[0].border;
    const item = {
      id: `${el.x}_${el.y}_${el.z}`,
      viewId: `${el.y}_${el.z}`,
      coord: [start_y, start_z],
      border: [border_y, border_z],
    };
    scaffoldArray.fiveViewGrid.rightSideView.push(item);
  });
  startPoint = [
    40 + maxWidth.y * scaling + 120 + maxWidth.x * scaling,
    40 + 160 + maxWidth.y * scaling + maxWidth.z * scaling,
  ];
  makRectangle(
    startPoint,
    scaffoldArray.fiveViewGrid.rightSideView,
    "rightSideView"
  );
  makStairStand(startPoint, scaffoldArray.fiveViewGrid.rightSideView);
  makDiagonalBraces(
    startPoint,
    scaffoldArray.fiveViewGrid.rightSideView,
    "rightSideView"
  );
  makRung(
    startPoint,
    scaffoldArray.fiveViewGrid.rightSideView,
    "rightSideView"
  );

  // rear
  // 重置
  scaffoldArray.fiveViewGrid.rearView = [];
  array.forEach((el) => {
    const start_x = xArrayReverse.filter((item) => item.id === el.x)[0]
      .startCoor;
    const start_z = zArray.filter((item) => item.id === el.z)[0].startCoor;
    const border_x = xArrayReverse.filter((item) => item.id === el.x)[0].border;
    const border_z = zArray.filter((item) => item.id === el.z)[0].border;
    const item = {
      id: `${el.x}_${el.y}_${el.z}`,
      viewId: `${el.x}_${el.z}`,
      coord: [start_x, start_z],
      border: [border_x, border_z],
    };
    scaffoldArray.fiveViewGrid.rearView.push(item);
  });
  startPoint = [
    40 + maxWidth.y * 2 * scaling + 180 + maxWidth.x * scaling,
    40 + 160 + maxWidth.y * scaling + maxWidth.z * scaling,
  ];
  makRectangle(startPoint, scaffoldArray.fiveViewGrid.rearView, "rearView");
  makStairStand(startPoint, scaffoldArray.fiveViewGrid.rearView);
  makDiagonalBraces(
    startPoint,
    scaffoldArray.fiveViewGrid.rearView,
    "rearView"
  );
  makRung(startPoint, scaffoldArray.fiveViewGrid.rearView, "rearView");

  // 生成錨定點
  createAnchorPoint();

  let newWidth = (maxWidth.x * 2 + maxWidth.y * 2) * scaling;
  let newHigh = (maxWidth.y + maxWidth.z) * scaling;
  let viewBox = `${0} ${0} ${newWidth} ${newHigh}`;
  //	設定 SVG viewBox 屬性值
  const svg3 = document.getElementById("step03Svg");
  svg3.setAttribute("viewBox", viewBox);
}

// 定義立面圖
function makRectangle(start, grid, target) {
  const scaling = scaffoldArray.base.scaling;
  const goal = document.getElementById(target);
  grid.forEach((el) => {
    // 尋找有沒有已經有出現的rect
    const id = `${target}_rect_${el.viewId}`;
    const item = document.getElementById(id);
    if (!item) {
      const width = el.border[0] * scaling;
      const height = el.border[1] * scaling;
      const x = start[0] + el.coord[0] * scaling;
      const y = start[1] - (el.coord[1] + el.border[1]) * scaling;
      // drawing.drawRect(x, y, x + width, y + long)

      const shape = rectangle(x, y, width, height, id);
      goal.appendChild(shape);
    }
  });
}

// 建立五視樓高
function makRectText(start, grid) {
  const scaling = scaffoldArray.base.scaling;
  const topView = document.getElementById("topViewText");
  grid.forEach((el) => {
    const viewId = `${el.viewId.split("_")[0]}_${el.viewId.split("_")[1]}`;
    let topIdArr = scaffoldArray.height;
    topIdArr = topIdArr.map(
      (item) => `${item.split("_")[0]}_${item.split("_")[1]}`
    );
    for (let i = 0; i < topIdArr.length; i++) {
      if (topIdArr[i] === viewId) {
        const id = `rect_${topIdArr[i]}`;
        const item = document.getElementById(`topView_text_${id}`);
        if (!item) {
          const width = el.border[0] * scaling;
          const long = el.border[1] * scaling;
          const x = start[0] + el.coord[0] * scaling;
          const y = start[1] - (el.coord[1] + el.border[1]) * scaling;
          const text = scaffoldArray.height[i].split("_")[2];
          const shape = rectangleText(x, y, width, long, id, text);
          topView.appendChild(shape);
        }
      }
    }
  });
}

// 建立平面底格文字
function rectangleText(x, y, width, height, id, value) {
  // 校正
  let newX = x + width / 2;
  let newY = y + height / 2;
  var svgns = "http://www.w3.org/2000/svg";
  var shape = document.createElementNS(svgns, "text");
  shape.setAttributeNS(null, "id", `topView_text_${id}`);
  shape.setAttributeNS(null, "x", newX);
  shape.setAttributeNS(null, "y", newY); //width="150" height="150"
  shape.setAttributeNS(null, "dominant-baseline", "middle");
  shape.setAttributeNS(null, "text-anchor", "middle");
  shape.setAttributeNS(null, "font-size", "15");
  shape.innerHTML = value;
  return shape;
}

// 建立梯位
function makStairTop(start, grid) {
  const scaling = scaffoldArray.base.scaling;
  const stairArray = scaffoldArray.stair;
  grid.forEach((el) => {
    const id = el.id;
    for (let i = 0; i < stairArray.length; i++) {
      if (stairArray[i] === id) {
        const x = start[0] + el.coord[0] * scaling;
        const y = start[1] - (el.coord[1] + el.border[1]) * scaling;
        const stairWidth = (el.border[0] / 4) * scaling;
        const stairLong = (el.border[1] / 5) * scaling;
        makeFiveTopStair(
          x,
          y,
          x + stairWidth,
          y + el.border[1] * scaling,
          "y",
          `topView_stiar_${stairArray[i]}`
        );
      }
    }
  });
}

// 建立階梯
function makeFiveTopStair(x1, y1, x2, y2, rotate, id) {
  // 建立一個group
  const topViewStair = document.getElementById("topViewStair");
  const item = document.getElementById(id);
  if (!item) {
    const childGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    childGroup.setAttribute("id", id);
    // 将子元素添加为父元素的子元素
    topViewStair.appendChild(childGroup);
    // 確認方向
    if (rotate === "x") {
      // 橫向
      line(x1, x2, y1, y1, id);
      for (i = 0; i < 5; i++) {
        line(x1 + (i * (x2 - x1)) / 5, x1 + (i * (x2 - x1)) / 5, y1, y2, id);
      }
      line(x1, x2, y2, y2, id);
    } else {
      // 直向
      line(x1, x1, y2, y1, id);
      for (i = 0; i < 5; i++) {
        line(x1, x2, y2 + (i * (y1 - y2)) / 5, y2 + (i * (y1 - y2)) / 5, id);
      }
      line(x2, x2, y2, y1, id);
    }
  }
}

// 建立梯位 直面圖
function makStairStand(start, grid) {
  const scaling = scaffoldArray.base.scaling;
  const stairArray = scaffoldArray.stair;
  grid.forEach((el) => {
    const id = el.id;
    for (let i = 0; i < stairArray.length; i++) {
      if (stairArray[i] === id) {
        const x1 = start[0] + el.coord[0] * scaling;
        const y1 = start[1] - el.coord[1] * scaling;
        const x2 = x1 + el.border[0] * scaling;
        const y2 = y1 - el.border[1] * scaling;
        const step = (el.border[1] * scaling) / 5;
        const width = el.border[0] * scaling;
        drawStairStand(x1, x2, y1, y2, step, width, id);
      }
    }
  });
}
// 建立立面階梯
function drawStairStand(x1, x2, y1, y2, step, width, id) {
  // 建立一個group
  const topViewStair = document.getElementById("topViewStair");
  const childGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  childGroup.setAttribute("id", id);
  // 将子元素添加为父元素的子元素
  topViewStair.appendChild(childGroup);
  line(x1, x2, y2, y1, id);
  line(
    x1 + width / 5 - width / 10,
    x1 + width / 5 + width / 10,
    y2 + step,
    y2 + step,
    id
  );
  line(
    x1 + (width / 5) * 2 - width / 10,
    x1 + (width / 5) * 2 + width / 10,
    y2 + step * 2,
    y2 + step * 2,
    id
  );
  line(
    x1 + (width / 5) * 3 - width / 10,
    x1 + (width / 5) * 3 + width / 10,
    y2 + step * 3,
    y2 + step * 3,
    id
  );
  line(
    x1 + (width / 5) * 4 - width / 10,
    x1 + (width / 5) * 4 + width / 10,
    y2 + step * 4,
    y2 + step * 4,
    id
  );
}

// 建立斜撐
function makDiagonalBraces(start, grid, target) {
  const scaling = scaffoldArray.base.scaling;
  // 建立一個group
  const diagonalBraces = document.getElementById(target);
  const childGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  childGroup.setAttribute("id", `${target}_makDiagonalBraces`);
  diagonalBraces.appendChild(childGroup);
  try {
    //需要左右對稱，先取得總共寬數
    let max = 0;
    grid.forEach((el) => {
      const x = Number(el.viewId.split("_")[0]);
      max = max > x ? max : x;
    });
    const braceArray = paintSymmetricCells(max);

    grid.forEach((el) => {
      const Id_x = parseInt(el.viewId.split("_")[0]);
      const x1 = start[0] + el.coord[0] * scaling;
      const x2 = x1 + el.border[0] * scaling;
      const y1 = start[1] - el.coord[1] * scaling;
      const y2 = y1 - el.border[1] * scaling;
      if (Id_x > max / 2 && braceArray[Id_x - 1]) {
        const id = el.viewId;
        line(x1, x2, y2, y1, `${target}_makDiagonalBraces`);
      } else if (Id_x <= max / 2 && braceArray[Id_x - 1]) {
        line(x1, x2, y1, y2, `${target}_makDiagonalBraces`);
      }
    });
  } catch (error) {}
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
function makRung(start, grid, target) {
  const rungRule = scaffoldArray.role.acnchor;
  let rungArray = getrungValue(rungRule);
  const scaling = scaffoldArray.base.scaling;
  const rung = document.getElementById(target);
  grid.forEach((el) => {
    const childGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    const itemID = `${target}_rung_${el.viewId}`;
    const item = document.getElementById(itemID);
    if (!item) {
      const y0 = start[1] - el.coord[1] * scaling;
      childGroup.setAttribute("id", itemID);
      childGroup.setAttribute("st_y", y0);
      rung.appendChild(childGroup);
      const x1 = start[0] + el.coord[0] * scaling;
      const x2 = x1 + el.border[0] * scaling;
      for (let i = 0; i < rungArray.length; i++) {
        const y1 = start[1] - (el.coord[1] + rungArray[i]) * scaling;
        line(x1, x2, y1, y1, itemID);
      }
    }
  });
}

// 取得橫桿規則
function getrungValue(value) {
  switch (value) {
    case 1:
      return [0.45];
      break;
    case 2:
      return [0.45, 0.9];
      break;
    case 3:
      return [0.45, 0.9, 1.35];
      break;
  }
}

// 變更橫桿規則
// 取得所有橫桿，依據橫桿的大小更改橫桿
function changeRung() {
  // 定義要找的
  const left = document.getElementById("leftSideView").childNodes;
  const front = document.getElementById("frontView").childNodes;
  const right = document.getElementById("rightSideView").childNodes;
  const rear = document.getElementById("rearView").childNodes;
  newRung(left);
  newRung(front);
  newRung(right);
  newRung(rear);
}

function newRung(arr) {
  const scaling = scaffoldArray.base.scaling;
  const rungRoleValue = getrungValue(scaffoldArray.role.acnchor);
  arr.forEach((el) => {
    const id = el.getAttribute("id").split("_");
    if (id[1] === "rung") {
      const y0 = el.getAttribute("st_y");
      const child = el.firstChild;
      const x1 = child.getAttribute("x1");
      const x2 = child.getAttribute("x2");
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
      for (let i = 0; i < rungRoleValue.length; i++) {
        const y1 = y0 - rungRoleValue[i] * scaling;
        const groupId = el.getAttribute("id");
        line(x1, x2, y1, y1, groupId);
      }
    }
  });
}

const rungRole = document.getElementById("rungRole");
rungRole.addEventListener("change", (e) => {
  scaffoldArray.role.acnchor = Number(rungRole.value);
  changeRung();
});

// 生成錨定點
function createAnchorPoint() {
  const anchorArray = scaffoldArray.anchor;
  // 取得xyz最大值
  const max = [
    scaffoldArray.base.coordX,
    scaffoldArray.base.coordY,
    scaffoldArray.base.coordZ,
  ];
  anchorArray.forEach((el) => {
    const x = el.split("_")[0];
    const y = el.split("_")[1];
    const z = el.split("_")[2];
    // todo 錨定點
    const topId = `topView_rect_${x}_${y}`;
    const leftId = `leftSideView_rect_${max[1] - y + 1}_${z}`;
    const rightId = `rightSideView_rect_${y}_${z}`;
    const frontId = `frontView_rect_${x}_${z}`;
    const rearId = `rearView_rect_${max[0] - x + 1}_${z}`;
    addAnchorPoint(topId, "topView");
    addAnchorPoint(leftId, "leftSideView");
    addAnchorPoint(frontId, "frontView");
    addAnchorPoint(rightId, "rightSideView");
    addAnchorPoint(rearId, "rearView");
  });
}

function addAnchorPoint(targetId, target) {
  const view = document.getElementById(target);
  const targetTop = document.getElementById(targetId);
  const top_x = targetTop.getAttribute("x");
  const top_y = targetTop.getAttribute("y");
  const newTopId = `${target}_anchor_${targetId.split("_")[2]}_${
    targetId.split("_")[3]
  }`;
  const itemTop = document.getElementById(newTopId);
  if (!itemTop) {
    const shape = circle(top_x, top_y, newTopId);
    view.appendChild(shape);
  }
}

///  ==========================================================
// ============================================================
///  ==========================================================

function getAnchorArray(xyArr) {
  const target = document.getElementById("anchorFiveView");
  const anchorList = scaffoldArray.anchorPoint;
  const topViewAnchor = xyArr[0];
  const leftSideViewAnchor = xyArr[1];
  const frontViewAnchor = xyArr[2];
  const rightViewAnchor = xyArr[3];
  const rearViewAnchor = xyArr[4];
  let circleX;
  let circleY;
  let anchorId;

  anchorList.forEach((el) => {
    const anchorId3D = `anchor3D_${el.x}_${el.y}_${el.z}`;
    makeAnchortags3D(anchorId3D);
    // topView
    circleX = topViewAnchor.x + (el.x - 1) * itemValue.itemX;
    circleY = topViewAnchor.y - el.y * itemValue.itemY;
    anchorId = `anchor_topView_${el.x}_${el.y}_${el.z}`;
    let shapeT = circle(circleX, circleY, anchorId);
    target.appendChild(shapeT);
    // left side view
    circleX =
      leftSideViewAnchor.x + (threeViewCount.y - el.y) * itemValue.itemY;
    circleY = leftSideViewAnchor.y - el.z * itemValue.itemZ;
    anchorId = `anchor_leftSideView_${el.x}_${el.y}_${el.z}`;
    let shapeL = circle(circleX, circleY, anchorId);
    target.appendChild(shapeL);
    // front view
    circleX = frontViewAnchor.x + (el.x - 1) * itemValue.itemX;
    circleY = frontViewAnchor.y - el.z * itemValue.itemZ;
    anchorId = `anchor_frontView_${el.x}_${el.y}_${el.z}`;
    let shapeF = circle(circleX, circleY, anchorId);
    target.appendChild(shapeF);
    // right side view
    circleX = rightViewAnchor.x + el.y * itemValue.itemY;
    circleY = rightViewAnchor.y - el.z * itemValue.itemZ;
    anchorId = `anchor_rightSideView_${el.x}_${el.y}_${el.z}`;
    let shapeR = circle(circleX, circleY, anchorId);
    target.appendChild(shapeR);

    // rear view
    circleX = rearViewAnchor.x + (threeViewCount.x - el.x) * itemValue.itemX;
    circleY = rearViewAnchor.y - el.z * itemValue.itemZ;
    anchorId = `anchor_rearView_${el.x}_${el.y}_${el.z}`;
    let shapeB = circle(circleX, circleY, anchorId);
    target.appendChild(shapeB);
  });
}

// 設定anchor tags
function makeAnchortags3D(id) {
  const anchorSelect3D = document.getElementById("anchorSelect3D");
  const controlBar = document.getElementById("control-bar");
  const div = document.createElement("div");
  div.className = "anchorList";
  div.innerHTML = `<span data-id="${id}" class="label label-default">
            ${id}  
            <button type="button" class="close" data-dismiss="alert">
              <span>&times;</span>
            </button>
          </span>`;

  // 使用 querySelectorAll 获取所有具有 "anchorList" 类名的元素
  const anchorTags = document.querySelectorAll(".anchorList");

  if (anchorTags.length > 0) {
    let check = true;
    anchorTags.forEach((tag) => {
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
  const anchorSelect3D = document.getElementById("anchorSelect3D");
  anchorSelect3D.addEventListener("click", (e) => {
    const target = e.target;
    if (target.innerHTML === "×") {
      // 取得刪除目標
      let targetId = target.parentElement.parentElement.dataset.id;
      let arr = targetId.split("_");
      // 取消目標長方形顏色
      let circleTargetT = document.getElementById(
        `anchor_topView_${arr[1]}_${arr[2]}_${arr[3]}`
      );
      circleTargetT.remove();
      let circleTargetL = document.getElementById(
        `anchor_leftSideView_${arr[1]}_${arr[2]}_${arr[3]}`
      );
      circleTargetL.remove();
      let circleTargetF = document.getElementById(
        `anchor_frontView_${arr[1]}_${arr[2]}_${arr[3]}`
      );
      circleTargetF.remove();
      let circleTargetR = document.getElementById(
        `anchor_rightSideView_${arr[1]}_${arr[2]}_${arr[3]}`
      );
      circleTargetR.remove();
      let circleTargetB = document.getElementById(
        `anchor_rearView_${arr[1]}_${arr[2]}_${arr[3]}`
      );
      circleTargetB.remove();
      // 取消目標列表內容
      let targetItem = target.parentElement.parentElement.parentElement;
      targetItem.remove();
    }
  });
}

//
const selectView = document.getElementById("selectMode2");
selectView.addEventListener("change", (e) => {
  const scaling = scaffoldArray.base.scaling;
  let selectViewValue;
  selectViewValue = document.querySelector(
    'input[name="inputMode"]:checked'
  ).value;
  const alert = document.querySelector(".alert");
  // 傳入模式
  alert.innerHTML = `移動到${selectViewValue}區塊！`;
  $(".alert").addClass("show");
  window.setTimeout(function () {
    $(".alert").removeClass("show");
  }, 1000);
  if (typeof selectViewValue !== "undefined") {
    if (selectViewValue.includes("平面圖")) {
      resetViewBox(
        maxWidth.y * scaling + 50,
        0,
        maxWidth.x * scaling,
        maxWidth.y * scaling + 70,
        "step03Svg"
      );
    } else if (selectViewValue.includes("左側視圖")) {
      resetViewBox(
        0,
        maxWidth.y * scaling + 100,
        maxWidth.y * scaling + 80,
        maxWidth.z * scaling + 130,
        "step03Svg"
      );
    } else if (selectViewValue.includes("正面圖")) {
      resetViewBox(
        100 + maxWidth.y * scaling,
        maxWidth.y * scaling + 100,
        maxWidth.x * scaling + 80,
        maxWidth.z * scaling + 130,
        "step03Svg"
      );
    } else if (selectViewValue.includes("右側視圖")) {
      resetViewBox(
        150 + maxWidth.x * scaling + maxWidth.y * scaling,
        maxWidth.y * scaling + 100,
        maxWidth.y * scaling + 80,
        maxWidth.z * scaling + 130,
        "step03Svg"
      );
    } else if (selectViewValue.includes("後視圖")) {
      resetViewBox(
        200 + maxWidth.x * scaling + maxWidth.y * scaling * 2,
        maxWidth.y * scaling + 100,
        maxWidth.x * scaling + 80,
        maxWidth.z * scaling + 130,
        "step03Svg"
      );
    }
  }
});

// 重設步驟三座標
function resetViewBox(x1, y1, maxborderX, maxborderY, target) {
  const targetSvg = document.getElementById(target);
  const viewBox = `${x1} ${y1} ${maxborderX} ${maxborderY}`;
  targetSvg.setAttribute("viewBox", viewBox);
}

// 建立正面立圖
function buildStant(arr) {
  let x = 30;
  let y = maxborder.y + 140;
  // 找出最大x, z
  let grid = scaffoldArray.grid;
  let itemMaxX = 0;
  let itemMaxZ = 0;
  grid.forEach((item) => {
    let itemX = item.x;
    let itemZ = item.z;
    if (itemMaxX < itemX) {
      itemMaxX = itemX;
    }
    if (itemMaxZ < itemZ) {
      itemMaxZ = itemZ;
    }
  });
  for (i = 0; i < itemMaxX; i++) {
    let coordX = 0;
  }
}

// 建立樓高
function setRectHighInput(rectArray) {
  const selDiv = document.getElementById("selectDiv");
  selDiv.style.display = "none";
  let str = ``;

  rectArray.forEach((el) => {
    const coord = el.id.split("_");
    if (coord[0] !== "descGrid") {
      str += `, (${coord[1]}, ${coord[2]})`;
    }
  });
  str = str.substring(1, str.length);
  if (rectArray.length > 0) {
    inputValue = prompt(`座標組[${str}] 請輸入數值`);
    if (inputValue !== "") {
      if (inputValue === "0") {
        rectArray.forEach((el) => {
          const coord = el.id.split("_");
          try {
            rectHigh.removeChild(
              document.getElementById(`text_rect_${coord[1]}_${coord[2]}`)
            );
            el.remove();
            fixRectHeight(`${coord[1]}_${coord[2]}`, inputValue);
            stair.removeChild(
              document.getElementById(`stair_${coord[1]}_${coord[2]}`)
            );
          } catch (e) {}
        });
      } else if (Number(inputValue) > 0) {
        rectArray.forEach((el) => {
          const coord = el.id.split("_");
          if (coord[0] !== "descGrid") {
            document.querySelector(
              `#text_rect_${coord[1]}_${coord[2]}`
            ).innerHTML = inputValue;
            fixRectHeight(`${coord[1]}_${coord[2]}`, inputValue);
          }
        });
      }
    }
  }
}

/**
 * 回到步驟二
 */
const backToStep03 = document.getElementById("backTostep03");
backToStep03.addEventListener("click", (e) => {
  const topView = document.getElementById("topView");
  const frontView = document.getElementById("frontView");
  const rearView = document.getElementById("rearView");
  const leftSideView = document.getElementById("leftSideView");
  const rightSideView = document.getElementById("rightSideView");
  while (topView.firstChild) {
    topView.removeChild(topView.firstChild);
  }
  while (frontView.firstChild) {
    frontView.removeChild(frontView.firstChild);
  }
  while (rearView.firstChild) {
    rearView.removeChild(rearView.firstChild);
  }
  while (leftSideView.firstChild) {
    leftSideView.removeChild(leftSideView.firstChild);
  }
  while (rightSideView.firstChild) {
    rightSideView.removeChild(rightSideView.firstChild);
  }
});

// 修改高度
function fixRectHeight(targetId, inputValue) {
  const x = Number(targetId.split("_")[0]);
  const y = Number(targetId.split("_")[1]);
  const target = Number(inputValue);
  let array = scaffoldArray.baseGrid.filter(
    (item) => item.x === x && item.y === y
  );
  scaffoldArray.baseGrid = scaffoldArray.baseGrid.filter(
    (item) => item.x !== x || item.y !== y
  );
  const size = array.length;
  if (target > size) {
    // 要多加z欄位
    let newItem = array.filter((item) => item.z === size)[0];
    const length = baseWidth.z.length;
    for (i = 0; i < target - size; i++) {
      const item = {
        x: newItem.x,
        y: newItem.y,
        z: newItem.z + i + 1,
        border: [
          newItem.border[0],
          newItem.border[1],
          scaffoldArray.base.height,
        ],
        startCoor: [
          newItem.startCoor[0],
          newItem.startCoor[1],
          newItem.startCoor[2] +
            newItem.border[2] +
            i * scaffoldArray.base.height,
        ],
      };
      array.push(item);

      // 判定是否需要另外加
      const zLength = Number(newItem.z + i + 1);
      const baseZ = Number(baseWidth.z[baseWidth.z.length - 1].id);
      if (zLength > baseZ) {
        const baseZArray = {
          id: Number(length + i + 1),
          startCoor:
            baseWidth.z[length - 1].startCoor +
            baseWidth.z[length - 1].border +
            i * scaffoldArray.base.height,
          border: scaffoldArray.base.height,
        };
        baseWidth.z.push(baseZArray);
      }
    }
    array.forEach((el) => scaffoldArray.baseGrid.push(el));
    // 增加base width
  } else if (target < size) {
    // 依據z欄位去除
    array = array.filter((item) => item.z <= target);
    array.forEach((el) => scaffoldArray.baseGrid.push(el));
  }
}

// 關閉並儲存
const textDesc = document.getElementById("saveDescText");
textDesc.addEventListener("click", (e) => {
  e.preventDefault();
  const text = document.getElementById("descText").value;
  if (text.length > 0) {
    scaffoldArray.description = text;
  }
  $("#exampleModal").modal("hide");
});

/**
 * 選取樓高的設定
 *  
 * */
const selectBtn = document.querySelector(".btn-toolbox")
selectBtn.addEventListener("click", (e) => {
  e.preventDefault();
  // 選擇開啟選樓狀態
  // 樓高選擇器 TODO
  let mouseOnStep03 = false;
  let startX = 0;
  let startY = 0;
  // 目標選取區
  const selectAvg = document.getElementById("step03Svg");
  selectAvg.addEventListener("mousedown", onMouseDownModeStep03);
  selectAvg.addEventListener("mousemove", onMouseMoveModeStep03);
  selectAvg.addEventListener("mouseup", onMouseUpModeStep03);

  // 開啟按鈕選擇
  const toolboxLine = document.querySelectorAll(".toolbox-line")
  openToolbox()
  function openToolbox() {
    toolboxLine.forEach((el) => {
      if (el.classList.contains("d-none")) {
        el.classList.remove("d-none")
        el.classList.add("d-block")
      } else {
        el.classList.remove("d-block")
        el.classList.add("d-none")
      }
    })
  }
  const svgSubmitBtn = document.querySelector(".btn-toolbox-submit");
  svgSubmitBtn.addEventListener("click", onSubmitSave)

  function onSubmitSave(e) {
    e.preventDefault();
    // 關閉按鈕選擇
    openToolbox()
    svgSubmitBtn.removeEventListener("click", onSubmitSave)
    selectAvg.removeEventListener("mousedown", onMouseDownModeStep03);
    selectAvg.removeEventListener("mousemove", onMouseMoveModeStep03);
    selectAvg.removeEventListener("mouseup", onMouseUpModeStep03);
  }

  // 點選 mouse up的事件
  function onMouseUpModeStep03(e) {
    if (!mouseOnStep03) return;
    clearEventBubble(e);
    mouseOnStep03 = false;
    var selDiv = document.getElementById("selectDiv");
    var fileDivs = document.getElementsByTagName("rect");
    var selectedEls = [];
    // 取得參數
    var l = selDiv.offsetLeft;
    var t = selDiv.offsetTop;
    var w = selDiv.offsetWidth;
    var h = selDiv.offsetHeight;
    for (var i = 0; i < fileDivs.length; i++) {
      var sl = fileDivs[i].offsetWidth + fileDivs[i].offsetLeft;
      var st = fileDivs[i].offsetHeight + fileDivs[i].offsetTop;
      if (
        fileDivs[i].getBoundingClientRect().right > l &&
        fileDivs[i].getBoundingClientRect().bottom > t &&
        fileDivs[i].getBoundingClientRect().left < l + w &&
        fileDivs[i].getBoundingClientRect().top < t + h
      ) {
        // 该DOM元素被选中，进行处理
        // 排除topview 
        
        if (fileDivs[i].id.substring(0, 8) !== "descGrid" && fileDivs[i].id.substring(0,7) !== "topView" ) {
          selectedEls.push(fileDivs[i]);
          // 加上顏色
          fileDivs[i].classList.add("select-stair");
        }
        console.log(fileDivs[i])
      }
    }
    // ===============選擇梯位===================== 確認儲存
    // 恢复参数
    selDiv.style.display = "none";
  }

  function onMouseMoveModeStep03(e) {
    if (!mouseOnStep03) return;
    clearEventBubble(e);
    var _x = e.clientX;
    var _y = e.clientY;
    var selDiv = document.getElementById("selectDiv");
    selDiv.style.display = "block";
    selDiv.style.left = Math.min(_x, startX) + "px";
    selDiv.style.top = Math.min(_y, startY) + "px";
    selDiv.style.width = Math.abs(_x - startX) + "px";
    selDiv.style.height = Math.abs(_y - startY) + "px";
  }

  function onMouseDownModeStep03(e) {
    clearEventBubble(e);
    if (e.buttons !== 1 || e.which !== 1) return;
    mouseOnStep03 = true;
    startX = e.clientX;
    startY = e.clientY;
    var selDiv = document.createElement("div");
    selDiv.style.cssText =
      "position:absolute;width:0;height:0;margin:0;padding:0;border:1px dashed #eee;background-color:#aaa;z-index:1000;opacity:0.6;display:none;";
    selDiv.id = "selectDiv";
    document.body.appendChild(selDiv);
    selDiv.style.left = startX + "px";
    selDiv.style.top = startY + "px";
  }

  function clearEventBubble(e) {
    if (e.stopPropagation) e.stopPropagation();
    else e.cancelBubble = true;
    if (e.preventDefault) e.preventDefault();
    else e.returnValue = false;
  }

  // 重置參數
  function resetStep03Rect() {
    const topView = document.getElementById("topView");
    const frontView = document.getElementById("frontView");
    const rearView = document.getElementById("rearView");
    const leftSideView = document.getElementById("leftSideView");
    const rightSideView = document.getElementById("rightSideView");
    while (topView.firstChild) {
      topView.removeChild(topView.firstChild);
    }
    while (frontView.firstChild) {
      frontView.removeChild(frontView.firstChild);
    }
    while (rearView.firstChild) {
      rearView.removeChild(rearView.firstChild);
    }
    while (leftSideView.firstChild) {
      leftSideView.removeChild(leftSideView.firstChild);
    }
    while (rightSideView.firstChild) {
      rightSideView.removeChild(rightSideView.firstChild);
    }
  }
})

// 關閉並儲存
const saveAddAnchor = document.getElementById("saveAddAnchor");
saveAddAnchor.addEventListener("click", (e) => {
  e.preventDefault();
  const addAnchorInfoX = document.getElementById("addAnchorInfoX").value;
  const addAnchorInfoY = document.getElementById("addAnchorInfoY").value;
  const addAnchorInfoZ = document.getElementById("addAnchorInfoZ").value;
  if (addAnchorInfoX === "" && addAnchorInfoY === "" && addAnchorInfoZ === "") {
  } else {
    scaffoldArray.anchorPoint.push({
      x: parseInt(addAnchorInfoX),
      y: parseInt(addAnchorInfoY),
      z: parseInt(addAnchorInfoZ),
    });
    getAnchorArray(xyArray);
  }
  $("#addAnchorModal").modal("hide");
});

// 上傳並下載

const finishAndDownload = document.getElementById("finishAndDownload");
finishAndDownload.addEventListener("click", (e) => {
  const svgData = document.getElementById("svg").outerHTML;
  convertSvgToDxf(svgData);
});

const convertSvgToDxf = async (svgData) => {
  const loading = document.querySelector(".bar");
  loading.style.display = "block";
  try {
    const data = getNewJson();
    const response = await axios.post("/api", {
      data: JSON.stringify(data),
    });
    const res = response.data;
    console.log(res);
    if (res.result) {
      loading.style.display = "none";
      location.href = `/dxfFile/${res.fileName}.dxf`;
    }
  } catch (error) {}
};

// 測試檔案上傳
const uploadInput = document.getElementById("uploadInput");
uploadInput.addEventListener(
  "change",
  () => {
    // Calculate total size
    let numberOfBytes = 0;
    for (const file of uploadInput.files) {
      numberOfBytes += file.size;
    }

    // Approximate to the closest prefixed unit
    const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
    const exponent = Math.min(
      Math.floor(Math.log(numberOfBytes) / Math.log(1024)),
      units.length - 1
    );
    const approx = numberOfBytes / 1024 ** exponent;
    const output =
      exponent === 0
        ? `${numberOfBytes} bytes`
        : `${approx.toFixed(3)} ${units[exponent]} (${numberOfBytes} bytes)`;

    document.getElementById("fileNum").textContent = uploadInput.files.length;
    document.getElementById("fileSize").textContent = output;
  },
  false
);

// 上傳檔案
// script.js
const uploadForm = document.getElementById("upload-form");

uploadForm.addEventListener("submit", submitForm);

function submitForm(e) {
    e.preventDefault();
    const files = document.getElementById("uploadInput");
    const formData = new FormData();
    for(let i =0; i < files.files.length; i++) {
        formData.append("file", files.files[i]);
    }
    fetch("/upload_files", {
        method: 'POST',
        body: formData,
        // headers: {
        //   "Content-Type": "multipart/form-data"
        // }
    })
        .then((res) => console.log(res))
        .catch((err) => ("Error occured", err));
}

function getNewJson() {
  const newJson = {
    fileName: caseName, // caseName
    base: scaffoldArray.base,
    role: scaffoldArray.role,
    fiveViewGrid: scaffoldArray.fiveViewGrid,
    height: scaffoldArray.height,
    stair: scaffoldArray.stair,
    anchor: scaffoldArray.anchor,
  };
  return newJson;
}
