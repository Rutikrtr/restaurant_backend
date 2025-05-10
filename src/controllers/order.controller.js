import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/order.model.js";
import { Restaurant } from "../models/restaurant.model.js";

// Customer places an order
const placeOrder = asyncHandler(async (req, res) => {
  const {
    restaurantId,
    items,
    orderType,
    parkingRequired,
    paymentMethod,
    deliveryAddress,
    tableNumber,
    specialInstructions
  } = req.body;

  // Validate customer
  if (!req.user || (req.user.accountType !== "customer" && req.user.accountType !== "restaurant")) {
    throw new ApiError(403, "Only customers or restaurant staff can place orders");
  }
  

  // Validate required fields
  if (!restaurantId || !items || !orderType || !paymentMethod) {
    throw new ApiError(400, "Missing required fields");
  }

  // Get restaurant and validate menu items
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  // Calculate order totals
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const menuItem = restaurant.menu.id(item.menuItemId);
    if (!menuItem || !menuItem.available) {
      throw new ApiError(400, `Item ${item.name} is not available`);
    }
    
    subtotal += menuItem.price * item.quantity;
    orderItems.push({
      menuItemId: item.menuItemId,
      name: menuItem.name,
      price: menuItem.price,
      quantity: item.quantity
    });
  }

  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  // Create order
  const order = await Order.create({
    customer: req.user._id,
    restaurant: restaurantId,
    items: orderItems,
    orderType,
    subtotal,
    tax,
    total,
    parkingRequired: parkingRequired || false,
    paymentMethod,
    deliveryAddress,
    tableNumber,
    specialInstructions,
    status: "pending"
  });

  return res
    .status(201)
    .json(new ApiResponse(201, order, "Order placed successfully"));
});

// Manager updates order status
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId, status } = req.body;
  
    // Validate manager
    if (!req.user || req.user.accountType !== "restaurant") {
      throw new ApiError(403, "Only restaurant managers can update orders");
    }
  
    // Validate required fields
    if (!orderId || !status) {
      throw new ApiError(400, "Order ID and status are required");
    }
  
    // Validate status
    const validStatuses = ["approved", "preparing", "ready", "completed", "rejected"];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, `Invalid status. Valid statuses are: ${validStatuses.join(", ")}`);
    }
  
    // Find order and validate restaurant ownership
    const order = await Order.findById(orderId).populate("restaurant");
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
  
    if (!order.restaurant.manager.equals(req.user._id)) {
      throw new ApiError(403, "You can only update orders for your restaurant");
    }
  
    // Validate status transition
    const validTransitions = {
      pending: ["approved", "rejected"],
      approved: ["preparing"],
      preparing: ["ready"],
      ready: ["completed"],
      rejected: []
    };
  
    if (!validTransitions[order.status]?.includes(status)) {
      throw new ApiError(400, `Cannot change status from ${order.status} to ${status}`);
    }
  
    // Update status
    order.status = status;
    
    // Add status history tracking
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user._id
    });
  
    await order.save();
  
    return res
      .status(200)
      .json(new ApiResponse(200, order, "Order status updated successfully"));
  });

// Get orders for customer
const getCustomerOrders = asyncHandler(async (req, res) => {
  if (!req.user || req.user.accountType !== "customer") {
    throw new ApiError(403, "Only customers can view their orders");
  }

  const orders = await Order.find({ customer: req.user._id })
    .populate("restaurant", "name image");

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "Customer orders fetched successfully"));
});

// Get orders for restaurant manager
const getRestaurantOrders = asyncHandler(async (req, res) => {
  if (!req.user || req.user.accountType !== "restaurant") {
    throw new ApiError(403, "Only restaurant managers can view orders");
  }

  const restaurant = await Restaurant.findOne({ manager: req.user._id });
  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  const orders = await Order.find({ restaurant: restaurant._id })
    .populate("customer", "fullname email");

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "Restaurant orders fetched successfully"));
});

export {
  placeOrder,
  updateOrderStatus,
  getCustomerOrders,
  getRestaurantOrders
};