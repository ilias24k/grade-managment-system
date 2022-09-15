const express = require('express')
const Schema = require('mongoose')
const Course = require('../models/course')
const router = new express.Router()
const Student = require('../models/student')
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

    const course = await Course.findById(req.params.id)
    // console.log(course)
    CourseStudents = course.students
    const students = await Student.find({ '_id': { $in: CourseStudents } });
    studentslist = []
    theoryNamesList = []
    theoryList = []
    labNamesList = []
    labList = []

    for (var i = 0; i < students.length - 1; i++) {
        theoryList.push(students[i].theoryGrade.computedGrade[i])
    }
    // console.log(theoryList)
    for (var i = 0; i < students[0].theoryGrade.name.length; i++) {

        theoryNamesList.push(students[0].theoryGrade.name[i])

    }
    for (var i = 0; i < students.length; i++) {
        for (var y = 0; y < students[i].labGrade.computedGrade.length; y++) {
            labList.push(students[i].labGrade.computedGrade[y])
        }
    }

    for (var i = 0; i < students[0].labGrade.name.length; i++) {
        labNamesList.push(students[0].labGrade.name[i])
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

        worksheet.getCell('L' + (i + 3)).value = students[i].finalGradeTh
        worksheet.getCell('M' + (i + 3)).value = students[i].finalGradeLab

        if (students[i].finalGradeLab < course.lowLabBound || students[i].finalGradeTheory < course.lowTheoryBound) {
            var Grade1 =  Math.min(students[i].finalGradeTh * course.theoryWeight / 100, students[i].finalGradeLab * course.labWeight / 100)
            worksheet.getCell('N' + (i + 3)).value =Grade1
            total_grade =  await Student.findByIdAndUpdate({_id: students[i]._id},{  $set:  {
                "totalGrade": Grade1 }})
        }else {
            var Grade2 = students[i].finalGradeTh * course.theoryWeight / 100 + students[i].finalGradeLab * course.labWeight / 100
            worksheet.getCell('N' + (i + 3)).value = Grade2
            total_grade = await Student.findByIdAndUpdate({_id: students[i]._id},{  $set:  {
                "totalGrade": Grade2 }})
        }
        
    }

    workbook.xlsx.writeFile('analytical/analytical.xlsx')
        .then(function () {
            const fileLoc = path.join(__dirname, '../../analytical/analytical.xlsx')
            const file = fileLoc;

            res.download(file);
        });

});

// typical excel file

router.get('/download/typical/:id', async function (req, res) {
    var fs = require('fs');
    var dir = './typical';

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    // console.log(req.params.id)
    const course = await Course.findById(req.params.id)
    CourseStudents = course.students

    const students = await Student.find({ '_id': { $in: CourseStudents } });

    studentslist = []
    // console.log(students)
    var  total_grade
    for (var i = 0; i < students.length; i++) {
        obj = {}
        obj.name = students[i].name
        obj.email = students[i].email
        obj.finalGradeTheory = students[i].finalGradeTh
        obj.finalGradeLab = students[i].finalGradeLab

        if (students[i].finalGradeLab < course.lowLabBound || students[i].finalGradeTheory < course.lowTheoryBound) {
            obj.total = Math.min(students[i].finalGradeTh * course.theoryWeight / 100, students[i].finalGradeLab * course.labWeight / 100)
        }else {
            obj.total = students[i].finalGradeTh * course.theoryWeight / 100 + students[i].finalGradeLab * course.labWeight / 100
        }


       total_grade = await Student.findByIdAndUpdate({_id: students[i]._id},{  $set:  {
                     "totalGrade": obj.total }})
        studentslist.push(obj)
    }
    
    // console.log(total_grade)

    let binaryWS = xlsx.utils.json_to_sheet(studentslist);
    var wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, binaryWS, 'Binary values')
    xlsx.writeFile(wb, 'typical/typical.xlsx');

    const fileLoc = path.join(__dirname, '../../typical/typical.xlsx')

    const file = fileLoc;
    console.log(file)

    res.download(file);
});


