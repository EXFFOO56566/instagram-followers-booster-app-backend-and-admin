const mongoose = require('mongoose');
const Joi = require("@hapi/joi");
const Joigoose = require("joigoose")(mongoose, { convert: false });

const userSchema = Joi.object().keys({
    username: Joi.string().required(),
    fullName: Joi.string().allow(''),
    bio: Joi.string().allow(''),
    isPrivate: Joi.boolean().default(false),
    profilePicUrl: Joi.string().required(),
    isVerified: Joi.boolean().default(false),
    pk: Joi.string().required(),
    stars: Joi.number().default(0),
    totalBoostStar: Joi.number().allow(null).default(0),
    followings: Joi.number().allow(null).default(0),
    followers: Joi.number().allow(null).default(0),
    createdAt: Joi.date().allow(null).default(new Date()),
    updatedAt: Joi.date().allow(new Date()),
    deletedAt: Joi.date().allow(null),
    lastLogin: Joi.date().allow(null),
  });
  
  const Schema = mongoose.Schema;
  
  const mongooseSchema = new Schema(Joigoose.convert(userSchema), {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });  
  mongooseSchema.virtual("id").get(function() {
    return this._id;
  });

  module.exports = {
    userSchema,
    User: mongoose.model("User", mongooseSchema)
  }