import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();



app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        return callback(null, true); // Reflect the request origin
    },
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