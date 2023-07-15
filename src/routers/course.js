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
        var user = req.user
        const courses = await Course.find({})
        // res.send(courses)
        res.render('course', { courses, user: user })
    } catch (e) {
        res.status(500).send()
    }

})

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

router.post('/course', upload.single("files"), uploadFiles);

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


// uploading courses 

router.post('/upload_course/:id', auth, upload.single("files"), uploadFiles);
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
        await course.save()
        // Store the uploaded course ID to the user's array of course IDs
        const user = await User.findOne({ _id: req.params.id })
        user.courses.push(course._id)
        await user.save()
        course.user = user.name
        await course.save()
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


//getting all courses of signed in user

router.get('/course', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        let courses;

        var allCourses = []

        if (user.role === 'admin') {
            courses = await Course.find();


        } else if (user.role === 'user') {
            const courseIds = user.courses;
            courses = await Course.find({ _id: { $in: courseIds } });
        } else {
            throw new Error('Invalid user role');
        }


        res.render('course', { courseList: courses, user: JSON.stringify(user.id), role: user.role,loggedUser:user.name });
    } catch (e) {
        res.status(500).send();
    }
});



//getting specific course students

router.get('/course/:id', auth, async (req, res) => {
    const _id = req.params.id
    var user = req.user
    try {
        var students = [];
        const course = await Course.findById(_id)
        students = course.students
        const records = await Student.find({ '_id': { $in: students } });
        if (!course) {
            return res.status(404).send()
        }
        res.render('courseStudents', { records: records, user: JSON.stringify(user) })
    } catch (e) {
        res.status(500).send()
    }

})

//getting  course lab and theory parts

router.get('/course/edit/:id', auth, async (req, res) => {

    const _id = req.params.id
    var user = req.user

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
            lowTheoryBound: lowTheoryBound, lowLabBound: lowLabBound, user: JSON.stringify(user)
        })
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/course/teaching/:id', auth, async (req, res) => {

    try {
        var user = req.user
        var course = await Course.findById(req.params.id)
        var teachingList = []
        var usersList = []
        var user = await User.find({})
        for (var i = 0; i < user.length; i++) {

            usersList.push(user[i])
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
        res.render('teaching', { teachingList: teachingList, usersList: usersList, user: JSON.stringify(user) })
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
        const courseId = req.params.id;
        let course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).send();
        }

        const userName = course.name;
        const user = await User.findOneAndUpdate(
            { 'courses': courseId },
            { $pull: { courses: courseId } }
        );
        course = await Course.findByIdAndDelete(courseId);

        res.redirect('/course');
    } catch (e) {
        res.status(500).send();
    }
});



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