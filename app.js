//jshint esversion:6
//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 9;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//const md5 = require("md5");
//const encrypt = require("mongoose-encryption");

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(session({
  secret: 'little secret secrets',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

//establish connection to db
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology: true,useFindAndModify: false,useCreateIndex: true });


const userSchema = new mongoose.Schema({
email : String,
password: String,
secret : [{type:String}]
});


userSchema.plugin(passportLocalMongoose);

//userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields : ["password"]});
const User = mongoose.model("User", userSchema);
// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/",function(req,res){
res.render("home");
});

app.get("/login",function(req,res){
res.render("login");
});

app.get("/register",function(req,res){
res.render("register");
});

app.get("/secrets",function(req,res){
User.find({"secret":{$ne:null}},function(err,foundUsers){
if(err){
 console.log(err);
}
else{
 if(foundUsers){
 res.render("secrets",{usersWithSecrets:foundUsers});
 }
}
});
	
	/*if(req.isAuthenticated()){
	res.render("secrets");
	}
	else{
	res.redirect("/login");
	}*/

});

app.get("/submit",function(req,res){
if(req.isAuthenticated()){
res.render("submit");
}
else{
res.redirect("/login");
}

});


app.get("/logout",function(req,res){
req.logout();
res.redirect("/");
});

app.post("/register",function(req,res){

User.register({username: req.body.username}, req.body.password, function(err,user){
if(err){
console.log(err);
res.redirect("/register");
}
else{
passport.authenticate("local")(req,res,function(){
res.redirect("/secrets");
});
}

});
	/*bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
	const newUser = new User ({
	email:req.body.username,
	password:hash
	});

	newUser.save(function(err){
	  if(err){
	  console.log(err);
	  }
	  else{
	  res.render("secrets");
	  }
	});

	});*/
});

app.post("/login",function(req,res){
const user = new User({
username: req.body.username,
password: req.body.pasword
});

req.login(user,function(err){
if(err){
console.log(err);
}
else{
passport.authenticate("local")(req,res,function(){
res.redirect("/secrets");
});
}

});
	/*const username = req.body.username;
	const password = req.body.password;

	User.findOne({email:username},function(err,foundUser){
	if(err){
	  console.log(err);
	}
	else{
	  if(foundUser){
	    bcrypt.compare(password,foundUser.password, function(err, result) {
	    if(result == true){
	     res.render("secrets");
	    }
	    });
	    
	  }
	}
	});*/

});

app.post("/submit",function(req,res){
const submittedSecret = req.body.secret;

User.findById(req.user.id, function(err,foundUser){
	if(err){
	console.log(err);
	}
	else{
		if(foundUser){
		foundUser.secret.push(submittedSecret);
		foundUser.save();
		res.redirect("/secrets");
		}
	}
});


});




app.listen(3000,function(){
console.log("starting server 3000");
});
