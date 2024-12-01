const express = require('express')
const app = express()
const feedRoutes = require('./routes/feed')
const authRoutes = require('./routes/auth')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname)
    }
})
const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    )
        cb(null, true)
    else
        cb(null, false)
}
const { graphqlHTTP } = require('express-graphql')
const graphqlSchema = require('./graphql/schema')
const graphqlResolver = require('./graphql/resolvers')
const auth = require('./middleware/is-auth')
const helmet = require('helmet')
const compression = require('compression')
const morgan =  require('morgan')
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {
    flags: 'a'
})
const privateKey = fs.readFileSync('server.key')
const certificate = fs.readFileSync('server.cert')
const https = require('https')

app.use(helmet())
app.use(morgan('combined', {
    stream: accessLogStream
}))
app.use(compression())
app.use(bodyParser.json())
app.use(multer({
    storage: fileStorage,
    fileFilter: fileFilter
}).single('image'))
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    //this takes care of graphql query requests from browser when it request for options and it return 405
    if(req.method === 'OPTIONS')
        return res.sendStatus(200)
    next()
})
app.use(auth)
app.put('/post-image', (req, res, next)=> {
    if(!req.isAuth)
        throw new Error('unauthe')
    if(!req.file)
        return res.json({message: 'No file'})
    if(req.body.oldPath)
        clearImage(req.body.oldPath)
    return res.status(201).json({message: 'stored', filePath: req.file.path})
})
app.use('/graphql', graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    formatError(err) {
        if(!err.originalError)
            return err
        const data = err.originalError.data
        const message = err.message || 'Error occured'
        const code = err.originalError.code || 500

        return {message: message, status: code, data: data}
    }
}))
app.use('/feed', feedRoutes)
app.use('/auth', authRoutes)
app.use((error, req, res, next) => {
    console.log(error)
    const message = error.message
    const status = error.statusCode || 500
    const data = error.data

    res.status(status).json({message: message, data: data})
})
//way to use envs
process.env.MONGO
mongoose.connect('mongodb://root:example@localhost:27017')
.then(r => {
    //app.listen(8080)
    https.createServer({key: privateKey, cert: certificate}, app).listen(3000)
    //websocket built on top of http
    // const io = require('./socket').init(server);
    // io.on('connection', socket => {
    //     console.log('Connected')
    // })
}).catch(e => console.log(e))

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath)

    fs.unlink(filePath, e => console.log(e))
}