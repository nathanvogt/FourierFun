import {ComplexNumber, CoefficientCache} from '/modules.js'
import {fourierTransform, fourierFunction, arcLengthDerivative} from '/fourier.js'

var canvas;
var ctx;

var settingsOverlay;

var pausePlayButton;

var WIDTH;
var HEIGHT;

let x = 0;
let y = 0;
let startedPath = false;

var path = [];
var pathLength;

var coefficients = [];

var coefCache = new CoefficientCache();

var frameReq;

var tracePath = [];

var timeScale = 20;
var timeScaleChanged = false;

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

var playing = false;

var showEntireTracePath = false;

//for testing purposes in console
window.path = path;

document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    settingsOverlay = document.getElementById("settings");
    pausePlayButton = document.getElementById("pausePlayButton");
    canvas = document.getElementById("canvas");
    //initialize show entire trace path button as unchecked
    document.getElementById("showEntireTracePath").checked = false;
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
    });
    window.addEventListener("orientationchange", function(e){
        resizeCanvas();
    });
}

function clearCurve(){
    cancelAnimationFrame(frameReq);
    //disable pausing/playing (no longer rendering)
    playing = false;
    pausePlayButton.innerHTML = "Pause";
    //clear canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    //clear user generated path
    path = [];
    pathLength = 0;
    //reset calculated coefficients
    coefficients = [];
    //remove coefficient cache
    coefCache.reset();
    //reset time inputs
    prevTimeStamp = false;
    t = 0;
    prev_t = 0;
    //reset trace up to
    traceUpTo = 0;
    previousTraceUpTo = 0;
    //clear old tracePath
    tracePath = [];
}

function fourierSketch(coefficients, N){
    for(let t=0;t<N;t++){
        let step = fourierFunction(coefficients, t, N)[coefficients.length];
        graphComplexNumber(step);
    }
}
function tracePathSketch(){
    for(let t=0;t<tracePath.length;t++){
        let step = tracePath[t][0];
        graphComplexNumber(step);
    }
}

