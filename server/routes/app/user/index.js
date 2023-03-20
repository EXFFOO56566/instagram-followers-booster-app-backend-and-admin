
const express = require("express");
const router = express.Router();
const download = require('download-file')
const axios = require('axios');
const moment = require('moment')
const { IgApiClient } = require('instagram-private-api');
var {ObjectId} = require('mongodb');
require('dotenv/config');

const { User } = require("../../../models/user");
const { Feed } = require("../../../models/feed");
const { Follow } = require("../../../models/follow");
const { Package } = require("../../../models/package");
const { Ads } = require("../../../models/ads");
const { Reward } = require("../../../models/reward");
const { Boost } = require("../../../models/boost");
const { Activity } = require("../../../models/activity");
const { BoostHistory } = require("../../../models/boostHistory");

const INSTA_SEARCH = 'https://i.instagram.com/api/v1/users/web_profile_info/'

const REWARD = {
  watch_video: {
    point: 5,
    type: 'watch_video'
  },
  follow_instagram: {
    point: 2,
    type: 'follow'
  },
  follow_our_instagram: {
    point: 2,
    type: 'follow_our_instagram'
  }
}
const { PackageDumData } = require("../../../data/package");
const { AdsDumData } = require("../../../data/ads");
const { BoostDumData } = require("../../../data/boost");

const {
  checkSignin,
  checkExistUser,
  checkExistFeed,
  checkExistUserByUsername,
  checkParamsBoost,
  checkIsExistBoost,
  checkParamsPurchase,
  checkIsExistPackage,
  checkExistOrder,
  checkExistRewardFollowInstagram,
  checkParamsRewardFolowOurInstagram
} = require("./middleware");
const { Order } = require("../../../models/order");
var _ig;
var _auth;
router.post('/user/loginInstaFisrt',
  
  async function (req, res, next) {
  // login
  const ig = new IgApiClient();
  ig.state.generateDevice(process.env.USERNAME);
  const auth = await ig.account.login(process.env.USERNAME, process.env.PASSWORD);
  _auth = auth
  _ig = ig
  console.log(_auth)
  console.log(_ig)
  console.log('====== DID LOGIN ======')
  return res.status(200).json({ data: 'did login' })
})

router.post('/user/follow',
  [checkExistUser, checkExistFeed],
  async function (req, res, next) {
    console.log(_auth)
    try {
      const { isExistUser, isExistFeed, user, feed } = req
      if (!isExistUser || !isExistFeed) {
        return res.status(400).json({ error: 'User or feed has not found' })
      }

      var params = {
        userId: user._id,
        feedId: feed._id,
      }
      console.log(params)
      var follow = await Follow.findOne(params)

      if (follow) {
        return res.status(400).json({ error: 'you have already follow this feed' })
      }

      const user_pk = user.pk
      const feed_pk = feed.pk

       // login
       if(!_ig || _ig === undefined) {
        _ig = new IgApiClient();
        _ig.state.generateDevice(process.env.USERNAME);
        const auth = await _ig.account.login(process.env.USERNAME, process.env.PASSWORD);
        
        console.log('====== DID LOGIN ======')
       }
       
       const following = _ig.feed.accountFollowing(user_pk)
       setTimeout(async () => {  
         var i = true;
         var hasFollowed = false
         
         while (i === true) {
           const response = await following.request();
           console.log(response.users.length)
           const feedState = following.serialize(); // You can serialize feed state to have an ability to continue get next pages.
          console.log(feedState);
          following.deserialize(feedState);
            response.users.map(e => {
             if (e.pk.toString() === feed_pk.toString()) {
               console.log(`username ${user.username} has follow ${e.username}`)
               hasFollowed = true
               i = true
             }
             return e
           })
           i = following.moreAvailable
         }
        if (hasFollowed === false) {
          return res.status(400).json({ error: `Please follow ${feed.username} instagram first` })
        }
        const point = REWARD.follow_instagram.point
        follow = await Follow.create({
          ...params,
          reward: point
        })
        await Feed.updateOne({
          _id: feed._id
        }, {
          boostStar: feed.boostStar - point
        })
  
        await User.updateOne({
          _id: user._id
        }, {
          stars: user.stars + point
        })
  
        return res.status(200).json(
          {
            data: {
              ...follow.toJSON(),
              reward: point
            }
          }
        )
      }, 500)

    } catch (e) {
      console.error(e)
      return res.status(400).json({ error: e })
    }
  })

