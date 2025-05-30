import { Router } from "express";
import { 
    signUp, 
    verifyEmailOTP,
    resendOTP,
    loginSuperRestaurent,
    loginCustomer,
    logout  
} from "../controllers/user.controller.js";
import { 
    registerRestaurant,
    verifyRestaurantOTP,
    resendRestaurantOTP,
    getRestaurantByManager,
    getAllRestaurants,
    getRestaurantById,
    getRestaurantDetails,
    updateRestaurant
} from "../controllers/restaurant.controller.js";
import { addReview, getRestaurantReviews } from "../controllers/review.controller.js";
import { verifyJWT, isSuperadmin } from "../middleware/auth.middleware.js";
import { checkRestaurantApproval } from "../middleware/restaurant.middleware.js";
import {
    addMenuItemWithCategory,
    deleteMenuItem,
    updateMenuItem,
    addCategory,
    deleteCategory
} from '../controllers/restaurent.menu.controller.js'
import { 
    placeOrder,
    updateOrderStatus,
    getCustomerOrders,
    getRestaurantOrders
} from "../controllers/order.controller.js";
import { 
    updateRestaurantApproval,
    pendingRestaurants,
    changeRestaurantStatus 
} from "../controllers/superadmin.controller.js";

const router = Router();

// ================= PUBLIC AUTHENTICATION ROUTES =================
// User Signup Flow (2-step process with OTP verification)
router.post('/signup', signUp);                    // Step 1: Send OTP
router.post('/verify-email', verifyEmailOTP);      // Step 2: Verify OTP & complete signup
router.post('/resend-otp', resendOTP);             // Resend OTP if needed

// Restaurant Registration Flow (2-step process with OTP verification)
router.post('/register', registerRestaurant);       // Step 1: Send OTP
router.post('/verify-restaurant', verifyRestaurantOTP); // Step 2: Verify OTP & complete registration
router.post('/resend-restaurant-otp', resendRestaurantOTP); // Resend restaurant OTP

// Login Routes
router.post('/login/bothsuperadmin&restaurent', loginSuperRestaurent);
router.post('/login/customer', loginCustomer);

// Logout Route (requires authentication)
router.post('/logout', verifyJWT, logout);

// ================= AUTHENTICATED RESTAURANT ROUTES =================
// Restaurant Management (for restaurant owners)
router.get('/manager', verifyJWT, getRestaurantByManager);     // Get restaurant managed by current user
router.get('/details/:id', verifyJWT, getRestaurantDetails);   // Get restaurant details (authenticated)
router.put('/update', verifyJWT, updateRestaurant);            // Update restaurant details


// ================= PUBLIC RESTAURANT ROUTES =================
router.get('/', getAllRestaurants);                // Get all restaurants
router.get('/:id', getRestaurantById);             // Get restaurant by ID (public)


// ================= MENU MANAGEMENT ROUTES =================
// Menu Management (requires restaurant approval)
router.post('/menu', verifyJWT, checkRestaurantApproval, addMenuItemWithCategory);
router.put('/menu/:menuItemId', verifyJWT, checkRestaurantApproval, updateMenuItem);
router.delete('/menu/:menuItemId', verifyJWT, checkRestaurantApproval, deleteMenuItem);

// Category Management
router.post('/menu/category', verifyJWT, checkRestaurantApproval, addCategory);
router.delete('/menu/category/:categoryName', verifyJWT, checkRestaurantApproval, deleteCategory);

// ================= ORDER MANAGEMENT ROUTES =================
router.post('/order', verifyJWT, placeOrder);                                    // Place order (customers)
router.put('/order/status', verifyJWT, checkRestaurantApproval, updateOrderStatus); // Update order status (restaurants)
router.get('/order/customer', verifyJWT, getCustomerOrders);                     // Get customer orders
router.get('/order/restaurant', verifyJWT, checkRestaurantApproval, getRestaurantOrders); // Get restaurant orders

// ================= REVIEW ROUTES =================
router.get('/:restaurantId/reviews', getRestaurantReviews);      // Get reviews (public)
router.post('/:restaurantId/reviews', verifyJWT, addReview);     // Add review (authenticated)

// ================= SUPERADMIN ROUTES =================
router.put('/superadmin/approval', verifyJWT, isSuperadmin, updateRestaurantApproval);
router.get('/superadmin/pending-restaurants', verifyJWT, isSuperadmin, pendingRestaurants);
router.put('/superadmin/changeRestaurantStatus', verifyJWT, isSuperadmin, changeRestaurantStatus);

export default router;