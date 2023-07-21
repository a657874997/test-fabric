<template>
  <div>
    <input type="number" v-model="radius" />
    <button @click="changeRadiusFun">修改圆角</button>
    <canvas width="800" height="600" id="c" style="border: 1px solid #ccc;"></canvas>
    <button @click="deleteImageFun">删除背景</button>
    <button @click="changeImageFun">更换背景</button>
  </div>
</template>
<script setup>
import { fabric } from 'fabric'
import { ref, onMounted } from 'vue'
import {
  createRoundedPolygonPath,
  createPiePath,
  cretateCircularRingPath,
  createFanshapedPath,
  CreatePolygonAndTextGroup,
  CreatePolygonAndImageGroup
} from './utils/polygonUtils'
const radius = ref(0)
let canvas
let polygonAndImageGroup
let polygon

function changeRadiusFun() {
  const newPolygonPath = createRoundedPolygonPath(polygonPoints, radius.value)
  polygon.set({ path: new fabric.Path(newPolygonPath).path })
  canvas.renderAll()
}

// 多边形
const polygonPoints = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 150, y: 50 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
]
onMounted(() => {
  canvas = new fabric.Canvas('c', {
    preserveObjectStacking: true,
  });
  canvas.renderOnAddRemove = false
  // 多边形
  const polygonPath = createRoundedPolygonPath(polygonPoints, radius.value)
  polygon = new fabric.Path(polygonPath, {
    left: 10,
    top: 10,
    fill: 'red',
  })
  canvas.add(polygon)
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
  canvas.add(star)
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
  canvas.add(hexagon)
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
  canvas.add(parallelogram)
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
  canvas.add(trapezoid)
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
  canvas.add(arrow)
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
  canvas.add(pie)
  // 圆环
  const circularRingPosints = [
    { x: 50, y: 50 },
    { x: 0, y: 50 },
    { x: 50, y: 100 },
  ]
  const circularRingPath = cretateCircularRingPath(circularRingPosints, 30)
  const circularRing = new fabric.Path(circularRingPath, {
    left: 400,
    top: 10,
    fill: 'red',
  })
  canvas.add(circularRing)
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
  canvas.add(fanshaped)
  // 绑定文本
  const polygonAndTextGroup = new CreatePolygonAndTextGroup(
    canvas,
    polygon,
    new fabric.Textbox('动态设置圆角', {
      fontSize: 20,
    })
  )
  // 绑定图片
  polygonAndImageGroup = new CreatePolygonAndImageGroup(
    canvas,
    fanshaped,
    "https://www.vidnoz.com/img/index/index_man.png"
  )
  canvas.renderAll()
})
function deleteImageFun() {
  polygonAndImageGroup.deleteImageFun()
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
