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
const Teaching = require('../src/models/teaching')
const Student = require('../src/models/student')
const cookieParser = require('cookie-parser');



const app = express()
const port = process.env.port || 4000
app.use(cookieParser());

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))



app.use(homeRouter)
app.use(userRouter)
app.use(courseRouter)
app.use(studentRouter)



const multer = require('multer')
const async = require('hbs/lib/async')
const upload = multer({ dest: 'files' })

const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')


app.set('views', viewsPath)
app.set('view engine', 'hbs')
hbs.registerPartials(partialsPath)

app.use(express.static(publicDirectoryPath))
hbs.registerHelper("checkFlag", function (value1, value2, options) {
  return (value1 == value2)? options.fn(this) : options.inverse(this);
});



var dir = './analytical';
var dir2 = './typical';



const directory = 'files';

//clearing file list on files directory every 10 secs

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

//deleting generated excel files 

const analyticalDir = 'analytical'
const typicalDir = 'typical';

function clearFiles2() {
  if (!fs.existsSync(dir) && !fs.existsSync(dir2)) {
    fs.mkdirSync(dir);
    fs.mkdirSync(dir2)
  } else {
    fs.readdir(analyticalDir, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        fs.unlink(path.join(analyticalDir, file), err => {
          if (err) throw err;
        });
      }
    });
    fs.readdir(typicalDir, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        fs.unlink(path.join(typicalDir, file), err => {
          if (err) throw err;
        });
      }
    });
  }


  setTimeout(clearFiles2, 5000);
}

clearFiles2();


//checks every 24.8 days for updated grade in students and deletes them from course array if 
// grade upodated time is greater than current date

async function clearStuds() {
  const todaysDate = new Date()
  const currentYear = todaysDate.getFullYear() //current year YYYY
  records = []
  const courses = await Course.find({})
  var courseTeachings
  var teaching

  for (var i = 0; i < courses.length; i++) {
    courseTeachings = courses[i].teachings
    for (var j = 0; j < courseTeachings.length; j++) {
      teaching = await Teaching.findById({ _id: courseTeachings[j] })
      teachingStudents = teaching.students
      records = await Student.find({ '_id': { $in: teachingStudents } });

      for (var y = 0; y < records.length; y++) {
        courseDate = records[y].updatedAt.toString()
        yearOfStudentUpdate = courseDate.substring(11, 15)                  // last updated grade in YYYY
        // console.log(records[y])
        // yearOfStudentUpdate = 0
        if ((currentYear - yearOfStudentUpdate) > teaching.duration) {

          id = records[y].id


          // when the duration of teachings grade is smaller than the balance of curr year - the year when the grade of
          // student was updated
          // he is removed from the latest teaching by year
          Teaching.findOneAndUpdate(
            { $and: [{ students: { $eq: id } }, { year: { $eq: currentYear } }] },
            { $pull: { students: id } },
            { new: true },

            function (err, removedFromUser) {

            })
        }
      }
    }

  }

  setTimeout(clearStuds, 2147483647);
}

clearStuds();

const jwt = require('jsonwebtoken');
const res = require('express/lib/response')
const { next } = require('mongodb/lib/operations/cursor_ops')



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