const express = require('express')
const router = express.Router()


router.get('/', (req, res) => {               //gets view and converts to html
    res.render('index', {
        title: 'Grade Managment System',
        name: 'ilias'
    })
})




module.exports = router