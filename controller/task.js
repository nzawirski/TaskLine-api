const express = require('express')
const router = express.Router()
const config = require('../config/config')
const jwt = require('jsonwebtoken')

const readToken = require('../middleware/read-token')

const User = require('../model/user')
const Project = require('../model/project')
const Task = require('../model/task')

//Get Task
router.get('/:_id', readToken, (req, res) => {
    jwt.verify(req.token, config.secretKey, (err, authData) => {
        if (err) {
            return res.status(401).json({
                message: err.message
            })
        }
        Task.findById(req.params._id)
            .populate('added_by')
            .populate('assigned_users')
            .populate('parent_project', 'name members')
            .exec((err, task) => {
                if (err) {
                    return res.status(500).json({ message: err.message })
                };
                if (!task) {
                    return res.status(404).send("Task not found")
                }
                //Check if user is a member of this project
                let isMember = false;
                task.parent_project.members.forEach(member => {
                    isMember = (member.user._id == authData.id) ? true : isMember
                })

                if (!isMember) {
                    return res.status(403).send("User is not a member of this project")
                }
                res.json(task);
            });
    })
})

//Edit task
router.put('/:_id', readToken, (req, res) => {
    const { name, description, due_date, status } = req.body;
    jwt.verify(req.token, config.secretKey, (err, authData) => {
        if (err) {
            return res.status(401).json({
                message: err.message
            })
        }
        Task.findById(req.params._id)
            .populate('parent_project', 'name members')
            .exec((err, task) => {
                if (err) {
                    return res.status(500).json({ message: err.message })
                };
                if (!task) {
                    return res.status(404).send("Task not found")
                }
                //Check if user is a member of this project
                let isMember = false;
                task.parent_project.members.forEach(member => {
                    isMember = (member.user._id == authData.id) ? true : isMember
                })

                if (!isMember) {
                    return res.status(403).send("User is not a member of this project")
                }

                if (name) {
                    task.name = name
                }
                if (description) {
                    task.description = description
                }
                if (due_date) {
                    task.due_date = due_date
                }
                if (status) {
                    task.status = status
                }
                task.save((err) => {
                    if (err) return res.status(400).send(err.message);
                    res.json(task);
                })
            });
    })
})

//Assign users to task
router.post('/:_id/users', readToken, (req, res) => {
    const { assignee } = req.body
    jwt.verify(req.token, config.secretKey, (err, authData) => {
        if (err) {
            return res.status(401).json({
                message: err.message
            })
        }
        if (!assignee) {
            return res.status(400).json({
                message: "Required parameters are missing"
            })
        }
        Task.findById(req.params._id)
            .populate('parent_project', 'name members')
            .exec((err, task) => {
                if (err) {
                    return res.status(500).json({ message: err.message })
                };
                if (!task) {
                    return res.status(404).send("Task not found")
                }
                //Check if user is a member AND ADMIN of this project
                let isAdmin = false
                task.parent_project.members.forEach(member => {
                    isAdmin = (member.user._id == authData.id && member.role == 'admin') ? true : isAdmin
                })

                if (!isAdmin) {
                    return res.status(403).send("User cannot perform this action")
                }

                //Check if asignee is a member
                let isMember = false
                task.parent_project.members.forEach(member => {
                    isMember = (member.user._id == assignee) ? true : isMember
                })

                if (!isMember) {
                    return res.status(404).send("Assigne is not a member")
                }

                //Check if user was already assigned to this task
                let alreadyAssigned = false
                task.assigned_users.forEach(user => {
                    alreadyAssigned = (user._id == assignee) ? true : alreadyAssigned
                })

                if (!alreadyAssigned) {
                    //assign
                    task.assigned_users.push(assignee)
                } else {
                    //dismiss
                    task.assigned_users = task.assigned_users.filter(e => e != assignee)
                }

                task.save((err) => {
                    if (err) return res.status(500).json({ message: err.message })
                    res.json(task);
                })
            });
    })
})

//Delete Task
router.delete('/:_id', readToken, (req, res) => {
    jwt.verify(req.token, config.secretKey, (err, authData) => {
        if (err) {
            return res.status(401).json({
                message: err.message
            })
        }
        Task.findById(req.params._id)
            .populate('parent_project', 'name members')
            .exec((err, task) => {
                if (err) {
                    return res.status(500).json({ message: err.message })
                };
                if (!task) {
                    return res.status(404).send("Task not found")
                }
                //Check if user is a member of this project
                let isMember = false;
                task.parent_project.members.forEach(member => {
                    isMember = (member.user._id == authData.id) ? true : isMember
                })

                if (!isMember) {
                    return res.status(403).send("User is not a member of this project")
                }

                task.deleteOne((err) => {
                    if (err) return res.status(400).send(err.message);
                    res.send("Task Deleted");
                })
            });
    })
})

module.exports = router