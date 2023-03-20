const mongoose = require('mongoose');
const Joi = require("@hapi/joi");
const Joigoose = require("joigoose")(mongoose, { convert: false });

const schema = Joi.object().keys({
    boostId: Joi.string().required(),
    userId: Joi.string().required(),
    stars: Joi.number().allow(null).default(0),
    feedId: Joi.string().required(),
    createdAt: Joi.date().allow(null).default(new Date()),
    updatedAt: Joi.date().allow(new Date()),
    deletedAt: Joi.date().allow(null)
  });
  
  const Schema = mongoose.Schema;
  
  const mongooseSchema = new Schema(Joigoose.convert(schema), {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
    
  mongooseSchema.virtual("id").get(function() {
    return this._id;
  });
  
  module.exports = {
    schema: schema,
    BoostHistory: mongoose.model("BoostHistory", mongooseSchema)
  }