const mongoose = require('mongoose');
const Joi = require("@hapi/joi");
const Joigoose = require("joigoose")(mongoose, { convert: false });

const schema = Joi.object().keys({
    packageName: Joi.string().required(),
    packageId: Joi.string().required(),
    packageStars: Joi.number().required(),
    packagePlatform: Joi.string().required().allow('android', 'ios'),
    packagePricing: Joi.number().default(0),
    createdAt: Joi.date().allow(null).default(new Date()),
    updatedAt: Joi.date().allow(new Date()),
    deletedAt: Joi.date().allow(null)
  });
  
  const Schema = mongoose.Schema;
  
  const mongooseSchema = new Schema(Joigoose.convert(schema), {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  
  mongooseSchema.path('packageId').index({ unique: true });
  
  mongooseSchema.virtual("id").get(function() {
    return this._id;
  });
  
  module.exports = {
    schema: schema,
    Package: mongoose.model("Package", mongooseSchema)
  }