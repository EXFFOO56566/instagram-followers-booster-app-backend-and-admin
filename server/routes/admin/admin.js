var express = require("express");
var md5 = require("md5");
const path = require("path");
const moment = require("moment");
const fs = require("fs");
const handlebars = require("handlebars");
const { Admin } = require("../../models/admin");
const { User } = require("../../models/user");
const { BoostHistory } = require("../../models/boostHistory");
const { Activity } = require("../../models/activity");
const { Package } = require("../../models/package");
const { Order } = require("../../models/order");
const { Boost } = require("../../models/boost");
const { api } = require("../../utils");
const router = express.Router();
const {
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
} = require("./middleware");
const { listview, filter, pagination } = require("../../utils/list");
const { Ads } = require("../../models/ads");
const { PackageDumData } = require("../../data/package");
const { AdsDumData } = require("../../data/ads");

const sendLinkMail = async (to, baseUrl) => {
  try {
    const otp = Date.now();
    let code = otp;

    code = `${baseUrl}/change-password?code=${code}`;

    let replacements = {
      code,
    };

    const htmlTemplate = fs.readFileSync(
      path.join(__dirname, "../../configs/template_reset_password.html"),
      "utf8"
    );

    const template = handlebars.compile(htmlTemplate);
    const htmlToSend = template(replacements);

    const mailOptions = {
      from: "hello@witwork.app",
      to,
      subject: "Verify your email for StrongVPN",
      html: htmlToSend,
    };

    const resSendMail = await sgMail.send(mailOptions);

    if (resSendMail) {
      await OTP.create({
        email: to,
        code: otp,
        isVerify: false,
      });
      return Promise.resolve({});
    } else {
      return Promise.reject({});
    }
  } catch (e) {
    console.log(e);
    return Promise.reject({});
  }
};

/* IS NEW ADMIN? */
router.post(
  "/admin/getProfile",
  [checkExistAdmin],
  async function (req, res, next) {
    const { isExistAdmin } = req;
    try {
      api.ok({
        res,
        data: isExistAdmin === true ? 1 : 0,
      });
    } catch (e) {
      api.error({ res });
    }
  }
);

/* SIGNUP */
router.post(
  "/admin/signup",
  [checkSignup, checkExistAdmin],
  async function (req, res, next) {
    const { body, isExistAdmin } = req;
    let admin = undefined;
    try {
      if (!isExistAdmin) {
        const admin = Admin.create({
          ...body,
          password: md5(body.password),
        });
        api.ok({
          res,
          data: admin,
        });
      } else {
        api.error({ res });
      }
    } catch (e) {
      console.log(e)
      api.error({ res });
    }
  }
);

/* SIGNIN */
router.post(
  "/admin/login",
  [checkSignin, checkExistAdmin],
  async function (req, res, next) {
    const { body: { password, email, ...props } = req, isExistAdmin } = req;
    let user = undefined;
    try {
      if (isExistAdmin) {
        user = await Admin.findOne({ email, password: md5(password) });

        if (!user) {
          return api.error({ res });
        }

        return api.ok({
          res,
          data: user,
        });
      } else {
        api.error({ res });
      }
    } catch (e) {
      console.log(e)
      api.error({ res });
    }
  }
);

/* UPDATE PROFILE */
router.post(
  "/admin/updateProfile",
  [checkUpdateProfile, checkExistIdAdmin],
  async function (req, res, next) {
    const { body: { adminId, ...props } = req, isExistIdAdmin } = req;
    try {
      if (isExistIdAdmin) {
        const admin = await Admin.findOneAndUpdate({ _id: adminId }, props);
        api.ok({
          res,
          data: props,
        });
      } else {
        api.error({ res });
      }
    } catch (e) {
      api.error({ res });
    }
  }
);

/* UPDATE PASSWORD */
router.post(
  "/admin/updatePassword",
  [checkUpdatePassword, checkExistIdAdmin, checkOldPassword],
  async function (req, res, next) {
    const {
      body: { adminId, ...props } = req,
      isExistIdAdmin,
      isValidPassword,
    } = req;
    try {
      if (isExistIdAdmin && isValidPassword) {
        const admin = await Admin.findOneAndUpdate(
          { _id: adminId },
          { password: md5(props.password) }
        );
        api.ok({
          res,
          data: admin,
        });
      } else {
        api.error({ res });
      }
    } catch (e) {
      api.error({ res });
    }
  }
);

