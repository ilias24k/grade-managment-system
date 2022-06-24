const mongoose = require('mongoose')




const gradeSchema = new mongoose.Schema({
    name: [{
        type: Number,
        required: false
    }],
    lab: [{
        type: Number,
        required: false
    }],
    
})


const Grade = mongoose.model('Grade', gradeSchema)

module.exports = Grade

