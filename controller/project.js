const express = require('express')
const router = express.Router()
const config = require('../config/config')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const saltRounds = 10;

const readToken = require('../middleware/read-token')

const User = require('../model/user')
const Project = require('../model/project')

//List of Projects
router.get('/', readToken, (req, res) => {
    jwt.verify(req.token, config.secretKey, (err, authData) => {
        if (err) {
            return res.status(401).json({
                message: err.message
            })
        }
        Project.find({ 'members.user': authData.id}, (err, projects) => {
            if (err) return console.error(err);
            res.json(projects);
        });
    })
})

//Add Project
router.post('/', readToken, (req, res) => {
    const { name } = req.body;

    jwt.verify(req.token, config.secretKey, (err, authData) => {
        if (err) {
            return res.status(401).json({
                message: err.message
            })
        }
        if (!name) {
            return res.status(400).json({
                message: "Please provide post content"
            })
        }
        User.findById(authData.id, (err, user) => {
            if (err) {
                return res.status(400).json({
                    message: err.message
                })
            }
            let project = new Project({ name, members: [{user: authData.id}] });
            project.save((err) => {
                if (err) return console.error(err);

                res.status(201).json(project);
            })
        })
    })
})

module.exports = router