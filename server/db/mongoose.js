var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true }).then(connection => {
  console.log('Connected to MongoDB');
}).catch(error => {
  console.log(error.message);
});

module.exports = {mongoose};