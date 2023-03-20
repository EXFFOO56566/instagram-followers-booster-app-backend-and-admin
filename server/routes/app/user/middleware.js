const Joi = require("@hapi/joi");
const { User } = require("../../../models/user");
const { Feed } = require("../../../models/feed");
const { Order } = require("../../../models/order");
const { Reward } = require("../../../models/reward");
const { Boost } = require("../../../models/boost");
const { api } = require("../../../utils");
const { Package } = require("../../../models/package");
var ObjectId = require('mongodb').ObjectID;

/* BOOST */
const checkParamsBoost = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().lowercase().required(),
    boostId: Joi.string().lowercase().required()
  });
  console.log('===== checkBoost =====')
  const {body: { os, ...body }} = req
  const valid = schema.validateAsync(body, { abortEarly: false });

  valid
    .then(() => next())
    .catch((e) => {
      console.error('=========ERROR=========')
      console.log(e)
      console.error('checkBoost: failed to valid')
      api.error({ res, message: "Sever has some problems!" });
    });
};

const checkIsExistBoost = async (req, res, next) => {
  const {
    body: { boostId },
  } = req;
  console.log('===== checkIsExistBoost =====')
  try {
    const boost = await Boost.findOne({ _id: boostId });
    if (boost) {
      req.isExistBoost = true
      req.boost = boost
    }else {
      console.log('boostId has not found')
    }
    return next();
  } catch (e){
    console.error('=========ERROR=========')
    console.log(e)
    console.error('checkIsExistBoost: failed to valid')
    return api.error({ res});
  }
};

// USER
const checkSignin = (req, res, next) => {
    const schema = Joi.object({
      username: Joi.string().lowercase().required(),
    });
    console.log('===== checkSignin =====')

    const {body: { os, ...body }} = req
    const valid = schema.validateAsync(body, { abortEarly: false });
  
    valid
      .then(() => next())
      .catch(() => {
        console.error('=========ERROR=========')
        console.error('checkSignin: failed to valid')
        api.error({ res, message: "Sever has some problems!" });
      });
};

const checkExistUser = async (req, res, next) => {
  const {
    body: { userId },
  } = req;
  console.log('===== checkExistUser =====')
  try {
    const user = await User.findOne({ _id: userId });
    if (user) {
      req.isExistUser = true
      req.user = user
    }

    return next();
  } catch (e){
    console.error('=========ERROR=========')
    console.error('checkExistUser: failed to valid')
    return api.error({ res});
  }
};

const checkExistUserByUsername = async (req, res, next) => {
  const {
    body: { username },
  } = req;
  console.log('===== checkExistUserByUsername =====')
  try {
    const user = await User.findOne({ username });
    if (user) {
      console.log('username has already exist')
      req.isExistUser = true
      req.user = user
    }

    return next();
  } catch (e){
    console.error('=========ERROR=========')
    console.error('checkExistUserByUsername: failed to valid')
    return api.error({ res});
  }
};

// FEED
const checkExistFeed = async (req, res, next) => {
  const {
    body: { feedId },
  } = req;
  console.log('===== checkExistFeed =====')
  try {
    const feed = await Feed.findOne({ _id: feedId });
    
    if (feed) {
      req.isExistFeed = true
      req.feed = feed
    }

    return next();
  } catch (e){
    console.error('=========ERROR=========')
    console.error('checkExistFeed: failed to valid')
    return api.error({ res });
  }
};

/* PURCHASE */
const checkParamsPurchase = (req, res, next) => {
  const schema = Joi.object({
    orderId: Joi.string().required(),
    packageName: Joi.string().required(),
    productId: Joi.string().required(),
    purchaseTime: Joi.date().required(),
    purchaseState: Joi.number().allow(0),
    purchaseToken: Joi.string().required(),
    quantity: Joi.number().required(),
    acknowledged: Joi.boolean().required(),
    userId: Joi.string().required()
  });
  console.log('===== checkPurchase =====')
  const {body: { os, ...body }} = req
  const valid = schema.validateAsync(body, { abortEarly: false });

  valid
    .then(() => next())
    .catch((e) => {
      console.error('=========ERROR=========')
      console.error(e)
      console.error('checkPurchase: failed to valid')
      api.error({ res, message: "Sever has some problems!" });
    });
};

const checkIsExistPackage = async (req, res, next) => {
  const {
    body: { productId },
  } = req;
  console.log('===== checkIsExistPackage =====')
  try {
    const package = await Package.findOne({ packageId: productId });
    console.log(package)
    if (package) {
      req.isExistPackage = true
      req.package = package
    }

    return next();
  } catch (e){
    console.error('=========ERROR=========')
    console.error('checkIsExistPackage: failed to valid')
    console.log(e)
    return api.error({ res });
  }
};

const checkExistOrder = async (req, res, next) => {
  const {
    body: { orderId },
  } = req;
  console.log('===== checkExistOrder =====')
  try {
    const order = await Order.findOne({ orderId: orderId });
    if (order) {
      req.isExistOrder = true
      req.order = order
    }

    return next();
  } catch (e){
    console.error('=========ERROR=========')
    console.error('checkExistOrder: failed to valid')
    console.log(e)
    return api.error({ res });
  }
};

// REWARD
const checkParamsRewardFolowOurInstagram = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().required(),
    userId: Joi.string().required(),
  });
  console.log('===== checkParamsRewardFolowOurInstagram =====')
  const {body: { os, ...body }} = req
  const valid = schema.validateAsync(body, { abortEarly: false });

  valid
    .then(() => next())
    .catch((e) => {
      console.error('=========ERROR=========')
      console.error(e)
      console.error('checkParamsRewardFolowOurInstagram: failed to valid')
      api.error({ res, message: "Sever has some problems!" });
    });
};

const checkExistRewardFollowInstagram = async (req, res, next) => {
  const {
    body: { userId },
  } = req;
  console.log('===== checkExistRewardFollowInstagram =====')
  try {
    const reward = await Reward.findOne(
      { 
        userId: userId,
        type: 'follow_our_instagram'
      }
    );
    if (reward) {
      req.isExistReward= true
      req.reward = reward
    }

    return next();
  } catch (e){
    console.error('=========ERROR=========')
    console.error('checkExistRewardFollowInstagram: failed to valid')
    console.log(e)
    return api.error({ res });
  }
};


module.exports = {
    checkSignin,
    checkExistUser,
    checkParamsBoost,
    checkIsExistBoost,
    checkExistFeed,
    checkExistUserByUsername,
    checkParamsPurchase,
    checkIsExistPackage,
    checkExistOrder,
    checkParamsRewardFolowOurInstagram,
    checkExistRewardFollowInstagram
};
