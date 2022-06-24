const mongoose = require('mongoose')




const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
        trim: true
    },
    email: {
        type: String,
        required: false
    },
    theoryGrade: {
        name: [String],
        computedGrade: [Number]        
    },
    finalGradeTh: {
        type: Number,
        required: false
    },
    labGrade: {
        name: [String],
        computedGrade: [Number]       
    },
    finalGradeLab: {
        type: Number,
        required: false
    },
    
}, { timestamps: true })


const Student = mongoose.model('Student', studentSchema)

module.exports = Student

