// restaurant.middleware.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { Restaurant } from "../models/restaurant.model.js";
const checkRestaurantApproval = asyncHandler(async (req, res, next) => {
    const restaurant = await Restaurant.findOne({ manager: req.user._id });
    
    if (!restaurant || restaurant.approvalStatus !== 'approved') {
        return res.status(403).json({
            success: false,
            message: "Restaurant not approved. Please wait for admin approval"
        });
    }
    
    req.restaurant = restaurant;
    next();
});

export { checkRestaurantApproval };