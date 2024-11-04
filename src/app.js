import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cros({
    origin: process.env.CROS_ORIGIN,
    Credentials: true
}))
//for configurations app.use()
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"})); //extened used to have on=bject inside a object 
app.use(express.static("public"))
app.use(cookieParser());

export {app}
