import { fabric } from 'fabric'
export function createProxiedCustomGroup(polygon, text) {
    let group = new fabric.CustomGroup(polygon, text)
    let keyList = ['type',
        'id',
        'name',
        'polygon', 
        'text', 
        'setTextPoint', 
        'textEditingFun', 
        'polygonOnDoubleClick', 
        'mouseDown', 
        'textEditingFunBing', 
        'polygonOnDoubleClickBind', 
        'mouseDownBind', 
        'isOnMouseDown', 
        'callSuper', 
        'canvas'
    ]
    return new Proxy(group, {
        set: function (target, key, value) {
            target[key] = value
            if (key in target.polygon && !keyList.includes(key)) {
                target.polygon.set(key, value)
            }
            return true
        },
        get: function (target, key) {
            if (key in target.polygon && !keyList.includes(key)) {
                return target.polygon[key]
            }
            return target[key]
        }

    })
}

export const initCustomGroup = () => {
    fabric.CustomGroup = fabric.util.createClass(fabric.Object, {
        type: 'CustomGroup',
        initialize: function (polygon, text) {
            this._polygon = polygon
            // 获取多边形对象的最小轴对齐边界框，位置 如果多边形在旋转，返回值也会顺之改变
            // const { width } = this._polygon.getBoundingRect()
            const { width } = this._polygon
            let polygonCenter = this._polygon.getCenterPoint();
            this._text = text
            this._text.set({
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
                polygon: this._polygon,
                text: this._text,
            })
            this._polygon.evented = true;
            this._polygon.selectable = true;
            this.textEditingFunBing = this.textEditingFun.bind(this)
            this.polygonOnDoubleClickBind = this.polygonOnDoubleClick.bind(this)
            this.mouseDownBind = this.mouseDown.bind(this)
            this.isOnMouseDown = false
            this._polygon.on("moving", this.textEditingFunBing)
            this._polygon.on("scaling", this.textEditingFunBing)
            this._polygon.on("rotating", this.textEditingFunBing)
            this._polygon.on("resizing", this.textEditingFunBing)
            this._polygon.on("skewing", this.textEditingFunBing)
            this._polygon.on("modified", this.textEditingFunBing)
            this._polygon.on("mousedblclick", this.polygonOnDoubleClickBind)
            // let originalSet = this._polygon.set
            // this._polygon.set = (key, value) => {
            //     originalSet.call(this._polygon, key, value)
            //     this.setTextPoint()
            // }
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
        set: function (key, value) {
            console.log("set");
            console.log(key, value);
            if (typeof key === 'object') {
                for (let k in key) {
                   if (k in this._polygon) {
                    this._polygon.set({
                        [k]: key[k]
                    })
                   }
                }
                this._polygon.setCoords()
                this.setTextPoint()
            }
                
            this.callSuper('set', key, value)
        },
        _render: function (ctx) {
            if (this.canvas) {
                console.log("渲染");
                this.canvas.add(this._polygon)
                this.canvas.add(this._text)
            }
            this.callSuper('_render', ctx)
        },
        get polygon() {
            return this._polygon
        },
        get text () {
            return this._text
        },
        textEditingFun: function (e) {
            this._text.exitEditing();
            this._text.set({
                evented: false,
            })
            this.setTextPoint()
        },
        polygonOnDoubleClick: function (options) {
            // 双击事件
            this._text.enterEditing()
            this._text.set({
                evented: true,
            })
            this._text.setSelectionStart(this._text.text.length)
            this._text.setSelectionEnd(this._text.text.length)
            if (!this.isOnMouseDown) {
                this.isOnMouseDown = true
                this.canvas.on("mouse:down", this.mouseDownBind)
            }
        },
        setTextPoint() {
            // 获取多边形中心点
            let polygonCenter = this._polygon.getCenterPoint();
            const { width, scaleX } = this._polygon
            console.log(width);
            this._text.set({
                width: width * scaleX - 40,
                angle: this._polygon.angle,
                left: polygonCenter.x,
                top: polygonCenter.y,
            });
        },
        mouseDown: function (options) {
            const { target } = options
            if (!target && target !== this._polygon && target !== this._text) {
                this._text.exitEditing();
                this.canvas.off("mouse:down", this.mouseDownBind)
                this._text.set({
                    evented: false,
                })
                this._polygon.on("mousedblclick", this._polygonOnDoubleClickBind)
                this.isOnMouseDown = false
            }

        },
    });
    fabric.CustomGroup.fromObject = function (object, callback) {
        fabric.util.enlivenObjects([object.polygon, object.text], function (enlivenedObjects) {
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