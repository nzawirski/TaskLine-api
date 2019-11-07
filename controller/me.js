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

//edit profile
router.put('/', readToken, (req, res) => {
    const { username, password } = req.body;
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

                if (password) {
                    Password.findOne({ user: authData.id }).exec((err, _password) => {
                        if (err) {
                            return res.status(500).json({ message: err.message })
                        };

                        bcrypt.hash(password, saltRounds, (err, hash) => {
                            if (err) return console.error(err);
                            _password.password = hash
                            _password.save((err) => {
                                if (err) return console.error(err);
                            })
                        })
                    })
                }

                user.username = username || user.username

                user.save((err) => {
                    if (err) return res.status(400).send(err.message);
                    res.json(user);
                })
            })
    })
})

module.exports = router