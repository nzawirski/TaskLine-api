const express = require('express')
const router = express.Router()
const config = require('../config/config')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');

const User = require('../model/user');
const Password = require('../model/password')

router.post('/', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            message: "login or password not provided"
        })
    }

    User.findOne({ email: email }, (err, user) => {
        if (err) {
            return res.status(500).json({ message: err.message })
        };
        if (!user) {
            return res.status(404).send("User not found")
        }
        Password.findOne({ user: user._id }, (err, passData) => {
            if (err) {
                return res.status(500).json({ message: err.message })
            };

            bcrypt.compare(password, passData.password, (err, _res) => {
                if (err) return res.status(500).json({ message: err.message })
                if (_res) {
                    //pass good
                    jwt.sign({ user: user.username, email: user.email, id: user._id }, config.secretKey, (err, token) => {
                        res.json({ token: token })
                    });

                } else {
                    //pass bad
                    res.status(400).json({
                        message: "Wrong Password"
                    })
                }
            })
        })
    })
})

module.exports = router