router.post('/user/feeds',
  [checkExistUser],
  async function (req, res, next) {
    try {
      const { body: { objectIds, page, size }, isExistUser, user } = req
      console.log('===== objectIds =====')
      console.log(objectIds)
      if (!isExistUser) {
        return res.status(400).json({ error: 'User has not found' })
      }
      if (parseInt(page) < 0 || parseInt(size) < 0) {
        return res.status(400).json({ error: 'Params page or size are missing' })
      }

      // get history follow
      const followIds = (await Follow.find({
        userId: user.id
      })).map(e => { return e.feedId.toString() })
      const feeds = await Feed.find({
        _id: { $nin: followIds.length > 0 ? followIds : [] },
        pk: {$ne: user.pk},
        active: true,
        boostStar: { $gte: 0 }
      })
        .sort({
          'boostStar': -1
        })
        .limit(parseInt(size))
        .skip(parseInt(page) * parseInt(size))

      return res.status(200).json(
        {
          data: feeds
        }
      )

    } catch (e) {
      console.error(e)
      return res.status(400).json({ error: e })
    }
  })

/* BOOST */
router.post('/user/boost',
  [checkParamsBoost, checkIsExistBoost, checkExistUser],
  async function (req, res, next) {
    try {
      const { isExistUser, isExistBoost, user, boost } = req
      if (!isExistUser) {
        return res.status(400).json({ error: 'User has not found' })
      }
      if (!isExistBoost) {
        return res.status(400).json({ error: 'Boost has not found' })
      }
      var user_stars = user.stars
      const { boostStar } = boost
      if (user_stars < boostStar) {
        return res.status(400).json({ error: 'Your stars are not enough to boost' })
      }

      var feed = await Feed.findOne({ pk: user.pk })
      if (!feed) {
        // insert new feed
        feed = await Feed.create({
          username: user.username,
          boostStar: boostStar,
          fullName: user.fullName,
          isPrivate: user.isPrivate,
          profilePicUrl: user.profilePicUrl,
          isVerified: user.isVerified,
          pk: user.pk,
          bio: user.bio ?? "",
          active: true
        })
      } else {
        // update feed
        const feedStar = feed.boostStar
        await Feed.updateOne({
          _id: feed._id
        }, {
          boostStar: feedStar + boostStar,
          bio: user.bio ?? "",
          fullName: user.fullName,
        })

        feed = {
          ...feed.toJSON(),
          boostStar: feedStar + boostStar
        }
      }

      // minius user star & add total boost star
      user_stars -= boostStar
      await User.updateOne({
        _id: user._id
      }, {
        stars: user_stars,
        totalBoostStar: (user.totalBoostStar ?? 0) + boostStar
      })

      // update boost used
      await Boost.updateOne({
        _id: boost._id
      }, {
        boostUsed: (boost.boostUsed ?? 0) + 1
      })

      // create boost history
      const params = {
        boostId: boost.id,
        userId: user.id,
        stars: boost.boostStar,
        feedId: feed.id
      }
      await BoostHistory.create(params)

      return res.status(200).json(
        {
          data: feed
        }
      )

    } catch (e) {
      console.error(e)
      return res.status(400).json({ error: e })
    }
  })
/* GET BOOST */
router.post('/user/getBoost',
  [checkExistUser],
  async function (req, res, next) {
    try {

      const { isExistUser, user } = req;
      if (!isExistUser) {
        return res.status(400).json({ error: 'User has not found' })
      }

      var boosts = await Boost.find()
      if (boosts?.length === 0) {
        boosts = await Boost.insertMany(BoostDumData);
      }
      return res.status(200).json({ data: boosts })

    } catch (e) {
      console.error(e)
      return res.status(400).json({ error: e })
    }
  })

