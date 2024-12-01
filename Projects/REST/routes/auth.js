const express = require('express')
const router = express.Router()
const {body} = require('express-validator')
const User = require('../models/user')
const authController = require('../controllers/auth')

router.put('/signup', [
    body('email').isEmail().withMessage('Entur emaili').custom((v, {req}) => {
        return User.findOne({email: v}).then(u => {
            if(u)
                return Promise.reject('Exits')
        })
    }).normalizeEmail(),
    body('password').trim().isLength({min: 5}),
    body('name').trim().not().isEmpty()
], authController.signup)
router.post('/login', authController.login)

module.exports = router