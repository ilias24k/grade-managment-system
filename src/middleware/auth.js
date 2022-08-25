const jwt = require('jsonwebtoken')
const { restart } = require('nodemon')
const User = require('../models/user')



const auth = async (req, res, next) =>{
    // console.log(req.cookies["cookie name"])
    

    try {
        const cookie = req.cookies["cookie name"]
        // const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(req.cookies["cookie name"], 'grademanagment')
        const user = await User.findOne({_id: decoded._id, 'tokens.token': cookie})
        
        // const cookie = req.cookies
        // console.log(user, cookie)
        if(!user){
            throw new Error()
        }
        // req.token = token
        req.user = user
        req.cookie = cookie
        
        next()

    } catch (e) {
        res.redirect('/')
        // res.status(401).send({error: 'please authe'})   
    }

}

module.exports = auth