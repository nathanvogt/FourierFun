import {ComplexNumber} from '/modules.js'
import {fourierTransform, fourierFunction} from '/fourier.js'

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

var frameReq;

var tracePath = [];

var timeScale = 1/150;
var timeScaleChanged = false;

var circles = true;

var showArrows = true;

// var numOfK = 15;
var startK = -15;
var endK = 15;

var fadeFactor = 1/80;

//default trace color
var traceColor = "#00ffff";

//for testing purposes in console
window.path = path;

document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    settingsOverlay = document.getElementById("settings");
    canvas = document.getElementById("canvas");
    //set canvas width
    WIDTH = Math.floor(window.innerWidth*0.97);
    HEIGHT = Math.floor(window.innerHeight*0.86);
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    //get canvas context
    ctx = canvas.getContext('2d');
    ctx.lineWidth = 0.8;
    initGlobalListeners();
});

function initGlobalListeners(){
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
            if ( distance >= 5) {
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
    });
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
}
window.closeSettings = function(){
    settingsOverlay.style.height = "0%";
}


function clearCurve(){
    cancelAnimationFrame(frameReq);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    path = [];
    pathLength = 0;
    coefficients = [];
    startTime = false;
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
    if(startTime === false){
        startTime=timeStamp
    }
    var dt = (timeStamp-startTime)*(timeScale);
    // shadowPoint = (prevTimeStamp-startTime)*(prevTimeScale)
    if(timeScaleChanged === true){
        tracePath = []
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        timeScaleChanged = false;
    }
    if(dt >=  path.length){
        tracePath=[];
        startTime = timeStamp;
    }
    //partial sums of each frequency
    var [sums, _] = fourierFunction(coefficients, dt, pathLength, true);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    //draw arrows
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
    tracePath.push(sums[sums.length-1]);
    //draw path trace
    ctx.beginPath();
    let [startX, startY] = toCanvas(tracePath[0].re, tracePath[0].im);
    ctx.moveTo(startX, startY);
    for(let n=1;n<tracePath.length;n++){
        let [newX, newY] = toCanvas(tracePath[n].re, tracePath[n].im);
        ctx.lineTo(newX, newY);
    }
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = traceColor;
    ctx.stroke();
    ctx.strokeStyle = "#000000";
    frameReq = requestAnimationFrame(fourierCircleTrace);
}

function finishPath(){
    if(path.length < 2){return 0}
    ctx.closePath();
    ctx.stroke();
    startedPath = false;
    //TODO: Calculate Fourier Transform
    coefficients = fourierTransform(path, startK, endK);
    pathLength = path.length;
    //begin animating
    requestAnimationFrame(fourierCircleTrace);
}
function toPlane(x, y){
    return [x-WIDTH/2, HEIGHT/2-y];
}
function toCanvas(x, y){
    return [x+WIDTH/2, HEIGHT/2-y];
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
//checks on inputed value
    //make sure entered value is less than end K
    var value = parseInt(event.value);
    if(value >= endK){
        value = endK - 1;
    }
    document.getElementById("startK").value = value;
    startK = value;
    document.getElementById("K").value = endK - startK;
}
window.changeEndK = changeEndK;
function changeEndK(event){
//checks on inputed value
    //make sure entered value is greater than starting k
    var value = parseInt(event.value);
    if(value <= startK){
        value = startK + 1;
    }
    document.getElementById("endK").value = value;
    endK = value;
    document.getElementById("K").value = endK - startK;
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
