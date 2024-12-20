const express = require('express')
const router = express.Router()

const productRouter = require('./products')
const authRouter = require('./auth')
const userRouter = require('./user')
const salesRouter = require('./sales')
const favoriteRouter = require('./favorite')

router.use('/product', productRouter)
router.use('/auth', authRouter)
router.use('/user', userRouter)
router.use('/sale', salesRouter)
router.use('/favorite', favoriteRouter)

module.exports = router