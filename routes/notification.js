const express = require('express')
const router = express.Router()
const authenticate = require('../authentication')
const {Notifications: nt, NotificationViewers: notificationViewers, Users: users, sequelize} =  require('../models')
var { Op } = require('sequelize')
const admin_authentication = require('../admin_authentication')

router.get('/all', admin_authentication, async (req, res) => {
    try {
        let notification;
    if (req.user.admin) {
        notification = await nt.findAll({
            include: [{model: users, as: 'viewers', attributes:  ['auth_key'], through: {attributes: []}}],
            attributes: {exclude: ['onlyAdmin']}
        })
    }else {
        notification = await nt.findAll({
            where: {onlyAdmin: false},
            include: [{model: users, as: 'viewers', attributes:  ['auth_key'], through: {attributes: []}}],
            attributes: {exclude: ['onlyAdmin']}
        })
    }

    if (notification) {
        return res.status(200).json({status: true, data: notification})
    }
    return res.status(404).json({status: false, msg: "no notification for this user"})
    } catch (error) {
        return res.status(500).json({status: false, msg: error.message})
    }
})

router.post('/viewed', admin_authentication, async(req, res) => {
    try {
        let notification;
            if (req.user.admin) {
                notification = await nt.findAll({
                    include: [{model: users, as: 'viewers', attributes: ['id']}],
                    where: {
                        id: {
                            [Op.notIn]: sequelize.literal(`(
                                SELECT notificationId 
                                FROM notificationviewers
                                WHERE userId = :userId
                            )`)
                        }
                    },
                    replacements: { userId: req.user.id } 
                })
            }else {
                notification = await nt.findAll({
                    include: [{model: users, as: 'viewers', attributes: ['id']}],
                    where: {
                        id: {
                            [Op.notIn]: sequelize.literal(`(
                                SELECT notificationId 
                                FROM notificationviewers
                                WHERE userId = :userId
                            )`)
                        },
                        onlyAdmin: false
                    },
                    replacements: { userId: req.user.id } 
                })
            }
            
        if (notification) {
            notification.forEach(val => {
                val.addViewers(req.user.id)
            });
        }
        res.status(200).json({status: true})

    } catch (error) {
        res.status(500).json({status: false, msg: error.message})
    }
})

module.exports = router