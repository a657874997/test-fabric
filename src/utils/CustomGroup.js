import { fabric } from 'fabric'

export const initCustomGroup = () => {
    fabric.CustomGroup = fabric.util.createClass(fabric.Object, {
        type: 'CustomGroup',
        initialize: function (polygon, text) {
            this.polygon = polygon
            // 获取多边形对象的最小轴对齐边界框，位置 如果多边形在旋转，返回值也会顺之改变
            // const { width } = this.polygon.getBoundingRect()
            const { width } = this.polygon
            let polygonCenter = this.polygon.getCenterPoint();
            this.text = text
            this.text.set({
                evented: false,
                width: width - 40,
                left: polygonCenter.x,
                top: polygonCenter.y,
                selectable: false,
                textAlign: 'center',
                splitByGrapheme: true,
                originX: "center",
                originY: "center",
            })
            this.setTextPoint()
            this.callSuper('initialize', {
                polygon: this.polygon,
                text: this.text,
            })
            this.polygon.evented = true;
            this.polygon.selectable = true;
            this.textEditingFunBing = this.textEditingFun.bind(this)
            this.polygonOnDoubleClickBind = this.polygonOnDoubleClick.bind(this)
            this.mouseDownBind = this.mouseDown.bind(this)
            this.isOnMouseDown = false
            this.polygon.on("moving", this.textEditingFunBing)
            this.polygon.on("scaling", this.textEditingFunBing)
            this.polygon.on("rotating", this.textEditingFunBing)
            this.polygon.on("resizing", this.textEditingFunBing)
            this.polygon.on("skewing", this.textEditingFunBing)
            this.polygon.on("modified", this.textEditingFunBing)
            this.polygon.on("mousedblclick", this.polygonOnDoubleClickBind)

        },
        setCoords: function () {
            this.callSuper('setCoords')
        },
        toObject: function (propertiesToInclude) {
            const tmpPropertiesToInclude = propertiesToInclude || []
            return this.callSuper('toObject', [
                'polygon',
                'text',
                ...tmpPropertiesToInclude,
            ])
        },
        _render: function (ctx) {
            if (this.canvas) {
                console.log("渲染");
                this.canvas.add(this.polygon)
                this.canvas.add(this.text)
            }
            this.callSuper('_render', ctx)
        },
        getPolygon: function () {
            return this.polygon
        },
        getText: function () {
            return this.text
        },
        textEditingFun: function (e) {
            this.text.exitEditing();
            this.text.set({
                evented: false,
            })
            this.setTextPoint()
        },
        polygonOnDoubleClick: function (options) {
            // 双击事件
            this.text.enterEditing()
            this.text.set({
                evented: true,
            })
            this.text.setSelectionStart(this.text.text.length)
            this.text.setSelectionEnd(this.text.text.length)
            if (!this.isOnMouseDown) {
                this.isOnMouseDown = true
                this.canvas.on("mouse:down", this.mouseDownBind)
            }
        },
        setTextPoint() {
            // 获取多边形中心点
            let polygonCenter = this.polygon.getCenterPoint();
            const { width,  scaleX} = this.polygon
            console.log(width);
            this.text.set({
                width: width * scaleX - 40,
                angle: this.polygon.angle,
                left: polygonCenter.x,
                top: polygonCenter.y,
            });
        },
        mouseDown: function (options) {
            const { target } = options
            if (!target && target !== this.polygon && target !== this.text) {
                this.text.exitEditing();
                this.canvas.off("mouse:down", this.mouseDownBind)
                this.text.set({
                    evented: false,
                })
                this.polygon.on("mousedblclick", this.polygonOnDoubleClickBind)
                this.isOnMouseDown = false
            }

        },
    });
    fabric.CustomGroup.fromObject = function(object, callback) {
        fabric.util.enlivenObjects([object.polygon, object.text], function(enlivenedObjects) {
            const enlivenedPolygon = enlivenedObjects[0];
            const enlivenedText = enlivenedObjects[1];
            callback && callback(new fabric.CustomGroup(enlivenedPolygon, enlivenedText));
        });
        return false;
    };
    
    fabric.CustomGroup.generate = function (polygon, text) {
        const obj = new fabric.CustomGroup(polygon, text)
        return obj
    }
}