const express = require('express')
const res = require('express/lib/response')
const router = new express.Router()
const Course = require('../models/course')
const multer = require('multer')
const fs = require('fs')


const path = require("path");
const Student = require('../models/student')
const { redirect } = require('express/lib/response')





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
    Course.insertMany(newData, function (error, docs) {

    })

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

router.get('/course', async (req, res) => {

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

router.get('/course/:id', async (req, res) => {
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

router.get('/course/edit/:id', async (req, res) => {

    const _id = req.params.id

    try {
        const course = await Course.findById(_id)

        theoryIDs = course.theory.id

        theory = course.theory.names
        theoryWeights = course.theory.weight

        labIDs = course.lab.id
        // console.log( labIDs,theoryIDs)
        lab = course.lab.names
        labWeights = course.lab.weight
        arr = [];
        arr2 = [];
        theory.forEach(function (v, i) {
            var obj = {};
            obj.id = theoryIDs[i]
            obj.name = v;
            obj.weight = theoryWeights[i];
            arr.push(obj);
        })

        lab.forEach(function (x, y) {
            var obj = {};
            obj.id = labIDs[y]
            obj.name = x;
            obj.weight = labWeights[y];
            arr2.push(obj);
        })


        if (!course) {
            return res.status(404).send()
        }
        res.render('editCourse', { arr: arr, arr2: arr2 })
    } catch (e) {
        res.status(500).send()
    }

})

//editing course weights
router.patch('/course/edit/:id', async (req, res) => {

    try {

        // console.log(req.body.theory.length, req.body.lab)

        const course = {}
        if (req.body.theory && req.body.lab) {

            theoryNames = DBnames(req.body.theory)
            theoryWeights = DBweights(req.body.theory)
            theoryIds = DbIds(req.body.theory)
            labNames = DBnames(req.body.lab)
            labWeights = DBweights(req.body.lab)
            labIds = DbIds(req.body.lab)
            // console.log(theoryIds, theoryNames,theoryWeights,labIds,labNames,labWeights)
            course = Course.findByIdAndUpdate(
                req.params.id,
                { $push: { "theory.id": theoryIds, "theory.names": theoryNames, "theory.weight": theoryWeights, "lab.id": labIds, "lab.names": labNames, "lab.weight": labWeights } },
                { safe: true, upsert: true },
                function (err, model) {
                    if (model) {

                        return res.status(200).send({ result: 'redirect', url: '/course/edit/' + req.params.id })
                    }
                }
            );
        } else if (!(req.body.lab)) {
            theoryNames = DBnames(req.body.theory)
            theoryWeights = DBweights(req.body.theory)
            theoryIds = DbIds(req.body.theory)
            // console.log(req.body.theory, theoryIds, theoryNames,theoryWeights)
            course = Course.findByIdAndUpdate(
                req.params.id,
                { $push: { "theory.id": theoryIds, "theory.names": theoryNames, "theory.weight": theoryWeights } },
                { safe: true, upsert: true },
                function (err, model) {
                    if (model) {

                        return res.status(200).send({ result: 'redirect', url: '/course/edit/' + req.params.id })
                    }
                }
            );
        } else if (!(req.body.theory)) {
            labNames = DBnames(req.body.lab)
            labWeights = DBweights(req.body.lab)
            labIds = DbIds(req.body.lab)
            // console.log(req.body.theory, theoryIds, theoryNames,theoryWeights)
            course = Course.findByIdAndUpdate(
                req.params.id,
                { $push: { "lab.id": labIds, "lab.names": labNames, "lab.weight": labWeights } },
                { safe: true, upsert: true },
                function (err, model) {
                    if (model) {

                        return res.status(200).send({ result: 'redirect', url: '/course/edit/' + req.params.id })
                    }
                }
            );
        }

        if (!course) {
            // return res.status(404).send()

            console.log(course)
        }

        res.redirect('/course/edit/' + req.params.id)
    } catch (e) {
        // res.status(400).send(e)

    }

})
// deleting course theory

router.patch('/course/edit/delete/:id', async (req, res) => {

    try {
        // console.log(req.body.theory, req.body.lab)
        const data = JSON.stringify(req.params.id)
        const name = data.substring(1, data.indexOf('$'))
        const weight = data.split('$').pop().split('!').pop().split('&')[0];

        const DbId = data.split('$').pop().split('!')[0];

        const currCourseId = data.slice(data.lastIndexOf('&') + 1)
        const CourseId = currCourseId.slice(0, -1)
        //  const course = await Course.findByIdAndDelete(req.params.id)
        const course = Course.findByIdAndUpdate(
            CourseId,
            { $pull: { "theory.id": DbId, "theory.names": name, "theory.weight": weight } },
            { safe: true, upsert: true },
            function (err, model) {
                if (model) {

                    return res.status(200).send({ result: 'redirect', url: '/course/edit/' + CourseId })
                }
            }
        );
        if (!course) {
            return res.status(404).send()

        }

    } catch (e) {
        res.status(500).send()
    }
})

// deleting course lab

router.patch('/course/edit/deleteLab/:id', async (req, res) => {

    try {

        const data = JSON.stringify(req.params.id)
        const name = data.substring(1, data.indexOf('$'))
        const weight = data.split('$').pop().split('!').pop().split('&')[0];

        const DbId = data.split('$').pop().split('!')[0];



        const currCourseId = data.slice(data.lastIndexOf('&') + 1)
        const CourseId = currCourseId.slice(0, -1)
        // console.log(DbId, name, weight)
        //  const course = await Course.findByIdAndDelete(req.params.id)
        const course = Course.findByIdAndUpdate(
            CourseId,
            { $pull: { "lab.id": DbId, "lab.names": name, "lab.weight": weight } },
            { safe: true, upsert: true },
            function (err, model) {
                if (model) {

                    return res.status(200).send({ result: 'redirect', url: '/course/edit/' + CourseId })
                }
            }
        );
        if (!course) {
            return res.status(404).send()

        }

    } catch (e) {
        res.status(500).send()
    }
})

//changed from delete to post due to html only handling post and get
//deleting course

router.post('/course/delete/:id', async (req, res) => {
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
    names = []
    for (var i = 1; i < arr1.length; i += 3) {
        names.push(arr1[i])
    }
    return names
}
function DBweights(arr1) {
    // console.log('fun weights')
    weights = []
    for (var i = 2; i < arr1.length; i += 3) {
        weights.push(arr1[i])
    }
    return weights
}

function DbIds(arr1) {
    // console.log('fun ids')
    ids = []
    for (var i = 0; i < arr1.length; i += 3) {
        ids.push(arr1[i])
    }
    return ids
}

module.exports = router