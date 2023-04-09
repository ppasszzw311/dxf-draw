// 儲存步驟3
// 第三步完成
const btnStep03 = document.getElementById("step03")
btnStep03.addEventListener('click', e => {
    const rung = document.getElementById("rungRole").value
    scaffoldArray.rung.push(rung)
    // 建立五視圖
    buildThreeView()

    // 設定view point
    const svgaa = document.getElementById("step04Svg")

    let moveToViewBox = `0 0 ${threeViewBorder[9].x} ${(threeViewBorder[9].x)*5/6}` 
    svgaa.setAttribute('viewBox', moveToViewBox)
})

// 建立五視圖
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
    getRectArray(30 + threeViewCoord.y + 50, threeViewCoord.y, sizeXY, topViewArray, 'topView04')
    threeViewBorder.push({ name: "topView", x: 30 + threeViewCoord.y + 50, y: 0, size: sizeXY })
    getRectArray(30, threeViewCoord.z + threeViewCoord.y + 140, sizeYZ, leftSideViewArray, 'leftSideView04')
    threeViewBorder.push({ name: "leftSideView", x: 30, y: threeViewCoord.y, size: sizeYZ })
    getRectArray(30 + threeViewCoord.y + 50, threeViewCoord.z + threeViewCoord.y + 140, sizeXZ, frontViewArray, 'frontView04')
    threeViewBorder.push({ name: "frontView", x: 30 + threeViewCoord.y + 50, y: threeViewCoord.y, size: sizeXZ })
    getRectArray(30 + threeViewCoord.y + threeViewCoord.x + 100, threeViewCoord.z + threeViewCoord.y + 140, sizeYZ, rightSideViewArray, 'rightSideView04')
    threeViewBorder.push({ name: "rightSideView", x: 30 + threeViewCoord.y + threeViewCoord.x + 100, y: threeViewCoord.y, size: sizeYZ })
    getRectArray(30 + threeViewCoord.y * 2 + threeViewCoord.x + 150, threeViewCoord.z + threeViewCoord.y + 140, sizeXZ, rearViewArray, 'rearView04')
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
            let rectId = `${id}_${i + 1}_${j + 1}_04`
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
                const textValue = `text_rect_${i + 1}_${j + 1}_04`
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
