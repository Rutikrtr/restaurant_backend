import { Router } from "express";
import { signUp, loginSuperRestaurent,
    loginCustomer,logout  } from "../controllers/user.controller.js";
import { 
  registerRestaurant,
  getRestaurantByManager,
  getAllRestaurants,
  getRestaurantById,
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

import { updateRestaurantApproval,pendingRestaurants,changeRestaurantStatus } from "../controllers/superadmin.controller.js";


const router = Router();


// ================= AUTHENTICATED ROUTES =================
// Restaurant Management
router.route("/register").post(registerRestaurant);
router.route("/manager").get(verifyJWT, getRestaurantByManager);

// ================= PUBLIC ROUTES =================
router.post('/signup', signUp);
router.post('/login/bothsuperadmin&restaurent', loginSuperRestaurent);
router.post('/login/customer', loginCustomer);
router.post('/logout',verifyJWT,logout)
router.route("/").get(getAllRestaurants);
router.route("/:id").get(getRestaurantById);
router.route("/:restaurantId/reviews").get(getRestaurantReviews);


// Menu Management
router.route("/menu").post(verifyJWT, checkRestaurantApproval, addMenuItemWithCategory);
router.route("/menu/:menuItemId")
  .put(verifyJWT, checkRestaurantApproval, updateMenuItem)
  .delete(verifyJWT, checkRestaurantApproval, deleteMenuItem);

router.route("/menu/category")
  .post(verifyJWT, checkRestaurantApproval, addCategory);


router.route("/menu/category/:categoryName")
  .delete(verifyJWT, checkRestaurantApproval, deleteCategory);
// Order Management
router.route("/order").post(verifyJWT, placeOrder);
router.route("/order/status").put(verifyJWT, checkRestaurantApproval, updateOrderStatus);
router.route("/order/customer").get(verifyJWT, getCustomerOrders);
router.route("/order/restaurant").get(verifyJWT, checkRestaurantApproval, getRestaurantOrders);

// Reviews (authenticated POST)
router.route("/:restaurantId/reviews").post(verifyJWT, addReview);

// ================= SUPERADMIN ROUTES =================
router.route("/superadmin/approval").put(verifyJWT, isSuperadmin, updateRestaurantApproval);
router.route("/superadmin/pending-restaurants").get(verifyJWT, isSuperadmin, pendingRestaurants);
router.route("/superadmin/changeRestaurantStatus").put(verifyJWT, isSuperadmin, changeRestaurantStatus);

export default router;