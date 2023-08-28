export const initShapeRectTextGroup = () => {
    fabric.ShapeRectTextGroup = fabric.util.createClass(fabric.Group, {
        type: 'shapeRectTextGroup',
        initialize: function (objects, options) {
            this.setControlsVisibility({
                mt: false,
                mb: false,
                ml: false,
                mr: false,
                bl: false,
                br: false,
                tl: false,
                tr: false,
                mtr: false
            });
            this.subTargetCheck = true;
            const object = objects[1];
            object.set({
                // hasControls: true
            })
            this.callSuper('initialize', objects, options);
        },
        _render: function (ctx) {
            for (var i = 0; i < this._objects.length; i++) {
                const object = this._objects[i];
                object.render(ctx)
            }
        }
    });
}
function rotatePoint(x, y, angle, pivotX, pivotY) {
    const radian = angle * Math.PI / 180;
    const rotatedX = Math.cos(radian) * (x - pivotX) - Math.sin(radian) * (y - pivotY) + pivotX;
    const rotatedY = Math.sin(radian) * (x - pivotX) + Math.cos(radian) * (y - pivotY) + pivotY;
    return {
        x: rotatedX,
        y: rotatedY
    };
}
export const initTextRect = () => {
    fabric.TextRect = fabric.util.createClass(fabric.ShapeRect, {
        type: 'textRect',
        initialize: function (options) {
            this.callSuper('initialize', options);
            this.text = options.text || '';
            this.enterEditingBind = this.enterEditing.bind(this);
            // this.selectionFuncBind = this.selectionFunc.bind(this);
            this.on('mousedblclick', this.enterEditingBind);
            this.tempTextbox = null;
            this.fontSize = options.fontSize || 20;
            this.fontFamily = options.fontFamily || 'Helvetica';
            this.textFill = options.textFill || '#000000';
            this.textLeft = 0;
            this.textTop = 0;
            this.lineHeight = options.lineHeight || 1.16;
            this.objectCaching = false;
            this.isEditing = false;
        },
        _render: function (ctx) {
            this.callSuper('_render', ctx);
            if (!this.isEditing) {
                ctx.font = this.fontSize + 'px ' + this.fontFamily;
                ctx.fillStyle = this.textFill;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const width = this.width - 40 > this.fontSize ? this.width - 40 : this.fontSize;
                this.wrapText(ctx, this.text, this.textLeft, this.textTop, width, this.fontSize * this.lineHeight);
            }
        },
        wrapText: function (ctx, text, x, y, maxWidth, lineHeight) {
            const words = text.split('');
            let line = '';
            let lines = [];
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n];
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    lines.push(line);
                    line = words[n];
                } else {
                    line = testLine;
                }
            }
            lines.push(line);
            const totalHeight = lines.length * lineHeight;
            const startingY = y - totalHeight / 2 + lineHeight / 2;
            for (let k = 0; k < lines.length; k++) {
                ctx.fillText(lines[k], x, startingY + lineHeight * k);
            }
        },
        enterEditing: function () {
            if (this.isEditing) {
                return;
            }
            this.isEditing = true;
            console.log(this.canvas.lowerCanvasEl.getBoundingClientRect());
            const textarea = document.createElement('textarea');
            textarea.style.position = 'fixed';
            // textarea.style.left = this.canvas.lowerCanvasEl.getBoundingClientRect().left + this.left + 20 + 1 + 'px';
            // textarea.style.top = this.canvas.lowerCanvasEl.getBoundingClientRect().top + this.top + 'px';
            const width = this.width - 40 > this.fontSize ? this.width - 40 : this.fontSize;
            textarea.style.width = width + 'px';
            textarea.style.height = 'auto';
            textarea.style.fontSize = this.fontSize + 'px';
            textarea.style.fontFamily = this.fontFamily;
            textarea.style.color = this.textFill;
            textarea.style.border = 'none';
            textarea.style.outline = 'none';
            textarea.style.padding = '0px';
            textarea.style.textAlign = 'center';
            textarea.style.resize = 'none';
            textarea.style.overflow = 'hidden';
            textarea.style.lineHeight = this.lineHeight * this.fontSize + 'px';
            textarea.style.backgroundColor = 'transparent';
            textarea.style.zIndex = 9999;
            textarea.style.transform = `rotate(${this.angle}deg)`
            textarea.style.transformOrigin = '0px 0px';
            textarea.value = this.text;

            const boundingRect = this.canvas.lowerCanvasEl.getBoundingClientRect();
            const centerX = boundingRect.left + this.left + 20 + 1;
            const centerY = boundingRect.top + this.top + this.height / 2 + 1;
            const rotatedX = centerX - this.width / 2;
            textarea.style.left = rotatedX + 'px';



            this.dirty = true;
            this.canvas.renderAll();
            const body = document.getElementsByTagName('body')[0];
            const that = this;
            textarea.addEventListener('input', function () {
                that.text = textarea.value;
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + 'px';
                textarea.style.top = centerY - textarea.scrollHeight / 2 + 'px';
            }, false);
            textarea.addEventListener('blur', function (e) {
                that.text = textarea.value;
                body.removeChild(textarea);
                that.isEditing = false;
                that.dirty = true;
                that.canvas.renderAll();
            }, false);
            body.appendChild(textarea);
            requestAnimationFrame(function () {
                textarea.style.height = textarea.scrollHeight + 'px';
                textarea.style.top = centerY - textarea.scrollHeight / 2 + 'px';
            });
            textarea.focus();
        }
    });
}