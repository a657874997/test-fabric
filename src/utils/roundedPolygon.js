import { fabric } from 'fabric'

const LEFT = 'left'
const TOP = 'top'
const RIGHT = 'right'
const BOTTOM = 'bottom'
const CENTER = 'center'
const opposite = {
    top: BOTTOM,
    bottom: TOP,
    left: RIGHT,
    right: LEFT,
    center: CENTER
}

/**
  * Inspect fabricObject to understand if the current scaling action is allowed 是否允许缩放
  * @param {fabric.Object} fabricObject the fabric object about to scale
  * @param {String} by 'x' or 'y' or ''
  * @param {Boolean} scaleProportionally true if we are trying to scale proportionally
  * @return {Boolean} true if scaling is not allowed at current conditions
  */
function scalingIsForbidden(fabricObject, by, scaleProportionally) {
    // 判断是否可以缩放，若为true则不可缩放
    const lockX = fabricObject.lockScalingX
    const lockY = fabricObject.lockScalingY
    if (lockX && lockY) {
        return true
    }
    if (!by && (lockX || lockY) && scaleProportionally) {
        return true
    }
    if (lockX && by === 'x') {
        return true
    }
    if (lockY && by === 'y') {
        return true
    }
    return false
}

/**
  * Inspect event and fabricObject properties to understand if the scaling action 判断是否等比例缩放
  * @param {Event} eventData from the user action
  * @param {fabric.Object} fabricObject the fabric object about to scale
  * @return {Boolean} true if scale is proportional
  */
function scaleIsProportional(eventData, fabricObject) {
    const canvas = fabricObject.canvas
    const uniScaleKey = canvas.uniScaleKey
    const uniformIsToggled = eventData[uniScaleKey]
    return (canvas.uniformScaling && !uniformIsToggled) || (!canvas.uniformScaling && uniformIsToggled)
}

/**
  * Transforms a point described by x and y in a distance from the top left corner of the object 将坐标点（x，y）转换为相对于一个对象（通过transform.target指定）的左上角的距离
  * bounding box.
  * @param {Object} transform
  * @param {String} originX
  * @param {String} originY
  * @param {number} x
  * @param {number} y
  * @return {fabric.Point} the normalized point
  */
function getLocalPoint(transform, originX, originY, x, y) {
    const target = transform.target
    const control = target.controls[transform.corner]
    const zoom = target.canvas.getZoom()
    const padding = target.padding / zoom
    const localPoint = target.toLocalPoint(new fabric.Point(x, y), originX, originY)
    if (localPoint.x >= padding) {
        localPoint.x -= padding
    }
    if (localPoint.x <= -padding) {
        localPoint.x += padding
    }
    if (localPoint.y >= padding) {
        localPoint.y -= padding
    }
    if (localPoint.y <= padding) {
        localPoint.y += padding
    }
    localPoint.x -= control.offsetX
    localPoint.y -= control.offsetY
    return localPoint
}

/**
   * Checks if transform is centered 检查变换是否居中
   * @param {Object} transform transform data
   * @return {Boolean} true if transform is centered
   */
function isTransformCentered(transform) {
    return transform.originX === CENTER && transform.originY === CENTER
}

