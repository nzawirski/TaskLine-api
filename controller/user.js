const express = require('express')
const router = express.Router()
const config = require('../config/config')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const saltRounds = 10;

const readToken = require('../middleware/read-token')

const User = require('../model/user')
const Password = require('../model/password')

//List of users
router.get('/', (req, res) => {
    User.find({}, (err, users) => {
        if (err) return console.error(err);
        res.json(users);
    });
})

//register
router.post('/', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "Please provide all required parameters"
        })
    }

    User.findOne({ username: username }, (err, user) => {
        if (user) {
            return res.status(409).send("User already exists")
        }
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) return console.error(err);
            let user = new User({ username: username, email: email })
            user.save((err, user) => {
                if (err) return console.error(err);
                let password = new Password({ user: user._id, password: hash })
                password.save((err) => {
                    if (err) return console.error(err);
                })
                res.status(201).json(user);
            })
        })
    })
})

//Get single user
router.get('/:_id', (req, res) => {
    User.findById(req.params._id)
        .exec((err, user) => {
            if (err) {
                return res.status(500).json({ message: err.message })
            };
            if (!user) {
                return res.status(404).send("User not found")
            }
            res.json(user);
        });
})

module.exports = router