/* GET ALL USERS */
router.post(
  "/admin/users",
  [checkExistIdAdmin, filter, pagination],
  async function (req, res, next) {
    const { isExistIdAdmin } = req;

    req.relation = ["subscription"]
    if (!isExistIdAdmin) api.error({ res });
    return listview.get({ model: User, res, next, req });
  }
);

/* GET DETAIL USER */
router.post(
  "/admin/detailUser",
  [checkExistIdAdmin],
  async function (req, res, next) {
    const { body: { userId } = req, isExistIdAdmin } = req;
    try {
      if (isExistIdAdmin) {
        const user = await User.findById({ _id: userId });
        api.ok({
          res,
          data: user,
        });
      } else {
        api.error({ res });
      }
    } catch (e) {
      api.error({ res });
    }
  }
);

/* REMOVE USER */
router.post(
  "/admin/users/delete",
  [checkExistIdAdmin],
  async function (req, res, next) {
    const { body: { userId } = req, isExistIdAdmin } = req;

    if (!userId) return api.error({ res, message: "Not found user id" });

    try {
      if (isExistIdAdmin) {
        await User.findByIdAndDelete({ _id: userId });
        api.ok({
          res,
          data: "OK",
        });
      } else {
        api.error({ res, message: "Not found admin!" });
      }
    } catch (e) {
      api.error({ res });
    }
  }
);

/*  CREATE PACKAGE */
router.post(
  "/admin/createPackage",
  [checkExistIdAdmin, checkCreateAndUpdatePackage],
  async function (req, res, next) {
    const {
      body: { id, ...props },
      isExistIdAdmin,
    } = req;
    try {
      if (isExistIdAdmin) {
        const package = await Package.create(props);

        api.ok({
          res,
          data: package,
        });
      } else {
        api.error({ res });
      }
    } catch (e) {
      api.error({ res });
    }
  }
);

/*  UPDATE PACKAGE */
router.put(
  "/admin/updatePackage/:id",
  [checkExistIdAdmin, checkCreateAndUpdatePackage],
  async function (req, res, next) {
    const { id: packageId } = req.params;
    console.log(packageId)

    if (!packageId) return api.error({ res });

    const {
      body: { id, ...props },
      isExistIdAdmin,
    } = req;
    try {
      if (isExistIdAdmin) {
        await Package.findByIdAndUpdate(packageId, props);
        api.ok({
          res,
          data: props,
        });
      } else {
        api.error({ res });
      }
    } catch (e) {
      api.error({ res });
    }
  }
);

/*  DELETE PACKAGE */
router.delete(
  "/admin/deletePackage/:id",
  [checkExistIdAdmin],
  async function (req, res, next) {
    const { id: packageId } = req.params;

    if (!packageId) return api.error({ res });

    const { isExistIdAdmin } = req;
    try {
      if (isExistIdAdmin) {
        await Package.findByIdAndDelete(packageId);

        api.ok({
          res,
          data: "success",
        });
      } else {
        api.error({ res });
      }
    } catch (e) {
      api.error({ res });
    }
  }
);

/*  GET LIST PACKAGE*/
router.post(
  "/admin/getPackage",
  [checkExistIdAdmin, filter, pagination],
  async function (req, res, next) {
    const { isExistIdAdmin } = req;

    if (!isExistIdAdmin) api.error({ res });

    return listview.get({ model: Package, res, next, req });
  }
);

/*  CREATE ADS */
router.post(
  "/admin/createAdService",
  [checkExistIdAdmin, checkCreateAndUpdateAds],
  async function (req, res, next) {
    const {
      body: { id, ...props },
      isExistIdAdmin,
    } = req;
    try {
      if (isExistIdAdmin) {
        const ads = await Ads.create(props);

        api.ok({
          res,
          data: ads,
        });
      } else {
        api.error({ res });
      }
    } catch (e) {
      api.error({ res });
    }
  }
);

