const mongoose = require('mongoose');

var TripSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
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
  }
});

var Trip = mongoose.model('Trip', TripSchema);

module.exports = {Trip};