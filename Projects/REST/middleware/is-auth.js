const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    const auth = req.get('Authorization')
        // if(!auth){
        //     const error = new Error('no tokun')
        //     error.statusCode = 401

        //     throw error
        // }
        if(!auth){
            req.isAuth = false

            return next()
        }
    const token = req.get('Authorization').split(' ')[1]
    let decodedToken

    try {
        decodedToken = jwt.verify(token, 'secret')
    } catch (error) {
       req.isAuth = false

       return next()
    }
    if(!decodedToken){
        req.isAuth = false

        return next()
    }
    req.userId = decodedToken.userId
    req.isAuth = true
    next()
}