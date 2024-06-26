const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const IngredientSchema = new Schema({
  name: { type: String, required: true, maxLength: 50 },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  rec_exp_date: { type: Number },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

IngredientSchema.virtual("url").get(function() {
  return `/api/ingredient/${this._id}`
});

const Ingredient = mongoose.model("Ingredient", IngredientSchema);

module.exports = Ingredient;