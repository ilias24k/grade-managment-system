const express = require('express')
const Schema = require('mongoose')
const Course = require('../models/course')
const router = new express.Router()
const Student = require('../models/student')
const Teaching = require('../models/teaching')

const fs = require('fs')
const xlsx = require('xlsx')
const multer = require('multer')
const { json } = require('body-parser')
const path = require('path')
const exceljs = require('exceljs')
const auth = require('../middleware/auth')


const upload = multer({
    dest: 'files'
})

// analytical excel file 

router.get('/download/analytical/:id', async function (req, res) {
    var fs = require('fs');
    var dir = './analytical';

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    // console.log(req.params.id)


    const teaching = await Teaching.findById(req.params.id)

    var course = await Course.findOne({ "teachings": req.params.id })

    // console.log(course)
    TeachingStudents = teaching.students
    const students = await Student.find({ '_id': { $in: TeachingStudents } });
    studentslist = []
    theoryNamesList = []
    theoryList = []
    labNamesList = []
    labList = []

    for (var i = 0; i < students.length - 1; i++) {
        theoryList.push(students[i].theoryGrade.computedGrade[i])
    }


    for (var i = 0; i < students.length; i++) {
        if (students[i].theoryGrade.name.length > 0) {
            for (var y = 0; y < students[i].theoryGrade.name.length; y++) {
                theoryNamesList.push(students[i].theoryGrade.name[y])
            }
            break;
        }
    }

    for (var i = 0; i < students.length; i++) {
        for (var y = 0; y < students[i].labGrade.computedGrade.length; y++) {
            labList.push(students[i].labGrade.computedGrade[y])
        }
    }

    for (var i = 0; i < students.length; i++) {
        if (students[i].labGrade.name.length > 0) {
            for (var y = 0; y < students[i].labGrade.name.length; y++) {
                labNamesList.push(students[i].labGrade.name[y])
            }
            break;
        }
    }

    var workbook = new exceljs.Workbook();
    var sheet = workbook.addWorksheet('records');
    var worksheet = workbook.getWorksheet("records");

    counterTheory = 4;
    for (var i = 0; i < theoryNamesList.length; i++) {
        worksheet.getCell(1, counterTheory).value = theoryNamesList[i]
        counterTheory += 1
    }

    counterLab = 7;
    for (var i = 0; i < labNamesList.length; i++) {
        worksheet.getCell(1, counterLab).value = labNamesList[i]
        counterLab += 1
    }

    counterTheory = 3;
    counterTheory2 = 0;

    for (var i = 0; i < students.length; i++) {
        for (var y = 0; y < students[i].theoryGrade.computedGrade.length; y++) {
            worksheet.getCell((counterTheory), (counterTheory2 + 4)).value = students[i].theoryGrade.computedGrade[y]
            counterTheory2 += 1
        }
        counterTheory += 1
        counterTheory2 = 0
    }

    counterLab = 3;
    counterLab2 = 0;

    for (var i = 0; i < students.length; i++) {
        for (var y = 0; y < students[i].labGrade.computedGrade.length; y++) {
            worksheet.getCell((counterLab), (counterLab2 + 7)).value = students[i].labGrade.computedGrade[y]
            counterLab2 += 1
        }
        counterLab += 1
        counterLab2 = 0
    }

    worksheet.getCell('A' + 1).value = 'name'
    worksheet.getCell('B' + 1).value = 'email'
    worksheet.getCell('M' + 1).value = 'total theory'
    worksheet.getCell('L' + 1).value = 'total lab'
    worksheet.getCell('N' + 1).value = 'total '

    counterTheory = 4;
    var total_grade
    for (var i = 0; i < students.length; i++) {
        worksheet.getCell('A' + (i + 3)).value = students[i].name
        worksheet.getCell('B' + (i + 3)).value = students[i].email
        if (students[i].finalGradeTh === undefined) {
            students[i].finalGradeTh = 0
        }
        if (students[i].finalGradeLab === undefined) {
            students[i].finalGradeLab = 0
        }
        worksheet.getCell('L' + (i + 3)).value = students[i].finalGradeTh
        worksheet.getCell('M' + (i + 3)).value = students[i].finalGradeLab


        if (students[i].finalGradeLab < course.lowLabBound || students[i].finalGradeTheory < course.lowTheoryBound) {
            var Grade1 = Math.min(students[i].finalGradeTh * course.theoryWeight / 100, students[i].finalGradeLab * course.labWeight / 100)
            worksheet.getCell('N' + (i + 3)).value = Grade1
            total_grade = await Student.findByIdAndUpdate({ _id: students[i]._id }, {
                $set: {
                    "totalGrade": Grade1
                }
            })
        } else {
            var Grade2 = students[i].finalGradeTh * course.theoryWeight / 100 + students[i].finalGradeLab * course.labWeight / 100
            worksheet.getCell('N' + (i + 3)).value = Grade2
            total_grade = await Student.findByIdAndUpdate({ _id: students[i]._id }, {
                $set: {
                    "totalGrade": Grade2
                }
            })
        }
        if (typeof students[i].finalGradeLab !== "undefined" && typeof students[i].finalGradeTh !== "undefined") {
            await Student.findByIdAndUpdate({ _id: students[i]._id }, {
                $set: {
                    "frozen.theory": students[i].finalGradeTh, "frozen.lab": students[i].finalGradeLab
                }
            })

        } else if (!students[i].finalGradeTh) {

            await Student.findByIdAndUpdate({ _id: students[i]._id }, {
                $set: {
                    "frozen.lab": students[i].finalGradeLab
                }
            })

        } else if (!students[i].finalGradeLab) {

            await Student.findByIdAndUpdate({ _id: students[i]._id }, {
                $set: {
                    "frozen.theory": students[i].finalGradeTh
                }
            })
        }
    }
    workbook.xlsx.writeFile('analytical/analytical.xlsx')
        .then(function () {
            const fileLoc = path.join(__dirname, '../../analytical/analytical.xlsx')
            const file = fileLoc;

            res.download(file);
        });
});

