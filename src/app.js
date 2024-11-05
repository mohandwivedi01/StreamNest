import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
//for configurations app.use()
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"})); //extened used to have object inside a object 
app.use(express.static("public"))
app.use(cookieParser());

//import routes 
import userRouter from './routes/user.routes.js'

//routes declearation 
app.use("/api/v1/users", userRouter )

export {app}
