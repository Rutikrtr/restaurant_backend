import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Restaurant } from "../models/restaurant.model.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        return null;
    }
}

const signUp = asyncHandler(async (req, res) => {
    const { fullname, email, password, accountType } = req.body;

    // Validation
    if (!fullname || !email || !password || !accountType) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }

    if (accountType === 'superadmin') {
        return res.status(403).json({
            success: false,
            message: 'Cannot create superadmin account via signup'
        });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: 'User with this email already exists'
        });
    }

    // Create user
    const user = await User.create({
        fullname,
        email,
        password,
        accountType
    });

    if (!user) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create user'
        });
    }

    // Return response without sensitive data
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    return res.status(201).json({
        success: true,
        data: createdUser,
        message: 'User registered successfully'
    });
});



// const login = asyncHandler(async (req, res) => {
//     const { email, password } = req.body;

//     if (!email || !password) {
//         return res.status(400).json({
//             success: false,
//             message: 'Email and password are required'
//         });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//         return res.status(404).json({
//             success: false,
//             message: 'User not found'
//         });
//     }

//     const isPasswordValid = await user.isPasswordCorrect(password);
//     if (!isPasswordValid) {
//         return res.status(401).json({
//             success: false,
//             message: 'Invalid credentials'
//         });
//     }

//     const tokens = await generateAccessAndRefreshToken(user._id);
//     if (!tokens) {
//         return res.status(500).json({
//             success: false,
//             message: 'Failed to generate tokens'
//         });
//     }

//     const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

//     let responseData = {
//         user: loggedInUser,
//         accessToken: tokens.accessToken,
//         refreshToken: tokens.refreshToken
//     };

//     // Fetch data from User collection based on accountType
//     // auth.controller.js (login controller update)
//     if (loggedInUser.accountType === 'superadmin') {
//         try {
//             const [pendingRestaurants, customerData] = await Promise.all([
//                 Restaurant.find({ approvalStatus: 'pending' }),
//                 User.find({ accountType: 'customer' }).select("-password")
//             ]);

//             responseData = {
//                 ...responseData,
//                 pendingRestaurants,
//                 customerData
//             };
//         } catch (error) {
//             console.error("Error fetching superadmin data:", error);
//             return res.status(500).json({
//                 success: false,
//                 message: 'Error fetching superadmin data'
//             });
//         }
//     }

//     const options = {
//         httpOnly: true,
//         secure: true
//     };

//     return res
//         .status(200)
//         .cookie("accessToken", tokens.accessToken, options)
//         .cookie("refreshToken", tokens.refreshToken, options)
//         .json({
//             success: true,
//             data: responseData,
//             message: 'User logged in successfully'
//         });
// });


// const loginSuperadmin = asyncHandler(async (req, res) => {
//     const { email, password } = req.body;

//     if (!email || !password) {
//         return res.status(400).json({
//             success: false,
//             message: 'Email and password are required'
//         });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//         return res.status(404).json({
//             success: false,
//             message: 'User not found'
//         });
//     }

//     if (user.accountType !== 'superadmin') {
//         return res.status(403).json({
//             success: false,
//             message: 'Access forbidden for non-superadmin users'
//         });
//     }

//     const isPasswordValid = await user.isPasswordCorrect(password);
//     if (!isPasswordValid) {
//         return res.status(401).json({
//             success: false,
//             message: 'Invalid credentials'
//         });
//     }

//     const tokens = await generateAccessAndRefreshToken(user._id);
//     if (!tokens) {
//         return res.status(500).json({
//             success: false,
//             message: 'Failed to generate tokens'
//         });
//     }

//     const [pendingRestaurants, customerData] = await Promise.all([
//         Restaurant.find({ approvalStatus: 'pending' }),
//         User.find({ accountType: 'customer' }).select("-password")
//     ]);

//     const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

//     const options = {
//         httpOnly: true,
//         secure: true
//     };

//     return res
//         .status(200)
//         .cookie("accessToken", tokens.accessToken, options)
//         .cookie("refreshToken", tokens.refreshToken, options)
//         .json({
//             success: true,
//             data: {
//                 user: loggedInUser,
//                 accessToken: tokens.accessToken,
//                 refreshToken: tokens.refreshToken,
//                 pendingRestaurants,
//                 customerData
//             },
//             message: 'Superadmin logged in successfully'
//         });
// });

// // Restaurant Login Controller
// const loginRestaurant = asyncHandler(async (req, res) => {
//     const { email, password } = req.body;

