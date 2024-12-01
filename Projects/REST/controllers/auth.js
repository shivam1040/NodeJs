const User = require('../models/user')
const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.signup = (req, res, next) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()){
        const error = new Error('volidation failed')
        error.statusCode = 422
        error.data = errors.array()
        throw error
    }
    const email = req.body.email
    const name = req.body.name
    const password = req.body.password

    bcrypt.hash(password, 12).then(r => {
        const user = new User({
            email: email,
            password: r,
            name: name
        })
        return user.save()
    })
    .then(r => {
        res.status(201).json({message: 'Created', userId: r._id})
    })
    .catch(e => {
        if(!e.statusCode)
            e.statusCode = 500
        next(e)
    })
}

exports.login = (req, res, next) => {
    const email = req.body.email
    const password = req.body.password
    let user

    User.findOne({email: email}).then(r => {
        if(!r){
            const error = new Error("Not found")
            error.statusCode = 401

            throw error
        }
        user = r
        return bcrypt.compare(password, r.password)
    })
    .then(r => {
        if(!r){
            const error = new Error('Wrong')
            error.statusCode = 401

            throw error
        }
        const token = jwt.sign({email: user.email, userId: user._id.toString()}, 'secret', {expiresIn: '1h'})

        res.json({token: token, userId: user._id.toString()})
    })
    .catch(e => {
        if(!e.statusCode)
            e.statusCode = 500
        next(e)
    })
}