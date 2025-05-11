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

const getAllRestaurants = asyncHandler(async (req, res) => {
    const restaurants = await Restaurant.find({})
        .select('name introduction openingTime closingTime location image rating categories')
        .lean();

    return res.status(200).json({
        success: true,
        data: restaurants,
        message: "Restaurants fetched successfully"
    });
});

const getRestaurantByManager = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized - Please login first"
        });
    }

    if (req.user.accountType !== "restaurant") {
        return res.status(403).json({
            success: false,
            message: "Only restaurant accounts can access this information"
        });
    }

    const restaurant = await Restaurant.findOne({ manager: req.user._id });
    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: "No restaurant found for this manager"
        });
    }

    const manager = await User.findById(req.user._id).select("-password -refreshToken");

    return res.status(200).json({
        success: true,
        data: {
            restaurant,
            manager: {
                name: manager.fullname,
                email: manager.email
            }
        },
        message: "Restaurant details fetched successfully"
    });
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

const addMenuItemWithCategory = asyncHandler(async (req, res) => {
    const { name, description, price, category, image, available = true } = req.body;

    if (!req.user || req.user.accountType !== "restaurant") {
        return res.status(403).json({
            success: false,
            message: "Only restaurant managers can add menu items"
        });
    }

    if (!name || !description || !price || !category || !image) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    if (price <= 0) {
        return res.status(400).json({
            success: false,
            message: "Price must be greater than 0"
        });
    }

    const restaurant = await Restaurant.findOne({ manager: req.user._id });
    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: "Restaurant not found for this manager"
        });
    }

    if (!restaurant.categories.includes(category)) {
        restaurant.categories.push(category);
    }

    const newMenuItem = { name, description, price, category, image, available };
    restaurant.menu.push(newMenuItem);
    await restaurant.save();

    return res.status(201).json({
        success: true,
        data: {
            categories: restaurant.categories,
            menuItem: newMenuItem,
            restaurantId: restaurant._id
        },
        message: "Menu item and category added successfully"
    });
});

export { 
    registerRestaurant,
    getAllRestaurants,
    getRestaurantByManager,
    addMenuItemWithCategory,
    getRestaurantById,
    getRestaurantDetails
};