/*  UPDATE ADS */
router.put(
  "/admin/updateAdService/:id",
  [checkExistIdAdmin, checkCreateAndUpdateAds],
  async function (req, res, next) {
    const { id: adsId } = req.params;
    if (!adsId) return api.error({ res });

    const {
      body: { id, ...props },
      isExistIdAdmin,
    } = req;
    try {
      if (isExistIdAdmin) {
        await Ads.findByIdAndUpdate(adsId, props);

        api.ok({
          res,
          data: props,
        });
      } else {
        api.error({ res });
      }
    } catch (e) {
      api.error({ res });
    }
  }
);

/*  DELETE ADS */
router.delete(
  "/admin/deleteAdService/:id",
  [checkExistIdAdmin],
  async function (req, res, next) {
    const { id: adsId } = req.params;

    if (!adsId) return api.error({ res });

    const { isExistIdAdmin } = req;
    try {
      if (isExistIdAdmin) {
        await Ads.findByIdAndDelete(adsId);

        api.ok({
          res,
          data: "success",
        });
      } else {
        api.error({ res });
      }
    } catch (e) {
      api.error({ res });
    }
  }
);

/*  GET LIST ADS*/
router.post(
  "/admin/getAdService",
  [filter, pagination, checkExistIdAdmin],
  async function (req, res, next) {
    const { isExistIdAdmin } = req;

    if (!isExistIdAdmin) api.error({ res });

    return listview.get({ model: Ads, res, next, req });
  }
);

const countTodayUser = async () => {
  const today = moment().startOf('day')
  const filterDate = {
    $gte: today.toDate(),
    $lte: moment(today).endOf('day').toDate()
  };

  const requests = await User.aggregate([
    {
      $match: {
        createdAt: filterDate,
      },
    },
    {
      $count: "count",
    },
  ]);

  return requests?.[0]?.count || 0;
};

const countUser = async () => {
  const requests = await User.aggregate([
    {$sort:{email:-1}},
    {
      $count: "count",
    },
  ]);

  return requests?.[0]?.count || 0;
};

const countTotalBought = async () => {
  const requests = await Order.aggregate([
    {
      $count: "count",
    },
  ]);

  return requests?.[0]?.count || 0;
};

const countTodayBought = async () => {
  const today = moment().startOf('day')
  const filterDate = {
    $gte: today.toDate(),
    $lte: moment(today).endOf('day').toDate()
  };

  const requests = await Order.aggregate([
    {
      $match: {
        createdAt: filterDate,
      },
    },
    {
      $count: "count",
    },
  ]);

  return requests?.[0]?.count || 0;
};

const countTotalRevenue = async () => {
  const requests = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$pricing' },
      },
    },
  ]);
  return requests?.[0]?.totalAmount || 0;
};

const countTodayRevenue = async () => {
  const today = moment().startOf('day')
  const filterDate = {
    $gte: today.toDate(),
    $lte: moment(today).endOf('day').toDate()
  };

  const requests = await Order.aggregate([
    {
      $match: {
        createdAt: filterDate,
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$pricing' },
      },
    },
  ]);
  console.log(requests)
  return requests?.[0]?.totalAmount || 0;
};

const countTodayBoost = async () => {
  const today = moment().startOf('day')
  const filterDate = {
    $gte: today.toDate(),
    $lte: moment(today).endOf('day').toDate()
  };
  const requests = await BoostHistory.aggregate([
    {
      $match: {
        createdAt: filterDate,
      },
    },
    {
      $count: "count",
    },
  ]);

  return requests?.[0]?.count || 0;
};

