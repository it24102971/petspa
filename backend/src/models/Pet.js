import mongoose from "mongoose";

const petSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			required: true,
			enum: ["Dog", "Cat", "Bird", "Rabbit", "Hamster", "Fish", "Turtle", "Guinea Pig", "Other"],
			default: "Dog",
		},
		breed: {
			type: String,
			required: true,
		},
		age: {
			type: Number,
			required: true,
		},
		cutenessLevel: {
			type: Number,
			required: true,
			default: 10,
		},
		imageUrl: {
			type: String,
			default: null,
		},
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
	},
	{ timestamps: true }
);

const Pet = mongoose.model("Pet", petSchema);

export default Pet;
