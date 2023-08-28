import { fabric } from 'fabric'
function returnEnlivenedObjects(text) {
    return new Promise((resolve, reject) => {
        fabric.util.enlivenObjects([text], function (enlivenedObjects) {
            resolve(enlivenedObjects[0])
        })
    })
}
export const initShapeRectText = () => {
    fabric.ShapeRectText = fabric.util.createClass(fabric.ShapeRect, {
        type: 'ShapeRectText',
        initialize: async function (options) {
            this.callSuper('initialize', {
                ...options
            })
            // 获取多边形对象的最小轴对齐边界框，位置 如果多边形在旋转，返回值也会顺之改变
            // const { width } = this.getBoundingRect()
            const { width } = this
            const polygonCenter = this.getCenterPoint()
            if (!options.text) {
                this.text = new fabric.Textbox('双击编辑文字', {
                    fill: 'black',
                    fontSize: 20
                })
            } else if(!(options.text instanceof fabric.Textbox)){
                this.text = await returnEnlivenedObjects(options.text)
            }else {
                this.text = options.text
            }
            setTimeout(() => {
                if (this.canvas) {
                    this.canvas.add(this.text)
                    this.setTextPoint()
                    this.canvas.renderAll()
                }
            }, 0)
            this.text.set({
                evented: false,
                width: width - 40,
                left: polygonCenter.x,
                top: polygonCenter.y,
                selectable: false,
                textAlign: 'center',
                splitByGrapheme: true,
                originX: 'center',
                originY: 'center',
                excludeFromExport: true
            })
            this.textEditingFunBing = this.textEditingFun.bind(this)
            this.polygonOnDoubleClickBind = this.polygonOnDoubleClick.bind(this)
            this.mouseDownBind = this.mouseDown.bind(this)
            this.isOnMouseDown = false
            this.on('moving', this.textEditingFunBing)
            this.on('scaling', this.textEditingFunBing)
            this.on('rotating', this.textEditingFunBing)
            this.on('resizing', this.textEditingFunBing)
            this.on('skewing', this.textEditingFunBing)
            this.on('modified', this.textEditingFunBing)
            this.on('mousedblclick', this.polygonOnDoubleClickBind)
            this.on("removed", ()=>{
                if (this.text) {
                    this.canvas.remove(this.text)
                }
            })
        },
        setCoords: function () {
            this.callSuper('setCoords')
        },
        _render: function (ctx) {
            this.callSuper('_render', ctx)
        },
        toObject: function (propertiesToInclude) {
            const tmpPropertiesToInclude = propertiesToInclude || []
            return this.callSuper('toObject', [
                'text',
                ...tmpPropertiesToInclude
            ])
        },
        textEditingFun: function (e) {
            console.log("==============================");
            console.log(this.text);
            console.log(this.text instanceof fabric.Textbox);
            this.text.exitEditing()
            this.text.set({
                evented: false
            })
            this.setTextPoint()
        },
        polygonOnDoubleClick: function (options) {
            // 双击事件
            this.text.enterEditing()
            this.text.set({
                evented: true
            })
            this.text.setSelectionStart(this.text.text.length)
            this.text.setSelectionEnd(this.text.text.length)
            if (!this.isOnMouseDown) {
                this.isOnMouseDown = true
                this.canvas.on('mouse:down', this.mouseDownBind)
            }
        },
        setTextPoint() {
            // 获取多边形中心点
            const polygonCenter = this.getCenterPoint()
            const { width, scaleX } = this
            console.log(width)
            this.text.set({
                width: width * scaleX - 40,
                angle: this.angle,
                left: polygonCenter.x,
                top: polygonCenter.y
            })
        },
        mouseDown: function (options) {
            const { target } = options
            if (!target && target !== this.polygon && target !== this.text) {
                this.text.exitEditing()
                this.canvas.off('mouse:down', this.mouseDownBind)
                this.text.set({
                    evented: false
                })
                this.on('mousedblclick', this.polygonOnDoubleClickBind)
                this.isOnMouseDown = false
            }
        }
    })
    fabric.ShapeRectText.fromObject = function (object, callback) {
        return fabric.Object._fromObject('ShapeRectText', object, callback)
    }

    fabric.ShapeRectText.generate = function (options) {
        const obj = new fabric.ShapeRectText(options)
        return obj
    }
}
