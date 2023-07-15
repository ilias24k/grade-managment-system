const mongoose = require('mongoose')
const validator = require('validator')

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,

    },
    description:{
        type: String
    },
    lowTheoryBound:{
        type: Number,
        default: 5
    },
    lowLabBound: {
        type: Number,
        default: 5
    },
    theoryWeight: {
        type: Number
    },
    labWeight: {
        type: Number
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
    theoryBounds:{
        id: [Number],
        bound: [Number]
    },
    labBounds:{
        id: [Number],
        bound: [Number]
    },
    teachings: [{
        type: mongoose.Schema.Types.ObjectId,
        required: false
    }],

    students: [{
        type: mongoose.Schema.Types.ObjectId,
        required: false
    }],
    user: {
        type: String
    },

})

const Course = mongoose.model('Course', courseSchema)

// fix grade for lab and main course


module.exports = Course