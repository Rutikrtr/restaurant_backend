import mongoose from "mongoose";
import dotenv from "dotenv"


const DB_NAME = "restaurant"
// const MONGODB_URL = "mongodb+srv://siddheshghare6112:Siddhesh6972@cluster0.9ffpa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

const connectDB= async()=>{
    try {
     const connectionInstance =   await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n mongoDB connected !! DB host :${
            connectionInstance.connection.host }`);
        
    } catch (error) {
        console.log("mongodb connection error:",error);
        process.exit(1)
        
    }

}
export default connectDB;