/* PURCHASE */
router.post('/user/purchase',
  [checkParamsPurchase, checkIsExistPackage, checkExistOrder, checkExistUser],
  async function (req, res, next) {
    try {
      const { body: { productId }, isExistUser, isExistOrder, isExistPackage, body, user, package } = req
      if (!isExistUser) {
        return res.status(400).json({ error: 'User has not found' })
      }
      if (isExistOrder) {
        return res.status(400).json({ error: 'You have alread purchase this order' })
      }

      if (!isExistPackage) {
        return res.status(400).json({ error: 'PackageId is not found' })
      }

      const packageStars = package.packageStars
      const params = {
        ...body,
        stars: packageStars,
        pricing: package.packagePricing
      }
      const order = await Order.create(params)
      if (order) {
        await User.updateOne({
          _id: user._id
        }, {
          stars: user.stars + packageStars
        })
      } else {
        return res.status(400).json({ error: 'Purchase failed' })
      }
      return res.status(200).json({ data: order.toJSON() })
    } catch (e) {
      console.error(e)
      return res.status(400).json({ error: e })
    }
  });

async function getProfile(username) {
  let letter = username.charAt(0);
  if(letter === '@') {
    username = username.substring(1);
  }
  const params = {
    username: username,
  };
  let config = {
    headers: {
      "Accept-Encoding": "gzip, deflate, br",
      "Accept": "*/*",
      "Connection": "keep-alive",
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 12_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 105.0.0.11.118 (iPhone11,8; iOS 12_3_1; en_US; en-US; scale=2.00; 828x1792; 165586599)", 
      "Cookie": "sessionid=1527952261%3AeEgsDmtcFyGrsU%3A28%3AAYcFeWfeu0CIMhSl5-c628LkVR-6AbkVnmMbS6cfYQ"
    },
    params: params
  }

  const r = await axios.get(INSTA_SEARCH, config)
  return r.data
};

router.post('/user/login',
  [checkSignin, checkExistUserByUsername],
  async function (req, res, next) {
    try {
      const { body: { username }, isExistUser } = req

      if (username === undefined || username === null) {
        return res.status(200).json({ data: {} })
      }
      const { data } = await getProfile(username)
      console.log(data)
      if (data?.user) {
        const { full_name, id, biography, edge_followed_by, edge_follow, is_private, is_verified, profile_pic_url } = data?.user

        // const directory = `${__dirname}/files/`
        const directory = `${require('path').resolve(__dirname, '../../../public')}`
        var options = {
          directory: directory,
          filename: `${id}.png`
        }
        const r = await download(profile_pic_url, options)

        let params = {
          username: username,
          bio: biography,
          fullName: full_name,
          isPrivate: is_private,
          profilePicUrl: profile_pic_url,
          isVerified: is_verified,
          pk: id,
          followers: edge_followed_by?.count ?? 0,
          followings: edge_follow?.count ?? 0,
        }
        if (!isExistUser) {
          // insert to database
          params = {
            ...params,
            createdAt: new Date(),
            stars: 0,
          }

          userObj = await User.create(params);
        } else {
          // query user
          await User.updateOne({
            username: username
          }, params)
          userObj = await User.findOne({ username: username });
        }

        return res.status(200).json(
          {
            data: {
              ...userObj.toJSON(),
              isFirstLogin: !isExistUser
            }
          }
        )
      }
      return res.status(200).json({ error: 'Account is not exist' })
    } catch (e) {
      console.log('===== login =====')
      console.error(e.message)
      return res.status(400).json({ error: e.message })
    }
  })

/* GET PROFILE */
router.post('/user/profile',
  [checkExistUser],
  async function (req, res, next) {
    try {
      const { user, isExistUser } = req
      if (!isExistUser) {
        return res.status(400).json({ error: 'User has not found' })
      }

      return res.status(200).json({ data: user })
    } catch (e) {
      console.error(e)
      return res.status(400).json({ error: e });
    }
  })

/* UPDATE ACTIVITY */
router.put('/user/updateActivity',
  [checkExistUser],
  async function (req, res, next) {
    try {
      const { user, isExistUser } = req
      if (!isExistUser) {
        return res.status(400).json({ error: 'User has not found' })
      }
      const format = "DD/MM/YYYY"
      const today = moment(new Date()).format(format)
      const params = {
        date: moment(today, format),
        userId: user.id
      }
      var activity = await Activity.findOne(params)

      if (!activity || activity === undefined) {
        activity = await Activity.create(params)
      }
      console.log(activity)
      return res.status(200).json({ data: activity })
    } catch (e) {
      console.error(e)
      return res.status(400).json({ error: e });
    }
  })

