import { asyncHandler } from "../utils/asyncHandler.js";
import { Restaurant } from "../models/restaurant.model.js";
import { User } from "../models/user.model.js";
import nodemailer from "nodemailer";

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'feastnation6972@gmail.com',
            pass: 'snhe lrbq wczc qubl' || 'snhelrbqwczcqubl' 
        }
    });
};

// Send approval email to restaurant owner
const sendApprovalEmail = async (restaurant) => {
    try {
        const transporter = createTransporter();
        
        // Get user details
        const user = await User.findById(restaurant.manager);
        if (!user) {
            console.error('User not found for restaurant:', restaurant._id);
            return false;
        }

        const mailOptions = {
            from: 'feastnation6972@gmail.com',
            to: user.email,
            subject: '🎉 Restaurant Approved - Welcome to FeastNation!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #28a745, #20c997); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
                        <p style="margin: 10px 0 0 0; font-size: 18px;">Your restaurant has been approved!</p>
                    </div>
                    
                    <div style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 10px 10px;">
                        <p>Dear ${user.fullname},</p>
                        <p>Great news! Your restaurant <strong>${restaurant.name}</strong> has been successfully approved and is now live on our platform.</p>
                        
                        <div style="background-color: #d4edda; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0; border-radius: 5px;">
                            <h3 style="color: #155724; margin-top: 0;">✅ You can now:</h3>
                            <ul style="color: #155724; margin-bottom: 0;">
                                <li>Manage your restaurant profile</li>
                                <li>Add and update menu items</li>
                                <li>View and respond to customer reviews</li>
                                <li>Track orders and manage inventory</li>
                                <li>Access analytics and insights</li>
                            </ul>
                        </div>
                        
                        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 5px;">
                            <h4 style="color: #856404; margin-top: 0;">📋 Restaurant Details:</h4>
                            <p style="margin: 5px 0; color: #856404;"><strong>Name:</strong> ${restaurant.name}</p>
                            <p style="margin: 5px 0; color: #856404;"><strong>Location:</strong> ${restaurant.location}</p>
                            <p style="margin: 5px 0; color: #856404;"><strong>Hours:</strong> ${restaurant.openingTime} - ${restaurant.closingTime}</p>
                            <p style="margin: 5px 0; color: #856404;"><strong>Status:</strong> Active</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="#" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Access Dashboard</a>
                        </div>
                        
                        <p>If you have any questions or need assistance getting started, our support team is here to help.</p>
                        <p>Welcome to the FeastNation family!</p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #666; font-size: 12px; text-align: center;">
                        This is an automated email. Please do not reply to this message.<br>
                        © 2024 FeastNation. All rights reserved.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Approval email sent successfully to:', user.email);
        return true;
    } catch (error) {
        console.error('Error sending approval email:', error);
        return false;
    }
};

// Send rejection email to restaurant owner
const sendRejectionEmail = async (restaurant) => {
    try {
        const transporter = createTransporter();
        
        // Get user details
        const user = await User.findById(restaurant.manager);
        if (!user) {
            console.error('User not found for restaurant:', restaurant._id);
            return false;
        }

        const mailOptions = {
            from: 'feastnation6972@gmail.com',
            to: user.email,
            subject: 'Restaurant Registration Update - FeastNation',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #dc3545; padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 24px;">Registration Update</h1>
                    </div>
                    
                    <div style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 10px 10px;">
                        <p>Dear ${user.fullname},</p>
                        <p>Thank you for your interest in joining FeastNation with your restaurant <strong>${restaurant.name}</strong>.</p>
                        
                        <div style="background-color: #f8d7da; padding: 20px; border-left: 4px solid #dc3545; margin: 20px 0; border-radius: 5px;">
                            <h3 style="color: #721c24; margin-top: 0;">Registration Status Update</h3>
                            <p style="color: #721c24; margin-bottom: 0;">Unfortunately, your restaurant registration could not be approved at this time. This may be due to incomplete information, policy requirements, or other factors.</p>
                        </div>
                        
                        <h3>What you can do:</h3>
                        <ul>
                            <li>Review your registration details</li>
                            <li>Contact our support team for specific feedback</li>
                            <li>Reapply once any issues have been addressed</li>
                        </ul>
                        
                        <p>We encourage you to reach out to our support team who can provide more detailed feedback and assist you with the reapplication process.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="mailto:feastnation6972@gmail.com" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Contact Support</a>
                        </div>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #666; font-size: 12px; text-align: center;">
                        This is an automated email. Please do not reply to this message.<br>
                        © 2024 FeastNation. All rights reserved.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Rejection email sent successfully to:', user.email);
        return true;
    } catch (error) {
        console.error('Error sending rejection email:', error);
        return false;
    }
};

// Send status change email (for stop status)
const sendStatusChangeEmail = async (restaurant, status) => {
    try {
        const transporter = createTransporter();
        
        // Get user details
        const user = await User.findById(restaurant.manager);
        if (!user) {
            console.error('User not found for restaurant:', restaurant._id);
            return false;
        }

        let statusMessage, statusColor, statusIcon;
        
        switch(status) {
            case 'stop':
                statusMessage = 'Your restaurant has been temporarily suspended';
                statusColor = '#ffc107';
                statusIcon = '⚠️';
                break;
            case 'approved':
                statusMessage = 'Your restaurant has been reactivated';
                statusColor = '#28a745';
                statusIcon = '✅';
                break;
            default:
                statusMessage = `Your restaurant status has been updated to ${status}`;
                statusColor = '#6c757d';
                statusIcon = 'ℹ️';
        }

        const mailOptions = {
            from: 'feastnation6972@gmail.com',
            to: user.email,
            subject: `Restaurant Status Update - ${restaurant.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: ${statusColor}; padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 24px;">${statusIcon} Status Update</h1>
                    </div>
                    
                    <div style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 10px 10px;">
                        <p>Dear ${user.fullname},</p>
                        <p>${statusMessage}.</p>
                        
                        <div style="background-color: white; padding: 20px; border-left: 4px solid ${statusColor}; margin: 20px 0; border-radius: 5px;">
                            <h4 style="margin-top: 0;">Restaurant: ${restaurant.name}</h4>
                            <p style="margin: 5px 0;"><strong>New Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
                            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        
                        ${status === 'stop' ? `
                            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 5px;">
                                <p style="color: #856404; margin: 0;"><strong>What this means:</strong> Your restaurant is temporarily unavailable to customers. Please contact support for more information.</p>
                            </div>
                        ` : ''}
                        
                        <p>If you have any questions about this status change, please don't hesitate to contact our support team.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="mailto:feastnation6972@gmail.com" style="background-color: ${statusColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Contact Support</a>
                        </div>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #666; font-size: 12px; text-align: center;">
                        This is an automated email. Please do not reply to this message.<br>
                        © 2024 FeastNation. All rights reserved.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Status change email sent successfully to: ${user.email} for status: ${status}`);
        return true;
    } catch (error) {
        console.error('Error sending status change email:', error);
        return false;
    }
};

const updateRestaurantApproval = asyncHandler(async (req, res) => {
    const { status, restaurantId } = req.body;

    // Superadmin verification
    if (!req.user || req.user.accountType !== 'superadmin') {
        return res.status(403).json({
            success: false,
            message: "Only superadmins can perform this action"
        });
    }

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid status provided"
        });
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
        restaurantId,
        { approvalStatus: status },
        { new: true }
    ).populate('manager', 'fullname email');

    if (!updatedRestaurant) {
        return res.status(404).json({
            success: false,
            message: "Restaurant not found"
        });
    }

    // Send appropriate email based on status
    try {
        if (status === 'approved') {
            await sendApprovalEmail(updatedRestaurant);
        } else if (status === 'rejected') {
            await sendRejectionEmail(updatedRestaurant);
        }
    } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue with successful response even if email fails
    }

    return res.status(200).json({
        success: true,
        data: updatedRestaurant,
        message: `Restaurant ${status} successfully. Notification email sent.`
    });
});