function fourierTrace(timeStamp){
    if(prevTimeStamp === false){
        prevTimeStamp=timeStamp
    }
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.beginPath();
    var dt = (timeStamp-prevTimeStamp)*timeScale;
    if(dt >=  path.length){
        tracePath=[];
        prevTimeStamp = timeStamp;
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

//persistent variables for animating fourier function
var previousTraceUpTo = 0;
var prev_t = 0;
var t = 0;
var prevTimeStamp = false;

function animateFourierFunction(timeStamp){
    //start tracking time elapsed
    if(prevTimeStamp === false){
        prevTimeStamp=timeStamp
    }
    //change in seconds since last frame times timescale
    var dt;
    //animation is paused
    if(prevTimeStamp === -1){
        dt = 0;
    }else{ //not paused
        //change in time since last frame (times timescale)
        dt = (timeScale*(timeStamp-prevTimeStamp)/1000);
        //update previous time stamp
        prevTimeStamp = timeStamp;
    }
    
    //increase time input
    t = (t + dt) % pathLength;
    //reset prevTraceUpTo after full period
    if(t < prev_t){
        previousTraceUpTo = 0;
    }
    //update previous time input
    prev_t = t;
    //show entire trace path
    if(showEntireTracePath){
        traceUpTo = tracePath.length;
        //for when show entire trace path is disabled
        previousTraceUpTo = 0;
    }else{      //don't show entire trace path, only up until current time stamp
        //find closest point in tracepath to current t (previousTraceUpTo is an optimization that reduces length of for loop)
        for (let i=previousTraceUpTo;i<tracePath.length;i++) {
            //get time stamp of this trace point
            let timeStamp = tracePath[i][1];
            if(timeStamp > t){
                break;
            }
            traceUpTo = i;
        }
        previousTraceUpTo = traceUpTo;
    }
    var sums = fourierFunction(coefficients, t, pathLength, true);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    //draw arrows
    if(showArrows){drawArrowsAndCircles(sums);}
    //draw path trace
    drawTracePath(traceUpTo);
    //TODO:
    //optional: draw original path
    frameReq = requestAnimationFrame(animateFourierFunction);
}
function drawArrowsAndCircles(sums){
    if(showArrows){
        for(let n=2;n<sums.length;n++){
            ctx.beginPath();
            let [x0, y0] = toCanvas(sums[n-1].re, sums[n-1].im);
            let [x1, y1] = toCanvas(sums[n].re, sums[n].im);
            //euclidean distance of this sum step
            var radius = Math.sqrt((x1-x0)*(x1-x0)+(y1-y0)*(y1-y0));
            //headlen depending on radius of circle
            let headLen = Math.min(radius/3, 8)
            drawArrow(x0, y0, x1, y1, headLen);
            ctx.lineWidth = 0.8-fadeFactor*(n-2);
            ctx.stroke();
            if(circles && n <= 150){
                ctx.beginPath();
                // let radius = ComplexNumber.add(sums[n], sums[n-1].scale(-1)).radius;
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
    var m = 2*pathLength;
    var dt = 0;
    var input = 0;
    //first point of the trace path at t = 0
    let start = fourierFunction(coefficients, input, pathLength)[coefficients.length];
    tracePath.push([start, input]);
    while(input < pathLength){
        dt = m / arcLengthDerivative(coefficients, input, pathLength);
        input += dt;
        tracePath.push([fourierFunction(coefficients, input, pathLength)[coefficients.length], input]);
    }
    //last point (same as first point)
    tracePath.push([start, input]);
}
function finishPath(){
    //make sure there is a path
    if(path.length < 2){return 0}
    ctx.closePath();
    ctx.stroke();
    //no longer making user generated path
    startedPath = false;
    //calculate coefficients for transform of user generated path
    coefficients = fourierTransform(path, startK, endK, coefCache);
    //user generated path length
    pathLength = path.length;
    //calculate and create tracepath
    createTracePath();
    //allow pausing/playing (circle animation is starting)
    playing = true;
    //begin animating
    frameReq = requestAnimationFrame(animateFourierFunction);
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
    let [x, y] = toCanvas(c.re, c.im);
    let [x0, y0] = toCanvas(0, 0);
    ctx.beginPath();
    drawArrow(x0, y0, x, y);
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
window.changeKButton = function(event){
    changeK(event.value);
}
function changeK(k){
    var value = parseInt(k);
    //make sure value is positive
    if(value < 2){
        value = 2;
    }
    else if(value % 2 === 1){
        value ++;
    }
    document.getElementById("K").value = value;
    // document.getElementById("startK").value = -value/2;
    // document.getElementById("endK").value = value/2;
    startK = -value/2;
    endK = value/2;
    coefficients = fourierTransform(path, startK, endK, coefCache);
    //clear old trace path before creating new one
    tracePath = [];
    previousTraceUpTo = 0;
    createTracePath();
}
window.decreaseCircles = function(){
    changeK(coefficients.length-3);
}
window.increaseCircles = function(){
    changeK(coefficients.length + 1);
}
window.changeTime = changeTime;
function changeTime(event){
    var value = parseFloat(event.value);
    timeScale = value;
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
//toggle play/pause button
window.toggleAnimation = function(event){
    //only toggle while playing
    if(!playing){return 0;}
    var status = event.innerHTML;
    if(status === "Pause"){
        //pause circle animation
        prevTimeStamp = -1;
        pausePlayButton.innerHTML = "Play";
    }else if(status === "Play"){
        //restart tracking time and rendering circles
        prevTimeStamp = false;
        pausePlayButton.innerHTML = "Pause";
    }
}
//choose whether to show entire trace path
window.showEntireTracePath = function(event){
    showEntireTracePath = event.checked;
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