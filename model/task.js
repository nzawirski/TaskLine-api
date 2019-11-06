const mongoose = require('mongoose');

const statuses = ['Pending', 'In progress', 'Completed', 'Canceled']

const taskSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
  },
  due_date: {
    type: Date,
  },
  added_by: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User'
  },
  assigned_users: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'User'
  }],
  parent_project: {
    type: mongoose.Schema.Types.ObjectId, ref: 'Project'
  },
  status: {
    type: String,
    enum: statuses,
    default: 'Pending'
  },
  create_date: {
    type: Date,
    default: Date.now
  }
});

taskSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  var task = this;
  // remove ref and recount comments amount
  await mongoose.model('Project').findById(task.parent_project).exec((err, project) => {
      if (err) console.error(err)

      project.tasks = project.tasks.filter(e => e != String(task._id));

      project.save((err) => {
          if (err) console.error(err);
      })
  })

  next()
});

module.exports = mongoose.model("Task", taskSchema);
