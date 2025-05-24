import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Enhanced CORS configuration
app.use(cors({
    origin: [
        "http://localhost:3000", // React default
        "http://localhost:5173", // Vite default
        "http://localhost:3001"  // Alternative localhost
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// Configure preflight requests
app.options("*", cors());

// Rest of your middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
import userRouter from "./routes/user.routes.js";
app.use("/api/v1/users", userRouter);




app.use("/api/v1/user", userRouter)

export { app }