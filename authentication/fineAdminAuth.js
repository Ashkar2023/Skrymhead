const adminIn = async(req,res,next)=>{
    try{
        if(req.session.admin){
            next();
        }else{
            res.redirect("/fine/Login");
        }
    }catch(error){
        console.log(error.message);
    }
}

const adminNotIn = async(req,res,next)=>{
    try{
        if(!req.session.admin){
            next();
        }else{
            res.redirect("/fine");
        }
    }catch(error){
        console.log(error.message);
    }
}

module.exports ={
    adminIn,
    adminNotIn
}