// typical grade excel file

router.get('/download/typical/:id', async function (req, res) {
    var fs = require('fs');
    var dir = './typical';

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    // console.log(req.params.id)
    const teaching = await Teaching.findById(req.params.id)
    var course = await Course.findOne({ "teachings": teaching._id })
    CourseStudents = teaching.students

    const students = await Student.find({ '_id': { $in: CourseStudents } });

    studentslist = []
    // console.log(students)
    var total_grade
    for (var i = 0; i < students.length; i++) {
        obj = {}
        obj.name = students[i].name
        obj.email = students[i].email

        if (students[i].finalGradeTh === undefined) {
            students[i].finalGradeTh = 0
        }
        if (students[i].finalGradeLab === undefined) {
            students[i].finalGradeLab = 0
        }
        obj.finalGradeTheory = students[i].finalGradeTh
        obj.finalGradeLab = students[i].finalGradeLab
        if (students[i].finalGradeLab < course.lowLabBound || students[i].finalGradeTheory < course.lowTheoryBound) {
            obj.total = Math.min(students[i].finalGradeTh * course.theoryWeight / 100, students[i].finalGradeLab * course.labWeight / 100)
        } else {
            obj.total = students[i].finalGradeTh * course.theoryWeight / 100 + students[i].finalGradeLab * course.labWeight / 100
        }
        total_grade = await Student.findByIdAndUpdate({ _id: students[i]._id }, {
            $set: {
                "totalGrade": obj.total
            }
        })
        studentslist.push(obj)
        if (typeof students[i].finalGradeLab !== "undefined" && typeof students[i].finalGradeTh !== "undefined") {
            await Student.findByIdAndUpdate({ _id: students[i]._id }, {
                $set: {
                    "frozen.theory": students[i].finalGradeTh, "frozen.lab": students[i].finalGradeLab
                }
            })

        } else if (!students[i].finalGradeTh) {
            await Student.findByIdAndUpdate({ _id: students[i]._id }, {
                $set: {
                    "frozen.lab": students[i].finalGradeLab
                }
            })

        } else if (!students[i].finalGradeLab) {
            await Student.findByIdAndUpdate({ _id: students[i]._id }, {
                $set: {
                    "frozen.theory": students[i].finalGradeTh
                }
            })
        }
    }

    // console.log(total_grade)

    let binaryWS = xlsx.utils.json_to_sheet(studentslist);
    var wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, binaryWS, 'Binary values')
    xlsx.writeFile(wb, 'typical/typical.xlsx');
    const fileLoc = path.join(__dirname, '../../typical/typical.xlsx')
    const file = fileLoc;
    // console.log(file)
    res.download(file);
});


// upload students
router.post('/upload_students', upload.single("files"), uploadFiles);

