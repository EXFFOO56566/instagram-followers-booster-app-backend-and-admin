const mongoose = require('mongoose');
const Joi = require("@hapi/joi");
const Joigoose = require("joigoose")(mongoose, { convert: false });

const schema = Joi.object().keys({
    userId: Joi.string().required(),
    date: Joi.date().allow(new Date()),
    createdAt: Joi.date().allow(null).default(new Date()),
    updatedAt: Joi.date().allow(new Date()),
    deletedAt: Joi.date().allow(null),
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
    schema,
    Activity: mongoose.model("Activity", mongooseSchema)
  }