const Product = require('../models/product')

exports.getIndex= (req, res, next) => {
    const products = Product.fetchAll(products => {
        res.render("shop/index", {prods: products, doc: "Shop", path:"/", hasProducts: products.length>0, activeShop:true, productCss:true})
    })
}

exports.getProducts=(req, res, next) => {
    //res.sendFile(path.join(__dirname, "..", "views", "shop.html"))
    //console.log(adminData.products)
    //res.sendFile(path.join(root, "views", "shop.html"))
    //rendering template instead of html and passing data to template
    // passing products as callback arguement to fetchall function. this takes care of executing this controller body only when call back is called in fetchall, in case of async execution
    const products = Product.fetchAll(products => {
        res.render("shop/product-list", {prods: products, doc: "All Products", path:"/products", hasProducts: products.length>0, activeShop:true, productCss:true})
    })
}

exports.getProduct=(req, res, next)=>{
    const id=req.params.productId
    console.log(id)
    res.redirect("/")
}

exports.getCart=(req, res, next)=>{
    res.render("shop/cart", {
        path: "/cart",
        doc: "Your Cart"
    })
}

exports.getOrders=(req, res, next)=>{
    res.render("shop/orders", {
        path: "/orders",
        doc: "Your Orders"
    })
}

exports.getCheckOut=(req, res, next)=>{
    res.render("shop/checkout", {
        path: "/checkout",
        doc: "Checkout"
    })
}