function scaleObject(eventData, transform, x, y, options) {
    options = options || {}
    const target = transform.target
    const lockScalingX = target.lockScalingX
    const lockScalingY = target.lockScalingY
    const by = options.by
    let newPoint
    let scaleX
    let scaleY
    let dim
    const scaleProportionally = scaleIsProportional(eventData, target)
    const forbidScaling = scalingIsForbidden(target, by, scaleProportionally)
    let signX
    let signY
    // 用户手指间的相对距离变化
    const gestureScale = transform.gestureScale

    if (forbidScaling) {
        return false
    }
    if (gestureScale) {
        scaleX = transform.scaleX * gestureScale
        scaleY = transform.scaleY * gestureScale
    } else {
        newPoint = getLocalPoint(transform, transform.originX, transform.originY, x, y)
        // use of sign: We use sign to detect change of direction of an action. sign usually change when
        // we cross the origin point with the mouse. So a scale flip for example. There is an issue when scaling
        // by center and scaling using one middle control ( default: mr, mt, ml, mb), the mouse movement can easily
        // cross many time the origin point and flip the object. so we need a way to filter out the noise.
        // This ternary here should be ok to filter out X scaling when we want Y only and vice versa.
        signX = by !== 'y' ? Math.sign(newPoint.x) : 1
        signY = by !== 'x' ? Math.sign(newPoint.y) : 1
        if (!transform.signX) {
            transform.signX = signX
        }
        if (!transform.signY) {
            transform.signY = signY
        }

        if (transform.signX !== signX || transform.signY !== signY) {
            return false
        }

        dim = target._getTransformedDimensions()
        // missing detection of flip and logic to switch the origin
        if (scaleProportionally && !by) {
            // uniform scaling
            const distance = Math.abs(newPoint.x) + Math.abs(newPoint.y)
            const original = transform.original
            const originalDistance = Math.abs(dim.x * original.scaleX / target.scaleX) +
                Math.abs(dim.y * original.scaleY / target.scaleY)
            const scale = distance / originalDistance
            scaleX = original.scaleX * scale
            scaleY = original.scaleY * scale
        } else {
            scaleX = Math.abs(newPoint.x * target.scaleX / dim.x)
            scaleY = Math.abs(newPoint.y * target.scaleY / dim.y)
        }
        // if we are scaling by center, we need to double the scale
        if (isTransformCentered(transform)) {
            scaleX *= 2
            scaleY *= 2
        }
        if (transform.signX !== signX && by !== 'y') {
            transform.originX = opposite[transform.originX]
            scaleX *= -1
            transform.signX = signX
        }
        if (transform.signY !== signY && by !== 'x') {
            transform.originY = opposite[transform.originY]
            scaleY *= -1
            transform.signY = signY
        }
    }
    // minScale is taken are in the setter.
    const oldWidth = target.width
    const oldHeight = target.height
    if (!by) {
        let points = target.points;
        if (!lockScalingX) {
            let rotatedMovementX = oldWidth * (1 - scaleX);
            const maxX = Math.max(...points.map(point => point.x))
            const minX = Math.min(...points.map(point => point.x)); // 找到最小x值，也就是最左边的点
            const xLength = maxX - minX;
            switch (options.control) {
                // 左上角控制点
                case 'tl':
                // 左下控制点
                case 'bl':
                    points.forEach((point) => {
                        if (point.x < maxX) {
                            point.x = point.x + ((maxX - point.x) / xLength) * rotatedMovementX;
                        }
                    })
                    target.set({
                        rotatedMovementX_1: target.rotatedMovementX_1 + rotatedMovementX,
                    })
                    break;
                // 右上控制点
                case 'tr':
                // 右下控制点
                case 'br':
                    points.forEach((point) => {
                        if (point.x > minX) { // 只有在最左边的点右边的点会被移动
                            point.x = point.x - ((point.x - minX) / xLength) * rotatedMovementX;
                        }
                    })
                    target.set({
                        rotatedMovementX_2: target.rotatedMovementX_2 + rotatedMovementX,
                    })
                default:
                    break;
            }
        }
        if (!lockScalingY) {
            let rotatedMovementY = oldHeight * (1 - scaleY);
            const maxY = Math.max(...points.map(point => point.y))
            const minY = Math.min(...points.map(point => point.y)); // 找到最小y值，也就是最上边的点
            const yLength = maxY - minY;
            switch (options.control) {
                // 左上角控制点
                case 'tl':
                // 右上控制点
                case 'tr':
                    points.forEach((point) => {
                        if (point.y < maxY) { // 只有在最下边的点上边的点会被移动
                            point.y = point.y + ((maxY - point.y) / yLength) * rotatedMovementY;
                        }
                    })
                    target.set({
                        rotatedMovementY_1: target.rotatedMovementY_1 + rotatedMovementY,
                    })
                    break;
                // 左下控制点
                case 'bl':
                // 右下控制点
                case 'br':
                    points.forEach((point) => {
                        if (point.y > minY) { // 只有在最上边的点下边的点会被移动
                            point.y = point.y - ((point.y - minY) / yLength) * rotatedMovementY;
                        }
                    })
                    target.set({
                        rotatedMovementY_2: target.rotatedMovementY_2 + rotatedMovementY,
                    })
                default:
                    break;
            }
        }
        const newMaxX = Math.max(...points.map(point => point.x))
        const newMinX = Math.min(...points.map(point => point.x)); // 找到最小x值，也就是最左边的点
        const newXLength = newMaxX - newMinX;
        const newMaxY = Math.max(...points.map(point => point.y))
        const newMinY = Math.min(...points.map(point => point.y)); // 找到最小y值，也就是最上边的点
        const newYLength = newMaxY - newMinY;
        const newPath = createRoundedPolygonPath(points, target.radius)
        const path = new fabric.Path(newPath).path
        target.set("path", path)
        target.set({
            width: newXLength,
            height: newYLength,
        })
        switch (options.control) {
            // 左上角控制点
            case 'tl':
                target.pathOffset.x = target.startWidth - newXLength / 2 - target.rotatedMovementX_2;
                target.pathOffset.y = target.startHeight - newYLength / 2 - target.rotatedMovementY_2;
                break;
            // 右上控制点
            case 'tr':
                target.pathOffset.x = newXLength / 2 + target.rotatedMovementX_1;
                target.pathOffset.y = target.startHeight - newYLength / 2 - target.rotatedMovementY_2;
                break;
            // 左下控制点
            case 'bl':
                target.pathOffset.x = target.startWidth - newXLength / 2 - target.rotatedMovementX_2;
                target.pathOffset.y = newYLength / 2 + target.rotatedMovementY_1;
                break;
            // 右下控制点
            case 'br':
                target.pathOffset.x = newXLength / 2 + target.rotatedMovementX_1;
                target.pathOffset.y = newYLength / 2 + target.rotatedMovementY_1;
                break;
            default:
                break;
        }
        target.setCoords()
    }
    if (oldWidth !== target.width || oldHeight !== target.height) {
        const radians = fabric.util.degreesToRadians(target.angle) // 将角度转换为弧度
        const cosAngle = Math.cos(radians)
        const sinAngle = Math.sin(radians)
        switch (options.control) {
            // 左上角控制点
            case 'tl':
                {
                    const newLeft = target.left - ((target.width - oldWidth) * cosAngle - (target.height - oldHeight) * sinAngle)
                    const newTop = target.top - ((target.width - oldWidth) * sinAngle + (target.height - oldHeight) * cosAngle)
                    target.set('left', newLeft)
                    target.set('top', newTop)
                    break
                }
            // 右上控制点
            case 'tr':
                {
                    const newLeft = target.left + ((target.height - oldHeight) * sinAngle)
                    const newTop = target.top - ((target.height - oldHeight) * cosAngle)
                    target.set('left', newLeft)
                    target.set('top', newTop)
                    break
                }
            case 'bl':
                {
                    const newLeft = target.left - ((target.width - oldWidth) * cosAngle)
                    const newTop = target.top - ((target.width - oldWidth) * sinAngle)
                    target.set('left', newLeft)
                    target.set('top', newTop)
                    break
                }
            case 'br':
                {
                    break
                }
            default:
                break
        }
    }
    return oldWidth !== target.width || oldHeight !== target.height
}
/**
 * @description: 生成带圆角的多边形路径(不支持扇形、圆弧等)
 * @param {Array<{x:number,y:number}>} points 多边形顶点坐标数组
 * @return {string} 返回path数据，可用fabric.Path直接生成对应形状
 */
