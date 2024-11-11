import mongoose from 'mongoose';
const { Schema } = mongoose;

const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: Schema.Types.ObjectId, 
        ref: "User",
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User",
    }
}, {timestamps: true})

export const Subscription = new  mongoose.model("Subscription", subscriptionSchema)