async function uploadFiles(req, res) {
    try {
        const workbook = xlsx.readFile(req.file.path);
        var sheet_name_list = workbook.SheetNames;
        var students = [];
        var course = await Course.findOneAndUpdate({ "teachings": req.body.teaching_id })

        sheet_name_list.forEach(function (y) {
            var worksheet = workbook.Sheets[y];
            var headers = {};
            var data = [];

            for (z in worksheet) {
                if (z[0] === '!') continue;
                var col = z.substring(0, 1);
                var row = parseInt(z.substring(1));
                var value = worksheet[z].v;
                if (row == 1) {
                    headers[col] = value;
                    continue;
                }
                if (!data[row]) data[row] = {};
                data[row][headers[col]] = value;
            }
            data.shift();
            data.shift();
            students.push(...data);
        });
        Student.insertMany(students, function (error, docs) {
            if (error) {
                res.status(500).send(error);
                return;
            }
            //adding students to teaching and course 

            docs.forEach(function (doc) {
                Teaching.findByIdAndUpdate(
                    req.body.teaching_id,
                    { $push: { "students": doc } },
                    { safe: true, upsert: true },
                    function (err, model) {
                        if (err) {
                            console.log(err);
                        }
                    }
                );
                Course.findByIdAndUpdate(
                    course.id,
                    { $push: { "students": doc } },
                    { safe: true, upsert: true },
                    function (err, model) {
                        if (err) {
                            console.log(err);
                        }
                    }
                );
            });
        });
        res.redirect('/course/view/teaching/' + req.body.teaching_id);
    } catch (e) {
        res.status(400).send(e);
    }
}


router.get('/student', auth, async (req, res) => {
  try {
    var user = req.user;
    var role = user.role;

    var userCoursesIds = user.courses;
    var courses = [];
    for (let i = 0; i < userCoursesIds.length; i++) {
      let course = await Course.findById(userCoursesIds[i]);
      if (course && course.students) {
        courses.push(course);
      }
    }

    var teachingStudents = [];
    var data = [];
    var teachingYears = [];
    var curStud;
    var curCourse;
    var curAM;
    var curEmail;

    var students = [];
    for (let i = 0; i < courses.length; i++) {
      if (courses[i].students) {
        students = students.concat(courses[i].students);
      }
    }

    for (var i = 0; i < students.length; i++) {
      var teaching = await Teaching.find({ students: students[i] });
      let student = await Student.findById(students[i]);

      // Add a null check for the student object
      if (student !== null) {
        curStud = student.name;
        curEmail = student.email;
        curAM = student.AM;
      } else {
        continue;
      }

      let studId = student.id;
      for (var y = 0; y < teaching.length; y++) {
        teachingYears = [];
        let year = teaching[y].year;

        if (teaching.some((obj) => obj.year === year)) {
          teachingYears.push(year);
          curCourse = teaching[y].courseName;
        } else {
          teachingYears = [year];
          curCourse = teaching[y].courseName;
        }
      }

      var object = {
        curAM,
        curStud,
        curEmail,
        curCourse,
        teachingYears,
        studId,
      };
    //   console.log(object)
      data.push(object);
    }

    res.render('allCourseStudents', {
      data: data,
      user: { user: JSON.stringify(user) },
      role: role,
    });
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});




//getting all courses students
router.get('/course/students/:id', auth, async (req, res) => {
    try {
        var user = req.user
        var course = await Course.findById(req.params.id)
        var teachingsList = course.teachings
        var studentListId = []
        for (var i = 0; i < teachingsList.length; i++) {
            var teaching = await Teaching.findById(teachingsList[i])
            for (var y = 0; y < teaching.students.length; y++) {
                studentListId.push(teaching.students[y])
            }
        }
        var studentList = []
        for (var i = 0; i < studentListId.length; i++) {
            var student = await Student.findById(studentListId[i])
            studentList.push(student)
        }
        var teachingList = await Teaching.find({ "flag": false })

        res.render('student', { course: course, studentList: studentList, teachingList: teachingList, user: JSON.stringify(user) })

        // res.send(students)
    } catch (e) {
        res.status(500).send()
    }
})


router.patch('/students/upd/', auth, async (req, res) => {

    try {
        var index = req.body.index[0].index
        var AM = req.body.rows[index].AM
        var name = req.body.rows[index].name
        var teachingYear = req.body.teachingYear
        var teaching

        var student = await Student.findOne({ AM: { $eq: AM } })

        if (teachingYear == 'remove from current teaching') {
            teaching = await Teaching.findOneAndUpdate({
                "students": student.id
            },
                { $pull: { "students": student.id } },
                { safe: true, upsert: true },
                function (err, model) {
                    // console.log();
                })

        } else {
            teaching = await Teaching.findOneAndUpdate({ "year": teachingYear }, { $addToSet: { students: student.id } })
        }

        res.status(201).send({ result: 'redirect', url: '/student' })

    } catch (e) {
        res.status(500).send()
    }
})


router.get('/course/student/check/:id', auth, async (req, res) => {
    try {

        const selStudent = await Student.findById(req.params.id)
        var years = Object.keys(Object.assign({}, ...selStudent.history))
        var user = req.user


        var data = []
        var object = {}
        var semesterList = []
        var theoryNames = []
        var labNames = []
        var teaching
        var course
        for (var i = 0; i < years.length; i++) {
            teaching = await Teaching.findOne({ 'year': years[i], 'students': selStudent.id })
            semesterList.push(teaching.semester)
            course = await Course.findOne({ "teachings": teaching.id })
            object = { "year": years[i], "semester": semesterList[i] }

            if (theoryNames.length > 0) {

            } else {
                course.theory.names.forEach(element => {
                    theoryNames.push(element)
                });
            }
            if (labNames.length > 0) {

            } else {
                course.lab.names.forEach(element => {
                    labNames.push(element)
                });
            }

            var copy = selStudent.history.map(o => Object.assign({}, o))

            for (var k = 0; k < selStudent.history.length; k++) {
                for (var y = 0; y < theoryNames.length; y++) {
                    if (years[i] == Object.keys(selStudent.history[k])) {
                        Object.assign(object, { [theoryNames[y]]: copy[k][years[i]].theory[y] })
                    }
                }
            }

            for (var k = 0; k < selStudent.history.length; k++) {
                for (var y = 0; y < labNames.length; y++) {
                    if (years[i] == Object.keys(selStudent.history[k])) {
                        Object.assign(object, { [labNames[y]]: copy[k][years[i]].lab[y] })
                    }
                }
            }
            data.push(object)
        }

        var headers = Object.keys(data[0])

        res.render('checkGrade', { student: selStudent, data: data, headers: headers, user: JSON.stringify(user) })
    } catch (e) {
        res.status(500).send('No grade history. Please grade the student first!')
    }

})



router.post('/student/teaching/delete/:id', auth, async (req, res) => {
    try {
        //checking header and  referer for redirecting purposes
        // console.log(req.params)
        // console.log(req.body)
        var teachingId = req.body.teachingId
        var studentId = req.params.id

        Teaching.findByIdAndUpdate(
            { _id: teachingId },
            { $pull: { students: studentId } },
            { new: true },
            function (err, removedFromUser) {

            })

        res.redirect('/course/view/teaching/' + teachingId);


    } catch (e) {
        res.status(500).send()
    }
})




router.get('/student/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const student = await Student.findById(_id)
        if (!student) {
            return res.status(404).send()
        }
        res.send(student)
    } catch (e) {
        res.status(500).send()
    }

})

