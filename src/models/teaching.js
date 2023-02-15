const mongoose = require('mongoose')

const teachingSchema = new mongoose.Schema({
    
    semester: {
        type: Number       
    },
    year:{
        type: Number        
    },
    duration:{
        type: Number
    },
    flag:{
        type:Boolean,
        default: false
    },   
    courseName:{
        type: String
    },
    
    teacher: [{
        type: mongoose.Schema.Types.ObjectId,
        required: false
    }],
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        required: false
    }]


})

const Teaching = mongoose.model('Teaching', teachingSchema)



module.exports = Teaching