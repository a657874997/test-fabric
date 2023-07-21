// 传入定点坐标和圆角大小，返回圆角多边形的path
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
      end = points[2]
    }else {
      start = points[2]
      end = points[1]
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
 * @param {Boolean} isClockwise 是否顺时针
 * @return {String} 返回path参数，可用fabric.Path直接生成对应图形
 */
function cretateCircularRingPath(points, isClockwise = true) {
  let pathData = "";
  const radius = calculateDistance(points[0].x, points[0].y, points[1].x, points[1].y);
  let start, end;
  if (isClockwise) {
    start = points[1];
    end = points[2]
  }else {
    start = points[2]
    end = points[1]
  }
  const startAngle = Math.atan2(start.y - points[0].y, start.x - points[0].x); // 起始角度
  const endAngle = Math.atan2(end.y - points[0].y, end.x - points[0].x); // 截止角度
  pathData = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${calculateClosureFlag(startAngle, endAngle) ? "1" : "0"} 1 ${end.x} ${end.y}`
  return pathData;
}
/**
 * @description: 通过坐标点，创建圆环 若是整圆，请使用fabric.Circle方法
 * @param {Array<{x:number,y:number}>} points 坐标点，第一个为圆心，第二个为起点，第三个为结束点
 * @param {Number} sectorWidth 圆环宽度
 * @param {Boolean} isClockwise 是否顺时针
 * @return {String} 返回path参数，可用fabric.Path直接生成对应图形
 */
function cretateCircularRingPathV2(points, sectorWidth = 1, isClockwise = true) {
  const outerRadius = calculateDistance(points[0].x, points[0].y, points[1].x, points[1].y);
  const innerRadius = outerRadius - sectorWidth;
  let outerStart, outerEnd;
  if (isClockwise) {
    outerStart = points[1];
    outerEnd = points[2]
  }else {
    outerStart = points[2]
    outerEnd = points[1]
  }
  const startAngle = Math.atan2(outerStart.y - points[0].y, outerStart.x - points[0].x); // 起始角度
  const endAngle = Math.atan2(outerEnd.y - points[0].y, outerEnd.x - points[0].x); // 截止角度
  const innerStart = getInnerCircleCoordinates(points[0].x, points[0].y, outerStart.x, outerStart.y, sectorWidth);
  const innerEnd = getInnerCircleCoordinates(points[0].x, points[0].y, outerEnd.x, outerEnd.y, sectorWidth);
  const pathData = `M ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 ${calculateClosureFlag(startAngle, endAngle) ? "1" : "0"} 1 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${innerRadius} ${innerRadius} 0 ${calculateClosureFlag(startAngle, endAngle) ? "1" : "0"} 0 ${innerStart.x} ${innerStart.y} Z`
  return pathData;
}

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
/**
 * @description: 生成扇形图的path 若是整圆，请使用fabric.Circle方法
 * @param {Array<{x: number, y:number}>} points 坐标点，第一个为圆心，第二个为起点，第三个为结束点 
 * @return {string} 返回path参数，可用fabric.Path直接生成对应图形 
 */
function createFanshapedPath(points) {
  const radius = calculateDistance(points[0].x, points[0].y, points[1].x, points[1].y);
  const start = points[1];
  const end = points[2];
  const startAngle = Math.atan2(start.y - points[0].y, start.x - points[0].x); // 起始角度
  const endAngle = Math.atan2(end.y - points[0].y, end.x - points[0].x); // 截止角度
  // "M 0 50 A 50 50 0 0 1 100 50";
  const pathData = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${calculateClosureFlag(startAngle, endAngle) ? "1" : "0"} 1 ${end.x} ${end.y}`
  return pathData;
}

let createTextAndRectangleGroup = function (canvas, left, top) {
  let text = new fabric.Textbox("Hello", {
    left: 0,
    top: 0,
    fontSize: 20,
    fill: "black",
  });
  text.lockMovementX = true;
  text.lockMovementY = true;
  text.lockScalingX = true;
  text.lockScalingY = true;
  let rect = new fabric.Rect({
    left: 0,
    top: 0,
    width: 100,
    height: 50,
    fill: "red",
  });
  rect.lockMovementX = true;
  rect.lockMovementY = true;
  rect.lockScalingX = true;
  rect.lockScalingY = true;

  let group = new fabric.Group([rect, text], {
    left: left,
    top: top,
    subTargetCheck: true,
  });

  attachMousedownHandler(canvas, group);

  text.on("editing:exited", function () {
    canvas.discardActiveObject();
    let items = group.getObjects();
    group._restoreObjectsState();
    canvas.remove(group);
    group = new fabric.Group(items);
    console.log("group.savedProps");
    console.log();
    group.set({
      ...group.toObject(),
      subTargetCheck: true,
    });
    attachMousedownHandler(canvas, group);
    canvas.add(group);
    canvas.requestRenderAll();
  });

  return group;
};

function attachMousedownHandler(canvas, group) {
  group.on("mousedown", function () {
    let items = group.getObjects();
    group.savedProps = {
      left: group.left,
      top: group.top,
      scaleX: group.scaleX,
      scaleY: group.scaleY,
      angle: group.angle,
    };
    group._restoreObjectsState();
    canvas.remove(group);
    items.forEach(function (item) {
      canvas.add(item);
    });
    canvas.setActiveObject(items[1]); //set the text as the active object
    items[1].enterEditing();
    canvas.renderAll();
  });
}
class createTextAndPolygonGroup {
  canvas;
  group;
  savedProps;
  text;
  rect;
  intervalId;
  isDbClick = false;
  constructor(canvas, left, top) {
    this.canvas = canvas;
    this.init(left, top);
    return this.group;
  }
  init(left, top) {
    this.text = new fabric.IText("Hello\n擦飒飒", {
      left: 0,
      top: 0,
      width: 100,
      fontSize: 20,
      splitByGrapheme: true,
      fill: "black",
    });
    this.text.lockMovementX = true;
    this.text.lockMovementY = true;
    this.text.lockScalingX = true;
    this.text.lockScalingY = true;
    this.rect = new fabric.Rect({
      left: 0,
      top: 0,
      width: 100,
      height: 50,
      fill: "red",
      selectable: false,
    });
    this.group = new fabric.Group([this.rect, this.text], {
      left: left,
      top: top,
      subTargetCheck: true,
    });
    console.log("getHeight:", this.text.height);
    this.attachMousedownHandler();
    let ctx = this.canvas.getContext("2d");
    let text = this.text;
    let canvas = this.canvas;
    let maxWidth = 100;
    text.on("changed", function () {
      let words = this.text.split("");
      let formatted = "";
      let line = "";
      words.forEach((word, i) => {
        let width = canvas.getContext("2d").measureText(line + word).width;
        if (width > maxWidth) {
          formatted += "\n" + word;
          line = word;
        } else {
          formatted += word;
          line += word;
        }
      });

      this.text = formatted;
    });
    this.text.on("editing:exited", () => {
      this.canvas.discardActiveObject();
      this.group = new fabric.Group([this.rect, this.text]);
      this.group.set({
        // ...this.savedProps,
        subTargetCheck: true,
      });
      this.attachMousedownHandler();
      this.canvas.add(this.group);
      this.canvas.requestRenderAll();
    });
  }
  attachMousedownHandler() {
    this.group.on("mousedown", () => {
      if (!this.isDbClick) {
        this.isDbClick = true;
        setTimeout(() => {
          this.isDbClick = false;
        }, 300);
        return;
      }
      this.isDbClick = false;
      let items = this.group.getObjects();
      this.savedProps = {
        left: this.group.left,
        top: this.group.top,
        scaleX: this.group.scaleX,
        scaleY: this.group.scaleY,
        angle: this.group.angle,
      };
      this.group._restoreObjectsState();
      this.canvas.remove(this.group);
      items.forEach((item) => {
        this.canvas.add(item);
      });
      this.canvas.setActiveObject(items[1]); //set the text as the active object
      items[1].enterEditing();
      this.canvas.renderAll();
    });
  }
}
class createPolygonAndTextGroupV2 {
  isDbClick = false;
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
    this.canvas.add(this.polygon);
    this.canvas.add(this.text);
    this.updateText();
    this.changePolygon(polygon);
  }
  /**
   * @description: 初始化数据，和事件绑定
   * @param {*}
   * @return {*}
   */
  init() {
    this.textExite = false;
    this.text.left =
      this.polygon.left + this.polygon.width / 2 - this.text.width / 2;
    this.text.top =
      this.polygon.top + this.polygon.height / 2 - this.text.height / 2;
    // 禁止缩放和移动
    this.text.lockMovementX = true;
    this.text.lockMovementY = true;
    this.text.lockScalingX = true;
    this.text.lockScalingY = true;
    // 隐藏控制点
    this.text.hasControls = false;
    this.text.set({
      originX: "center",
      originY: "center",
      textAlign: "center",
    });
    this.text.on("editing:exited", () => {
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
      console.log("文字mouseDown");
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
class createPolygonAndImageGroup {
  /**
   * @description: 为多边形添加背景图
   * @param {*} canvas fabric生成的canvas对象
   * @param {*} polygon 多边形对象
   * @param {*} image 图片地址
   * @return {*}
   */
  constructor(canvas, polygon, image) {
    this.polygon = polygon;
    this.canvas = canvas;
    this.image = image;
    this.init();
  }
  /**
   * @description: 设置初始量，和事件绑定
   * @param {*}
   * @return {*}
   */
  init() {
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
    this.isPolygonInsideImage = true;
    fabric.Image.fromURL(this.image, (image) => {
      image.top = this.polygon.top;
      image.left = this.polygon.left;
      this.image = image;
      this.image.set({
        originX: "center",
        originY: "center",
      });
      this.canvas.add(image);
      this.canvas.add(this.polygon);
      this.canvas.setActiveObject(this.polygon);
      this.canvas.renderAll();
    });
    this.imagePosition = {
      offsetX: 0,
      offsetY: 0,
    };
    // 用户点击画布其他位置时，退出编辑状态
    this.boundMouseDown = this.mouseDown.bind(this);
    this.canvas.on("mouse:down", this.boundMouseDown);
    this.isDbClick = false;
    this.polygon.on("mousedown", () => {
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
    });
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
}
export {
  createRoundedPolygonPath,
  createTextAndRectangleGroup,
  createTextAndPolygonGroup,
  createPolygonAndTextGroupV2,
  createPolygonAndImageGroup,
  createPiePath,
  createFanshapedPath,
  cretateCircularRingPath,
  cretateCircularRingPathV2
};