router.get('/student/edit/:id', auth, async (req, res) => {

    try {
        var user = req.user

        // const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        var teachingId = req.query.teachingId

        const teaching = await Teaching.findById({ _id: teachingId });

        var course = await Course.findOne({ "teachings": teaching._id })


        const theory = []
        const lab = []
        arr = [];
        arr2 = [];

        compTheoryGrade = []
        const student = await Student.findById(req.params.id)

        theory.push(course.theory)
        lab.push(course.lab)

        theory[0].names.forEach(function (v, i) {
            var obj = {};
            obj.id = course.theory.id[i]
            obj.name = v;
            obj.weight = course.theory.weight[i];
            obj.compTheoryGrade = student.theoryGrade.computedGrade[i]
            obj.finalGradeTh = student.finalGradeTh
            arr.push(obj);
        })

        lab[0].names.forEach(function (v, i) {
            var obj = {};
            obj.id = course.lab.id[i]
            obj.name = v;
            obj.weight = course.lab.weight[i];
            obj.compLabGrade = student.labGrade.computedGrade[i]
            obj.finalGradeLab = student.finalGradeLab
            arr2.push(obj);
        })

        var flag = {}
        if (student.frozen.theory.length == 0 && student.frozen.lab.length == 0) {

            flag = { theory: 0, lab: 0 }
        } else if (student.frozen.lab.length == 0 && student.frozen.theory.length == 1) {
            flag = { theory: 1, lab: 0 }
        } else if (student.frozen.theory.length == 0 && student.frozen.lab.length == 1) {
            flag = { theory: 0, lab: 1 }
        } else if (student.frozen.theory.length == 1 && student.frozen.lab.length == 1) {
            flag = { theory: 0, lab: 0 }
        }
        console.log(flag)


        flag.stringify = JSON.stringify(flag)

        res.render('editStudent', { arr: arr, arr2: arr2, flag: flag, user: JSON.stringify(user) })
        if (!student) {
            // return res.status(404).send()
        }
        // res.send(student)
    } catch (e) {
        res.status(400).send(e)
    }
})

