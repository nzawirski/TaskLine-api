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
        Project.find({ 'members.user': authData.id }, (err, projects) => {
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
            let project = new Project({ name, members: [{ user: authData.id }] });
            project.save((err) => {
                if (err) return console.error(err);

                res.status(201).json(project);
            })
        })
    })
})

//Get Project
router.get('/:_id', readToken, (req, res) => {
    jwt.verify(req.token, config.secretKey, (err, authData) => {
        if (err) {
            return res.status(401).json({
                message: err.message
            })
        }
        Project.findById(req.params._id)
            .populate('members.user')
            .exec((err, project) => {
                if (err) {
                    return res.status(500).json({ message: err.message })
                };
                if (!project) {
                    return res.status(404).send("Project not found")
                }
                //Check if user is a member of this project
                let isMember = false;
                project.members.forEach(member => {
                    console.log(member.user)
                    console.log(authData.id)
                    isMember = (member.user._id == authData.id) ? true : isMember
                })

                if(!isMember){
                    res.status(403).send("User is not a member of this project")
                }else{
                    res.json(project);
                }
            });
    })
})
module.exports = router