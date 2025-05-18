import mongoose from "mongoose"

import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema =new  mongoose.Schema({

    fullname:{
        type:String,
        required:true,

    },
    email:{
        type:String,
        required:true,
        unique:true,
         match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password:{
        type:String,
        required:[true,"password required"],
        minlength: [8, 'Password must be at least 8 characters long'],
        maxlength: [20, 'Password cannot exceed 32 characters']
    },
    accountType:{
        type:String,
       required:true,
       enum :['customer','restaurant','superadmin']
    }


},{timestamps:true})


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})


userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}



userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
           
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET, // Correct secret for access tokens
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY // Example: '15m'
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET, // Correct secret for refresh tokens
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY // Example: '7d'
        }
    );
};




export const User = mongoose.model("User",userSchema)