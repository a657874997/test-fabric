<template>
  <div>
    <input type="number" v-model="radius" />
    <button @click="changeRadiusFun">修改圆角</button>
    <canvas width="800" height="600" id="c" style="border: 1px solid #ccc;"></canvas>
    <button @click="deleteImageFun">删除背景</button>
    <button @click="changeImageFun">更换背景</button>
    <button @click="toObjectFun">导出</button>
    <button @click="fromObjectFun">导入</button>
  </div>
</template>
<script setup>
import { fabric } from 'fabric'
import { ref, onMounted } from 'vue'
import { initShapeRect } from './utils/shape-rect'
import { initShapeRectText } from './utils/shape-rect-text'
import {
  createRoundedPolygonPath,
  createPiePath,
  cretateCircularRingPath,
  createFanshapedPath,
  CreatePolygonAndTextGroup,
  CreatePolygonAndImageGroup
} from './utils/polygonUtils'
import { initRoundedPolygon } from "./utils/roundedPolygon"
import { initCustomGroup, createProxiedCustomGroup } from './utils/CustomGroup'
import { initShapeRectTextGroup,initTextRect } from './utils/shape-rect-text-group'
const radius = ref(0)
let canvas
let polygonAndImageGroup
let polygon
let roundedPolygon
let customGroup
function changeRadiusFun() {
  // const newPolygonPath = createRoundedPolygonPath(points, radius.value)
  // polygon.set({ path: new fabric.Path(newPolygonPath).path })
  // // polygon.dirty = true
  // const dims = polygon._calcDimensions()
  // polygon.set({ width: dims.width, height: dims.height })
  // polygon.pathOffset.x = polygon.width/2;
  // polygon.pathOffset.y = polygon.height/2;
  // polygon.setCoords()
  // canvas.renderAll()
  roundedPolygon.set({ radius: radius.value })
  canvas.renderAll()
}
function toObjectFun() {
  console.log(customGroup);
  const json = canvas.toJSON()
  console.log(json)
  localStorage.setItem('json', JSON.stringify(json))
  canvas.clear()
  canvas.renderAll()
}
function fromObjectFun() {
  const json = JSON.parse(localStorage.getItem('json'))
  console.log(json);
  canvas.loadFromJSON(json, () => {
    console.log("加载完成");
    canvas.renderAll()
  })
  // fabric.ShapeRectText.fromObject(json, newCustomGroup =>{
  //   console.log("加载完成");
  //   customGroup = newCustomGroup
  //   canvas.add(customGroup)
  //   requestAnimationFrame(() => {
  //     canvas.renderAll();
  //   });
  //   setTimeout(() => {
  //     canvas.renderAll();
  //   }, 0);
  // })
  // fabric.CustomGroup.fromObject(json, (newCustomGroup) => {
  //   console.log("加载完成");
  //   customGroup = newCustomGroup
  //   canvas.add(customGroup)
  //   requestAnimationFrame(() => {
  //     canvas.renderAll();
  //   });
  //   setTimeout(() => {
  //     canvas.renderAll();
  //   }, 500);
  // })
}

