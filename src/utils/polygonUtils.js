/**
 * @description: 生成带圆角的多边形路径(不支持扇形、圆弧等)
 * @param {Array<{x:number,y:number}>} points 多边形顶点坐标数组
 * @return {string} 返回path数据，可用fabric.Path直接生成对应形状
 */
function createRoundedPolygonPath(points, cornerRadius) {
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
      cornerRadius,
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
/**
 * @description: 通过坐标点，创建饼图
 * @param {Array<{x:number,y:number}>} points 坐标点 至少两个，第一个为圆心，第二个为起点，第三个为结束点,若第三个不存在，则生成整圆 [{x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}]
 * @param {Boolean} isClockwise 是否顺时针
 * @return {String} 返回path参数，可用fabric.Path直接生成对应图形
 */
function createPiePath(points, isClockwise = true) {
  let pathData = "";
  const radius = calculateDistance(
    points[0].x,
    points[0].y,
    points[1].x,
    points[1].y
  );
  // const radius = 70;
  if (points.length <= 2) {
    pathData =
      "M " +
      points[0].x +
      " " +
      points[0].y +
      " m -" +
      radius +
      ", 0" +
      " a " +
      radius +
      "," +
      radius +
      " 0 1,0 " +
      radius * 2 +
      ",0" +
      " a " +
      radius +
      "," +
      radius +
      " 0 1,0 -" +
      radius * 2 +
      ",0";
  } else {
    let start, end;
    console.log("isClockwise", isClockwise);
    if (isClockwise) {
      start = points[1];
      end = points[2];
    } else {
      start = points[2];
      end = points[1];
    }
    const startAngle = Math.atan2(start.y - points[0].y, start.x - points[0].x); // 起始角度
    const endAngle = Math.atan2(end.y - points[0].y, end.x - points[0].x); // 截止角度
    pathData =
      "M " +
      start.x +
      " " +
      start.y +
      " A " +
      radius +
      " " +
      radius +
      " 0 " +
      (calculateClosureFlag(startAngle, endAngle) ? "1" : "0") +
      ` 1 ` +
      end.x +
      " " +
      end.y +
      " L " +
      points[0].x +
      " " +
      points[0].y +
      " Z";
  }
  return pathData;
}
/**
 * @description: 通过坐标点，创建圆环
 * @param {Array<{x:number,y:number}>} points 坐标点，第一个为圆心，第二个为起点，第三个为结束点
 * @param {Number} sectorWidth 圆环宽度
 * @param {Boolean} isClockwise 是否顺时针
 * @return {String} 返回path参数，可用fabric.Path直接生成对应图形 TODO: 若是整圆，请将fillRule设置为evenodd 否则会出现填充问题
 */
function cretateCircularRingPath(points, sectorWidth = 1, isClockwise = true) {
  const outerRadius = calculateDistance(
    points[0].x,
    points[0].y,
    points[1].x,
    points[1].y
  );
  const innerRadius = outerRadius - sectorWidth;
  let outerStart, outerEnd;
  if (isClockwise) {
    outerStart = points[1];
    outerEnd = points[2];
  } else {
    outerStart = points[2];
    outerEnd = points[1];
  }
  const innerStart = getInnerCircleCoordinates(
    points[0].x,
    points[0].y,
    outerStart.x,
    outerStart.y,
    sectorWidth
  );
  const innerEnd = getInnerCircleCoordinates(
    points[0].x,
    points[0].y,
    outerEnd.x,
    outerEnd.y,
    sectorWidth
  );
  if (outerStart.x === outerEnd.x && outerStart.y === outerEnd.y) {
    let pathData = `M ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 1 1 ${2 * points[0].x - outerStart.x} ${2 * points[0].y - outerStart.y} A ${outerRadius} ${outerRadius}  0 1 1 ${outerStart.x} ${outerStart.y} M ${innerStart.x} ${innerStart.y} A ${innerRadius} ${innerRadius} 0 1 1 ${ 2 * points[0].x - innerStart.x} ${ 2 * points[0].y - innerStart.y} A ${innerRadius} ${innerRadius} 0 1 1 ${innerStart.x} ${innerStart.y} Z`;
    return pathData;
  }
  // 起始角度
  const startAngle = Math.atan2(
    outerStart.y - points[0].y,
    outerStart.x - points[0].x
  );
  // 截止角度
  const endAngle = Math.atan2(
    outerEnd.y - points[0].y,
    outerEnd.x - points[0].x
  );
  const pathData = `M ${outerStart.x} ${
    outerStart.y
  } A ${outerRadius} ${outerRadius} 0 ${
    calculateClosureFlag(startAngle, endAngle) ? "1" : "0"
  } 1 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${
    innerEnd.y
  } A ${innerRadius} ${innerRadius} 0 ${
    calculateClosureFlag(startAngle, endAngle) ? "1" : "0"
  } 0 ${innerStart.x} ${innerStart.y} Z`;
  return pathData;
}
/**
 * @description: 生成扇形图的path 若是整圆，请使用fabric.Circle方法
 * @param {Array<{x: number, y:number}>} points 坐标点，第一个为圆心，第二个为起点，第三个为结束点
 * @return {string} 返回path参数，可用fabric.Path直接生成对应图形
 */
function createFanshapedPath(points) {
  const radius = calculateDistance(
    points[0].x,
    points[0].y,
    points[1].x,
    points[1].y
  );
  const start = points[1];
  const end = points[2];
  const startAngle = Math.atan2(start.y - points[0].y, start.x - points[0].x); // 起始角度
  const endAngle = Math.atan2(end.y - points[0].y, end.x - points[0].x); // 截止角度
  const pathData = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${
    calculateClosureFlag(startAngle, endAngle) ? "1" : "0"
  } 1 ${end.x} ${end.y} Z`;
  return pathData;
}
/**
 * @description: 计算圆弧内圈的坐标
 * @param {number} x1 圆心x坐标
 * @param {number} y1 圆心y坐标
 * @param {number} x2 圆弧外圈x坐标
 * @param {number} y2 圆弧外圈y坐标
 * @param {number} sectorWidth 圆环宽度
 * @return {Object} 返回内圈坐标 {x:number,y:number}
 */
function getInnerCircleCoordinates(x1, y1, x2, y2, sectorWidth) {
  const radius = calculateDistance(x1, y1, x2, y2);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const x = x1 + (radius - sectorWidth) * Math.cos(angle);
  const y = y1 + (radius - sectorWidth) * Math.sin(angle);
  return { x, y };
}
/**
 * @description: 计算闭合标志位
 * @param {number} startAngle 起始角度
 * @param {number} endAngle 截止角度
 * @return {Boolean}  返回闭合标志位
 */
function calculateClosureFlag(startAngle, endAngle) {
  var angleDifference = endAngle - startAngle;

  // 根据角度差值来确定闭合标志位的值
  if (angleDifference >= 0) {
    // 当 endAngle 大于等于 startAngle 时，判断角度差值是否大于等于 Math.PI
    return angleDifference >= Math.PI;
  } else {
    // 当 endAngle 小于 startAngle 时，判断角度差值是否大于等于 -Math.PI
    return angleDifference >= -Math.PI;
  }
}
/**
 * @description: 计算两个坐标点之间的距离
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} x2
 * @param {Number} y2
 * @return {Number} 返回距离
 */
function calculateDistance(x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  var distance = Math.sqrt(dx * dx + dy * dy);
  return distance;
}
// 为多边形添加文字
class CreatePolygonAndTextGroup {
  /**
   * @description: 为多边形添加文字
   * @param {*} canvas fabric生成的canvas对象
   * @param {*} polygon 多边形对象
   * @param {*} text fabric的Textbox对象
   * @return {*}
   */
  constructor(canvas, polygon, text) {
    this.polygon = polygon;
    this.canvas = canvas;
    this.text = text;
    this.init();
  }
  /**
   * @description: 初始化数据，和事件绑定
   * @param {*}
   * @return {*}
   */
  init() {
    this.textExite = false;
    this.isDbClick = false;
    // 禁止缩放和移动
    // 隐藏控制点
    this.text.set({
      splitByGrapheme: true,
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      hasControls: false,
      originX: "center",
      originY: "center",
      textAlign: "center",
    });
    this.canvas.add(this.polygon);
    this.canvas.add(this.text);
    this.updateText();
    this.changePolygon(this.polygon);
    // 输入框获取焦点的时候，绑定退出焦点事件
    this.text.on("editing:entered", () => {
      if (!this.textExite) {
        // 用户点击画布其他位置时，退出编辑状态
        this.boundMouseDown = this.mouseDown.bind(this);
        this.canvas.on("mouse:down", this.boundMouseDown);
        this.textExite = true;
      }
    });
  }
  /**
   * @description: 点击画布其他位置，退出编辑状态
   * @param {*}
   * @return {*}
   */
  mouseDown(e) {
    const { target } = e;
    if (!target || (target !== this.polygon && target !== this.text)) {
      this.text.exitEditing();
      this.textExite = false;
      // 结束后，删除绑定的事件
      this.canvas.off("mouse:down", this.boundMouseDown);
    }
  }
  /**
   * @description: 更新文字的宽度和位置
   * @param {*}
   * @return {*}
   */
  updateText() {
    let actualWidth = this.polygon.width * this.polygon.scaleX;
    this.maxWidth = actualWidth - 40 > 0 ? actualWidth - 40 : this.fontSize;
    this.text.set({
      width: this.maxWidth,
    });
    this.setTextPoint();
    this.canvas.renderAll();
  }

  /**
   * @description: 位置文字的位置和角度
   * @param {*}
   * @return {*}
   */
  setTextPoint() {
    let polygonCenter = this.polygon.getCenterPoint();
    this.text.set({
      angle: this.polygon.angle,
      left: polygonCenter.x,
      top: polygonCenter.y,
    });
    this.canvas.renderAll();
  }
  /**
   * @description: 图形改变时，需要重新绑定事件
   * @param {*}
   * @return {*}
   */
  changePolygon(polygon) {
    this.polygon = polygon;
    this.canvas.bringToFront(this.text);
    // 模拟双击事件
    this.polygon.on("mousedown", () => {
      if (!this.isDbClick) {
        this.isDbClick = true;
        setTimeout(() => {
          this.isDbClick = false;
        }, 300);
        return;
      }
      this.isDbClick = false;
      this.text.enterEditing();
    });
    // 多边形旋转时，文字也跟着旋转
    this.polygon.on("rotating", (e) => {
      this.text.exitEditing();
      this.canvas.bringToFront(this.text);
      this.setTextPoint();
    });
    // 多边形缩放时，动态设置文字宽度、位置
    this.polygon.on("scaling", (e) => {
      this.text.exitEditing();
      this.canvas.bringToFront(this.text);
      this.updateText();
    });
    // 多边形移动时，动态设置文字位置
    this.polygon.on("moving", (e) => {
      this.text.exitEditing();
      this.setTextPoint();
    });
    this.updateText();
  }
}
// 为多边形添加背景图
class CreatePolygonAndImageGroup {
  /**
   * @description: 为多边形添加背景图
   * @param {*} canvas fabric生成的canvas对象
   * @param {*} polygon 多边形对象
   * @param {*} imageUrl 图片地址
   * @return {*}
   */
  constructor(canvas, polygon, imageUrl) {
    this.polygon = polygon;
    this.canvas = canvas;
    this.init();
    this.bindBgImage(imageUrl);
  }
  /**
   * @description: 设置初始量，和事件绑定
   * @param {*}
   * @return {*}
   */
  init() {
    // 用户点击画布其他位置时，退出编辑状态
    this.isDbClick = false;
    this.boundMouseDown = this.mouseDown.bind(this);
    this.polygonMousedownBind = this.polygonMousedown.bind(this);
  }
  /**
   * @description: 多边形的点击事件
   * @param {*}
   * @return {*}
   */
  polygonMousedown() {
    // 模拟双击事件
    if (!this.isDbClick) {
      this.isDbClick = true;
      setTimeout(() => {
        this.isDbClick = false;
      }, 300);
      return;
    }
    this.isDbClick = false;
    // 如果图片已经显示，则直接裁切
    if (this.image.visible) {
      this.cutImage();
      return;
    }
    // 开启裁切模式
    let left = !this.isPolygonInsideImage
      ? this.polygon.left
      : this.polygon.left +
        this.imagePosition.offsetX +
        (this.image.width - this.polygon.width) / 2;
    let top = !this.isPolygonInsideImage
      ? this.polygon.top
      : this.polygon.top +
        this.imagePosition.offsetY +
        (this.image.height - this.polygon.height) / 2;
    this.image.set({
      left,
      top,
      angle: this.isPolygonInsideImage ? this.image.angle : 0,
      scaleX: this.isPolygonInsideImage ? this.image.scaleX : 1,
      scaleY: this.isPolygonInsideImage ? this.image.scaleY : 1,
      visible: true,
    });
    this.polygon.set({
      fill: "transparent",
      stroke: "black",
      lockScalingX: true,
      lockScalingY: true,
      hasControls: false,
      angle: 0,
      scaleX: 1,
      scaleY: 1,
    });
    // 绑定点击画布其他位置时，退出编辑状态
    this.boundMouseDown = this.mouseDown.bind(this);
    this.canvas.on("mouse:down", this.boundMouseDown);
    this.canvas.renderAll();
  }
  /**
   * @description: 设置点击画布其他位置时，退出编辑状态
   * @param {*}
   * @return {*}
   */
  mouseDown(e) {
    const { target } = e;
    if (!target || (target !== this.polygon && target !== this.image)) {
      this.cutImage();
    }
  }
  /**
   * @description: 切图调用的方法
   * @param {*}
   * @return {*}
   */
  cutImage() {
    // 计算和保存图片的偏移量
    this.imagePosition = {
      offsetX:
        this.image.left -
        this.polygon.left -
        (this.image.width - this.polygon.width) / 2,
      offsetY:
        this.image.top -
        this.polygon.top -
        (this.image.height - this.polygon.height) / 2,
    };
    const angle = fabric.util.degreesToRadians(this.image.angle);
    // 通过patternTransform设置图片的旋转和缩放
    var patternTransform = [1, 0, 0, 1, 0, 0]; // 初始值为单位矩阵
    patternTransform[0] = this.image.scaleX * Math.cos(angle); // 设置水平缩放和旋转
    patternTransform[1] = this.image.scaleX * Math.sin(angle); // 设置水平倾斜和旋转
    patternTransform[2] = -this.image.scaleY * Math.sin(angle); // 设置垂直倾斜和旋转
    patternTransform[3] = this.image.scaleY * Math.cos(angle); // 设置垂直缩放和旋转
    // 设置旋转缩放的中心点
    const cx = this.image.width / 2;
    const cy = this.image.height / 2;
    patternTransform[4] =
      cx - (cx * patternTransform[0] + cy * patternTransform[2]);
    patternTransform[5] =
      cy - (cx * patternTransform[1] + cy * patternTransform[3]);

    const pattern = new fabric.Pattern({
      source: this.image.getElement(),
      repeat: "no-repeat",
      patternTransform,
      ...this.imagePosition,
    });
    this.polygon.set({
      fill: pattern,
      stroke: "transparent",
      lockScalingX: false,
      lockScalingY: false,
      hasControls: true,
    });
    this.image.visible = false;
    this.isPolygonInsideImage = this.isPolygonInsideImageFun();
    this.canvas.renderAll();
    // 结束后，删除绑定的事件
    this.canvas.off("mouse:down", this.boundMouseDown);
  }
  /**
   * @description: 判断图形和图片是否重合
   * @param {*}
   * @return {*}
   */
  isPolygonInsideImageFun() {
    this.polygon.setCoords();
    this.image.setCoords();
    return this.polygon.intersectsWithObject(this.image);
  }
  /**
   * @description: 删除多边形绑定的背景图片对象
   * @param {*}
   * @return {*}
   */
  deleteImageFun() {
    this.canvas.remove(this.image);
    this.polygon.off("mousedown", this.polygonMousedownBind);
    this.canvas.renderAll();
  }
  /**
   * @description: 更改背景图片地址
   * @param {String} imageUrl 图片地址
   * @return {ibject} 返回fabric.Image对象
   */
  bindBgImage(imageUrl) {
    this.isDbClick = false;
    this.isPolygonInsideImage = true;
    this.polygon.set({
      lockScalingX: true,
      lockScalingY: true,
      hasControls: false,
      originX: "center",
      originY: "center",
      globalCompositeOperation: "source-over",
      fill: "transparent",
      stroke: "black",
    });
    // 绑定点击画布其他位置时，退出编辑状态
    this.boundMouseDown = this.mouseDown.bind(this);
    // this.canvas.on("mouse:down", this.boundMouseDown);
    this.polygon.off("mousedown", this.polygonMousedownBind);
    this.polygon.on("mousedown", this.polygonMousedownBind);
    // this.canvas.setActiveObject(this.polygon);
    fabric.Image.fromURL(imageUrl, (image) => {
      image.top = this.polygon.top;
      image.left = this.polygon.left;
      this.canvas.remove(this.image);
      this.image = image;
      this.image.set({
        originX: "center",
        originY: "center",
      });
      this.canvas.add(image);
      this.canvas.add(this.polygon);
      // this.canvas.setActiveObject(this.polygon);
      this.canvas.renderAll();
    });
    this.imagePosition = {
      offsetX: 0,
      offsetY: 0,
    };
    return this.image;
  }
}
export {
  createRoundedPolygonPath,
  createPiePath,
  cretateCircularRingPath,
  createFanshapedPath,
  CreatePolygonAndTextGroup,
  CreatePolygonAndImageGroup,
};
