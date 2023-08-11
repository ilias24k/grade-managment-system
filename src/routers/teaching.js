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




const upload = multer({
    storage: multer.diskStorage({}),
    fileFilter: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        if (ext !== '.json') {
            return cb(new Error('Only JSON files are allowed'))
        }
        cb(null, true)
    }
});

router.post('/teachings', upload.single("files"), uploadFiles);

// error handling middleware for file upload 
router.use(function (err, req, res, next) {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        res.status(400).send('Error uploading file: ' + err.message);
    } else {
        res.status(500).send(err.message);

    }
});

function uploadFiles(req, res) {
    // read the uploaded file
    const file = req.file;
    if (!file) return res.status(400).send('No file uploaded.');

    // parse the JSON data and save to database
    const courseData = JSON.parse(file.buffer);
    // save course to database...

    // redirect to course page
    res.redirect('/course');
}



router.post('/upload_teaching', auth, upload.single("files"), uploadFiles);

async function uploadFiles(req, res) {
    // console.log(req.params)
    // console.log(req.body)

    var data = fs.readFileSync(req.file.path)
    const newDataJSON = data.toString()
    const newData = JSON.parse(newDataJSON)
    var teaching
    var count = 1

    for (var i = 0; i < newData.length; i++) {
        var course = await Course.findById(req.body.currentCourse)

        teaching = new Teaching(newData[i])
        teaching.courseName = course.name;

        if (req.user.role !== "admin") {
            teaching.teacher.push(req.user.id)
        } else if (req.user.role == "admin") {
            teaching.teacher.splice(1, 0, req.user.id);
        }

        count = 1;
        await teaching.save()

        const updatedCourse = await Course.findOne({ _id: req.body.currentCourse })
        updatedCourse.teachings.push(teaching._id)
        await updatedCourse.save()

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

        //check if user role is admin so that he can see all the teachings
        // if the role is user then  he can only see his own teachings
        
        if (user.role == 'admin') {
            teachingList = await Teaching.find({ '_id': { $in: teachings } });
        } else if (user.role == 'user') {
            teachingList = await Teaching.find({
                '_id': { $in: teachings },
                'teacher': { $elemMatch: { $exists: true } }
            });
        }

        for (var i = 0; i < teachingList.length; i++) {
            for (var j = 0; j < usersList.length; j++) {
                if (teachingList[i].teacher.length > 0 && teachingList[i].teacher[0].toString() === usersList[j].id.toString()) {
                    teachingList[i].teacher[0] = usersList[j].name;
                }
            }
            // console.log(teachingList[i])
            teachingList[i].semester = course.semester;

        }
        // console.log(teachingList)
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
            $and: [{ year: { $eq: year } }]
        })
        if (duration == '1 year') {
            duration = 1
            teaching = await Teaching.findOneAndUpdate({
                $and: [{ year: { $eq: year } }]
            }, { $set: { "duration": duration } },
                { safe: true, upsert: true },
                function (err, model) {
                    // console.log();
                })
        } else if (duration == '2 years') {
            duration = 2
            teaching = await Teaching.findOneAndUpdate({
                $and: [{ year: { $eq: year } }]
            }, { $set: { "duration": duration } },
                { safe: true, upsert: true },
                function (err, model) {
                    // console.log();
                })
        } else if (duration == '3 years') {
            duration = 3
            teaching = await Teaching.findOneAndUpdate({
                $and: [{ year: { $eq: year } }]
            }, { $set: { "duration": duration } },
                { safe: true, upsert: true },
                function (err, model) {
                    // console.log(model);
                })

        } else if (duration == 'no time limit') {
            duration = 100
            teaching = await Teaching.findOneAndUpdate({
                $and: [{ year: { $eq: year } }]
            }, { $set: { "duration": duration } },
                { safe: true, upsert: true },
                function (err, model) {
                    // console.log();
                })
            
        }
        if (teacher == 'remove current teacher') {
            teaching = await Teaching.findOneAndUpdate({
                $and: [{ year: { $eq: year } }]
            }, { $pull: { "teacher": teaching.teacher[0] } },
                { safe: true, upsert: true },
                function (err, model) {
                    // console.log();
                })
        } else if (typeof teacher == 'undefined') {
            // return
        } else {
            teaching = await Teaching.findOneAndUpdate({
                $and: [{ year: { $eq: year } }]
            }, { $push: { teacher: user._id } })

            teaching = await Teaching.findOneAndUpdate({
                $and: [{ year: { $eq: year } }]
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
        const user = req.user;

        for (let i = 0; i < courseTeachings.length; i++) {
            const teaching = await Teaching.findById(courseTeachings[i]);

            if (teaching) {
                if (teaching.year.toString() === req.body.year.toString() && course.semester.toString() === req.body.semester.toString()) {
                    await Course.findByIdAndUpdate(
                        req.params.id,
                        { $pull: { teachings: teaching.id } },
                        { safe: true, upsert: true }
                    );
                    await Teaching.findByIdAndDelete(teaching.id);
                }
            }
        }

        res.status(201).send({ result: 'redirect', url: '/course/teaching/' + req.params.id });
    } catch (e) {
        res.status(500).send(e.message);
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
        res.render('courseStudents', { records: records, flag: flag, user: JSON.stringify(user), role: user.role })

    } catch (e) {
        res.status(500).send()
    }

})


module.exports = router