
import { asyncHandler } from "../utils/asyncHandler.js";

import { Restaurant } from "../models/restaurant.model.js";


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

const updateRestaurantApproval = asyncHandler(async (req, res) => {
    const { status,restaurantId } = req.body;

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
    );

    if (!updatedRestaurant) {
        return res.status(404).json({
            success: false,
            message: "Restaurant not found"
        });
    }

    return res.status(200).json({
        success: true,
        data: updatedRestaurant,
        message: `Restaurant ${status} successfully`
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
    if (!['approved', 'rejected','stop'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid status provided"
        });
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
        restaurantId,
        { approvalStatus: status },
        { new: true }
    );

    if (!updatedRestaurant) {
        return res.status(404).json({
            success: false,
            message: "Restaurant not found"
        });
    }

    return res.status(200).json({
        success: true,
        data: updatedRestaurant,
        message: `Restaurant status updated to ${status} successfully`
    });
});



export {
    updateRestaurantApproval,
    pendingRestaurants,
    changeRestaurantStatus
}