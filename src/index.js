const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const courseRouter = require('./routers/course')
const studentRouter = require('./routers/student')
const homeRouter = require('./routers/home')
const hbs = require('hbs')
const path = require('path')
const bodyParser = require('body-parser')
const fs = require('fs')
const Course = require('../src/models/course')
const Student = require('../src/models/student')



const app = express()
const port = process.env.port || 4000


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


app.use(homeRouter)
app.use(userRouter)
app.use(courseRouter)
app.use(studentRouter)


const multer = require('multer')
const upload = multer({ dest: 'files' })

const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')


app.set('views', viewsPath)
app.set('view engine', 'hbs')
hbs.registerPartials(partialsPath)

app.use(express.static(publicDirectoryPath))
hbs.registerHelper("inc", function (value, options) {
  return parseInt(value) + 1;
});


const directory = 'files';

//clearing file list on files directory every 5 secs

function clearFiles() {

  fs.readdir(directory, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join(directory, file), err => {
        if (err) throw err;
      });
    }
  });

  setTimeout(clearFiles, 10000);
}

clearFiles();
const directory2 = 'typical';

function clearFiles2() {

  fs.readdir(directory2, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join(directory2, file), err => {
        if (err) throw err;
      });
    }
  });

  setTimeout(clearFiles, 5000);
}

clearFiles2();


//checks every 24.8 days for updated grade in students and deletes them from course array if 
// grade upodated time is greater than current date

async function clearStuds() {
  const todaysDate = new Date()
  const currentYear = todaysDate.getFullYear() //current year YYYY
  records = []
  const courses = await Course.find({})

  for (var i = 0; i < courses.length; i++) {
    courseStudents = courses[i].students
    records = await Student.find({ '_id': { $in: courseStudents } });
    // console.log(records.length)
    for (var y = 0; y < records.length; y++) {
      courseDate = records[y].updatedAt.toString()
      yearOfStudentUpdate = courseDate.substring(11, 15)                  // last updated grade in YYYY

      // console.log( records[y].id)
      if ((currentYear - yearOfStudentUpdate) > courses[i].gradeMaintainTime) {
        id = records[y].id
        Course.findOneAndUpdate(
          { students: id },
          { $pull: { students: id } },
          { new: true },
          function (err, removedFromUser) {

          })
      }
    }

  }

  setTimeout(clearStuds, 2147483647);
}

clearStuds();



app.get('*', (req, res) => {                //* means everything that hasnt been addressed !! 

  res.render('404', {
    title: '404',
    name: 'ilias',
    errorMessage: 'Page not found'
  })
})

app.listen(port, () => {
  console.log('server is up on port ' + port)
})