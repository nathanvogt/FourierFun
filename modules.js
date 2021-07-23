export class ComplexNumber {
    constructor(xy, polar=false){
        // console.log("xy: ", xy, "polar: ", polar)
        if(!polar){
            [this.re, this.im] = xy;
            //calculate theta and radius
            this.theta = Math.atan2(this.im, this.re);
            this.radius = Math.sqrt((this.re)*(this.re)+(this.im)*(this.im));
        }
        else if(polar){
            [this.theta, this.radius] = xy;
            this.re = this.radius * Math.cos(this.theta);
            this.im = this.radius * Math.sin(this.theta);
        }
        else{
            throw "no parameters passed to complex number"
        }
    }
    static multiply(c1, c2){
        let tH = c1.theta+c2.theta;
        let rH = c1.radius*c2.radius;
        return new ComplexNumber([tH, rH], true);
    }
    static add(c1, c2){
        let reH = c1.re+c2.re;
        let imH = c1.im+c2.im;
        return new ComplexNumber([reH, imH]);
    }
    scale (scalar){
        this.re = scalar*this.re;
        this.im = scalar*this.im;
        return this;
    }
}
export function drawArrow(x0, y0, x1, y1, headlen=2) {
    let context = ctx;
    // var headlen = 1; // length of head in pixels
    var dx = x1 - x0;
    var dy = y1 - y0;
    var theta = Math.atan2(dy, dx);
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.lineTo(x1 - headlen * Math.cos(theta - Math.PI / 6), y1 - headlen * Math.sin(theta - Math.PI / 6));
    context.moveTo(x1, y1);
    context.lineTo(x1 - headlen * Math.cos(theta + Math.PI / 6), y1 - headlen * Math.sin(theta + Math.PI / 6));
}
export class CoefficientCache {
    constructor(){
        this.cache = [];
    }
    insert(frequency, coefficient){
        this.cache[frequency] = coefficient;
    }
    grab(frequency){
        return this.cache[frequency];
    }
    exists(frequency){
        if(this.cache[frequency] !== undefined){
            return true;
        }else if(this.cache[frequency] === undefined){
            return false;
        }else{
            throw Error("Array Error (BRUH)");
        }
    }
    reset(){
        this.cache = [];
    }
}