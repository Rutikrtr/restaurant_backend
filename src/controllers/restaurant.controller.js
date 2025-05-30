import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Restaurant } from "../models/restaurant.model.js";
import { User } from "../models/user.model.js";
import nodemailer from "nodemailer";

// Email configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'feastnation6972@gmail.com',
            pass: 'snhe lrbq wczc qubl' || 'snhelrbqwczcqubl' 
        }
    });
};

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email for restaurant registration
const sendRestaurantOTPEmail = async (email, otp, fullname) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: 'feastnation6972@gmail.com',
            to: email,
            subject: 'Restaurant Registration - Email Verification',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Restaurant Registration - Email Verification</h2>
                    <p>Dear ${fullname},</p>
                    <p>To complete your restaurant registration, please verify your email address using the OTP below:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #007bff; font-size: 36px; margin: 0; letter-spacing: 5px;">${otp}</h1>
                        <p style="color: #666; margin: 10px 0 0 0;">This OTP will expire in 10 minutes</p>
                    </div>
                    
                    <p>After email verification, your restaurant will be submitted for admin approval.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated email. Please do not reply to this message.<br>
                        © 2024 FeastNation. All rights reserved.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Restaurant OTP email sent successfully to:', email);
        return true;
    } catch (error) {
        console.error('Error sending restaurant OTP email:', error);
        return false;
    }
};

const sendRegistrationEmail = async (userEmail, restaurantName, fullname) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: 'feastnation6972@gmail.com',
            to: userEmail,
            subject: 'Restaurant Registration - Pending Approval',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Restaurant Registration Successful!</h2>
                    <p>Dear ${fullname},</p>
                    <p>Thank you for registering your restaurant <strong>${restaurantName}</strong> with our platform.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0;">
                        <h3 style="color: #856404; margin-top: 0;">⏳ Approval Pending</h3>
                        <p style="margin-bottom: 0;">Your restaurant registration is currently under review by our admin team. You will receive another email once your restaurant has been approved and is ready to go live.</p>
                    </div>
                    
                    <h3>What happens next?</h3>
                    <ul>
                        <li>Our team will review your restaurant details</li>
                        <li>You'll receive an approval notification within 24-48 hours</li>
                        <li>Once approved, you can start managing your restaurant profile</li>
                    </ul>
                    
                    <p>If you have any questions, please don't hesitate to contact our support team.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated email. Please do not reply to this message.<br>
                        © 2024 FeastNation. All rights reserved.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Registration email sent successfully to:', userEmail);
        return true;
    } catch (error) {
        console.error('Error sending registration email:', error);
        return false;
    }
};

const sendAdminNotification = async (restaurantData, userData) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: 'feastnation6972@gmail.com',
            to: 'feastnation6972@gmail.com', // Admin email
            subject: 'New Restaurant Registration - Approval Required',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc3545;">New Restaurant Registration</h2>
                    <p>A new restaurant has been registered and requires approval.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Restaurant Details:</h3>
                        <p><strong>Restaurant Name:</strong> ${restaurantData.name}</p>
                        <p><strong>Manager:</strong> ${userData.fullname}</p>
                        <p><strong>Email:</strong> ${userData.email}</p>
                        <p><strong>Location:</strong> ${restaurantData.location}</p>
                        <p><strong>Opening Hours:</strong> ${restaurantData.openingTime} - ${restaurantData.closingTime}</p>
                        <p><strong>Introduction:</strong> ${restaurantData.introduction}</p>
                        <p><strong>Registration Date:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <p style="color: #dc3545; font-weight: bold;">⚠️ Action Required: Please review and approve this registration.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Admin notification sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending admin notification:', error);
        return false;
    }
};

