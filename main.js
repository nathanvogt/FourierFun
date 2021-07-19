import {ComplexNumber} from '/modules.js'
import {fourierTransform, fourierFunction, arcLengthDerivative} from '/fourier.js'

var canvas;
var ctx;

var settingsOverlay;

var WIDTH;
var HEIGHT;

let x = 0;
let y = 0;
let startedPath = false;

var path = [];
var pathLength;

var coefficients = [];

var startTime = false;

//arc length increment
var m = 50;

var frameReq;

var tracePath = [];

var timeScale = 1/150;
var timeScaleChanged = false;

var t = 0;

var circles = true;

var showArrows = true;

// var numOfK = 15;
var startK = -15;
var endK = 15;

var displayStartK = -15;
var displayEndK = 15;

var fadeFactor = 1/80;

var traceUpTo = 0;

//default trace color
var traceColor = "#00ffff";

var settingsOpen = false;

//for testing purposes in console
window.path = path;

document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    console.log("Branch: arc-length")
    settingsOverlay = document.getElementById("settings");
    canvas = document.getElementById("canvas");
    //set canvas dimensinos
    resizeCanvas();
    //get canvas context
    ctx = canvas.getContext('2d');
    ctx.lineWidth = 0.8;
    initGlobalListeners();
});
function resizeCanvas(){
    WIDTH = Math.floor(window.innerWidth*0.97);
    HEIGHT = Math.floor(window.innerHeight*0.86);
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
}

function initGlobalListeners(){
    //mobile touch listeners
    canvas.addEventListener('touchstart', function(e){
        // place first point in path
        if(startedPath === false){
            //get canvas coordinates of touch
            var offset = e.target.getBoundingClientRect();
            x = e.touches[0].pageX - offset.x;
            y = e.touches[0].pageY - offset.y;
            //clear old curve
            clearCurve();
            path.push(new ComplexNumber(toPlane(x, y)));
            startedPath = true;
            return 0;
        }
        e.preventDefault();
    });
    canvas.addEventListener('touchmove', function(e){
        if(startedPath === true){
            var offset = e.target.getBoundingClientRect();
            var canvasX = e.touches[0].pageX - offset.x;
            var canvasY = e.touches[0].pageY - offset.y;
            // add new point only if it is a minimum distance from previous point
            let distance = Math.sqrt( (canvasX-x)*(canvasX-x) + (canvasY-y)*(canvasY-y) );
            if ( distance >= 3) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                x = canvasX;
                y = canvasY;
                path.push(new ComplexNumber(toPlane(x, y)));
                ctx.lineTo(x, y);
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }
        }
        e.preventDefault();
    });
    //mouse listeners
    canvas.addEventListener('mousedown', e => {
        // place first point in path
        if(startedPath === false){
            //clear old curve
            clearCurve();
            x = e.offsetX;
            y = e.offsetY;
            path.push(new ComplexNumber(toPlane(x, y)));
            startedPath = true;
            return 0;
        }
    });
    canvas.addEventListener('mousemove', e => {
        // draw when only primary button is pressed
        if(e.buttons === 1 && startedPath === true){
            // add new point only if it is a minimum distance from previous point
            let distance = Math.sqrt( (e.offsetX-x)*(e.offsetX-x) + (e.offsetY-y)*(e.offsetY-y) );
            if ( distance >= 3) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                x = e.offsetX;
                y = e.offsetY;
                path.push(new ComplexNumber(toPlane(x, y)));
                ctx.lineTo(x, y);
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }
        }
    });
    // global key released listener
    document.addEventListener("keyup", function(e) {
        // console.log(e.key)
        if(e.key === "Enter"){
            window.enter();
        }
        if(e.key === "c"){
            window.c();
        }
        //toggle settings
        if(e.key === "s"){
            if(settingsOpen){closeSettings();}
            else if(!settingsOpen){openSettings();}
        }
    });
    //resize listener
    window.addEventListener('resize', function(e){
        resizeCanvas();
    })
}

function clearCurve(){
    cancelAnimationFrame(frameReq);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    path = [];
    pathLength = 0;
    coefficients = [];
    startTime = false;
    tracePath = [];
    //reset trace up to
    traceUpTo = 0;
    //clear old tracePath
    tracePath = [];
}

function fourierSketch(coefficients, N){
    for(let t=0;t<N;t++){
        let step = fourierFunction(coefficients, t, N);
        graphComplexNumber(step);
    }
}