// 多边形
const polygonPoints = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 150, y: 50 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
]
const points = polygonPoints || [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }]
onMounted(() => {
  initShapeRect()
  initShapeRectText()
  initRoundedPolygon()
  initCustomGroup()
  initShapeRectTextGroup()
  initTextRect()
  canvas = new fabric.Canvas('c', {
    preserveObjectStacking: true,
  });
  canvas.renderOnAddRemove = false
  // return
  roundedPolygon = new fabric.RoundedPolygon({
    points,
    radius: 2,
    fill: 'red',
    stroke: 'red',
    left: 0,
    top: 0,
  })
  const testText = new fabric.Textbox('测试文本', {
    fill: 'black',
    fontSize: 20,
  })
  const rect = new fabric.Rect({
    width: 100,
    height: 100,
    fill: 'red',
    left: 0,
    top: 0,
  })
  let text = new fabric.Textbox('双击编辑文字', {
    fill: 'black',
    fontSize: 20,
  })
  customGroup = new fabric.ShapeRectText({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
    fill: 'red',
    text: new fabric.Textbox('双击编辑文字', {
      fill: 'black',
      fontSize: 20,
    }),
  })
  const testGroup = new fabric.ShapeRectTextGroup([
  roundedPolygon, text
  ])
  const textRect = new fabric.TextRect({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
    fill: 'red',
    text: "",
  })
  canvas.add(textRect)
  window.textRect= textRect
  // canvas.add(testGroup)
  // canvas.add(rect)
  // canvas.add(text)
  // canvas.add(roundedPolygon)
  // canvas.add(customGroup)
  // setTimeout(()=>{
  //   console.log(customGroup);
    // customGroup.set({ left: 10 })
  //   canvas.renderAll()
  // }, 1000)
  // canvas.add(testText)
  canvas.renderAll()


















  // 多边形
  const polygonPath = createRoundedPolygonPath(polygonPoints, radius.value)
  polygon = new fabric.Path(polygonPath, {
    left: 10,
    top: 10,
    stroke: 'red',
    fill: 'transparent',
  })
  // canvas.add(polygon)
  // 五角星
  const starPoints = [
    { x: 100, y: 0 },
    { x: 122.94, y: 38.06 },
    { x: 193.13, y: 38.06 },
    { x: 141.72, y: 64.19 },
    { x: 163.87, y: 105.81 },
    { x: 100, y: 80 },
    { x: 36.13, y: 105.81 },
    { x: 58.28, y: 64.19 },
    { x: 6.87, y: 38.06 },
    { x: 77.06, y: 38.06 },
  ];
  const starPath = createRoundedPolygonPath(starPoints, 10)
  const star = new fabric.Path(starPath, {
    left: 600,
    top: 10,
    fill: 'red',
  })
  // canvas.add(star)
  // 六边形
  const hexagonPoints = [
    { x: 100, y: 0 },
    { x: 173.21, y: 50 },
    { x: 173.21, y: 150 },
    { x: 100, y: 200 },
    { x: 26.79, y: 150 },
    { x: 26.79, y: 50 },
  ];
  const hexagonPath = createRoundedPolygonPath(hexagonPoints, 10)
  const hexagon = new fabric.Path(hexagonPath, {
    left: 10,
    top: 200,
    fill: 'red',
  })
  // canvas.add(hexagon)
  // 平行四边形
  const parallelogramPoints = [
    { x: 50, y: 0 },
    { x: 100, y: 0 },
    { x: 50, y: 100 },
    { x: 0, y: 100 },
  ];
  const parallelogramPath = createRoundedPolygonPath(parallelogramPoints, 10)
  const parallelogram = new fabric.Path(parallelogramPath, {
    left: 200,
    top: 200,
    fill: 'red',
  })
  // canvas.add(parallelogram)
  // 梯形
  const trapezoidPoints = [
    { x: 50, y: 0 },
    { x: 100, y: 0 },
    { x: 150, y: 200 },
    { x: 0, y: 200 },
  ];
  const trapezoidPath = createRoundedPolygonPath(trapezoidPoints, 10)
  const trapezoid = new fabric.Path(trapezoidPath, {
    left: 400,
    top: 200,
    fill: 'red',
  })
  // canvas.add(trapezoid)
  // 箭头
  const arrowPoints = [
    { x: 0, y: -10 },
    { x: 100, y: -10 },
    { x: 100, y: -30 },
    { x: 150, y: 0 },
    { x: 100, y: 30 },
    { x: 100, y: 10 },
    { x: 0, y: 10 },
  ]
  const arrowPath = createRoundedPolygonPath(arrowPoints, 10)
  const arrow = new fabric.Path(arrowPath, {
    left: 600,
    top: 200,
    fill: 'red',
  })
  // canvas.add(arrow)
  // 饼图
  const piePoints = [
    { x: 50, y: 50 },
    { x: 0, y: 50 },
    { x: 50, y: 100 },
  ]
  const piePath = createPiePath(piePoints)
  const pie = new fabric.Path(piePath, {
    left: 200,
    top: 10,
    fill: 'red',
  })
  // canvas.add(pie)
  // 圆环
  const circularRingPosints = [
    { x: 50, y: 50 },
    { x: 0, y: 50 },
    { x: 0, y: 50 },
  ]
  const circularRingPath = cretateCircularRingPath(circularRingPosints, 30)
  const circularRing = new fabric.Path(circularRingPath, {
    left: 400,
    top: 10,
    fillRule: 'evenodd',
    fill: 'red',
  })
  // canvas.add(circularRing)
  // 扇形
  const fanshapedPosints = [
    { x: 50, y: 50 },
    { x: 0, y: 50 },
    { x: 50, y: 100 },
  ]
  const fanshapedPath = createFanshapedPath(fanshapedPosints)
  const fanshaped = new fabric.Path(fanshapedPath, {
    left: 200,
    top: 500,
    fill: 'red',
  })
  // canvas.add(fanshaped)
  // 绑定文本
  // const polygonAndTextGroup = new CreatePolygonAndTextGroup(
  //   canvas,
  //   polygon,
  //   new fabric.Textbox('动态设置圆角', {
  //     fontSize: 20,
  //   })
  // )
  // 绑定图片
  // polygonAndImageGroup = new CreatePolygonAndImageGroup(
  //   canvas,
  //   circularRing,
  //   "https://www.vidnoz.com/img/index/index_man.png"
  // )
  canvas.renderAll()
})
function deleteImageFun() {
  console.log("删除");
  canvas.remove(customGroup)
  canvas.renderAll()
  // polygonAndImageGroup.deleteImageFun()
}
function changeImageFun() {
  polygonAndImageGroup.bindBgImage("https://www.vidnoz.com/img/index/index_women.png")
}
</script>
<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