// Step 1: Initial restaurant registration - Send OTP
const registerRestaurant = asyncHandler(async (req, res) => {
    // Extract all required fields from request body
    const {
        email,
        password,
        accountType,
        fullname,
        name,
        introduction,
        openingTime,
        closingTime,
        location,
        image
    } = req.body;

    // Validate all required fields
    const requiredFields = [
        'email', 'password', 'accountType', 'fullname',
        'name', 'introduction', 'openingTime', 'closingTime',
        'location', 'image'
    ];

    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({
                success: false,
                message: `${field} is required`
            });
        }
    }

    // Validate account type
    if (accountType !== "restaurant") {
        return res.status(400).json({
            success: false,
            message: "Invalid account type - must be 'restaurant'"
        });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: "User already exists with this email"
        });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user (not verified yet)
    const user = await User.create({
        email,
        password,
        accountType,
        fullname,
        restaurantId: null,
        isEmailVerified: false,
        emailVerificationOTP: otp,
        otpExpiry: otpExpiry
    });

    if (!user) {
        return res.status(500).json({
            success: false,
            message: "Failed to create user account"
        });
    }

    // Send OTP email
    const emailSent = await sendRestaurantOTPEmail(email, otp, fullname);
    
    if (!emailSent) {
        // Clean up if email sending fails
        await User.deleteOne({ _id: user._id });
        return res.status(500).json({
            success: false,
            message: 'Failed to send verification email. Please try again.'
        });
    }

    // Store restaurant data temporarily (you might want to use a separate temp collection)
    // For now, we'll pass it back to the frontend to send with verification
    return res.status(201).json({
        success: true,
        data: {
            userId: user._id,
            email: email,
            restaurantData: {
                name,
                introduction,
                openingTime,
                closingTime,
                location,
                image
            }
        },
        message: "OTP sent to your email. Please verify to complete restaurant registration."
    });
});

// Step 2: Verify OTP and complete restaurant registration
const verifyRestaurantOTP = asyncHandler(async (req, res) => {
    const { 
        userId, 
        otp, 
        restaurantData // Restaurant details from frontend
    } = req.body;

    if (!userId || !otp || !restaurantData) {
        return res.status(400).json({
            success: false,
            message: 'User ID, OTP, and restaurant data are required'
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

    // Create restaurant after email verification
    const restaurant = await Restaurant.create({
        name: restaurantData.name,
        introduction: restaurantData.introduction,
        openingTime: restaurantData.openingTime,
        closingTime: restaurantData.closingTime,
        location: restaurantData.location,
        image: restaurantData.image,
        approvalStatus: "pending",
        manager: user._id,
        managerEmail: user.email,
        rating: 0,
        categories: []
    });

    if (!restaurant) {
        return res.status(500).json({
            success: false,
            message: "Failed to create restaurant"
        });
    }

    // Update user - verify email and link restaurant
    user.isEmailVerified = true;
    user.restaurantId = restaurant._id;
    user.emailVerificationOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Send emails (don't let email failures affect the registration process)
    try {
        // Send confirmation email to restaurant owner
        await sendRegistrationEmail(user.email, restaurant.name, user.fullname);
        
        // Send notification to admin
        await sendAdminNotification(restaurant, user);
    } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue with successful response even if email fails
    }

    return res.status(201).json({
        success: true,
        data: {
            restaurant: {
                _id: restaurant._id,
                name: restaurant.name,
                location: restaurant.location,
                approvalStatus: restaurant.approvalStatus
            },
            user: {
                _id: user._id,
                email: user.email,
                fullname: user.fullname,
                isEmailVerified: user.isEmailVerified
            }
        },
        message: "Restaurant registered successfully! Your registration is pending admin approval. Confirmation emails have been sent."
    });
});

// Resend OTP function
const resendRestaurantOTP = asyncHandler(async (req, res) => {
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
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new OTP
    user.emailVerificationOTP = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    const emailSent = await sendRestaurantOTPEmail(user.email, otp, user.fullname);
    
    if (!emailSent) {
        return res.status(500).json({
            success: false,
            message: 'Failed to send verification email. Please try again.'
        });
    }

    return res.status(200).json({
        success: true,
        message: 'New OTP sent to your email successfully.'
    });
});

// Get all restaurants
const getAllRestaurants = asyncHandler(async (req, res) => {
    const restaurants = await Restaurant.find({})
        .select('name introduction openingTime closingTime location image rating categories managerEmail approvalStatus')
        .lean();

    return res.status(200).json({
        success: true,
        data: restaurants,
        message: "Restaurants fetched successfully"
    });
});

// Get restaurant by manager
const getRestaurantByManager = asyncHandler(async (req, res) => {
    try {
        // 1. Authentication Check
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - Please login first"
            });
        }

        // 2. Authorization Check
        if (req.user.accountType !== "restaurant") {
            return res.status(403).json({
                success: false,
                message: "Only restaurant accounts can access this information"
            });
        }

        // 3. Find Restaurant with Population
        const restaurant = await Restaurant.findOne({ manager: req.user._id })
            .populate('manager', 'fullname email')  // Populate manager details
            .populate('menu')  // Populate menu items if needed
            .lean();  // Convert to plain JS object

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "No restaurant found for this manager"
            });
        }

        // 4. Transform Response Data
        const responseData = {
            _id: restaurant._id,
            name: restaurant.name,
            categories: restaurant.categories,
            menu: restaurant.menu,
            // Add other necessary fields
            manager: {
                _id: req.user._id,
                name: req.user.fullname,
                email: req.user.email
            }
        };

        // 5. Send Response
        return res.status(200).json({
            success: true,
            data: responseData,
            message: "Restaurant details fetched successfully"
        });

    } catch (error) {
        console.error("Error in getRestaurantByManager:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching restaurant data"
        });
    }
});

