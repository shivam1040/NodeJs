//ts
const num1 = document.getElementById('num1') as HTMLInputElement
const num2 = document.getElementById('num2') as HTMLInputElement
const button = document.querySelector('button')!
const numResults: Array<Number> = []
type NumOrString = number | string
type Result = { val: number; timestamp: Date}
const myPromise = new Promise<String>((r, re) => {
    setTimeout(() => {
        r('Work')
    }, 1000)
})
interface ResultObj {
    val: number; timestamp: Date
}

function add(num1: NumOrString , num2: NumOrString){
    if(typeof num1 === 'number' && typeof num2 === 'number')
        return num1 + num2
    else if(typeof num1 === 'string' && typeof num2 === 'string')
        return num1 + '' + num2
    else
        return +num1 + +num2
}

function printResult(resultObj: Result){
    return resultObj.val
}

button.addEventListener('click', () => {
    console.log(add(+num1.value, +num2.value))
})