//grading students


router.put('/student/edit/:id/:teachingId', auth, async (req, res) => {
    console.log('bike sto grade')
    console.log(req.params.teachingId)
    try {

        if (req.body.theory && req.body.lab) {

            var teaching = await Teaching.findById({ _id: req.params.teachingId })

            var course = await Course.findOne({ 'teachings': { $eq: teaching._id } });
            theoryGradeIds = DbIds(req.body.theory)
            theoryGrade = DbGrade(req.body.theory)
            labGradeIds = DbIds(req.body.lab)
            labGrade = DbGrade(req.body.lab)
            TheoryNames = DbNames(course.theory.names)
            LabNames = DbNames(course.lab.names)
            // console.log(teaching.year)

            var gradeYear = teaching.year

            const student = {}

            gradeTheory = []
            gradeLab = []
            var finalGradTheory = 0;
            var finalGradLab = 0;

            for (var i = 0; i < theoryGradeIds.length; i++) {

                if (theoryGrade[i] >= course.theoryBounds.bound[i]) {
                    gradeTheory[i] = theoryGrade[i] * course.theory.weight[i] / 100
                    finalGradTheory += gradeTheory[i]

                } else {
                    gradeTheory[i] = theoryGrade[i]
                    // finalGradTheory += gradeTheory[i]                    
                }
                // finalGradTheory += gradeTheory[i]
            }
            // console.log('thewria ', gradeTheory, finalGradTheory)
            // console.log(course[0].lab.weight, labGrade, course[0].labBounds)
            for (var i = 0; i < labGradeIds.length; i++) {

                if (labGrade[i] >= course.labBounds.bound[i]) {
                    gradeLab[i] = labGrade[i] * course.lab.weight[i] / 100
                    finalGradLab += gradeLab[i]

                } else {
                    gradeLab[i] = labGrade[i]
                    // finalGradTheory += gradeTheory[i]                    
                }
                // finalGradLab += gradeLab[i]
            }

            var theoryGradeNum = theoryGrade.map(str => {
                return Number(str);
            });
            var labGradeNum = labGrade.map(str => {
                return Number(str);
            });

            var stud = await Student.findById(req.params.id)

            var history = {}
            history = { [gradeYear]: { 'theory': theoryGradeNum, 'lab': labGradeNum } }
            // console.log(stud.history)

            student = Student.findByIdAndUpdate(
                req.params.id,
                {
                    $set: {
                        "theoryGrade.name": TheoryNames, "theoryGrade.computedGrade": gradeTheory,
                        "finalGradeTh": finalGradTheory, "labGrade.name": LabNames, "labGrade.computedGrade": gradeLab, "finalGradeLab": finalGradLab
                    },
                    $push: { "history": history }
                },
                { safe: true, upsert: true },
                function (err, model) {
                    if (model) {

                        return res.status(200).send({ result: 'redirect', url: '/student/edit/' + req.params.id + '?teachingId=' + req.params.teachingId })
                    } else {
                        // console.log(err)
                    }
                }
            );

        } else if (!(req.body.lab)) {
            var teaching = await Teaching.findById({ _id: req.params.teachingId })
            var course = await Course.findOne({ 'teachings': { $eq: teaching._id } });
            var gradeYear = []
            gradeYear.push(teaching.year)

            theoryGradeIds = DbIds(req.body.theory)
            theoryGrade = DbGrade(req.body.theory)
            const student = {}
            TheoryNames = DbNames(course.theory.names)
            gradeTheory = []
            var finalGradTheory = 0;
            for (var i = 0; i < theoryGradeIds.length; i++) {
                if (theoryGrade[i] >= course.theoryBounds.bound[i]) {
                    gradeTheory[i] = theoryGrade[i] * course.theory.weight[i] / 100

                } else {
                    gradeTheory[i] = 0
                    // finalGradTheory += gradeTheory[i]                  
                }
                finalGradTheory += gradeTheory[i]
            }

            var theoryGradeNum = theoryGrade.map(str => {
                return Number(str);
            });
            var labGradeNum = 0

            var history = {}
            history = { [gradeYear]: { 'theory': theoryGradeNum, 'lab': labGradeNum } }

            student = Student.findByIdAndUpdate(
                req.params.id,
                {
                    $set: { "theoryGrade.name": TheoryNames, "theoryGrade.computedGrade": gradeTheory, "theoryGrade.year": gradeYear, "finalGradeTh": finalGradTheory },
                    $push: { "history": history }
                },
                { safe: true, upsert: true },
                function (err, model) {
                    if (model) {

                        return res.status(200).send({ result: 'redirect', url: '/student/edit/' + req.params.id + '?teachingId=' + req.params.teachingId })
                    }
                }
            );
        } else if (!(req.body.theory)) {

            labGradeIds = DbIds(req.body.lab)
            labGrade = DbGrade(req.body.lab)

            const student = {}
            var teaching = await Teaching.findById({ _id: req.params.teachingId })
            var course = await Course.findOne({ 'teachings': { $eq: teaching._id } });
            var gradeYear = []
            gradeYear.push(teaching.year)
            LabNames = DbNames(course)
            var finalGradLab = 0;
            gradeLab = []

            for (var i = 0; i < labGradeIds.length; i++) {

                if (labGrade[i] >= course.labBounds.bound[i]) {
                    gradeLab[i] = labGrade[i] * course.lab.weight[i] / 100

                } else {
                    gradeLab[i] = 0
                    // finalGradTheory += gradeTheory[i]     
                }
                finalGradLab += gradeLab[i]
            }


            var theoryGradeNum = 0
            var labGradeNum = labGrade.map(str => {
                return Number(str);
            });


            var history = {}
            history = { [gradeYear]: { 'theory': theoryGradeNum, 'lab': labGradeNum } }


            student = Student.findByIdAndUpdate(
                req.params.id,
                { $set: { "labGrade.name": LabNames, "labGrade.computedGrade": gradeLab, "labGrade.year": gradeYear, "finalGradeLab": finalGradLab }, $push: { "history": history } },

                { safe: true, upsert: true },
                function (err, model) {
                    if (model) {

                        return res.status(200).send({ result: 'redirect', url: '/student/edit/' + req.params.id + '?teachingId=' + req.params.teachingId })
                    }
                }
            );
        }
        if (!student) {
            // return res.status(404).send()
            // console.log(student)
        }
    } catch (e) {
        // res.status(400).send(e)
    }
})

