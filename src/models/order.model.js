import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuItem",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  }
});

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true
  },
  items: [orderItemSchema],
  orderType: {
    type: String,
    enum: ["dine-in", "takeaway", "delivery"],
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  parkingRequired: {
    type: Boolean,
    default: false
  },
  paymentMethod: {
    type: String,
    enum: ["card", "cash"],
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "preparing", "ready", "completed", "rejected", "cancelled"],
    default: "pending"
  },
  deliveryAddress: {
    type: String,
    required: function() { return this.orderType === "delivery"; }
  },
  tableNumber: {
    type: String,
    required: function() { return this.orderType === "dine-in"; }
  },
  specialInstructions: {
    type: String
  }
}, { timestamps: true });

export const Order = mongoose.model("Order", orderSchema);