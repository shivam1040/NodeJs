const express = require('express')
const router = express.Router()
const shopController = require('../controllers/shop')

//express doesnt do full match on route but rather checks starts with so if no routes match then it'll match with / so ensure to keep it at bottom or top by making use of next()
router.use("/", shopController.getIndex)
router.use("/products", shopController.getProducts)
//means it'll have path variable
router.use("/products/:productId", shopController.getProduct)
router.use("/cart", shopController.getCart)
router.use("/orders", shopController.getOrders)
router.use("/checkout", shopController.getCheckOut)
module.exports = router