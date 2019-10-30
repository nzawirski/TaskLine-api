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

module.exports = mongoose.model("Task", taskSchema);
