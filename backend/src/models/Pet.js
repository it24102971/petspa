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
			enum: ["dog", "cat", "bird", "rabbit", "hamster", "fish", "turtle", "guinea pig", "other"],
			default: "dog",
		},
		breed: {
			type: String,
			required: true,
		},
		age: {
			type: Number,
			required: true,
		},
		gender: {
			type: String,
			enum: ["male", "female"],
			default: "male",
		},
		weight: {
			type: String,
		},
		notes: {
			type: String,
		},
		cutenessLevel: {
			type: Number,
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
