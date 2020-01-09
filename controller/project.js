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
            if (err) return res.status(500).json({ message: err.message })
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
                if (err) return res.status(400).send(err.message);

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
                if (!isMember) {
                    return res.status(403).send("User is not a member of this project")
                }
                //Check if admin
                let isAdmin = false;
                project.members.forEach(member => {
                    isAdmin = (member.user._id == authData.id && member.role == 'admin') ? true : isAdmin
                })
                project.isAdmin = isAdmin

                // Another query because sort in populate does not work: https://github.com/Automattic/mongoose/issues/2202
                Task.find({"parent_project": project._id})
                .sort({due_date: 1})
                .populate("added_by")
                .exec((err, tasks) => {
                    if (err) {
                        return res.status(500).json({ message: err.message })
                    };
                    project.tasks = tasks
                    
                    res.json(project);
                })
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

                if (!isAdmin) {
                    return res.status(403).send("User cannot perform this action")
                }
                project.latestActivity = Date.now()
                project.name = name
                project.save((err) => {
                    if (err) return res.status(400).send(err.message);
                    res.json(project);
                })

            });
    })
})

//Delete project
router.delete('/:_id', readToken, (req, res) => {
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
                //Check if user is a member AND ADMIN of this project
                let isAdmin = false;
                project.members.forEach(member => {
                    isAdmin = (member.user._id == authData.id && member.role == 'admin') ? true : isAdmin
                })

                if (!isAdmin) {
                    return res.status(403).send("User cannot perform this action")
                }

                project.deleteOne((err) => {
                    if (err) return res.status(400).send(err.message);
                    res.send("Project Deleted");
                })

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

                if (!isMember) {
                    res.status(403).send("User is not a member of this project")
                } else {
                    let task = new Task({ name, description, due_date, added_by: authData.id, parent_project: project._id })
                    task.save((err) => {
                        if (err) return res.status(400).send(err.message);
                        project.tasks.push(task._id)
                        project.latestActivity = Date.now()
                        project.save((err) => {
                            if (err) return res.status(400).send(err.message);
                            res.status(201).json(task);
                        })
                    })
                }
            });
    })
})

//Add member to project
router.post('/:_id/members', readToken, (req, res) => {
    const { newUser } = req.body;
    jwt.verify(req.token, config.secretKey, (err, authData) => {
        if (err) {
            return res.status(401).json({
                message: err.message
            })
        }
        if (!newUser) {
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
                //Check if LOGGED user is a member AND ADMIN of this project
                let isAdmin = false;
                project.members.forEach(member => {
                    isAdmin = (member.user._id == authData.id && member.role == 'admin') ? true : isAdmin
                })

                if (!isAdmin) {
                    return res.status(403).send("User cannot perform this action")
                }

                User.findById(newUser)
                    .exec((err, user) => {
                        if (err) {
                            return res.status(500).json({ message: err.message })
                        };
                        if (!user) {
                            return res.status(404).send("User not found")
                        }
                        //Check if NEW user isn't already a member
                        let isMember = false
                        project.members.forEach(member => {
                            isMember = (member.user._id == newUser) ? true : isMember
                        })
                        if (isMember) {
                            return res.status(400).send("User is already a member of this project")
                        }
                        project.members.push({ user: newUser, role: "member" })
                        project.latestActivity = Date.now()
                        project.save((err) => {
                            if (err) return res.status(500).json({ message: err.message })
                            res.status(201).json(project);
                        })
                    })
            });
    })
})

//Get member
router.get('/:_id/members/:_memberID', readToken, (req, res) => {
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

                //Check if LOGGED user is a member of this project
                let isMember = false;
                project.members.forEach(member => {
                    isMember = (member.user._id == authData.id) ? true : isMember
                })

                if (!isMember) {
                    return res.status(403).send("User is not a member of this project")
                }

                res.json(project.members.id(req.params._memberID));
            });
    })
})

//Edit project member
router.put('/:_id/members/:_memberID', readToken, (req, res) => {
    const { role } = req.body;
    jwt.verify(req.token, config.secretKey, (err, authData) => {
        if (err) {
            return res.status(401).json({
                message: err.message
            })
        }
        if (!role) {
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

                //Check if LOGGED user is a member AND ADMIN of this project
                let isAdmin = false;
                project.members.forEach(member => {
                    isAdmin = (member.user._id == authData.id && member.role == 'admin') ? true : isAdmin
                })

                if (!isAdmin) {
                    return res.status(403).send("User cannot perform this action")
                }

                project.members.id(req.params._memberID).role = role;
                project.save((err) => {
                    if (err) return res.status(400).send(err.message);
                    res.json(project);
                })
            });
    })
})

//Remove member from project
router.delete('/:_id/members/:_memberID', readToken, (req, res) => {

    jwt.verify(req.token, config.secretKey, (err, authData) => {
        if (err) {
            return res.status(401).json({
                message: err.message
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

                //Check if LOGGED user is a member AND ADMIN of this project
                let isAdmin = false;
                project.members.forEach(member => {
                    isAdmin = (member.user._id == authData.id && member.role == 'admin') ? true : isAdmin
                })

                if (!isAdmin) {
                    return res.status(403).send("User cannot perform this action")
                }

                project.members = project.members.filter(e => e._id != req.params._memberID)
                project.latestActivity = Date.now()
                project.save((err) => {
                    if (err) return res.status(400).send(err.message);
                    res.json(project);
                })
            });
    })
})

module.exports = router