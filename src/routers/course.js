const express = require('express')
const res = require('express/lib/response')
const router = new express.Router()
const Course = require('../models/course')
const multer = require('multer')
const fs = require('fs')
const auth = require('../middleware/auth')


const path = require("path");
const Student = require('../models/student')
const { redirect } = require('express/lib/response')
const { param } = require('./home')




router.post('/courses', async (req, res) => {
    const course = new Course(req.body)

    try {
        await course.save()
        res.status(201).send(course)
    } catch (e) {
        res.status(400).send(e)
    }
})
router.get('/upload_course', async (req, res) => {

    try {
        const courses = await Course.find({})
        // res.send(courses)
        res.render('course', { courses })
    } catch (e) {
        res.status(500).send()
    }

})

const upload = multer({
    dest: 'files'
})

// uploading courses 

router.post('/upload_course', upload.single("files"), uploadFiles);
async function uploadFiles(req, res) {

    var data = fs.readFileSync(req.file.path)
    const newDataJSON = data.toString()
    const newData = JSON.parse(newDataJSON)

    var course
    var count = 1

    for (var i = 0; i < newData.length; i++) {
        course = new Course(newData[i])
        Object.keys(newData[i].theory)
            .forEach(function eachKey(key) {
                course.theory.id.push(count)
                course.theory.names.push(key)

                course.theory.weight.push(newData[i].theory[key])
                course.theoryBounds.bound.push(5)
                course.theoryBounds.id.push(count)
                count += 1
            });
        // console.log(course.theory.bound)
        count = 1;

        if (newData[i].lab) {
            Object.keys(newData[i].lab)
                .forEach(function eachKey(key) {
                    course.lab.id.push(count)
                    course.lab.names.push(key)

                    course.lab.weight.push(newData[i].lab[key])
                    course.labBounds.bound.push(5)
                    course.labBounds.id.push(count)
                    count += 1
                });
            count = 1;
        }
        course.save()
    }

    try {
        // await course.save()
        res.status(201)
        res.redirect('/course')
    } catch (e) {
        res.status(400).send(e)
    }
    res.send()
}

//getting all courses

router.get('/course', auth, async (req, res) => {
    // console.log(req.cookie)
    try {
        const courses = await Course.find({})
        // res.send(courses)
        var courseList = courses

        res.render('course', { courseList: courseList })
    } catch (e) {
        res.status(500).send()
    }
})


//getting specific course students

router.get('/course/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        var students = [];

        const course = await Course.findById(_id)
        students = course.students

        const records = await Student.find({ '_id': { $in: students } });

        if (!course) {
            return res.status(404).send()
        }
        res.render('courseStudents', { records: records })
    } catch (e) {
        res.status(500).send()
    }

})

//getting  course lab and theory parts

router.get('/course/edit/:id', auth, async (req, res) => {

    const _id = req.params.id

    try {
        const course = await Course.findById(_id)

        theoryIDs = course.theory.id

        theory = course.theory.names
        theoryWeights = course.theory.weight
        var theoryBounds = course.theoryBounds.bound

        labIDs = course.lab.id
        generalTheoryWeight = course.theoryWeight
        generalLabWeight = course.labWeight
        lowTheoryBound = course.lowTheoryBound
        lowLabBound = course.lowLabBound
        labBounds = course.labBounds.bound
        // console.log(generalTheoryWeight)
        lab = course.lab.names
        labWeights = course.lab.weight
        arr = [];
        arr2 = [];
        theory.forEach(function (v, i) {
            var obj = {};
            obj.id = theoryIDs[i]
            obj.name = v;
            obj.weight = theoryWeights[i];
            obj.bound = theoryBounds[i]
            arr.push(obj);
        })

        lab.forEach(function (x, y) {
            var obj = {};
            obj.id = labIDs[y]
            obj.name = x;
            obj.weight = labWeights[y];
            obj.bound = labBounds[y]
            arr2.push(obj);
        })

        if (!course) {
            return res.status(404).send()
        }
        res.render('editCourse', {
            arr: arr, arr2: arr2, generalTheoryWeight: generalTheoryWeight, generalLabWeight: generalLabWeight,
            lowTheoryBound: lowTheoryBound, lowLabBound: lowLabBound
        })
    } catch (e) {
        res.status(500).send()
    }

})

