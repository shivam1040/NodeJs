const fs = require('fs')
const path = require('path')
const p = path.join(path.dirname(process.mainModule.filename), "data", "products.json")
const getProductsFromFile = c => {
    fs.readFile(p, (e, content) => {
        if(e)
            c([])
        c(JSON.parse(content))
    })
}
module.exports = class Product{

    constructor(title, img, description, price){
        this.title = title
        this.img=img
        this.description=description
        this.price=price
    }

    save(){
        this.id=Math.random().toString()
        getProductsFromFile(prod => {
            prod.push(this)
            fs.writeFile(p, JSON.stringify(prod), e=>{
                console.log(e)
            })
        })
    }

    static fetchAll(cb){
        getProductsFromFile(cb)
    }
}