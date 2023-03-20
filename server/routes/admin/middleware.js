const Joi = require("@hapi/joi");
const { api } = require("../../utils");
const { Admin } = require("../../models/admin");
const md5 = require("md5");

const checkSignin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(1).required(),
  });
  console.log('===== checkSignin Admin =====')
  const valid = schema.validateAsync(req.body, { abortEarly: false });

  valid
    .then(() => next())
    .catch((e) => {
      console.error('=========ERROR=========')
      console.error(e)
      console.error('checkSignin Admin: failed to valid')
      api.error({ res, message: "Sever has some problems!" });
    });
};


const checkUpdateProfile = (req, res, next) => {
  const schema = Joi.object({
    adminId: Joi.string().required(),
    firstname: Joi.string().min(1).required(),
    lastname: Joi.string().min(1).required(),
  });

  const valid = schema.validateAsync(req.body, { abortEarly: false });

  valid
    .then(() => next())
    .catch(() => {
      api.error({ res, message: "Sever has some problems!" });
    });
};

const checkUpdatePassword = (req, res, next) => {
  const schema = Joi.object({
    adminId: Joi.string().required(),
    password: Joi.string().min(1).required(),
    oldPassword: Joi.string().min(1).required(),
  });

  const valid = schema.validateAsync(req.body, { abortEarly: false });

  valid
    .then(() => next())
    .catch(() => {
      api.error({ res, message: "Sever has some problems!" });
    });
};

const checkOldPassword = async (req, res, next) => {
  const {
    body: { adminId: id, oldPassword},
  } = req;
  try {
    const admin = await Admin.findById(id)
    req.isValidPassword = (admin.password == md5(oldPassword)) ? true : false
    if(req.isValidPassword == false) {
      console.log('the old password is not match')
    }
    return next();
  } catch (e){
    return api.error({ res});
  }
};



const checkExistAdmin = async (req, res, next) => {
  try {
    console.log('===== checkExistAdmin =====')

    const admin = await Admin.find()
    req.isExistAdmin = admin && admin.length > 0
    return next()
  } catch (e){
    console.error('=========ERROR=========')
    console.error(e)
    console.error('checkExistAdmin: failed to valid')
    return api.error({ res});
  }
};

const checkExistIdAdmin = async (req, res, next) => {
  const {
    body: { adminId },
  } = req;

  if (!adminId) return api.error({ res, message: 'not found admin'});
  console.log('===== checkExistIdAdmin =====')

  try {
    const admin = await Admin.findById(adminId)

    if (admin) {
      req.isExistIdAdmin = true
      return next()
    }

    return api.error({ res, message: 'not found admin'});
  } catch (e){
    console.error('=========ERROR=========')
    console.error(e)
    console.error('checkExistIdAdmin: failed to valid')
    return api.error({ res, e});
  }
};


const checkSignup = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(1).required(),
    firstname: Joi.string().min(1).required(),
    lastname: Joi.string().min(1).required(),
  });
  console.log('===== checkSignup =====')

  const valid = schema.validateAsync(req.body, { abortEarly: false });

  valid
    .then(() => next())
    .catch((e) => {
      console.error('=========ERROR=========')
      console.error(e)
      console.error('checkSignup: failed to valid')
      api.error({ res, message: "Sever has some problems!" });
    });
}

const checkCreateAndUpdatePackage = (req, res, next) => {
  const { body: { id, adminId, ...body } } = req
  const schema = Joi.object().keys({
    packageName: Joi.string().required(),
    packageId: Joi.string().required(),
    packageStars: Joi.number().required(),
    packagePlatform: Joi.string().required().allow('android', 'ios'),
    packagePricing: Joi.number().required()
  });
  console.log('===== checkCreateAndUpdatePackage =====')
  const valid = schema.validateAsync(body, { abortEarly: false });

  valid
    .then(() => next())
    .catch((e) => {
      console.error('=========ERROR=========')
      console.error(e)
      console.error('checkExistAdmin: failed to valid')
      api.error({ res, message: "Sever has some problems!" });
    });
}

const checkCreateAndUpdateBoost = (req, res, next) => {
  const { body: { id, adminId, ...body } } = req
  const schema = Joi.object().keys({
    boostStar: Joi.number().required(),
    boostOfFollower: Joi.number().required(),
  });
  console.log('===== checkCreateAndUpdateBoost =====')
  const valid = schema.validateAsync(body, { abortEarly: false });

  valid
    .then(() => next())
    .catch((e) => {
      console.error('=========ERROR=========')
      console.error(e)
      console.error('checkCreateAndUpdateBoost: failed to valid')
      api.error({ res, message: "Sever has some problems!" });
    });
}


const checkCreateAndUpdateAds = (req, res, next) => {
  const { body: { id, adminId, ...body } } = req
  const schema = Joi.object().keys({
    adsId: Joi.string().required(),
    adsType: Joi.string().required(),
    adsPlatform: Joi.string().required().allow('android', 'ios'),
    adsStatus: Joi.boolean().default(false),
  });

  const valid = schema.validateAsync(body, { abortEarly: false });

  valid
    .then(() => next())
    .catch((err) => {
      api.error({ res, message: "Sever has some problems!" });
    });
}

module.exports = {
  checkSignin,
  checkExistAdmin,
  checkSignup,
  checkUpdateProfile,
  checkExistIdAdmin,
  checkUpdatePassword,
  checkOldPassword,
  checkCreateAndUpdatePackage,
  checkCreateAndUpdateAds,
  checkCreateAndUpdateBoost
};
