const express = require('express')
const res = require('express/lib/response')
const router = new express.Router()
const Course = require('../models/course')
const multer = require('multer')
const fs = require('fs')
const auth = require('../middleware/auth')
const Teaching = require('../models/teaching')
const path = require("path");
const Student = require('../models/student')
const { redirect } = require('express/lib/response')
const { param, route } = require('./home')
const User = require('../models/user')

//upload teaching

router.post('/teachings', upload.single("files"), uploadFiles);

router.post('/upload_teaching', auth, upload.single("files"), uploadFiles);
async function uploadFiles(req, res) {

    var data = fs.readFileSync(req.file.path)
    const newDataJSON = data.toString()
    const newData = JSON.parse(newDataJSON)
    var teaching
    var count = 1

    for (var i = 0; i < newData.length; i++) {
        teaching = new Teaching(newData[i])
        teaching.teacher.push(req.user.id)
        count = 1;
        await teaching.save()

        const course = await Course.findOne({ _id: req.body.currentCourse })
        course.teachings.push(teaching._id)
        await course.save()

    }
    try {
        // await course.save()
        res.status(201)
        res.redirect('/course/teaching/' + req.body.currentCourse)
    } catch (e) {
        res.status(400).send(e)
    }
    res.send()
}


router.get('/course/teaching/:id', auth, async (req, res) => {

    try {
        var user = req.user
        var course = await Course.findById(req.params.id)
        var teachingList = []
        var usersList = []
        var users = await User.find({})
        for (var i = 0; i < users.length; i++) {

            usersList.push(users[i])
        }
        var teachings = course.teachings
        teachingList = await Teaching.find({ '_id': { $in: teachings } });

        for (var i = 0; i < teachingList.length; i++) {
            for (var j = 0; j < usersList.length; j++) {
                if (teachingList[i].teacher.length > 0 && teachingList[i].teacher[0].toString() === usersList[j].id.toString()) {
                    teachingList[i].teacher[0] = usersList[j].name;
                }
            }
        }
        res.render('teaching', { teachingList: teachingList, usersList: usersList, user: JSON.stringify(user.id), role: user.role })
        // res.send(students)
    } catch (e) {
        res.status(500).send()
    }

})
router.patch('/course/teaching/upd/:id', auth, async (req, res) => {
    var index = req.body.index[0].index
    var semester = req.body.rows[index].semester
    var year = req.body.rows[index].year
    var teacher = req.body.teacher
    var duration = req.body.duration
    var user = await User.findOne({ "name": teacher })

    try {
        const course = await Course.findById(req.params.id)
        courseTeachings = course.teachings

        var teaching = await Teaching.findOne({
            $and: [{ year: { $eq: year } }, { semester: { $eq: semester } }]
        })
        if (duration == '1 year') {
            duration = 1
            teaching = await Teaching.findOneAndUpdate({
                $and: [{ year: { $eq: year } }, { semester: { $eq: semester } }]
            }, { $set: { "duration": duration } },
                { safe: true, upsert: true },
                function (err, model) {
                    // console.log();
                })
        } else if (duration == '2 years') {
            duration = 2
            teaching = await Teaching.findOneAndUpdate({
                $and: [{ year: { $eq: year } }, { semester: { $eq: semester } }]
            }, { $set: { "duration": duration } },
                { safe: true, upsert: true },
                function (err, model) {
                    // console.log();
                })
        } else if (duration == '3 years') {
            duration = 3
            teaching = await Teaching.findOneAndUpdate({
                $and: [{ year: { $eq: year } }, { semester: { $eq: semester } }]
            }, { $set: { "duration": duration } },
                { safe: true, upsert: true },
                function (err, model) {
                    console.log(model);
                })

        } else if (duration == 'no time limit') {
            duration = 100
            teaching = await Teaching.findOneAndUpdate({
                $and: [{ year: { $eq: year } }, { semester: { $eq: semester } }]
            }, { $set: { "duration": duration } },
                { safe: true, upsert: true },
                function (err, model) {
                    // console.log();
                })
            return
        }
        if (teacher == 'remove current teacher') {
            teaching = await Teaching.findOneAndUpdate({
                $and: [{ year: { $eq: year } }, { semester: { $eq: semester } }]
            }, { $pull: { "teacher": teaching.teacher[0] } },
                { safe: true, upsert: true },
                function (err, model) {
                    // console.log();
                })
        } else if (typeof teacher == 'undefined') {
            // return
        } else {
            teaching = await Teaching.findOneAndUpdate({
                $and: [{ year: { $eq: year } }, { semester: { $eq: semester } }]
            }, { $push: { teacher: user._id } })

            teaching = await Teaching.findOneAndUpdate({
                $and: [{ year: { $eq: year } }, { semester: { $eq: semester } }]
            }, { $pull: { "teacher": teaching.teacher[0] } },
                { safe: true, upsert: true },
                function (err, model) {
                    // console.log();
                })
        }
        res.status(201).send({ result: 'redirect', url: '/course/teaching/' + req.params.id })

    } catch (e) {
        res.status(500).send()
    }
})

