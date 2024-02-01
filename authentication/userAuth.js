const User = require("../models/userModel");
const userIn = async(req,res,next)=>{
    try{
        if(req.session.user){
            next();
        }else{
            res.redirect("/Login");
        }
    }catch(error){
        console.log(error.message);
    }
}

const userNotIn = async(req,res,next)=>{
    try{
        if(!req.session.user){
            next();
        }else{
            res.redirect("/Home");
        }
    }catch(error){
        console.log(error.message);
    }
}

const userValid = async(req,res,next)=>{
    try{
        const findUser = ()=>{
            return new Promise((resolve,reject)=>{
                User.findOne({email:req.session.user})
                .then(user=>{
                    resolve(user);
                })
                .catch(error=>{
                    reject(error)
                })
            })
        }

        findUser()
        .then(user=>{
            if(user.isBlocked){
                delete req.session.user;
                res.redirect("/");
            }else{
                next();
            }
        })
        .catch(error=>{
            console.log(error.message);
            res.redirect("/");
        })
        
    }catch(error){
        console.log(error.message)
    }
}


module.exports ={
    userNotIn,
    userIn,
    userValid
}