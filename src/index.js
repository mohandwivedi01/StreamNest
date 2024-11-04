// require('dotenv').configure({path: './env'})
import dotenv from "dotenv"

import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectDB from "./db/index.js";


dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
    console.log(`server listening on ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed: " + err);
});










/*
import express from "express";
const app = express()

;( async () =>{  //efi, ; semi colon for
    try{
        await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (error) => {
            console.log("error: ", error)
            throw error
        })
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
            console.log(`Database connected to: ${DB_NAME}`);
        })
        
    }catch (error){
        console.error("Error connecting to the database: ", error);
        throw err;
    }
} )()

*/