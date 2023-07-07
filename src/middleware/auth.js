const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        const token = req.cookies["cookie name"];
        const decoded = jwt.verify(token, 'grademanagment');
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
        
        if (!user) {
            throw new Error();
        }
        
      
        
        req.token = token;
        req.user = user;
        
        next();
    } catch (e) {
        console.log(e);
        res.status(302).redirect('/');
    }
}

module.exports = auth;
