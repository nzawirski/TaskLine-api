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
    },
    latestActivity:{
		type: Date,
		default: Date.now
    },
    isAdmin:{ //never save anything on that field
        type: Boolean
    }
});

projectSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    var project = this;
    //remove comment docs recursively
    await project.tasks.forEach(task => {
        mongoose.model('Task').deleteOne({ _id: task }, (err) => {
            if (err) console.error(err)
        });
    })
    next()
});

module.exports = mongoose.model("Project", projectSchema);
