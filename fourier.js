import {ComplexNumber} from '/modules.js'

export function fourierCoefficient(path, k){
    let sum = new ComplexNumber([0, 0]);
    for(let t=0;t<path.length;t++){
        // sum += e^i2pik(t/path.length)*path[t]
        let theta = -2*Math.PI*k*t/path.length;
        let silencer = new ComplexNumber([theta, 1], true);
        let step = ComplexNumber.multiply(silencer, path[t]);
        sum = ComplexNumber.add(sum, step)
    }
    return sum.scale(1/path.length);
}
export function fourierTransform(path, start, end){
    var coefficients = [];
    for(let k=start;k<end+1;k++){
        coefficients.push([fourierCoefficient(path, k), k]);
    }
    return sortCoefficientsLength(coefficients);
}
function sortCoefficientsFrequency(coefficients){
    var sorted = new Array(coefficients.length);
    var middle = Math.floor(coefficients.length/2);
    sorted[0] = coefficients[middle];
    var n = 1;
    for(let i=1;i<middle+1;i++){
        sorted[n] = coefficients[middle+i];
        n++;
        sorted[n] = coefficients[middle-i];
        n++;
    }
    return sorted;
}
function sortCoefficientsLength(coefficients){
    var sorted = [];
    var middle = Math.floor(coefficients.length/2);
    sorted.push(coefficients[middle]);
    coefficients.splice(middle, 1);
    coefficients.sort((a, b) => {
        return b[0].radius - a[0].radius;
    });
    sorted = [...sorted, ...coefficients];
    return sorted
}
export function fourierFunction(coefficients, t, N, arrows=false){
    let sums = [];
    let steps = [];
    let sum = new ComplexNumber([0, 0]);
    sums.push(sum);
    for (let n=0;n<coefficients.length;n++){
        let [c, k] = coefficients[n];
        let theta = 2*Math.PI*k*t/N;
        let ei = new ComplexNumber([theta, 1], true);
        let step = ComplexNumber.multiply(c, ei).scale(1/N);
        steps.push(step);
        sum = ComplexNumber.add(sum, step);
        sums.push(sum);
    }
    if(arrows){return [sums, steps]}
    return sum;
}