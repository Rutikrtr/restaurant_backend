import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Restaurant } from "../models/restaurant.model.js";
import { User } from "../models/user.model.js";

const registerRestaurant = asyncHandler(async (req, res) => {
    const {
        name,
        introduction,
        openingTime,
        closingTime,
        location,
        image,
        managerName,
        managerEmail,
        managerPassword
    } = req.body;

    // Validation
    if (
        !name ||
        !introduction ||
        !openingTime ||
        !closingTime ||
        !location ||
        !image ||
        !managerName ||
        !managerEmail ||
        !managerPassword
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if user is logged in and is a restaurant account
    if (!req.user) {
        throw new ApiError(401, "Unauthorized - Please login first");
    }

    if (req.user.accountType !== "restaurant") {
        throw new ApiError(403, "Only restaurant accounts can register a restaurant");
    }

    // Check if this user already has a registered restaurant
    const existingRestaurant = await Restaurant.findOne({ manager: req.user._id });
    if (existingRestaurant) {
        throw new ApiError(409, "You have already registered a restaurant");
    }

    // Check if restaurant name already exists (optional)
    const nameExists = await Restaurant.findOne({ name });
    if (nameExists) {
        throw new ApiError(409, "Restaurant name already exists");
    }

    // Create the restaurant with manager reference
    const restaurant = await Restaurant.create({
        name,
        introduction,
        openingTime,
        closingTime,
        location,
        image,
        manager: req.user._id,
        managerEmail,
        rating: 0,
        categories: []
    });

    if (!restaurant) {
        throw new ApiError(500, "Failed to register restaurant");
    }

    // Update user's restaurantId and manager details
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                restaurantId: restaurant._id,
                fullname: managerName
            }
        },
        { new: true }
    );

    return res
        .status(201)
        .json(new ApiResponse(201, restaurant, "Restaurant registered successfully"));
});

// const getAllRestaurants = asyncHandler(async (req, res) => {
//     // Optional: Check if user is logged in (but not required)
//     const isAuthenticated = req.user ? true : false;
    
//     // Get all restaurants with basic details
//     const restaurants = await Restaurant.find({})
//         .select('name introduction openingTime closingTime location image rating categories');
    
//     return res
//         .status(200)
//         .json(new ApiResponse(200, { 
//             restaurants,
//             isAuthenticated 
//         }, "Restaurants fetched successfully"));
// });

const getAllRestaurants = asyncHandler(async (req, res) => {
    // Get all restaurants with basic public details
    const restaurants = await Restaurant.find({})
        .select('name introduction openingTime closingTime location image rating categories')
        .lean(); // Use lean() for better performance

    // Format public response
    const publicResponse = restaurants.map(restaurant => ({
        id: restaurant._id,
        name: restaurant.name,
        introduction: restaurant.introduction,
        openingTime: restaurant.openingTime,
        closingTime: restaurant.closingTime,
        location: restaurant.location,
        image: restaurant.image,
        rating: restaurant.rating,
        categories: restaurant.categories,
    }));

    return res.status(200).json(
        new ApiResponse(200, publicResponse, "Restaurants fetched successfully")
    );
});

const getRestaurantByManager = asyncHandler(async (req, res) => {
    // Check if user is logged in and is a restaurant account
    if (!req.user) {
        throw new ApiError(401, "Unauthorized - Please login first");
    }

    if (req.user.accountType !== "restaurant") {
        throw new ApiError(403, "Only restaurant accounts can access this information");
    }

    // Find the restaurant managed by this user
    const restaurant = await Restaurant.findOne({ manager: req.user._id });

    if (!restaurant) {
        throw new ApiError(404, "No restaurant found for this manager");
    }

    // Get manager details from user collection
    const manager = await User.findById(req.user._id).select("-password -refreshToken");

    if (!manager) {
        throw new ApiError(404, "Manager details not found");
    }

    // Combine restaurant and manager details
    const responseData = {
        restaurant,
        manager: {
            name: manager.fullname,
            email: manager.email
        }
    };

    return res
        .status(200)
        .json(new ApiResponse(200, responseData, "Restaurant details fetched successfully"));
});

//for authorized users only
const getRestaurantDetails = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Authentication required");
    }

    const restaurant = await Restaurant.findById(req.params.id)
        .populate({
            path: 'menu',
            select: 'name description price category image available'
        })
        .lean();

    if (!restaurant) {
        throw new ApiError(404, "Restaurant not found");
    }

    const privateResponse = {
        id: restaurant._id,
        name: restaurant.name,
        introduction: restaurant.introduction,
        openingTime: restaurant.openingTime,
        closingTime: restaurant.closingTime,
        location: restaurant.location,
        image: restaurant.image,
        rating: restaurant.rating,
        categories: restaurant.categories,
        menu: restaurant.menu.map(item => ({
            id: item._id,
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            image: item.image,
            available: item.available
        }))
    };

    return res.status(200).json(
        new ApiResponse(200, privateResponse, "Restaurant details fetched successfully")
    );
});

const getRestaurantById = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new ApiError(400, "Invalid restaurant ID format");
    }
  
    // Find restaurant with full details including menu items
    const restaurant = await Restaurant.findById(id)
      .select('-manager -__v') // Exclude sensitive/uneeded fields
      .populate({
        path: 'menu',
        match: { available: true }, // Only include available items
        select: 'name description price category image'
      });
  
    if (!restaurant) {
      throw new ApiError(404, "Restaurant not found");
    }
  
    // Format the response
    const responseData = {
      _id: restaurant._id,
      name: restaurant.name,
      introduction: restaurant.introduction,
      openingTime: restaurant.openingTime,
      closingTime: restaurant.closingTime,
      location: restaurant.location,
      image: restaurant.image,
      rating: restaurant.rating,
      categories: restaurant.categories,
      menu: restaurant.menu.map(item => ({
            id: item._id,
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            image: item.image,
            available: item.available
        }))
    };
  
    return res
      .status(200)
      .json(new ApiResponse(200, responseData, "Restaurant details fetched successfully"));
  });

// restaurant.controller.js
const addMenuItemWithCategory = asyncHandler(async (req, res) => {
    const { name, description, price, category, image, available = true } = req.body;

    // Check if user is a restaurant manager
    if (!req.user || req.user.accountType !== "restaurant") {
        throw new ApiError(403, "Only restaurant managers can add menu items");
    }

    // Validation
    if (!name || !description || !price || !category || !image) {
        throw new ApiError(400, "All fields are required");
    }

    if (price <= 0) {
        throw new ApiError(400, "Price must be greater than 0");
    }

    // Find restaurant by manager ID
    const restaurant = await Restaurant.findOne({ manager: req.user._id });
    if (!restaurant) {
        throw new ApiError(404, "Restaurant not found for this manager");
    }

    // Add category if it doesn't exist
    if (!restaurant.categories.includes(category)) {
        restaurant.categories.push(category);
    }

    // Create new menu item
    const newMenuItem = {
        name,
        description,
        price,
        category,
        image,
        available
    };

    restaurant.menu.push(newMenuItem);
    await restaurant.save();

    return res
        .status(201)
        .json(new ApiResponse(201, {
            categories: restaurant.categories,
            menuItem: newMenuItem,
            restaurantId: restaurant._id
        }, "Menu item and category added successfully"));
});



export { registerRestaurant,getAllRestaurants,getRestaurantByManager,addMenuItemWithCategory,getRestaurantById };