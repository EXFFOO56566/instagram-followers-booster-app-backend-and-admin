const mongoose = require('mongoose');
const Joi = require("@hapi/joi");
const Joigoose = require("joigoose")(mongoose, { convert: false });

const orderSchema = Joi.object().keys({
    orderId: Joi.string().required(),
    packageName: Joi.string().required(),
    productId: Joi.string().required(),
    purchaseTime: Joi.date().required(),
    purchaseState: Joi.number().allow(0),
    purchaseToken: Joi.string().required(),
    quantity: Joi.number().required(),
    acknowledged: Joi.boolean().required(),
    pricing: Joi.number().required(),
    userId: Joi.object().default(false),
    stars: Joi.number().required(),
    createdAt: Joi.date().allow(null).default(new Date()),
    updatedAt: Joi.date().allow(new Date()),
    deletedAt: Joi.date().allow(null),
  });
  
  const Schema = mongoose.Schema;
  
  const mongooseSchema = new Schema(Joigoose.convert(orderSchema), {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });  
  mongooseSchema.virtual("id").get(function() {
    return this._id;
  });

  module.exports = {
    orderSchema,
    Order: mongoose.model("Order", mongooseSchema)
  }