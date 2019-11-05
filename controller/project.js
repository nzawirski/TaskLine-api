const express = require('express')
const router = express.Router()
const config = require('../config/config')
const jwt = require('jsonwebtoken')

const readToken = require('../middleware/read-token')

const User = require('../model/user')
const Project = require('../model/project')
const Task = require('../model/task')

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
            .populate('tasks')
            .populate({
                path: "tasks",
                populate: {
                    path: "added_by"
                }
            })
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

//Edit project
router.put('/:_id', readToken, (req, res) => {
    const { name } = req.body;
    jwt.verify(req.token, config.secretKey, (err, authData) => {
        if (err) {
            return res.status(401).json({
                message: err.message
            })
        }
        if (!name) {
            return res.status(400).json({
                message: "Required parameters are missing"
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
                //Check if user is a member AND ADMIN  of this project
                let isAdmin = false;
                project.members.forEach(member => {
                    isAdmin = (member.user._id == authData.id && member.role == 'admin') ? true : isAdmin
                })

                if(!isAdmin){
                    res.status(403).send("User cannot perform this action")
                }else{
                    project.name = name
                    project.save((err) => {
                        if (err) return console.error(err);
                        res.json(project);
                    })
                }
            });
    })
})

//Add task to project
router.post('/:_id/tasks', readToken, (req, res) => {
    const { name, description, due_date } = req.body;
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
        Project.findById(req.params._id)
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
                    isMember = (member.user == authData.id) ? true : isMember
                })

                if(!isMember){
                    res.status(403).send("User is not a member of this project")
                }else{
                    let task = new Task({ name, description, due_date, added_by: authData.id, parent_project: project._id})
                    task.save((err) => {
                        if (err) return console.error(err);
                        project.tasks.push(task._id)
                        project.save((err) => {
                            if (err) return console.error(err);
                            res.status(201).json(task);
                        })
                    })
                }
            });
    })
})

module.exports = router