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
    return coefficients;
}
export function fourierFunction(coefficients, t, N, arrows=false){
    let sums = [];
    let sum = new ComplexNumber([0, 0]);
    sums.push(sum);
    for (let n=0;n<coefficients.length;n++){
        let [c, k] = coefficients[n];
        let theta = 2*Math.PI*k*t/N;
        let ei = new ComplexNumber([theta, 1], true);
        let step = ComplexNumber.multiply(c, ei).scale(1/N);
        sum = ComplexNumber.add(sum, step);
        sums.push(sum);
    }
    if(arrows){return sums}
    return sum;
}