function fourierTrace(timeStamp){
    if(startTime === false){
        startTime=timeStamp
    }
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.beginPath();
    var dt = (timeStamp-startTime)*timeScale;
    if(dt >=  path.length){
        tracePath=[];
        startTime = timeStamp;
    }
    var point = fourierFunction(coefficients, dt, pathLength);
    tracePath.push(point);
    var [x0, y0] = toCanvas(0, 0);
    var [x, y] = toCanvas(point.re, point.im);
    drawArrow(x0, y0, x, y);
    let [traceX, traceY] = toCanvas(tracePath[0].re, tracePath[0].im);
    ctx.moveTo(traceX, traceY);
    for(let n=1;n<tracePath.length;n++){
        let [oldX, oldY] = toCanvas(tracePath[n-1].re, tracePath[n-1].im);
        let [newX, newY] = toCanvas(tracePath[n].re, tracePath[n].im);
        ctx.lineTo(newX, newY);
    }
    ctx.stroke();
    frameReq = requestAnimationFrame(fourierTrace);
}
function fourierCircleTrace(timeStamp){
    //start tracking time elapsed
    if(startTime === false){
        startTime=timeStamp
    }
    //change in time since start
    // var dt = (timeStamp-startTime)*1000;
    

    //reset traceUpTo after a period
    if(traceUpTo >= tracePath.length){
        traceUpTo = 0;
    }
    //partial sums of each frequency
    var current_t = tracePath[traceUpTo][1];
    var sums = fourierFunction(coefficients, current_t, pathLength, true);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    //draw arrows
    if(showArrows){drawArrowsAndCircles(sums);}
    //draw path trace
    drawTracePath(traceUpTo);
    traceUpTo += 5;
    //TODO:
    //optional: draw original path
    frameReq = requestAnimationFrame(fourierCircleTrace);
    // console.log("Queued Frame")
}
function drawArrowsAndCircles(sums){
    if(showArrows){
        for(let n=2;n<sums.length;n++){
            // let headLen = 2*5/n;
            let headLen = 8-(1/10)*(n-2)
            ctx.beginPath();
            let [x0, y0] = toCanvas(sums[n-1].re, sums[n-1].im);
            let [x1, y1] = toCanvas(sums[n].re, sums[n].im);
            drawArrow(x0, y0, x1, y1, headLen);
            ctx.lineWidth = 0.8-fadeFactor*(n-2);
            ctx.stroke();
            if(circles && n <= 150){
                ctx.beginPath();
                let radius = ComplexNumber.add(sums[n], sums[n-1].scale(-1)).radius;
                ctx.arc(x0, y0, radius, 0, 2*Math.PI);
                ctx.lineWidth = 0.2;
                ctx.stroke();
            }
        }
    }
}
function drawTracePath(end){
    ctx.beginPath();
    let [startX, startY] = toCanvas(tracePath[0][0].re, tracePath[0][0].im);
    ctx.moveTo(startX, startY);
    for(let n=1;n<end;n++){
        let [newX, newY] = toCanvas(tracePath[n][0].re, tracePath[n][0].im);
        ctx.lineTo(newX, newY);
    }
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = traceColor;
    ctx.stroke();
    ctx.strokeStyle = "#000000";
}

//OPTIMIZATION: save calculated coefficients and only calculate new coefficients

function createTracePath(){
    //add points m arc length apart
    var dt = 0;
    t = 0;
    tracePath.push([fourierFunction(coefficients, t, pathLength)[coefficients.length], t]);
    while(t < pathLength){
        dt = m / arcLengthDerivative(coefficients, t, pathLength);
        t += dt;
        tracePath.push([fourierFunction(coefficients, t, pathLength)[coefficients.length], t]);
    }
    t = 0;
}
function finishPath(){
    if(path.length < 2){return 0}
    ctx.closePath();
    ctx.stroke();
    startedPath = false;
    coefficients = fourierTransform(path, startK, endK);
    pathLength = path.length;
    //calculate and create tracepath
    createTracePath();
    //begin animating
    requestAnimationFrame(fourierCircleTrace);
}
function toPlane(x, y){
    return [x-WIDTH/2, HEIGHT/2-y];
}
function toCanvas(x, y){
    return [x+WIDTH/2, HEIGHT/2-y];
}
function drawArrow(x0, y0, x1, y1, headlen=5) {
    if(headlen < 0){headlen = 0}
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

// for testing purposes from console
function graphComplexNumber(c){
    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext('2d');
    let [x, y] = toCanvas(c.re, c.im);
    let [x0, y0] = toCanvas(0, 0);
    ctx.beginPath(x0, y0);
    ctx.moveTo(x0, y0);
    ctx.lineTo(x, y);
    ctx.stroke();
}

//global functions to call from buttons
window.updateCircles = updateCircles;
function updateCircles(event){
    circles = event.checked;
}
window.toggleArrows = toggleArrows;
function toggleArrows(event){
    // console.log(event.checked)
    showArrows = event.checked;
}
window.changeStartK = changeStartK;
function changeStartK(event){
    //make sure entered value is less than end K
    var value = parseInt(event.value);
    if(value >= endK){
        value = endK - 1;
    }
    document.getElementById("startK").value = value;
    startK = value;
    document.getElementById("K").value = endK - startK;
    coefficients = fourierTransform(path, startK, endK);
}
window.changeEndK = changeEndK;
function changeEndK(event){
    //make sure entered value is greater than starting k
    var value = parseInt(event.value);
    if(value <= startK){
        value = startK + 1;
    }
    document.getElementById("endK").value = value;
    endK = value;
    document.getElementById("K").value = endK - startK;
    coefficients = fourierTransform(path, startK, endK);
}
window.changeK = changeK;
function changeK(event){
    var value = parseInt(event.value);
    //make sure value is positive
    if(value < 2){
        value = 2;
    }
    else if(value % 2 === 1){
        value ++;
    }
    document.getElementById("K").value = value;
    document.getElementById("startK").value = -value/2;
    document.getElementById("endK").value = value/2;
    startK = -value/2;
    endK = value/2;
    coefficients = fourierTransform(path, startK, endK);
    //clear old trace path before creating new one
    tracePath = [];
    createTracePath();
}
window.changeTime = changeTime;
function changeTime(event){
    var value = parseFloat(event.value);
    timeScale = 1/value;
    timeScaleChanged = true;
}
window.setTraceColor = setTraceColor;
function setTraceColor(event){
    traceColor = event.value;
}
//enter button onCLick
window.enter = function(){
    if(startedPath === true){
        finishPath();
    }
}
//clear button onClick
window.c = function(){
    clearCurve();
    startedPath = false;
}
//settings button onClick
window.openSettings = function(){
    settingsOverlay.style.height = "100%";
    settingsOpen = true;
    settingsOverlay.classList.remove("close-settings");
    settingsOverlay.classList.add("open-settings");
}
window.closeSettings = function(){
    settingsOverlay.style.height = "0%";
    settingsOpen = false;
    settingsOverlay.classList.add("close-settings");
    settingsOverlay.classList.remove("open-settings");
}