router.post("/admin/charts/boostByYear",  
[checkExistIdAdmin],
async (req, res, next) => {
  try {
    const { date, boostId } = req.body;

    if (!date) {
      return api.error({ res, message: "Not found date" });
    }

    const year = moment(date, "DD-MM-YYYY").year();  
    let filterDate = {
      $gte: new Date(
        moment(`01-01-${year}`, "DD-MM-YYYY").toISOString()
      ),
      $lte: new Date(moment(date, "DD-MM-YYYY").endOf("year").toISOString()),
    };
    const requests = await BoostHistory.aggregate([
      {
        $match: {
          createdAt: filterDate,
          boostId: boostId
        },
      },
      {
        $project: {
          formatedcreatedAt: {
            $dateToString: { date: "$createdAt", format: '%Y-%m' },
          },
          createdAt: "$createdAt",
        },
      },
    ]);

    let formatOrders = requests?.reduce((obj, item) => {
      return {
        ...obj,
        [item?.formatedcreatedAt]: (obj?.[item?.formatedcreatedAt] || 0) + 1,
      };
    }, {});
    const monthOfYears = Array.from(
      { length: 12 },
      (_, i) => `${year}-${i + 1 <= 9 ? `0${i + 1}` : i + 1}`
    )
    const charts = monthOfYears?.reduce((arr, item) => {
      return [
        ...arr,
        {
          name: item,
          value: formatOrders?.[item] || 0,
        },
      ];
    }, []);

    return res.status(200).json({data: charts})
  } catch (e) {
    console.log(e)
    return res.status(400).json({error: e})
  }
});

router.post("/admin/charts/packageBoughtByYear",  
[checkExistIdAdmin],
async (req, res, next) => {
  try {
    const { date, packageId: productId } = req.body;

    if (!date) {
      return api.error({ res, message: "Not found date" });
    }

    const year = moment(date, "DD-MM-YYYY").year();  
    let filterDate = {
      $gte: new Date(
        moment(`01-01-${year}`, "DD-MM-YYYY").toISOString()
      ),
      $lte: new Date(moment(date, "DD-MM-YYYY").endOf("year").toISOString()),
    };
    const requests = await Order.aggregate([
      {
        $match: {
          createdAt: filterDate,
          productId: productId
        },
      },
      {
        $project: {
          formatedcreatedAt: {
            $dateToString: { date: "$createdAt", format: '%Y-%m' },
          },
          createdAt: "$createdAt",
        },
      },
    ]);

    let formatOrders = requests?.reduce((obj, item) => {
      return {
        ...obj,
        [item?.formatedcreatedAt]: (obj?.[item?.formatedcreatedAt] || 0) + 1,
      };
    }, {});
    const monthOfYears = Array.from(
      { length: 12 },
      (_, i) => `${year}-${i + 1 <= 9 ? `0${i + 1}` : i + 1}`
    )
    const charts = monthOfYears?.reduce((arr, item) => {
      return [
        ...arr,
        {
          name: item,
          value: formatOrders?.[item] || 0,
        },
      ];
    }, []);

    return res.status(200).json({data: charts})
  } catch (e) {
    console.log(e)
    return res.status(400).json({error: e})
  }
});

router.post("/admin/dashboard/overview",  
[checkExistIdAdmin],
async (req, res, next) => {
  try {
    const amountUser = await countUser();
    const amountTotalBought = await countTotalBought();
    const amountTodayBought = await countTodayBought();
    const amountTotalRevenue = await countTotalRevenue();
    const amountTodayRevenue = await countTodayRevenue();
    const amountTodayBoost = await countTodayBoost();
    return api.ok({
      res,
      data: {
        amountTotalBought,
        amountUser,
        amountTodayBought,
        amountTotalRevenue,
        amountTodayRevenue,
        amountTodayBoost,
        amountTodayUser: await countTodayUser(),
      },
    });
  } catch (e) {
    return api.ok({
      res,
      data: {
        amountTotalBought: 0,
        amountUser: 0,
        amountTodayBought: 0,
        amountTotalRevenue: 0,
        amountTodayRevenue: 0,
        amountTodayBoost: 0,
        amountTodayUser: 0,
      },
    });
  }
});

/* DASHBOARD */
router.post(
  "/admin/charts/pie",
  [checkExistIdAdmin],
  async (req, res, next) => {
    let pieChart = await User.find().populate({ path: "subscription" });

    pieChart = pieChart.reduce((obj, item) => {
      if (item?.subscription) {
        return {
          ...obj,
          [item?.subscription?.subscriptionType]: {
            name: item?.subscription?.subscriptionType,
            value:
              (obj?.[item?.subscription?.subscriptionType]?.value || 0) + 1,
          },
        };
      }

      return {
        ...obj,
        free: {
          value: (obj?.free?.value || 0) + 1,
          name: "free",
        },
      };
    }, {});

    pieChart = Object.values(pieChart);
    const totalPieChart = pieChart?.reduce(
      (total, item) => item?.value + total,
      0
    );
    return api.ok({
      res,
      data: {
        chart: pieChart,
        overview: pieChart?.reduce(
          (obj, item) => ({
            ...obj,
            [item?.name]: {
              percent: (item?.value * 100) / totalPieChart,
              total: item?.value,
            },
          }),
          {}
        ),
      },
    });
  }
);

