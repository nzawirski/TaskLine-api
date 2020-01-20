const express = require('express')
const router = express.Router()
const config = require('../config/config')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const multer = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname)
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true)
    } else {
        cb(new Error('unsupported file extension'), false)
    }
}
//1024 * 1024 * 5 = 5MB
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

const readToken = require('../middleware/read-token')

const User = require('../model/user')
const Password = require('../model/password')
const Task = require('../model/task')

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
                            if (err) return res.status(500).json({ message: err.message })
                            _password.password = hash
                            _password.save((err) => {
                                if (err) return res.status(500).json({ message: err.message })
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

//Change profile picture
router.put('/profilePic', [readToken, upload.single('image')], (req, res) => {

    jwt.verify(req.token, config.secretKey, (err, authData) => {
        if (err) {
            return res.status(403).json({
                message: err.message
            })
        }
        const imgPath = req.file ? req.file.path : null
        User.findById(authData.id)
            .exec((err, user) => {
                if (err) {
                    return res.status(500).json({ message: err.message })
                };
                if (!user) {
                    return res.status(404).send("User not found")
                }
                if (!imgPath) {
                    return res.status(400).send("Photo not uploaded")
                }

                oldPic = user.profilePic
                //remove old image file
                if (oldPic) {
                    fs.unlink(oldPic, (err) => {
                        if (err) return console.log('Tried to delete ' + oldPic + 'but it was already gone');
                        console.log(oldPic + ' has been deleted');
                    });
                }

                user.profilePic = imgPath

                user.save((err) => {
                    if (err) return res.status(500).json({ message: err.message })
                    res.status(200).json(user);
                })

            })
    })
})

//Delete profile picture
router.delete('/profilePic', readToken, (req, res) => {
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
                oldPic = user.profilePic
                //remove old image file
                if (oldPic) {
                    let delFail = false
                    fs.unlink(oldPic, (err) => {
                        if (err) delFail = true;

                        user.profilePic = null

                        user.save((err) => {
                            if (err) return res.status(500).json({ message: err.message })
                            delFail ?
                                res.status(200).send('Tried to delete ' + oldPic + 'but it was already gone. User profile updated')
                                : res.status(200).send(oldPic + ' has been deleted')
                        })

                    });
                } else {
                    res.status(200).send('There is no profile picture set')
                }
            })
    })
})

router.get('/dashboard', readToken, (req, res) => {

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
                Task.find({ assigned_users: authData.id, status: {$nin: ["Completed","Canceled"]} })
                    .sort({due_date: 1})
                    .populate('added_by')
                    .populate('assigned_users')
                    .populate('parent_project', 'name members')
                    .exec((err, tasks) => {
                        if (err) {
                            return res.status(500).json({ message: err.message })
                        };
                        res.json(tasks)
                    })
            })
    })
})

module.exports = router