//editing course weights
router.patch('/course/edit/:id', auth, async (req, res) => {

    try {

        theoryNames = DBnames(req.body.theory)
        theoryWeights = DBweights(req.body.theory)
        theoryIds = DbIds(req.body.theory)

        labNames = DBnames(req.body.lab)
        labWeights = DBweights(req.body.lab)
        labIds = DbIds(req.body.lab)
        // console.log(theoryNames, theoryWeights, theoryIds)
        editGeneralLabBound = req.body.editGeneralLabBound
        editGeneralLabWeight = req.body.editGeneralLabWeight
        editGeneralTheoryBound = req.body.editGeneralTheoryBound
        editGeneralTheoryWeight = req.body.editGeneralTheoryWeight

        // console.log(req.body.boundTh)

        var boundIdsTh = []
        var boundIdsLab = []
        boundIdsTh = boundsIds(req.body.boundTh)
        boundIdsLab = boundsIds(req.body.boundLab)

        var theoryBounds = []
        var labBounds = []

        theoryBounds = bounds(req.body.boundTh)
        labBounds = bounds(req.body.boundLab)

        params = {
            theory: {
                id: theoryIds,
                names: theoryNames,
                weight: theoryWeights
            },
            lab: {
                id: labIds,
                names: labNames,
                weight: labWeights
            },
            theoryBounds: {
                id: boundIdsTh,
                bound: theoryBounds
            },
            labBounds: {
                id: boundIdsLab,
                bound: labBounds
            },
            lowTheoryBound: editGeneralTheoryBound,
            lowLabBound: editGeneralLabBound,
            theoryWeight: editGeneralTheoryWeight,
            labWeight: editGeneralLabWeight
        }

        let updateObj = {};
        for (let [key, value] of Object.entries(params)) {
            if (value !== undefined) {
                updateObj[key] = value;
            }
        }

        // console.log(updateObj)

        if (updateObj.theory.names.length == 0 && updateObj.theory.weight.length == 0) {
            delete updateObj.theory
        }
        if (updateObj.lab.names.length == 0 && updateObj.lab.weight.length == 0) {
            delete updateObj.lab
        }

        var course = await Course.findById({ _id: req.params.id })

        course = course.toObject()
        let obj = Object.assign(course);
        // console.log(course)
        updateObj.theoryBounds.bound = params.theoryBounds.bound
        updateObj.labBounds.bound = params.labBounds.bound

        if (!updateObj.lowLabBound) {
            updateObj.lowLabBound = course.lowLabBound
        } else {
            updateObj.lowLabBound = editGeneralLabBound
        }
        if (!updateObj.lowTheoryBound) {
            updateObj.lowTheoryBound = course.lowTheoryBound
        } else {
            updateObj.lowTheoryBound = editGeneralTheoryBound

        }

        if (!updateObj.theoryWeight) {
            updateObj.theoryWeight = course.theoryWeight
        }

        if (!updateObj.labWeight) {
            updateObj.labWeight = course.labWeight
        } else if (updateObj.labWeight == 0) {
            updateObj.labWeight = 0
        }


        if (updateObj.theory) {
            for (var i = 0; i < updateObj.theory.id.length; i++) {
                obj.theory.id.push(updateObj.theory.id[i])
                obj.theory.names.push(updateObj.theory.names[i])
                obj.theory.weight.push(updateObj.theory.weight[i])
                obj.theoryBounds.bound.push(5)
                obj.theoryBounds.id.push(updateObj.theory.id[i])
            }
        }
        // console.log(updateObj.theory)
        if (updateObj.lab) {
            for (var i = 0; i < updateObj.lab.id.length; i++) {
                obj.lab.id.push(updateObj.lab.id[i])
                obj.lab.names.push(updateObj.lab.names[i])
                obj.lab.weight.push(updateObj.lab.weight[i])
                obj.labBounds.bound.push(5)
                obj.labBounds.id.push(updateObj.lab.id[i])
            }
        }
        // console.log(obj)
        // console.log(updateObj)

        for (var i = 0; i < obj.theoryBounds.id.length; i++) {
            for (var j = 0; j < updateObj.theoryBounds.id.length; j++) {
                if (obj.theoryBounds.id[i] == updateObj.theoryBounds.id[j]) {
                    // obj.theoryBounds.bound.splice(j,i,updateObj.theoryBounds.bound[j]) 
                    obj.theoryBounds.bound.splice(obj.theoryBounds.id[i] - 1, 1, updateObj.theoryBounds.bound[j])
                }
            }
        }

        for (var i = 0; i < obj.labBounds.id.length; i++) {
            for (var j = 0; j < updateObj.labBounds.id.length; j++) {
                if (obj.labBounds.id[i] == updateObj.labBounds.id[j]) {

                    obj.labBounds.bound.splice(obj.labBounds.id[i] - 1, 1, updateObj.labBounds.bound[j])
                }
            }
        }

        obj.lowLabBound = updateObj.lowLabBound
        obj.lowTheoryBound = updateObj.lowTheoryBound
        obj.theoryWeight = updateObj.theoryWeight
        obj.labWeight = updateObj.labWeight

        // console.log(obj)
        var course2 = await Course.findOneAndUpdate({ _id: req.params.id }, obj, function (err, model) {
            if (model) {

                return res.status(200).send({ result: 'redirect', url: '/course/edit/' + req.params.id })
            }
        });

        if (!course) {
            return res.status(404).send()


        }

        // res.redirect('/course/edit/' + req.params.id)
    } catch (e) {
        res.status(400).send(e)
    }

})
// deleting course theory

