const mongoose = require('mongoose')
const validator = require('validator')

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,

    },
    gradeMaintainTime: {
        type: Number,
        required: true,
        default: 1      // default time in years for maintaining grade of course 

    },
    remainingTime: {
        type: Number,
        required: false,


    },
    theory: {
        id: [Number],
        names: [String],
        weight: [Number]
    },
    lab: {
        id: [Number],
        names: [String],
        weight: [Number]
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        required: false
    }]


})

const Course = mongoose.model('Course', courseSchema)

// fix grade for lab and main course


module.exports = Course