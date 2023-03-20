const mongoose = require('mongoose');
const Joi = require("@hapi/joi");
const Joigoose = require("joigoose")(mongoose, { convert: false });

const feedSchema = Joi.object().keys({
    username: Joi.string().required(),
    fullName: Joi.string().required(),
    isPrivate: Joi.boolean().default(false),
    profilePicUrl: Joi.string().required(),
    isVerified: Joi.boolean().default(false),
    pk: Joi.string().required(),
    bio: Joi.string().allow('').default(''),
    active: Joi.bool().default(true),
    boostStar: Joi.number().default(0),
    createdAt: Joi.date().allow(null).default(new Date()),
    updatedAt: Joi.date().allow(new Date()),
    deletedAt: Joi.date().allow(null),
  });
  
  const Schema = mongoose.Schema;
  
  const mongooseSchema = new Schema(Joigoose.convert(feedSchema), {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

  mongooseSchema.path('pk').index({ unique: true });

  mongooseSchema.virtual("id").get(function() {
    return this._id;
  });

  module.exports = {
    feedSchema,
    Feed: mongoose.model("Feed", mongooseSchema)
  }