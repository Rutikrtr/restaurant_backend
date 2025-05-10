import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }



    } catch (error) {
        throw new ApiError(500, "something went wrong")

    }
}


const signUp = asyncHandler(async(req,res)=>{

    const {fullname,email,password , accountType}=req.body

    if(!fullname || !email || !password || ! accountType){
        throw new ApiError(
            400,"all details requireds"
        )
    }
    const user = await User.create({

        fullname,
        email,
        password,
        accountType
    })

    if (!user) {
        throw new ApiError(404,"unable to add user")
    }
    res.status(200).json(
        new ApiResponse(
            200,user,"user signup successfully"
        )
    )
})

const login=asyncHandler(async(req,res)=>{
    const { email, password } = req.body

    if (!(password || email)) {
        throw new ApiError(400, "username or password required")

    }

    const user = await User.findOne(
     { email })

    if (!user) {
        throw new ApiError(400, "credentials not found")

    }

    const isPasswordValid = await user.isPasswordCorrect(password)


    if (!isPasswordValid) {
        throw new ApiError(400, "invalid password")
    }


    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedUser = await User.findById(user._id).select("-password -refreshToken")


    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user1: loggedUser, accessToken, refreshToken
                },
                "user logged in successfully"
            )
        )




})


export {signUp,login}
