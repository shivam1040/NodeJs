//way to import file in node js
const express = require("express")
const bodyParser = require("body-parser")
const app = express()
const adminRoutes = require('./routes/admin')
const shopRoutes = require('./routes/shop')
const path = require("path")
//const {engine} = require("express-handlebars")
//setting pug as template engine
//app.set("view engine", "pug")
//setting handler bars as template engine
// app.engine("handlebars", engine({
//     extname: "handlebars",
//     defaultLayout: "main-layout",
//     layoutsDir: "views/layout"
// }))
app.set("view engine", "ejs")
//this handleBars extension should be used for all the handlebars template
// app.set("view engine", "handlebars")
//where to find templates
app.set("views", "views")
//parse body b4 going through middleware
app.use(bodyParser.urlencoded({extended: false}))
//serving static files which is available to user implicitly
//check shop.html header link
app.use(express.static(path.join(__dirname, "public")))
// app.use((req, res, next) => {
//     //this ensures all the use functions are executed until explicit return is done
//     next()
// })
//routes get prefixed with /admin
app.use('/admin', adminRoutes.routes)
app.use("/shop", shopRoutes)
app.use((req, res, next) => {
    //we can chain header, status methods like this and send should be always at last
    res.status(404).sendFile(path.join(__dirname, "views", "404.html"))
})
app.listen(3000)

//even though single thread the server func is scoped individually to each req/res so no concerns for data overlap/security