//PACK & ADS
router.post(
  "/user/packages",
  [checkExistUser],
  async (req, res, next) => {
    const { body: { os }, isExistUser } = req
    if (!isExistUser) {
      return res.status(400).json({ error: 'User has not found' })
    }
    if (!os) return res.status(400).json({ res, message: "Not found os" });
    if (!["android", "ios"].includes(os.toLocaleLowerCase?.()?.trim?.()))
      return res.status(400).json({ res, message: "Not found os" });
    try {
      let packages = await Package.find({
        packagePlatform: os.toLocaleLowerCase?.()?.trim?.(),
      });
      if (packages?.length === 0) {
        packages = await Package.insertMany(PackageDumData);
        packages = packages.filter(e => {
          if (e.packagePlatform === os.toLocaleLowerCase?.()?.trim?.()) {
            return e
          }
        })
      }
      return res.status(200).json({ data: packages })
    } catch (e) {
      console.error(e)
      return res.status(400).json({ error: e });
    }
  }
);

// REWARD & ADS
router.post("/user/ads",
  [checkExistUser],
  async (req, res, next) => {
    const { body: { os }, isExistUser } = req
    if (!os) return res.status(400).json({ res, message: "Not found os" });
    if (!["android", "ios"].includes(os.toLocaleLowerCase?.()?.trim?.()))
      return res.status(400).json({ res, message: "Not found os" });

    try {
      let ads = await Ads.find({
        adsPlatform: os.toLocaleLowerCase?.()?.trim?.(),
        adsStatus: true,
      });
      if (ads?.length === 0) {
        await Ads.insertMany(AdsDumData);
        ads = ads.filter(e => {
          if (e.adsPlatform === os.toLocaleLowerCase?.()?.trim?.()) {
            return e
          }
        })
      }
      return res.status(200).json({ data: ads })
    } catch (e) {
      console.error(e)
      return res.status(400).json({ error: e });
    }
  });

router.post("/user/watch",
  [checkExistUser],
  async (req, res, next) => {
    const { isExistUser, user } = req
    if (!isExistUser) {
      return res.status(400).json({ error: 'User has not found' })
    }
    try {
      const reward = await Reward.create({
        userId: user.id,
        point: REWARD.watch_video.point,
        type: REWARD.watch_video.type
      })
      await User.updateOne(
        { _id: user._id },
        {
          stars: user.stars + reward.point
        }
      )
      return res.status(200).json({ data: reward })
    } catch (e) {
      console.error(e)
      return res.status(400).json({ error: e });
    }
  });

router.post("/user/followOurInsta",
  [checkExistRewardFollowInstagram, checkParamsRewardFolowOurInstagram, checkExistUser],
  async (req, res, next) => {
    const { body: { username }, isExistUser, isExistReward, user } = req
    if (!isExistUser) {
      return res.status(400).json({ error: 'User has not found' })
    }
    if (isExistReward) {
      return res.status(400).json({ error: 'You have already follow our instagram' })
    }
    try {
      const { data } = await getProfile(username)
      if (data?.user) {
        const { id } = data.user
        const user_pk = user.pk

        // login
        if(!_ig || !_ig === undefined) {
          _ig = new IgApiClient();
          _ig.state.generateDevice(process.env.USERNAME);
          const auth = await _ig.account.login(process.env.USERNAME, process.env.PASSWORD);
        }
      

        const following = _ig.feed.accountFollowing(user_pk)
        var i = true;
        var hasFollowed = false
        while (i === true) {
          const response = await following.request();
          response.users.map(e => {
            if (e.pk.toString() === id) {
              console.log(`username ${user.username} has follow ${e.username}`)
              hasFollowed = true
              i = true
            }
            return e
          })
          i = following.moreAvailable
        }

        if (hasFollowed === false) {
          return res.status(400).json({ error: `Please follow ${username} instagram first` })
        }


        const reward = await Reward.create({
          userId: user.id,
          point: REWARD.follow_our_instagram.point,
          type: REWARD.follow_our_instagram.type
        })
        await User.updateOne(
          { _id: user._id },
          {
            stars: user.stars + reward.point
          }
        )
        return res.status(200).json({ data: reward })

      } else {
        return res.status(400).json({ error: 'Account is not exist' })
      }

    } catch (e) {
      console.error(e)
      return res.status(400).json({ error: e });
    }
  });


module.exports = router;