router.patch('/course/edit/delete/:id', auth, async (req, res) => {

    try {
        // console.log(req.body.theory, req.body.lab)
        const data = JSON.stringify(req.params.id)
        const name = data.substring(1, data.indexOf('$'))
        const weight = data.split('$').pop().split('!').pop().split('&')[0];

        const DbId = data.split('$').pop().split('!')[0];
        var DbIdNumb = parseInt(DbId - 1)
        const currCourseId = data.slice(data.lastIndexOf('&') + 1)
        const CourseId = currCourseId.slice(0, -1)

        var course = await Course.findById({ _id: CourseId })
        var updateObj = course

        var theoryBoundsIds = course.theoryBounds.id
        var theoryBounds = course.theoryBounds.bound

        theoryBounds.splice(DbIdNumb, 1)
        theoryBoundsIds.splice(DbIdNumb, 1)

        theoryBounds = theoryBounds
        theoryBoundsIds = theoryBoundsIds

        updateObj.theory.id.splice(DbIdNumb, 1)
        updateObj.theory.id = updateObj.theory.id
        updateObj.theory.names.splice(DbIdNumb, 1)
        updateObj.theory.names = updateObj.theory.names
        updateObj.theory.weight.splice(DbIdNumb, 1)
        updateObj.theory.weight = updateObj.theory.weight


        updateObj.theoryBounds.id = theoryBoundsIds
        updateObj.theoryBounds.bound = theoryBounds

        for (var i = 0; i < updateObj.theory.id.length; i++) {
            if (updateObj.theory.id[i] > i + 1 && updateObj.theoryBounds.id[i] > i + 1) {
                updateObj.theory.id[i] = i + 1
                updateObj.theoryBounds.id[i] = i + 1
            }
        }
        //  console.log(updateObj)
        var course2 = await Course.findOneAndUpdate({ _id: CourseId }, updateObj, function (err, model) {
            if (model) {

                return res.status(200).send({ result: 'redirect', url: '/course/edit/' + req.params.id })
            }
        });
        if (!course) {
            return res.status(404).send()

        }

    } catch (e) {
        res.status(500).send()
    }
})

// deleting course lab

