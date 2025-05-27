import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Restaurant } from "../models/restaurant.model.js";
import { User } from "../models/user.model.js";

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

    // Create user
    const user = await User.create({
        email,
        password,
        accountType,
        fullname,
        restaurantId: null
    });

    if (!user) {
        return res.status(500).json({
            success: false,
            message: "Failed to create user account"
        });
    }

    // Create restaurant
    const restaurant = await Restaurant.create({
        name,
        introduction,
        openingTime,
        closingTime,
        location,
        image,
        approvalStatus: "pending",
        manager: user._id,
        managerEmail: user.email,
        rating: 0,
        categories: []
    });

    if (!restaurant) {
        // Rollback user creation if restaurant fails
        await User.deleteOne({ _id: user._id });
        return res.status(500).json({
            success: false,
            message: "Failed to create restaurant"
        });
    }

    // Link restaurant to user
    user.restaurantId = restaurant._id;
    await user.save();

    return res.status(201).json({
        success: true,
        data: {
            restaurant,
            user: {
                _id: user._id,
                email: user.email,
                fullname: user.fullname
            }
        },
        message: "Restaurant registered successfully. Waiting for approval."
    });
});

// restaurant.controller.js
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
            menu: restaurant.menu
        },
        message: "Restaurant details fetched successfully"
    });
});

const getRestaurantById = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
            success: false,
            message: "Invalid restaurant ID format"
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



// restaurant.controller.js


export { 
    registerRestaurant,
    getAllRestaurants,
    getRestaurantByManager,
    getRestaurantById,
    getRestaurantDetails,
};