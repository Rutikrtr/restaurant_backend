
import { asyncHandler } from "../utils/asyncHandler.js";
import { Restaurant } from "../models/restaurant.model.js";
// import { User } from "../models/user.model.js";

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

const updateMenuItem = asyncHandler(async (req, res) => {
    const { menuItemId } = req.params;
    const { name, description, price, category, image, available } = req.body;

    // Authorization check
    if (!req.user || req.user.accountType !== "restaurant") {
        return res.status(403).json({
            success: false,
            message: "Only restaurant managers can update menu items"
        });
    }

    // Find restaurant by manager ID
    const restaurant = await Restaurant.findOne({ manager: req.user._id });
    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: "Restaurant not found for this manager"
        });
    }

    // Find the menu item by ID
    const menuItem = restaurant.menu.id(menuItemId);
    if (!menuItem) {
        return res.status(404).json({
            success: false,
            message: "Menu item not found"
        });
    }

    // Validate price if provided
    if (price !== undefined && price <= 0) {
        return res.status(400).json({
            success: false,
            message: "Price must be greater than 0"
        });
    }

    // Update fields if provided
    if (name !== undefined) menuItem.name = name;
    if (description !== undefined) menuItem.description = description;
    if (price !== undefined) menuItem.price = price;
    if (image !== undefined) menuItem.image = image;
    if (available !== undefined) menuItem.available = available;

    // Handle category update
    if (category !== undefined) {
        // Add new category to restaurant if it doesn't exist
        if (!restaurant.categories.includes(category)) {
            restaurant.categories.push(category);
        }
        menuItem.category = category;
    }

    await restaurant.save();

    return res.status(200).json({
        success: true,
        data: {
            categories: restaurant.categories,
            menuItem: menuItem,
            restaurantId: restaurant._id
        },
        message: "Menu item updated successfully"
    });
});

const deleteMenuItem = asyncHandler(async (req, res) => {
    const { menuItemId } = req.params;

    // Authorization check
    if (!req.user || req.user.accountType !== "restaurant") {
        return res.status(403).json({
            success: false,
            message: "Only restaurant managers can delete menu items"
        });
    }

    // Find restaurant by manager ID
    const restaurant = await Restaurant.findOne({ manager: req.user._id });
    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: "Restaurant not found for this manager"
        });
    }

    // Find and remove the menu item
    const menuItem = restaurant.menu.id(menuItemId);
    if (!menuItem) {
        return res.status(404).json({
            success: false,
            message: "Menu item not found"
        });
    }

   restaurant.menu.pull({ _id: menuItemId });
    await restaurant.save();

    return res.status(200).json({
        success: true,
        data: {
            categories: restaurant.categories,
            restaurantId: restaurant._id
        },
        message: "Menu item deleted successfully"
    });
});


const addCategory = asyncHandler(async (req, res) => {
    const { category  } = req.body;
    console.log(category);

    if (!req.user || req.user.accountType !== "restaurant") {
        return res.status(403).json({
            success: false,
            message: "Only restaurant managers can add categories"
        });
    }

    if (!category ) {
        return res.status(400).json({
            success: false,
            message: "Category name is required"
        });
    }

    const restaurant = await Restaurant.findOne({ manager: req.user._id });
    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: "Restaurant not found"
        });
    }

    if (restaurant.categories.includes(category.name )) {
        return res.status(400).json({
            success: false,
            message: "Category already exists"
        });
    }

    restaurant.categories.push(category.name);
    await restaurant.save();

    return res.status(201).json({
        success: true,
        data: restaurant.categories,
        message: "Category added successfully"
    });
});
const deleteCategory = asyncHandler(async (req, res) => {
    const { categoryName } = req.params;

    if (!req.user || req.user.accountType !== "restaurant") {
        return res.status(403).json({
            success: false,
            message: "Unauthorized access"
        });
    }

    const restaurant = await Restaurant.findOne({ manager: req.user._id });
    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: "Restaurant not found"
        });
    }

    // Check if category exists
    if (!restaurant.categories.includes(categoryName)) {
        return res.status(404).json({
            success: false,
            message: "Category not found"
        });
    }

    // Check if any menu items are using this category
    const itemsInCategory = restaurant.menu.filter(item => item.category === categoryName);
    if (itemsInCategory.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Cannot delete category with existing menu items"
        });
    }

    // Remove category
    restaurant.categories = restaurant.categories.filter(cat => cat !== categoryName);
    await restaurant.save();

    return res.status(200).json({
        success: true,
        data: restaurant.categories,
        message: "Category deleted successfully"
    });
});


export {addMenuItemWithCategory,deleteMenuItem,updateMenuItem, addCategory,deleteCategory}