// upload students
router.post('/upload_students', upload.single("files"), uploadFiles);
async function uploadFiles(req, res) {

    try {
        const workbook = xlsx.readFile(req.file.path)
        var sheet_name_list = workbook.SheetNames;
        //convert xlsx to json
        var students = [];
        sheet_name_list.forEach(function (y) {
            var worksheet = workbook.Sheets[y];
            var headers = {};
            var data = [];
            for (z in worksheet) {
                if (z[0] === '!') continue;
                //parse out the column, row, and value
                var col = z.substring(0, 1);
                var row = parseInt(z.substring(1));
                var value = worksheet[z].v;

                //store header names
                if (row == 1) {
                    headers[col] = value;
                    continue;
                }

                if (!data[row]) data[row] = {};
                data[row][headers[col]] = value;
            }
            //drop those first two rows which are empty
            data.shift();
            data.shift();
            // console.log(data);

            students = data
        });

        Student.insertMany(students, function (error, docs) {
            students.createdAt;
            students.updatedAt;

            docs.forEach(function (docs) {
                Course.findByIdAndUpdate(
                    req.body.id,
                    { $push: { "students": docs } },
                    { safe: true, upsert: true },
                    function (err, model) {
                        // console.log(err);
                    }
                );
            })
        });

        // await student.save()
        res.status(201)
        res.redirect('/course')
    } catch (e) {
        res.status(400).send(e)
    }
    res.send()
}
// getting all students of all courses
router.get('/student', auth, async (req, res) => {

    try {
        const students = await Student.find({})
        var studentList = students
        res.render('student', { studentList: studentList })

        // res.send(students)
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
        // const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        const course = await Course.find({ 'students': { $eq: req.params.id } });
        const theory = []
        const lab = []
        arr = [];
        arr2 = [];

        compTheoryGrade = []
        const student = await Student.findById(req.params.id)


        theory.push(course[0].theory)
        lab.push(course[0].lab)

        theory[0].names.forEach(function (v, i) {
            var obj = {};
            obj.id = course[0].theory.id[i]
            obj.name = v;
            obj.weight = course[0].theory.weight[i];
            obj.compTheoryGrade = student.theoryGrade.computedGrade[i]
            obj.finalGradeTh = student.finalGradeTh
            arr.push(obj);
        })

        lab[0].names.forEach(function (v, i) {
            var obj = {};
            obj.id = course[0].lab.id[i]
            obj.name = v;
            obj.weight = course[0].lab.weight[i];
            obj.compLabGrade = student.labGrade.computedGrade[i]
            obj.finalGradeLab = student.finalGradeLab
            arr2.push(obj);
        })

        res.render('editStudent', { arr: arr, arr2: arr2 })
        if (!student) {
            // return res.status(404).send()
        }
        // res.send(student)
    } catch (e) {
        // res.status(400).send(e)
    }
})

//grading students


