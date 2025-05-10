import { Router } from "express";
import {signUp,login} from "../controllers/user.controller.js"
import { registerRestaurant } from "../controllers/restaurant.controller.js";
import { getRestaurantByManager,getAllRestaurants,addMenuItemWithCategory,getRestaurantById } from "../controllers/restaurant.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { 
    placeOrder,
    updateOrderStatus,
    getCustomerOrders,
    getRestaurantOrders
  } from "../controllers/order.controller.js";
const router=Router()

router.route("/signup").post(signUp)
router.route("/login").post(login)
router.route("/register").post(verifyJWT,registerRestaurant);
router.route("/").get(getAllRestaurants);
router.route("/:id").get(getRestaurantById);
router.route("/manager").get(verifyJWT,getRestaurantByManager);
router.route("/menu").post(verifyJWT,addMenuItemWithCategory)
router.route("/order").post(verifyJWT,placeOrder)
router.route("/order/status").put(verifyJWT,updateOrderStatus)
router.route("/order/customer").get(verifyJWT,getCustomerOrders)
router.route("/order/restaurant").get(verifyJWT,getRestaurantOrders)


export default router



//  http://localhost:8000/api/v1/user  -- to see all restaurants
//  http://localhost:8000/api/v1/user/manager -- to see restaurant by manager
//  http://localhost:8000/api/v1/user/signup -- to sign up a user
//  http://localhost:8000/api/v1/user/login -- to login a user
//  http://localhost:8000/api/v1/user/register -- to register a restaurant by manager
//  http://localhost:8000/api/v1/user/menu -- to add menu item with category by manager
//  http://localhost:8000/api/v1/user/order -- to place an order by customer
//  http://localhost:8000/api/v1/user/order/status -- to update order status by manager
//  http://localhost:8000/api/v1/user/order/customer -- to get customer orders by customer
//  http://localhost:8000/api/v1/user/order/restaurant -- to get restaurant orders by manager
