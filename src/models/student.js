const mongoose = require('mongoose')




const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
        trim: true
    },
    AM: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: false
    },
    frozen: {
        theory: [Number],
        lab: [Number]
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
    history: [{
        type: mongoose.Mixed
    }],
    finalGradeLab: {
        type: Number,
        required: false
    },
    totalGrade: {
        type: Number,
        required: false
    },

}, { timestamps: true })


const Student = mongoose.model('Student', studentSchema)

module.exports = Student

