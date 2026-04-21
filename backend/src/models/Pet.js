import mongoose from "mongoose";

const petSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
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
	},
	{ timestamps: true }
);

const Pet = mongoose.model("Pet", petSchema);

export default Pet;