function createRoundedPolygonPath(points, radius) {
    let pathData = "";
    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const nextPoint = points[(i + 1) % points.length];
        const prevPoint = points[i === 0 ? points.length - 1 : i - 1];

        const distancePrev = Math.hypot(
            point.x - prevPoint.x,
            point.y - prevPoint.y
        );
        const distanceNext = Math.hypot(
            point.x - nextPoint.x,
            point.y - nextPoint.y
        );

        const actualCornerRadius = Math.min(
            radius,
            distancePrev / 2,
            distanceNext / 2
        );

        const anglePrev = Math.atan2(prevPoint.y - point.y, prevPoint.x - point.x);
        const angleNext = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);

        const roundedStartX = point.x + actualCornerRadius * Math.cos(anglePrev);
        const roundedStartY = point.y + actualCornerRadius * Math.sin(anglePrev);

        const roundedEndX = point.x + actualCornerRadius * Math.cos(angleNext);
        const roundedEndY = point.y + actualCornerRadius * Math.sin(angleNext);

        if (i === 0) {
            pathData = `M ${roundedStartX} ${roundedStartY}`;
        } else {
            pathData += ` L ${roundedStartX} ${roundedStartY}`;
        }

        pathData += ` Q ${point.x} ${point.y}, ${roundedEndX} ${roundedEndY}`;
    }
    pathData += " Z";
    return pathData;
}