router.post('/course/teaching/:id', auth, async (req, res) => {

    try {
        var nums2 = []
        var insertedTeachingsSemester = []
        var insertedTeachingsYear = []
        var insertedTeachings = []
        var course = await Course.findById(req.params.id)

        if (typeof req.body.semester === 'string' && typeof req.body.year === 'string') {
            var y = Number(req.body.year)
            var s = req.body.semester
            insertedTeachingsYear.push(y)
            insertedTeachingsSemester.push(s)

        } else {
            insertedTeachingsSemester = req.body.semester
            insertedTeachingsYear = req.body.year
        }

        insertedTeachingsYear.forEach(str => {
            nums2.push(Number(str));
        });

        var teaching = {}
        for (var i = 0; i < nums2.length; i++) {
            teaching = {
                semester: insertedTeachingsSemester[i],
                year: nums2[i],
                teacher: [req.user.id],
                students: [],
                courseName: course.name,
                duration: course.gradeMaintainTime
            }
            insertedTeachings.push(teaching)
        }
        Teaching.insertMany(insertedTeachings, function (error, docs) {
            docs.forEach(function (docs) {
                Course.findByIdAndUpdate(
                    req.params.id,
                    { $push: { "teachings": docs } },
                    { safe: true, upsert: true },
                    function (err, model) {
                        // console.log(err);
                    }
                );
            })
        });
        res.status(201)
        res.redirect('/course/teaching/' + req.params.id)
    } catch (e) {
        res.status(500).send()
    }
})

//deleting teaching

router.patch('/course/teaching/teaching/delete/:id', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        const courseTeachings = course.teachings;
        const teaching = await Teaching.findOne({
            year: req.body.year,
            semester: req.body.semester
        });
        await Course.findByIdAndUpdate(
            req.params.id,
            { $pull: { teachings: teaching.id } },
            { safe: true, upsert: true }
        );
        const deletedTeaching = await Teaching.findByIdAndDelete(teaching.id);
        res.status(201).send({ result: 'redirect', url: '/course/teaching/' + req.params.id });
    } catch (e) {
        res.status(500).send();
    }
});

router.patch('/course/teaching/lock/:id', auth, async (req, res) => {

    try {
        var teaching = await Teaching.findByIdAndUpdate(req.params.id, { 'flag': req.body.choice })
        // console.log(teaching)
        res.status(201).send({ result: 'redirect', url: '/course/view/teaching/' + req.params.id })
    } catch (error) {
        res.status(500).send()
    }

})


//getting teachings students

router.get('/course/view/teaching/:id', auth, async (req, res) => {

    const _id = req.params.id
    var user = req.user

    try {
        var students = [];

        var teaching = await Teaching.findById(_id)

        students = teaching.students

        var records = await Student.find({ '_id': { $in: students } });
        var flag = {}
        if (teaching.flag == false) {

            flag = { flag: 0 }
        } else {
            flag = { flag: 1 }
        }
        flag.stringify = JSON.stringify(flag)
        if (!teaching) {
            return res.status(404).send()
        }
        res.render('courseStudents', { records: records, flag: flag, user: JSON.stringify(user) })

    } catch (e) {
        res.status(500).send()
    }

})


module.exports = router