//     if (!email || !password) {
//         return res.status(400).json({
//             success: false,
//             message: 'Email and password are required'
//         });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//         return res.status(404).json({
//             success: false,
//             message: 'User not found'
//         });
//     }

//     if (user.accountType !== 'restaurant') {
//         return res.status(403).json({
//             success: false,
//             message: 'Access forbidden for non-restaurant accounts'
//         });
//     }

//     const isPasswordValid = await user.isPasswordCorrect(password);
//     if (!isPasswordValid) {
//         return res.status(401).json({
//             success: false,
//             message: 'Invalid credentials'
//         });
//     }

//     const tokens = await generateAccessAndRefreshToken(user._id);
//     if (!tokens) {
//         return res.status(500).json({
//             success: false,
//             message: 'Failed to generate tokens'
//         });
//     }

//     const restaurantProfile = await Restaurant.findOne({ manager: user._id });
//     const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

//     const options = {
//         httpOnly: true,
//         secure: true
//     };

//     return res
//         .status(200)
//         .cookie("accessToken", tokens.accessToken, options)
//         .cookie("refreshToken", tokens.refreshToken, options)
//         .json({
//             success: true,
//             data: {
//                 user: loggedInUser,
//                 accessToken: tokens.accessToken,
//                 refreshToken: tokens.refreshToken,
//                 restaurant: restaurantProfile
//             },
//             message: 'Restaurant logged in successfully'
//         });
// });



const loginSuperRestaurent = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Validate account type
    if (!['superadmin', 'restaurant'].includes(user.accountType)) {
        return res.status(403).json({
            success: false,
            message: 'Access forbidden. Only superadmin and restaurant accounts can login here'
        });
    }

    // Validate password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: 'Invalid Password'
        });
    }

    // Restaurant-specific checks
    if (user.accountType === 'restaurant') {
        const restaurantProfile = await Restaurant.findOne({ manager: user._id });

        if (!restaurantProfile) {
            return res.status(403).json({
                success: false,
                message: 'No restaurant profile found for this account'
            });
        }

        switch (restaurantProfile.approvalStatus) {
            case 'pending':
                return res.status(403).json({
                    success: false,
                    message: 'Restaurant approval is pending. Please wait for rutik approval.'
                });
            case 'rejected':
                return res.status(403).json({
                    success: false,
                    message: 'Restaurant application rejected. Contact rutik for support.'
                });
            case 'stop':
                return res.status(403).json({
                    success: false,
                    message: 'Your Restaurent is temporary Stop... Contact to rutik'
                });
            case 'approved':
                break; // Proceed with login
            default:
                return res.status(403).json({
                    success: false,
                    message: 'Invalid restaurant status'
                });
        }
    }

    // Generate tokens
    const tokens = await generateAccessAndRefreshToken(user._id);
    if (!tokens) {
        return res.status(500).json({
            success: false,
            message: 'Failed to generate tokens'
        });
    }

    // Prepare response data
    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken")
        .lean();

    const responseData = {
        user: loggedInUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
    };

    let message = '';

    if (user.accountType === 'restaurant') {
        const restaurantProfile = await Restaurant.findOne({ manager: user._id }).lean();
        responseData.restaurant = restaurantProfile;
        message = 'Restaurant logged in successfully';
    } else {
        message = 'Superadmin logged in successfully';
    }

    // Set cookies
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    return res
        .status(200)
        .cookie("accessToken", tokens.accessToken, options)
        .cookie("refreshToken", tokens.refreshToken, options)
        .json({
            success: true,
            data: responseData,
            message: message
        });
});

// Customer Login Controller
const loginCustomer = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    if (user.accountType !== 'customer') {
        return res.status(403).json({
            success: false,
            message: 'Access forbidden for non-customer accounts'
        });
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    const tokens = await generateAccessAndRefreshToken(user._id);
    if (!tokens) {
        return res.status(500).json({
            success: false,
            message: 'Failed to generate tokens'
        });
    }

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie("accessToken", tokens.accessToken, options)
        .cookie("refreshToken", tokens.refreshToken, options)
        .json({
            success: true,
            data: {
                user: loggedInUser,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            },
            message: 'Customer logged in successfully'
        });
});

const logout = asyncHandler(async (req, res) => {
    // Update user document to remove refresh token
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // This removes the field from document
            }
        },
        {
            new: true
        }
    );

    // Configure cookie clearing options
    const options = {
        httpOnly: true,
        secure: true
    };

    // Clear cookies and send response
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json({
            success: true,
            message: 'User logged out successfully'
        });
});



export { 
    signUp, 
   loginSuperRestaurent,
    loginCustomer ,
    logout
};