router.put('/student/edit/:id', auth, async (req, res) => {

    try {

        if (req.body.theory && req.body.lab) {
            const course = await Course.find({ 'students': { $eq: req.params.id } });
            theoryGradeIds = DbIds(req.body.theory)
            theoryGrade = DbGrade(req.body.theory)
            labGradeIds = DbIds(req.body.lab)
            labGrade = DbGrade(req.body.lab)
            TheoryNames = DbNames(course[0].theory.names)
            LabNames = DbNames(course[0].lab.names)
            const student = {}

            gradeTheory = []
            gradeLab = []
            var finalGradTheory = 0;
            var finalGradLab = 0;

            for (var i = 0; i < theoryGradeIds.length; i++) {
                gradeTheory[i] = (theoryGrade[i] * course[0].theory.weight[i]) / 100
                finalGradTheory += gradeTheory[i]
            }

            for (var i = 0; i < labGradeIds.length; i++) {
                gradeLab[i] = (labGrade[i] * course[0].lab.weight[i]) / 100
                finalGradLab += gradeLab[i]
            }

            console.log(finalGradTheory, finalGradLab)
            student = Student.findByIdAndUpdate(
                req.params.id,
                { $set: { "theoryGrade.name": TheoryNames, "theoryGrade.computedGrade": gradeTheory, "finalGradeTh": finalGradTheory, "labGrade.name": LabNames, "labGrade.computedGrade": gradeLab, "finalGradeLab": finalGradLab } },
                { safe: true, upsert: true },
                function (err, model) {
                    if (model) {

                        return res.status(200).send({ result: 'redirect', url: '/student/edit/' + req.params.id })
                    }
                }
            );

        } else if (!(req.body.lab)) {
            const course = await Course.find({ 'students': { $eq: req.params.id } });
            theoryGradeIds = DbIds(req.body.theory)
            theoryGrade = DbGrade(req.body.theory)
            const student = {}
            TheoryNames = DbNames(course[0].theory.names)

            gradeTheory = []
            var finalGradTheory = 0;

            for (var i = 0; i < theoryGradeIds.length; i++) {
                gradeTheory[i] = theoryGrade[i] * course[0].theory.weight[i] / 100
                finalGradTheory += gradeTheory[i]
            }

            student = Student.findByIdAndUpdate(
                req.params.id,
                { $set: { "theoryGrade.name": TheoryNames, "theoryGrade.computedGrade": gradeTheory, "finalGradeTh": finalGradTheory } },
                { safe: true, upsert: true },
                function (err, model) {
                    if (model) {

                        return res.status(200).send({ result: 'redirect', url: '/student/edit/' + req.params.id })
                    }
                }
            );
        } else if (!(req.body.theory)) {

            labGradeIds = DbIds(req.body.lab)
            labGrade = DbGrade(req.body.lab)
            const student = {}
            const course = await Course.find({ 'students': { $eq: req.params.id } });

            LabNames = DbNames(course[0].lab.names)
            var finalGradLab = 0;
            gradeLab = []
            for (var i = 0; i < labGradeIds.length; i++) {
                gradeLab[i] = (labGrade[i] * course[0].lab.weight[i]) / 100
                finalGradLab += gradeLab[i]
            }
            student = Student.findByIdAndUpdate(
                req.params.id,
                { $set: { "labGrade.name": LabNames, "labGrade.computedGrade": gradeLab, "finalGradeLab": finalGradLab } },
                { safe: true, upsert: true },
                function (err, model) {
                    if (model) {

                        return res.status(200).send({ result: 'redirect', url: '/student/edit/' + req.params.id })
                    }
                }
            );
        }

        if (!student) {
            // return res.status(404).send()

            console.log(student)
        }

    } catch (e) {
        // res.status(400).send(e)

    }

})

//deleting students

router.post('/student/delete/:id', auth, async (req, res) => {
    try {
        //checking header and  referer for redirecting purposes

        var courseId
        var header = req.headers.referer.toString()

        if (header == 'http://localhost:4000/student') {
            courseId = null

        } else {
            courseId = req.headers.referer.split('/')[4].slice(0, -1)

        }

        if (courseId != null) {

            Student.findOneAndDelete({ _id: req.params.id })
                .exec(function (err, removed) {
                    Course.findOneAndUpdate(
                        { students: req.params.id },
                        // no _id it is array of objectId not object with _ids
                        { $pull: { students: req.params.id } },
                        { new: true },
                        function (err, removedFromUser) {

                        })
                })
            res.redirect('/course/' + courseId);
        } else {

            Student.findOneAndDelete({ _id: req.params.id })
                .exec(function (err, removed) {
                    Course.findOneAndUpdate(
                        { students: req.params.id },
                        // no _id it is array of objectId not object with _ids
                        { $pull: { students: req.params.id } },
                        { new: true },
                        function (err, removedFromUser) {

                        })
                })
            res.redirect('/student/');
        }


    } catch (e) {
        res.status(500).send()
    }
})

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