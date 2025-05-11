import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Review } from "../models/review.model.js";
import { Restaurant } from "../models/restaurant.model.js";
import { User } from "../models/user.model.js";

const addReview = asyncHandler(async (req, res) => {
    const { restaurantId } = req.params;
    const { rating, comment } = req.body;

    // 1. Validate customer account
    if (!req.user || req.user.accountType !== "customer") {
        throw new ApiError(403, "Only customers can add reviews");
    }

    // 2. Validate input
    if (!rating || !comment) {
        throw new ApiError(400, "Rating and comment are required");
    }

    if (rating < 1 || rating > 5) {
        throw new ApiError(400, "Rating must be between 1 and 5");
    }

    // 3. Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
        throw new ApiError(404, "Restaurant not found");
    }

    // 4. Check if customer already reviewed this restaurant
    const existingReview = await Review.findOne({
        restaurant: restaurantId,
        customer: req.user._id
    });

    if (existingReview) {
        throw new ApiError(409, "You have already reviewed this restaurant");
    }

    // 5. Create the review
    const review = await Review.create({
        restaurant: restaurantId,
        customer: req.user._id,
        rating,
        comment
    });

    if (!review) {
        throw new ApiError(500, "Failed to add review");
    }

    // 6. Update restaurant's average rating
    const allReviews = await Review.find({ restaurant: restaurantId });
    const totalRatings = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRatings / allReviews.length;

    await Restaurant.findByIdAndUpdate(restaurantId, {
        rating: averageRating,
        $inc: { reviewCount: 1 }
    });

    // 7. Return response
    return res
        .status(201)
        .json(new ApiResponse(201, review, "Review added successfully"));
});

const getRestaurantReviews = asyncHandler(async (req, res) => {
    const { restaurantId } = req.params;

    // 1. Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
        throw new ApiError(404, "Restaurant not found");
    }

    // 2. Get all reviews with customer details
    const reviews = await Review.find({ restaurant: restaurantId })
        .populate("customer", "fullname profileImage")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, reviews, "Reviews fetched successfully"));
});

export { addReview, getRestaurantReviews };