const listDatesOfYear = ({ date, data = {} }) => {
  return Array.from(
    { length: 12 },
    (_, i) => `${i + 1 <= 9 ? `0${i + 1}` : i + 1}`
  )?.reduce((arr, item) => {
    return [
      ...arr,
      data?.[item]
        ? data?.[item]
        : { monthly: 0, weekly: 0, free: 0, name: item },
    ];
  }, []);
};

const listDatesOfMonth = ({ date, data = {} }) => {
  const endOfMonth = moment(date, "DD-MM-YYYY").endOf("month");

  const leng = endOfMonth.format("DD").toString();
  const month = endOfMonth.format("MM").toString();
  const year = endOfMonth.format("YYYY").toString();
  const dayOfMonths = Array.from(
    { length: parseInt(leng) },
    (_, i) => `${year}-${month}-${i + 1 <= 9 ? `0${i + 1}` : i + 1}`
  )
  console.log(dayOfMonths)
  return dayOfMonths?.reduce((arr, item) => {
    return [
      ...arr,
      {
        name: moment(item).date(),
        value: data?.[item] || 0,
      },
    ];
  }, []);
};

router.post(
  "/admin/charts/year",
  [checkExistIdAdmin],
  async (req, res, next) => {
    const { date } = req?.query;

    if (!date) {
      return api.error({ res, message: "Not found date" });
    }
    const year = moment(date, "DD-MM-YYYY").year();
    const month = moment(date, "DD-MM-YYYY").month();

    let filterDate = {
      $gte: new Date(1,1, year),
      $lte: new Date(year, 12, 31),
    };

    const subscriptions = await User.find({createdAt: filterDate}).populate({ path: "subscription" });

    let formatSubscription = subscriptions?.reduce((obj, item) => {
      let formatedcreatedAt = moment(item?.createdAt).month() + 1

      if (formatedcreatedAt < 10) {
        formatedcreatedAt = `0${formatedcreatedAt}`
      }

      return {
        ...obj,
        [formatedcreatedAt]: [
          ...(obj?.[formatedcreatedAt] || []),
          item,
        ],
      };
    }, {});


    let newFormatSubscription = {};
    for (const item in formatSubscription) {
      newFormatSubscription = {
        ...newFormatSubscription,
        [item]: formatSubscription?.[item]?.reduce(
          (obj, i) => {
            if (i?.subscription) {
              return {
                ...obj,
                [i?.subscription?.subscriptionType]:
                  obj?.[i?.subscription?.subscriptionType] + 1,
                name: item,
              };
            }

            return {
              ...obj,
              free: obj?.free + 1,
              name: item,
            };
          },
          { monthly: 0, weekly: 0, free: 0 }
        ),
      };
    }

    return api.ok({
      res,
      data: listDatesOfYear({date, data: newFormatSubscription}),
    });
  }
);

router.post(
  "/admin/charts/activityByMonth",
  [checkExistIdAdmin],
  async (req, res, next) => {
    const { date } = req?.query;

    if (!date) {
      return api.error({ res, message: "Not found date" });
    }
    const year = moment(date, "DD-MM-YYYY").year();
    const month = moment(date, "DD-MM-YYYY").month();

    let filterDate = {
      $gte: new Date(
        moment(`01-${month + 1}-${year}`, "DD-MM-YYYY").toISOString()
      ),
      $lte: new Date(moment(date, "DD-MM-YYYY").endOf("month").toISOString()),
    };

    const users = await Activity.aggregate([
      {
        $match: {
          createdAt: filterDate,
        },
      },
      {
        $project: {
          formatedcreatedAt: {
            $dateToString: { date: "$createdAt", format: "%Y-%m-%d" },
          },
          createdAt: "$createdAt",
        },
      },
    ]);
    console.log('=== request aggregate ===')
    console.log(users)

    let formatUsers = users?.reduce((obj, item) => {
      return {
        ...obj,
        [item?.formatedcreatedAt]: (obj?.[item?.formatedcreatedAt] || 0) + 1,
      };
    }, {});
    console.log('=== formatUsers ===')
    console.log(formatUsers)

    return api.ok({
      res,
      data: listDatesOfMonth({ date, data: formatUsers }),
    });
  }
);

