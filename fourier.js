import {ComplexNumber} from '/modules.js'

//get coefficient for frequency k
export function fourierCoefficient(path, k, cache){
    //check if this frequency is cached
    if(cache.exists(k)){
        return cache.grab(k);
    }
    //start sum at zero (complex number)
    let sum = new ComplexNumber([0, 0]);
    //integral of path times silencer
    for(let t=0;t<path.length;t++){
        // sum += e^i2pik(t/path.length)*path[t]
        //exponent for euler complex form
        let theta = -2*Math.PI*k*t/path.length;
        //silencer made from theta of radius 1
        let silencer = new ComplexNumber([theta, 1], true);
        //path step times silencer
        let step = ComplexNumber.multiply(silencer, path[t]);
        //add to the sum
        sum = ComplexNumber.add(sum, step)
    }
    //scale sum
    sum.scale(1/path.length);
    //insert frequency's coefficient into cache
    cache.insert(k, sum);
    return sum;
}
//get coefficients for frequencies between start and end
export function fourierTransform(path, start, end, cache){
    var coefficients = [];
    for(let k=start;k<end+1;k++){
        coefficients.push([fourierCoefficient(path, k, cache), k]);
    }
    return sortCoefficientsLength(coefficients);
    return coefficients;
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
//sort coefficients by radius (the zero frequency arrow at 0 index)
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
//output of fourier approximation of original path for t
export function fourierFunction(coefficients, t, N){
    //track the sum after each coefficient is computed (for drawing arrows)
    let sums = [];
    //start sum at zero (complex number)
    let sum = new ComplexNumber([0, 0]);
    sums.push(sum);
    for (let n=0;n<coefficients.length;n++){
        //unpack the coefficient and its respective frequency
        let [c, k] = coefficients[n];
        //compute theta for this input t
        let theta = 2*Math.PI*k*t/N;
        //create euler complex number from theta (polar)
        let ei = new ComplexNumber([theta, 1], true);
        //multiply by coefficient
        let step = ComplexNumber.multiply(c, ei).scale(1/N);
        //add to the total sum
        sum = ComplexNumber.add(sum, step);
        //add to the partial sums
        sums.push(sum);
    }
    return sums;
}
//derivative of arc length function
export function arcLengthDerivative(coefficients, t, N){
    //F'(t) = ( (sum{k=a}{b}(r.k)*(w*k)*(-sin(wf(theta)))) )^1/2
    const w = 2*Math.PI/N;
    var x_sum = 0;
    var y_sum = 0;
    //iterate over each frequency (coefficient)
    for(let n=0;n<coefficients.length;n++){
        let [c, k] = coefficients[n];
        //get the radius and offset of this frequency's coefficient
        let r = c.radius;
        let offset = c.theta;
        //add the x dimension contribution by this frequency
        x_sum += r*w*k*(-1)*Math.sin(w*k*t+offset);
        //add the y dimension contribution by this frequency
        y_sum += r*w*k*Math.cos(w*k*t+offset);
    }
    //magnitude of derivative of vector valued Fourier function (derivative of arc length)
    return Math.sqrt(x_sum*x_sum + y_sum*y_sum);
}