// Get restaurant details (with authentication)
const getRestaurantDetails = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    const restaurant = await Restaurant.findById(req.params.id)
        .populate({
            path: 'menu',
            select: 'name description price category image available'
        })
        .lean();

    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: "Restaurant not found"
        });
    }

    return res.status(200).json({
        success: true,
        data: {
            id: restaurant._id,
            name: restaurant.name,
            introduction: restaurant.introduction,
            openingTime: restaurant.openingTime,
            closingTime: restaurant.closingTime,
            location: restaurant.location,
            image: restaurant.image,
            rating: restaurant.rating,
            categories: restaurant.categories,
            menu: restaurant.menu,
            approvalStatus: restaurant.approvalStatus
        },
        message: "Restaurant details fetched successfully"
    });
});

// Get restaurant by ID (public access)
const getRestaurantById = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
            success: false,
            message: "Invalid restaurant ID fat"
        });
    }
  
    const restaurant = await Restaurant.findById(id)
        .select('-manager -__v')
        .populate({
            path: 'menu',
            match: { available: true },
            select: 'name description price category image'
        });
  
    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: "Restaurant not found"
        });
    }
  
    return res.status(200).json({
        success: true,
        data: restaurant,
        message: "Restaurant details fetched successfully"
    });
});

// Update restaurant details (only by manager)
const updateRestaurant = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    if (req.user.accountType !== "restaurant") {
        return res.status(403).json({
            success: false,
            message: "Only restaurant managers can update restaurant details"
        });
    }

    const restaurant = await Restaurant.findOne({ manager: req.user._id });
    
    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: "No restaurant found for this manager"
        });
    }

    const allowedUpdates = ['name', 'introduction', 'openingTime', 'closingTime', 'location', 'image'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            success: false,
            message: "No valid fields to update"
        });
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
        restaurant._id,
        updates,
        { new: true, runValidators: true }
    );

    return res.status(200).json({
        success: true,
        data: updatedRestaurant,
        message: "Restaurant updated successfully"
    });
});

export { 
    registerRestaurant,
    verifyRestaurantOTP,
    resendRestaurantOTP,
    getAllRestaurants,
    getRestaurantByManager,
    getRestaurantById,
    getRestaurantDetails,
    updateRestaurant
};