const Product = require('../models/product')
exports.getAddProduct=(req, res, next) => {
    //res.sendFile(path.join(__dirname, "..", "views", "add-product.html"))
    //res.sendFile(path.join(rootDir, "views", "add-product.html"))
    res.render("admin/add-product", {doc: "Add Product", path: "/admin/add_product", activeAddProduct:true, productCss:true})
}

exports.postAddProduct=(req, res) => {
    const product = new Product(req.body.title, req.body.image, req.body.price, req.body.description)

    product.save()
    res.redirect("/")
}

exports.getProducts=(req, res, next)=>{
    const products = Product.fetchAll(products => {
        res.render("admin/products", {prods: products, doc: "Admin Products", path:"/admin/products", hasProducts: products.length>0, activeShop:true, productCss:true})
    })
}