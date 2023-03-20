var createError = require('http-errors');
var express = require('express');
var path = require('path');
const configs = require("./configs/index");
var router = express.Router()
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const usersRouter = require('./routes/app/user/index');
const adminRouter = require('./routes/admin/admin');
var cors = require('cors');
var PORT = process.env.PORT || 3002 
var app = express();
// Connect to db
configs.dbConnect();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: '*'
}));

// Add middleware
router.use(function (req, res, next) {
  console.log('=========MIDDLE WARE=========')
  console.log('request path: ', req.url)
  console.log('request body: ', req.body)
  var strHash     = req.body.hash;
  var strUnixTime = req.body.time;
  var crypto  = require('crypto');
  console.log(process.env.SECRET_KEY);
  var myhash  = strUnixTime + '|' + (process.env.SECRET_KEY || "InstaGramWitWork@123!@#")
  var strMyHash = crypto.createHash('sha256').update(myhash).digest('hex');
  var unixnow = Math.round(+new Date()/1000);
  var timefinal = (unixnow-strUnixTime);
  if(req.url.includes('/api/admin')) {
    const {body: { hash, time, bundleId, ...body }} = req
    req.body = body
    
    next()
    return;
  }
  if(timefinal>60) {
    return next(createError(401));
   }
  if(strMyHash != strHash) {
    return next(createError(401));
  }
  const {body: { hash, time, bundleId, ...body }} = req
  req.body = body
  
  next()
})
app.use('/instagram/api', express.static('public'))
app.use('/', router);
app.use(errorHandler);

router.use('/instagram/api', usersRouter);
router.use('/instagram/api', adminRouter);
// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

function errorHandler (err, req, res, next) {
  console.log('=========ERROR=========')
  res.status(500)
  res.json({message: err, error: 1 })
}

// Error handler
app.use(function(err, req, res, next) {
  console.log('')
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.json({message: err, error: 1 })
});


app.listen(PORT, '0.0.0.0', function() {
  console.log("... port %d in %s mode", PORT, 'prod');
  console.log(`username: ${process.env.USERNAME}`)
  console.log(`password: ${process.env.PASSWORD}`)
});
module.exports = app;
