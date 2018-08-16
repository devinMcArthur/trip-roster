const mongoose = require('mongoose');

var TripSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  stringifiedDate: {
    type: String,
    trim: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  }],
  destination: {
    type: String,
    required: true,
    trim: true
  },
  homeDepartTime: {
    type: Date
  },
  destinationArrivalTime: {
    type: Date
  },
  destinationDepartTime: {
    type: Date
  },
  homeArrivalTime: {
    type: Date
  },
  busCompany: {
    type: String,
    trim: true
  }
});

TripSchema.statics.getAll = function () {
  var Trip = this
  var tripArray = [];
  return Trip.find({}).sort({name: 'asc'}).then((trips) => {
    if (!trips) {return Promise.reject();}
    return new Promise(async (resolve, reject) => {
      await trips.forEach((trip) => {
        tripArray[trip._id] = trip;
      });
      if (Object.keys(tripArray).length > 0) {
        resolve(tripArray);
      } else {
        reject('Error: Unable to create Trip array (check to ensure Trips have been created)');
      }
    });
  });
}


var Trip = mongoose.model('Trip', TripSchema);

module.exports = {Trip};