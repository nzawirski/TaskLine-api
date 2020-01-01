const mongoose = require('mongoose');

// User Schema
const userSchema = mongoose.Schema({
	username:{
		type: String,
		required: true
    },
	email:{
		type: String,
		required: true
	},
	create_date:{
		type: Date,
		default: Date.now
	},
	profilePic:{
		type: String
	}
});

module.exports = mongoose.model("User", userSchema);