function calculateNewWidth(path) {
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < path.length; i++) {
        let x = path[i].x;
        if (x < minX) {
            minX = x;
        }
        if (x > maxX) {
            maxX = x;
        }
    }
    return maxX - minX;
}

function calculateNewHeight(path) {
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < path.length; i++) {
        let y = path[i].y;
        if (y < minY) {
            minY = y;
        }
        if (y > maxY) {
            maxY = y;
        }
    }
    return maxY - minY;
}
export const initRoundedPolygon = () => {
    fabric.RoundedPolygon = fabric.util.createClass(fabric.Path, {
        type: 'RoundedPolygon',
        initialize: function (options) {
            options = options || {}
            this.points = options.points;
            const path = createRoundedPolygonPath(this.points, options.radius || 0);
            const startWidth = calculateNewWidth(this.points)
            const startHeight = calculateNewHeight(this.points)
            this.callSuper('initialize', path, {
                strokeUniform: true,
                noScaleCache: false,
                paintFirst: 'stroke',
                startWidth,
                startHeight,
                rotatedMovementX_1: 0,
                rotatedMovementX_2: 0,
                rotatedMovementY_1: 0,
                rotatedMovementY_2: 0,
                ...options
            })
        },
        set: function (key, value) {
            this.callSuper('set', key, value);
            if ((typeof key === 'string' && key === 'radius') || (typeof key === 'object' && key.radius)) {
                var newRadius = typeof key === 'string' ? value : key.radius;
                const path = createRoundedPolygonPath(this.points, newRadius);
                this.callSuper('set', 'path', new fabric.Path(path).path)
            }

            return this;
        },
        toObject: function (propertiesToInclude) {
            const tmpPropertiesToInclude = propertiesToInclude || []
            return this.callSuper('toObject', [
                'radius',
                'points',
                'startWidth',
                'startHeight',
                'rotatedMovementX_1',
                'rotatedMovementX_2',
                'rotatedMovementY_1',
                'rotatedMovementY_2',
                ...tmpPropertiesToInclude
            ])
        },
        /**
         * @private
         * @param {CanvasRenderingContext2D} ctx Context to render on
         */
        // _renderFill: function (ctx) {
        //     if (!this.fill) {
        //         return
        //     }
        //     ctx.save()
        //     const _width = this.width - this.strokeWidth > 0 ? this.width - this.strokeWidth : 0
        //     const _height = this.height - this.strokeWidth > 0 ? this.height - this.strokeWidth : 0
        //     let rx = this.rx ? Math.min(this.rx, _width / 2) : 0
        //     let ry = this.ry ? Math.min(this.ry, _height / 2) : 0
        //     rx = rx - this.strokeWidth / 2 > 0 ? rx - this.strokeWidth / 2 : 0
        //     ry = ry - this.strokeWidth / 2 > 0 ? ry - this.strokeWidth / 2 : 0
        //     const w = _width
        //     const h = _height
        //     const x = -_width / 2
        //     const y = -_height / 2
        //     const isRounded = rx !== 0 || ry !== 0
        //     /* "magic number" for bezier approximations of arcs (http://itc.ktu.lt/itc354/Riskus354.pdf) */
        //     const k = 1 - 0.5522847498
        //     ctx.beginPath()

        //     ctx.moveTo(x + rx, y)

        //     ctx.lineTo(x + w - rx, y)
        //     isRounded && ctx.bezierCurveTo(x + w - k * rx, y, x + w, y + k * ry, x + w, y + ry)

        //     ctx.lineTo(x + w, y + h - ry)
        //     isRounded && ctx.bezierCurveTo(x + w, y + h - k * ry, x + w - k * rx, y + h, x + w - rx, y + h)

        //     ctx.lineTo(x + rx, y + h)
        //     isRounded && ctx.bezierCurveTo(x + k * rx, y + h, x, y + h - k * ry, x, y + h - ry)

        //     ctx.lineTo(x, y + ry)
        //     isRounded && ctx.bezierCurveTo(x, y + k * ry, x + k * rx, y, x + rx, y)

        //     ctx.closePath()
        //     this._setFillStyles(ctx, this)
        //     if (this.fillRule === 'evenodd') {
        //         ctx.fill('evenodd')
        //     } else {
        //         ctx.fill()
        //     }
        //     ctx.restore()
        // },
        controls: {
            ml: new fabric.Control({
                // 左中控制点
                x: -0.5,
                y: 0,
                cursorStyleHandler: fabric.controlsUtils.scaleSkewCursorStyleHandler,
                getActionName: fabric.controlsUtils.scaleOrSkewActionName,
                actionHandler: function (eventData, transform, x, y) {
                    const target = transform.target
                    const radians = fabric.util.degreesToRadians(target.angle) // 将角度转换为弧度

                    const cosAngle = Math.cos(radians)
                    const sinAngle = Math.sin(radians)
                    const cvs = target.canvas.getElement()
                    const showW = parseFloat(cvs.style.width)
                    const realW = cvs.width
                    const ratioW = realW / showW
                    const showH = parseFloat(cvs.style.height)
                    const realH = cvs.height
                    const ratioH = realH / showH
                    const mX = ratioW * eventData.movementX
                    const mY = ratioH * eventData.movementY
                    // 计算旋转后的拖拽向量
                    const rotatedMovementX = mX * cosAngle + mY * sinAngle
                    if (target.width - rotatedMovementX >= 1) {
                        // 更新图像大小
                        let points = target.points;
                        let maxX = Math.max(...points.map(point => point.x)); // 找到最大x值，也就是最右边的点
                        let minX = Math.min(...points.map(point => point.x)); // 找到最小x值，也就是最左边的点
                        let xLength = maxX - minX;
                        points.forEach((point) => {
                            if (point.x < maxX) { // 只有在最右边的点左边的点会被移动
                                point.x = point.x + ((maxX - point.x) / xLength) * rotatedMovementX;
                            }
                        })
                        const newPath = createRoundedPolygonPath(points, target.radius)
                        const path = new fabric.Path(newPath).path
                        target
                            .set({
                                path,
                                points,
                                objectCaching: false
                            })
                        const dims = target._calcDimensions()
                        const newWidth = (maxX-minX) - rotatedMovementX;
                        target.set({
                            rotatedMovementX_1: rotatedMovementX + target.rotatedMovementX_1,
                            width: newWidth,
                            left: target.left + rotatedMovementX * cosAngle,
                            top: target.top + rotatedMovementX * sinAngle,
                        })
                        target.pathOffset.x = target.startWidth - newWidth / 2 - target.rotatedMovementX_2;
                        target.setCoords()
                    }
                    return true
                }
            }),
            mr: new fabric.Control({
                // 右中控制点
                x: 0.5,
                y: 0,
                cursorStyleHandler: fabric.controlsUtils.scaleSkewCursorStyleHandler,
                getActionName: fabric.controlsUtils.scaleOrSkewActionName,
                actionHandler: function (eventData, transform, x, y) {
                    const target = transform.target
                    const radians = fabric.util.degreesToRadians(target.angle)
                    const cosAngle = Math.cos(radians)
                    const sinAngle = Math.sin(radians)
                    const cvs = target.canvas.getElement()
                    const showW = parseFloat(cvs.style.width)
                    const realW = cvs.width
                    const ratioW = realW / showW
                    const showH = parseFloat(cvs.style.height)
                    const realH = cvs.height
                    const ratioH = realH / showH
                    const mX = ratioW * eventData.movementX
                    const mY = ratioH * eventData.movementY

                    const rotatedMovementX = mX * cosAngle + mY * sinAngle
                    if (target.width + rotatedMovementX >= 1) {
                        // 更新图像大小
                        let points = target.points;
                        let minX = Math.min(...points.map(point => point.x)); // 找到最小x值，也就是最左边的点
                        let maxX = Math.max(...points.map(point => point.x)); // 找到最大x值，也就是最右边的点
                        let xLength = maxX - minX;
                        points.forEach((point) => {
                            if (point.x > minX) {
                                point.x = point.x + ((point.x - minX) / xLength) * rotatedMovementX;
                            }
                        })
                        const newPath = createRoundedPolygonPath(points, target.radius)
                        const path = new fabric.Path(newPath).path
                        target
                            .set({
                                path,
                                points,
                                objectCaching: false
                            })
                        // const dims = target._calcDimensions()
                        let newWidth = (maxX-minX) + rotatedMovementX;
                        target.set({
                            width: newWidth,
                            rotatedMovementX_2: target.rotatedMovementX_2 - rotatedMovementX,
                        })
                        target.pathOffset.x = newWidth / 2 + target.rotatedMovementX_1;
                        target.setCoords()
                    }

                    return true
                }
            }),
            mt: new fabric.Control({
                // 上中控制点
                x: 0,
                y: -0.5,
                cursorStyleHandler: fabric.controlsUtils.scaleSkewCursorStyleHandler,
                getActionName: fabric.controlsUtils.scaleOrSkewActionName,
                actionHandler: function (eventData, transform, x, y) {
                    const target = transform.target
                    const radians = fabric.util.degreesToRadians(target.angle) // 将角度转换为弧度

                    const cosAngle = Math.cos(radians)
                    const sinAngle = Math.sin(radians)
                    const cvs = target.canvas.getElement()
                    const showW = parseFloat(cvs.style.width)
                    const realW = cvs.width
                    const ratioW = realW / showW
                    const showH = parseFloat(cvs.style.height)
                    const realH = cvs.height
                    const ratioH = realH / showH
                    const mX = ratioW * eventData.movementX
                    const mY = ratioH * eventData.movementY

                    // 计算旋转后的拖拽向量
                    const rotatedMovementY =
                        mY * cosAngle - mX * sinAngle
                    if (target.height - rotatedMovementY >= 1) {
                        // 更新图像大小
                        let points = target.points;
                        let maxY = Math.max(...points.map(point => point.y)); // 找到最大y值，也就是最下边的点
                        let minY = Math.min(...points.map(point => point.y)); // 找到最小y值，也就是最上边的点
                        points.forEach((point) => {
                            if (point.y < maxY) { // 只有在最下边的点上边的点会被移动
                                point.y = point.y + ((maxY - point.y) / (maxY - minY)) * rotatedMovementY;
                            }
                        })
                        const newPath = createRoundedPolygonPath(points, target.radius)
                        const path = new fabric.Path(newPath).path
                        target
                            .set({
                                path,
                                points,
                                objectCaching: false
                            })
                        // const dims = target._calcDimensions()
                        const newHeight = (maxY-minY) - rotatedMovementY;
                        target.set({
                            rotatedMovementY_1: rotatedMovementY + target.rotatedMovementY_1,
                            height: newHeight,
                            left: target.left - rotatedMovementY * sinAngle,
                            top: target.top + rotatedMovementY * cosAngle,
                        })
                        target.pathOffset.y = target.startHeight - newHeight / 2 - target.rotatedMovementY_2;
                        target.setCoords()
                    }
                    return true
                }
            }),
            mb: new fabric.Control({
                // 下中控制点
                x: 0,
                y: 0.5,
                cursorStyleHandler: fabric.controlsUtils.scaleSkewCursorStyleHandler,
                getActionName: fabric.controlsUtils.scaleOrSkewActionName,
                actionHandler: function (eventData, transform, x, y) {
                    const target = transform.target
                    const radians = fabric.util.degreesToRadians(target.angle) // 将角度转换为弧度

                    const cosAngle = Math.cos(radians)
                    const sinAngle = Math.sin(radians)
                    const cvs = target.canvas.getElement()
                    const showW = parseFloat(cvs.style.width)
                    const realW = cvs.width
                    const ratioW = realW / showW
                    const showH = parseFloat(cvs.style.height)
                    const realH = cvs.height
                    const ratioH = realH / showH
                    const mX = ratioW * eventData.movementX
                    const mY = ratioH * eventData.movementY

                    // 计算旋转后的拖拽向量
                    const rotatedMovementY =
                        mY * cosAngle - mX * sinAngle
                    if (target.height + rotatedMovementY >= 1) {
                        // 更新图像大小
                        let points = target.points;
                        let minY = Math.min(...points.map(point => point.y)); // 找到最小y值，也就是最上边的点
                        let maxY = Math.max(...points.map(point => point.y)); // 找到最大y值，也就是最下边的点
                        points.forEach((point) => {
                            if (point.y > minY) { // 只有在最上边的点下边的点会被移动
                                point.y = point.y + ((point.y - minY) / (maxY - minY)) * rotatedMovementY;
                            }
                        })
                        const newPath = createRoundedPolygonPath(points, target.radius)
                        const path = new fabric.Path(newPath).path
                        target
                            .set({
                                path,
                                points,
                                objectCaching: false
                            })
                        // const dims = target._calcDimensions()
                        const newHeight = (maxY-minY) + rotatedMovementY;
                        target.set({
                            height: newHeight,
                            rotatedMovementY_2: target.rotatedMovementY_2 - rotatedMovementY,
                        })
                        target.pathOffset.y = newHeight / 2 + target.rotatedMovementY_1;
                        target.setCoords()
                    }
                    return true
                }
            }),
            tl: new fabric.Control({
                // 左上控制点
                x: -0.5,
                y: -0.5,
                cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
                actionHandler: function (eventData, transform, x, y) {
                    return scaleObject(eventData, transform, x, y, { control: 'tl' })
                }
            }),
            tr: new fabric.Control({
                // 右上控制点
                x: 0.5,
                y: -0.5,
                cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
                actionHandler: function (eventData, transform, x, y) {
                    return scaleObject(eventData, transform, x, y, { control: 'tr' })
                }
            }),
            bl: new fabric.Control({
                // 左下控制点
                x: -0.5,
                y: 0.5,
                cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
                actionHandler: function (eventData, transform, x, y) {
                    return scaleObject(eventData, transform, x, y, { control: 'bl' })
                }
            }),
            br: new fabric.Control({
                // 右下控制点
                x: 0.5,
                y: 0.5,
                cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
                actionHandler: function (eventData, transform, x, y) {
                    return scaleObject(eventData, transform, x, y, { control: 'br' })
                }
            }),
            mtr: fabric.Object.prototype.controls.mtr
        }
    })

    fabric.RoundedPolygon.fromObject = function (object, callback) {
        return fabric.Object._fromObject('RoundedPolygon', object, callback)
    }

    fabric.RoundedPolygon.generate = function (options) {
        const obj = new fabric.RoundedPolygon({
            fill: 'transparent', // 设置填充为透明
            ...options
        })
        return obj
    }
}