const checkValidCode = (code) => {
  const unixnow = Date.now();
  const timefinal = Math.round((unixnow - parseInt(code)) / 1000);

  return timefinal < 0 || timefinal > 12000
}

router.get("/admin/check-code/:code", async (req, res) => {
  if (!req.params?.code) {
    return api.error({ res });
  }

  if (checkValidCode(req.params?.code)) {
    return api.error({ res });
  }

  return api.ok({ res, data: "" });
});

// USER
router.post("/admin/reset-password", async (req, res) => {
  const {
    body: { email, baseUrl },
  } = req;

  if (!email || !baseUrl) {
    return api.error({ res, message: "Sever has some problems!" });
  }

  try {
    await sendLinkMail(email, baseUrl);

    api.ok({ res });
  } catch (e) {
    api.error({ res });
  }
});

/* VERIFY OTP */
router.post("/admin/change-password", async (req, res) => {
  const {
    body: { password, code },
  } = req;

  if (checkValidCode(code)) {
    return api.error({ res, message: "Invalid code" });
  }

  if (!password || !code) {
    return api.error({ res, message: "Sever has some problems!" });
  }

  const otp = await OTP.findOneAndUpdate(
    { isVerify: false, code },
    { isVerify: true }
  );

  if (otp) {
    try {
      return Admin.findOneAndUpdate({ email: otp?.email }, { password: md5(password) })
        .then((result) => {
          return api.ok({
            res,
            data: result,
          });
        })
        .catch(() => api.error({ res }));
    } catch (e) {
      return api.error({ res });
    }
  }

  return api.error({ res, message: "Sever has some problems!" });
});

/*  UPDATE BOOST */
router.put(
  "/admin/updateBoost/:id",
  [checkExistIdAdmin, checkCreateAndUpdateBoost],
  async function (req, res, next) {
    const { id: boostId } = req.params;
    if (!boostId) return api.error({ res });

    const {
      body: { id, ...props },
      isExistIdAdmin,
    } = req;
    try {
      if (isExistIdAdmin) {
        await Boost.findByIdAndUpdate(boostId, props);

        api.ok({
          res,
          data: props,
        });
      } else {
        api.error({ res });
      }
    } catch (e) {
      api.error({ res });
    }
  }
);

/*  CREATE BOOST */
router.post(
  "/admin/createBoost",
  [checkExistIdAdmin, checkCreateAndUpdateBoost],
  async function (req, res, next) {

    const {
      body: {...props },
      isExistIdAdmin,
    } = req;
    try {
      if (isExistIdAdmin) {
        await Boost.create(props);

        api.ok({
          res,
          data: props,
        });
      } else {
        api.error({ res });
      }
    } catch (e) {
      console.log(e)
      api.error({ res });
    }
  }
);

/* GET BOOST */
router.post(
  "/admin/getBoost",
  [checkExistIdAdmin],
  async function (req, res, next) {
    const {
      body: { id, ...props },
      isExistIdAdmin,
    } = req;
    try {
      if (isExistIdAdmin) {
        const boost = await Boost.find();

        api.ok({
          res,
          data: boost,
        });
      } else {
        api.error({ res });
      }
    } catch (e) {
      api.error({ res });
    }
  }
);

/*  DELETE BOOST */
router.delete(
  "/admin/deleteBoost/:id",
  [checkExistIdAdmin],
  async function (req, res, next) {
    const { id: boostId } = req.params;

    if (!boostId) return api.error({ res });

    const { isExistIdAdmin } = req;
    try {
      if (isExistIdAdmin) {
        await Boost.findByIdAndDelete(boostId);

        api.ok({
          res,
          data: "success",
        });
      } else {
        api.error({ res });
      }
    } catch (e) {
      api.error({ res });
    }
  }
);

module.exports = router;