//deleting students

router.post('/student/delete/:id', auth, async (req, res) => {
    try {
        // Checking header and referer for redirecting purposes
        console.log('edw2');
        let courseId;
        let header = req.headers.referer.toString();
        if (header == 'http://localhost:4000/student') {
            courseId = null;
        } else {
            // Extract the course ID from the URL
            courseId = req.headers.referer.split('/')[6];
        }
        if (courseId) {
            Student.findOneAndDelete({ _id: req.params.id }, (err, removed) => {
                if (err) {
                    throw err; // Handle the error here
                }
                Teaching.findOneAndUpdate(
                    { students: req.params.id },
                    { $pull: { students: req.params.id } },
                    { new: true },
                    (err, removedFromUser) => {
                        if (err) {
                            throw err; // Handle the error here
                        }
                        res.redirect('/course/view/teaching/' + courseId);
                    }
                );
            });
        } else {
            Student.findOneAndDelete({ _id: req.params.id }, (err, removed) => {
                if (err) {
                    throw err; // Handle the error here
                }
                Teaching.findOneAndUpdate(
                    { students: req.params.id },
                    { $pull: { students: req.params.id } },
                    { new: true },
                    (err, removedFromUser) => {
                        if (err) {
                            throw err; // Handle the error here
                        }
                        res.redirect('/student');
                    }
                );
            });
        }
    } catch (e) {
        res.status(500).send();
    }
});


// functions to get grades  ids and names 

function DbNames(arr1) {
    // console.log('fun names')
    names = []

    for (var i = 0; i < arr1.length; i++) {

        names.push(arr1[i])
    }
    return names
}

function DbGrade(arr1) {
    // console.log('fun names')
    grades = []

    for (var i = 1; i < arr1.length; i += 2) {

        grades.push(arr1[i])
    }
    return grades
}

function DbIds(arr1) {
    // console.log('fun ids')
    ids = []
    for (var i = 0; i < arr1.length; i += 2) {
        ids.push(arr1[i])
    }
    return ids
}



module.exports = router