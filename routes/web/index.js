const express = require('express')
const router = express.Router()

const productRouter = require('./products')
const authRouter = require('./auth')
const userRouter = require('./user')
const salesRouter = require('./sales')

router.use('/product', productRouter)
router.use('/auth', authRouter)
router.use('/user', userRouter)
router.use('/sale', salesRouter)

module.exports = router