const changeRestaurantStatus = asyncHandler(async (req, res) => {
    const { status, restaurantId } = req.body;

    // Superadmin verification
    if (!req.user || req.user.accountType !== 'superadmin') {
        return res.status(403).json({
            success: false,
            message: "Only superadmins can perform this action"
        });
    }

    // Validate status
    if (!['approved', 'rejected', 'stop'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid status provided"
        });
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
        restaurantId,
        { approvalStatus: status },
        { new: true }
    ).populate('manager', 'fullname email');

    if (!updatedRestaurant) {
        return res.status(404).json({
            success: false,
            message: "Restaurant not found"
        });
    }

    // Send status change email
    try {
        await sendStatusChangeEmail(updatedRestaurant, status);
    } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue with successful response even if email fails
    }

    return res.status(200).json({
        success: true,
        data: updatedRestaurant,
        message: `Restaurant status updated to ${status} successfully. Notification email sent.`
    });
});



const pendingRestaurants = asyncHandler(async (req, res) => {
    // Superadmin verification
    if (!req.user || req.user.accountType !== 'superadmin') {
        return res.status(403).json({
            success: false,
            message: "Only superadmins can perform this action"
        });
    }

    // Fetch all restaurants with pending approval status
    const restaurants = await Restaurant.find({ approvalStatus: 'pending' });

    if (restaurants.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No pending restaurant approvals found"
        });
    }

    return res.status(200).json({
        success: true,
        data: restaurants,
        message: "Pending restaurant approvals fetched successfully"
    });
}
);

export {
    updateRestaurantApproval,
    pendingRestaurants,
    changeRestaurantStatus
}