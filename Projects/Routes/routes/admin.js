const express = require('express')
const router = express.Router()
const path = require("path")
const rootDir = require("../util/path")
const adminController = require('../controllers/admin')

router.get("/add_product", adminController.getAddProduct)
//middleware for POST request
router.post("/add_product", adminController.postAddProduct)
router.use("/products", adminController.getProducts)

//module.exports = router
exports.routes = router
//exports.products = products