import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Restaurant } from "../models/restaurant.model.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

// Email configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'feastnation6972@gmail.com',
            pass: 'snhe lrbq wczc qubl'
        }
    });
};

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, fullname) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: 'feastnation6972@gmail.com',
            to: email,
            subject: 'Email Verification - FeastNation',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Email Verification Required</h2>
                    <p>Dear ${fullname},</p>
                    <p>To complete your registration, please verify your email address using the OTP below:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #007bff; font-size: 36px; margin: 0; letter-spacing: 5px;">${otp}</h1>
                        <p style="color: #666; margin: 10px 0 0 0;">This OTP will expire in 10 minutes</p>
                    </div>
                    
                    <p>If you didn't request this verification, please ignore this email.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated email. Please do not reply to this message.<br>
                        © 2024 FeastNation. All rights reserved.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
};

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

// Step 1: Initial signup - Send OTP
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

    // Generate and send OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store user data temporarily with OTP
    const tempUser = await User.create({
        fullname,
        email,
        password,
        accountType,
        isEmailVerified: false,
        emailVerificationOTP: otp,
        otpExpiry: otpExpiry
    });

    if (!tempUser) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create user'
        });
    }

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, fullname);
    
    if (!emailSent) {
        // Clean up if email sending fails
        await User.deleteOne({ _id: tempUser._id });
        return res.status(500).json({
            success: false,
            message: 'Failed to send verification email. Please try again.'
        });
    }

    return res.status(201).json({
        success: true,
        data: {
            userId: tempUser._id,
            email: email,
            message: 'OTP sent to your email. Please verify to complete registration.'
        },
        message: 'Verification OTP sent to your email'
    });
});

// Step 2: Verify OTP and complete registration
const verifyEmailOTP = asyncHandler(async (req, res) => {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
        return res.status(400).json({
            success: false,
            message: 'User ID and OTP are required'
        });
    }

    // Find user with matching OTP
    const user = await User.findById(userId);
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Check if already verified
    if (user.isEmailVerified) {
        return res.status(400).json({
            success: false,
            message: 'Email already verified'
        });
    }

    // Check OTP validity
    if (user.emailVerificationOTP !== otp) {
        return res.status(400).json({
            success: false,
            message: 'Invalid OTP'
        });
    }

    // Check OTP expiry
    if (new Date() > user.otpExpiry) {
        return res.status(400).json({
            success: false,
            message: 'OTP has expired. Please request a new one.'
        });
    }

    // Verify email and clear OTP fields
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Return response without sensitive data
    const verifiedUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationOTP");

    return res.status(200).json({
        success: true,
        data: verifiedUser,
        message: 'Email verified successfully. Registration completed!'
    });
});

// Resend OTP
const resendOTP = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'User ID is required'
        });
    }

    const user = await User.findById(userId);
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    if (user.isEmailVerified) {
        return res.status(400).json({
            success: false,
            message: 'Email already verified'
        });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.emailVerificationOTP = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send new OTP
    const emailSent = await sendOTPEmail(user.email, otp, user.fullname);
    
    if (!emailSent) {
        return res.status(500).json({
            success: false,
            message: 'Failed to send verification email. Please try again.'
        });
    }

    return res.status(200).json({
        success: true,
        message: 'New OTP sent to your email'
    });
});

// Modified login functions to check email verification
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

    // Check if email is verified
    if (!user.isEmailVerified) {
        return res.status(403).json({
            success: false,
            message: 'Please verify your email before logging in',
            requiresVerification: true,
            userId: user._id
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
                    message: 'Restaurant approval is pending. Please wait for admin approval.'
                });
            case 'rejected':
                return res.status(403).json({
                    success: false,
                    message: 'Restaurant application rejected. Contact admin for support.'
                });
            case 'stop':
                return res.status(403).json({
                    success: false,
                    message: 'Your Restaurant is temporarily stopped... Contact admin'
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
        .select("-password -refreshToken -emailVerificationOTP")
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

// Customer Login Controller with email verification check
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

    // Check if email is verified
    if (!user.isEmailVerified) {
        return res.status(403).json({
            success: false,
            message: 'Please verify your email before logging in',
            requiresVerification: true,
            userId: user._id
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

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationOTP");

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
    verifyEmailOTP,
    resendOTP,
    loginSuperRestaurent,
    loginCustomer,
    logout
};