const mongoose = require('mongoose');

const memberRoles = ['member', 'admin']

const projectSchema = mongoose.Schema({
	name:{
		type: String,
		required: true
    },
	tasks:[{
		type: mongoose.Schema.Types.ObjectId, ref: 'Task'
    }],
    members:[{
        user:{
            type: mongoose.Schema.Types.ObjectId, ref: 'User'
        },
        role:{
            type: String, enum: memberRoles, default: 'admin'
        }
    }],
	create_date:{
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model("Project", projectSchema);
