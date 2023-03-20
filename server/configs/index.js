const mongoose = require('mongoose')
const mongoURL = 'mongodb://localhost:27017/instabooster';
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
const dbConnect = () => {
    mongoose.connect(mongoURL, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
        .then(() => {
            console.log("\n");
            console.log('DB OK');
            console.log("\n");
        })
        .catch((err) => {
            console.log(err);
        });
};
module.exports = {
  dbConnect
}
