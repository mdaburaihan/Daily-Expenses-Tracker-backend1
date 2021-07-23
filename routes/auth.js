const Joi = require('Joi');
const {User} = require('../models/user');
const express = require('express');
const router = express.Router();
const moment = require('moment');
const bcrypt = require('bcryptjs');

router.post('/', async(req, res) => {
    const { error } = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ user_email: req.body.email });
    if (!user) return res.status(400).send('Invalid Email.');

    const validPassword = await bcrypt.compare(req.body.password, user.user_password);
    if (!validPassword) return res.status(400).send('Invalid Password.');

    const token = user.generateAuthToken();
    res.send(JSON.stringify(token));
});

router.post('/signup', async(req, res) => {

    try{
        const schema = Joi.object().keys({
            user_name: Joi.string().required(),
            user_email: Joi.string().required(),
            user_password: Joi.string().allow(""),
            contact_no: Joi.number().allow(""),
            profile_pic: Joi.string().allow(""),
        });
     
        const { error } = Joi.validate(req.body, schema);
    
        if(error){
            res.status(403).send(error.details[0].message);
        }

        const alreadyExistUser = await User.countDocuments({ user_email: req.body.user_email });

        if(alreadyExistUser>0){
            res.status(409).send("You have already registered with us.");
            return false;
        }

        let insert_obj = {
            user_name: req.body.user_name,
            user_email: req.body.user_email,
            user_password: req.body.user_password,
            contact_no: req.body.contact_no,
            profile_pic: req.body.profile_pic,
            doc_utc: moment().unix(),
            dom_utc: moment().unix()
        }

        const salt = await bcrypt.genSalt(10);
        insert_obj.user_password = await bcrypt.hash(req.body.user_password, salt);
    
        const userObj = new User(insert_obj);
    
        const result = await userObj.save();
        if(result){
            res.status(200).send(result);
        }else{
            res.status(500).send({ message : "Some error occured." });
        }
    
        //const token = user.generateAuthToken();
        //res.send(JSON.stringify(token));
    }catch(Expp){
        console.log(Expp);
        res.status(500).send({ message : "Some error occured." });
    }
    
});

function validate(req){
    const schema = {
        email: Joi.string().required().email(),
        password: Joi.string().required()
    };

    return Joi.validate(req, schema);
 }

module.exports = router;