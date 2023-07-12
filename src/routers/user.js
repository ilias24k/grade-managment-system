const express = require('express')
const router = new express.Router()
const User = require('../models/user')
const { use, route } = require('./home')
const auth = require('../middleware/auth')
const hbs = require('hbs')
const async = require('hbs/lib/async')


// handlebars helper function to check if user is admin 

hbs.registerHelper('isAdmin', function (user, options) {
    return user.isAdmin ? options.fn(this) : options.inverse(this);
});


router.get('/users/signup', async (req, res) => {

    try {

        res.render('signup')
    } catch (e) {
        res.status(500).send()
    }

})
router.post('/users/signup', async (req, res) => {
    const user = new User(req.body);

    try {
        const isFirstUser = await User.countDocuments() === 0;

        if (isFirstUser) {
            user.role = 'admin'; // Set role as admin for the first user
        }else{
            user.role = 'user'
        }

        await user.save();
        const token = await user.generateAuthToken();
        res.redirect('/users/login'); // Redirect to login page
    } catch (e) {
        res.status(400).send({ error: e.message }); // Send error message
    }
});



router.get('/users/login', async (req, res) => {
    try {
        res.render('login')
    } catch (e) {
        res.status(500).send()
    }

})

router.post('/users/login', async (req, res) => {
    // console.log(req.body.email)
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.cookie('cookie name', token)

        // res.send({ user, token })
        res.redirect('/course')
    } catch (e) {
        res.status(400).redirect('/users/login')
        // res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {

    try {
        // console.log(req.cookie)
        req.user.tokens = req.user.tokens.filter((token) => {

            return token.token !== req.cookie
        })
        res.clearCookie('cookie name')
        await req.user.save()
        res.redirect('/')
    } catch (e) {
        res.status(500).send()
    }
})



router.get('/users/:id', async (req, res) => {
    const _id = req.params.id
    try {
        const user = await User.findById(_id)
        if (!user) {
            return res.status(404).send()
        }
        res.send(user)
    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/users/:id', async (req, res) => {

    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    if (!isValidOperation) {
        return res.status(400).send({ error: ' invalid updates' })
    }
    try {
        const user = await User.findById(req.params.id)
        updates.forEach((update) => user[update] = req.body[update])
        await user.save()
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

        if (!user) {
            return res.status(404).send()
        }

        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

//deleting user

router.post('/users/delete/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id)

        if (!user) {
            return res.status(404).send()
        }
        res.redirect('/users');
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/users', auth, async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).send('Unauthorized');
        }
        const users = await User.find({ role: 'user' });
        res.render('users',{users: users,user: JSON.stringify(user), role: user.role});
    } catch (e) {
        res.status(500).send();
    }
});




module.exports = router