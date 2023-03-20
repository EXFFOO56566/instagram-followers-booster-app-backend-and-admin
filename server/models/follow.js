const mongoose = require('mongoose');
const Joi = require("@hapi/joi");
const Joigoose = require("joigoose")(mongoose, { convert: false });

const followSchema = Joi.object().keys({
    feedId: Joi.string().required(),
    userId: Joi.string().required(),
    reward: Joi.number().required(),
    createdAt: Joi.date().allow(null).default(new Date()),
    updatedAt: Joi.date().allow(new Date()),
    deletedAt: Joi.date().allow(null),
  });
  
  const Schema = mongoose.Schema;
  
  const mongooseSchema = new Schema(Joigoose.convert(followSchema), {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

  mongooseSchema.virtual("id").get(function() {
    return this._id;
  });

  module.exports = {
    followSchema,
    Follow: mongoose.model("Follow", mongooseSchema)
  }