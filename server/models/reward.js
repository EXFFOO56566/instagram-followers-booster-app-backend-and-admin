const mongoose = require('mongoose');
const Joi = require("@hapi/joi");
const Joigoose = require("joigoose")(mongoose, { convert: false });

const rewardSchema = Joi.object().keys({
    userId: Joi.string().required(),
    point: Joi.number().required(),
    type: Joi.string().required(),
    createdAt: Joi.date().allow(null).default(new Date()),
    updatedAt: Joi.date().allow(new Date()),
    deletedAt: Joi.date().allow(null),
  });
  
  const Schema = mongoose.Schema;
  
  const mongooseSchema = new Schema(Joigoose.convert(rewardSchema), {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

  mongooseSchema.virtual("id").get(function() {
    return this._id;
  });

  module.exports = {
    rewardSchema,
    Reward: mongoose.model("Reward", mongooseSchema)
  }