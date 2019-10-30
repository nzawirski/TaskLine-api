const express = require('express')
const router = express.Router()
const config = require('../config/config')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const saltRounds = 10;

const readToken = require('../middleware/read-token')

const User = require('../model/user')
const Password = require('../model/password')

//get current user
router.get('/', readToken, (req, res) => {

    jwt.verify(req.token, config.secretKey, (err, authData) => {
        if (err) {
            return res.status(403).json({
                message: err.message
            })
        }
        User.findById(authData.id)
            .exec((err, user) => {
                if (err) {
                    return res.status(500).json({ message: err.message })
                };
                if (!user) {
                    return res.status(404).send("User not found")
                }
                res.json(user);
            })
    })
})

module.exports = router