router.patch('/course/edit/deleteLab/:id', auth, async (req, res) => {

    try {

        const data = JSON.stringify(req.params.id)
        const name = data.substring(1, data.indexOf('$'))
        const weight = data.split('$').pop().split('!').pop().split('&')[0];

        const DbId = data.split('$').pop().split('!')[0];
        var DbIdNumb = parseInt(DbId - 1)

        const currCourseId = data.slice(data.lastIndexOf('&') + 1)
        const CourseId = currCourseId.slice(0, -1)

        var course = await Course.findById({ _id: CourseId })
        var updateObj = course
        var labBoundsIds = course.labBounds.id
        var labBounds = course.labBounds.bound

        labBounds.splice(DbIdNumb, 1)
        labBoundsIds.splice(DbIdNumb, 1)

        labBounds = labBounds
        labBoundsIds = labBoundsIds

        updateObj.lab.id.splice(DbIdNumb, 1)
        updateObj.lab.id = updateObj.lab.id
        updateObj.lab.names.splice(DbIdNumb, 1)
        updateObj.lab.names = updateObj.lab.names
        updateObj.lab.weight.splice(DbIdNumb, 1)
        updateObj.lab.weight = updateObj.lab.weight

        // console.log(updateObj.lab.weight, updateObj.lab.names, updateObj.lab.id)
        updateObj.labBounds.id = labBoundsIds
        updateObj.labBounds.bound = labBounds

        for (var i = 0; i < updateObj.lab.id.length; i++) {
            if (updateObj.lab.id[i] > i + 1 && updateObj.labBounds.id[i] > i + 1) {
                updateObj.lab.id[i] = i + 1
                updateObj.labBounds.id[i] = i + 1
            }
        }

        // console.log(updateObj)
        var course2 = await Course.findOneAndUpdate({ _id: CourseId }, updateObj, function (err, model) {
            if (model) {

                return res.status(200).send({ result: 'redirect', url: '/course/edit/' + req.params.id })
            }
        });
        if (!course) {
            return res.status(404).send()

        }

    } catch (e) {
        res.status(500).send()
    }
})

//changed from delete to post due to html only handling post and get
//deleting course

router.post('/course/delete/:id', auth, async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id)

        if (!course) {
            return res.status(404).send()
        }
        res.redirect('/course');
    } catch (e) {
        res.status(500).send()
    }
})

// functions to get grades  ids and names 

function DBnames(arr1) {
    // console.log('fun names')
    var names = []
    if (arr1 == undefined) {
        names = []
    } else {
        for (var i = 1; i < arr1.length; i += 3) {
            names.push(arr1[i])
        }
    }



    return names
}
function DBweights(arr1) {
    // console.log('fun weights')
    var weights = []
    if (arr1 == undefined) {
        weights = []
    } else {
        for (var i = 2; i < arr1.length; i += 3) {
            weights.push(arr1[i])
        }
    }

    return weights
}

function DbIds(arr1) {
    // console.log('fun ids')
    var ids = []
    if (arr1 == undefined) {
        ids = []
    } else {
        for (var i = 0; i < arr1.length; i += 3) {
            ids.push(arr1[i])
        }

    }

    return ids
}


function boundsIds(arr) {
    var ids = []
    var ids2 = []
    if (arr == undefined) {
        ids2 = []
    } else {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].emp_id && arr[i].input_val) {
                ids.push(arr[i].emp_id[0])
            }
        }
        ids.forEach(str => {
            ids2.push(Number(str));
        });
    }


    return ids2
}


function bounds(arr) {
    var bounds = []
    var bounds2 = []
    if (arr && arr[arr.length - 1].emp_id) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].input_val) {
                // console.log(req.body.boundTh[i].input_val)
                bounds.push(arr[i].input_val)
            }
        }
    } else if (arr) {

        for (var i = 0; i < arr.length; i++) {
            if (arr[i].input_val) {
                bounds.push(arr[i].input_val)
            }
        }

    } else if (!arr) {
        bounds2 = []
    }
    bounds.forEach(str => {
        bounds2.push(Number(str));
    });
    return bounds2


}


module.exports = router