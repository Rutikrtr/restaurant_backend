import { asyncHandler } from "../utils/asyncHandler.js";
import { Restaurant } from "../models/restaurant.model.js";
import { User } from "../models/user.model.js";

const registerRestaurant = asyncHandler(async (req, res) => {
    const { name, introduction, openingTime, closingTime, location, image } = req.body;

    // Check if user is logged in and is a restaurant account
    if (!req.user || req.user.accountType !== "restaurant") {
        return res.status(403).json({
            success: false,
            message: "Only authenticated restaurant accounts can register a restaurant"
        });
    }

    // Validation
    if (!name || !introduction || !openingTime || !closingTime || !location || !image) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    // Check if user already has a restaurant
    const existingRestaurant = await Restaurant.findOne({ manager: req.user._id });
    if (existingRestaurant) {
        return res.status(409).json({
            success: false,
            message: "You have already registered a restaurant"
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
        approvalStatus: 'pending',
        manager: req.user._id,
        managerEmail: req.user.email,
        rating: 0,
        categories: []
    });

    if (!restaurant) {
        return res.status(500).json({
            success: false,
            message: "Failed to register restaurant"
        });
    }

    // Update user's restaurantId
    await User.findByIdAndUpdate(req.user._id, { restaurantId: restaurant._id });

    return res.status(201).json({
        success: true,
        data: restaurant,
        message: "Restaurant registered successfully"
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


export { 
    registerRestaurant,
    getAllRestaurants,
    getRestaurantByManager,
    getRestaurantById,
    getRestaurantDetails,
    updateRestaurantApproval
};