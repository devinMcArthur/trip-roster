const mongoose = require('mongoose');

var TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  age: {
    type: String,
    required: true
  },
  league: {
    type: String,
    required: true
  },
  managers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  }],
  association: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Association'
  },
  managementRequests: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' 
    },
    status: {
      type: Boolean,
      required: true,
      default: false
    }
  }],
  trips: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  }],
  busCompanies: [{
    type: String,
    trim: true
  }]
});

TeamSchema.statics.getAll = function() {
  var Team = this
  var teamArray = [];
  return Team.find({}).sort({name: 'asc'}).then((teams) => {
    if (!teams) {return Promise.reject();}
    return new Promise(async (resolve, reject) => {
      await teams.forEach((team) => {
        teamArray[team._id] = team;
      });
      if (Object.keys(teamArray).length > 0) {
        resolve(teamArray);
      } else {
        reject('Error: Unable to create Team array (check to ensure Teams have been created)');
      }
    });
  });
};

var Team = mongoose.model('Team', TeamSchema);

module.exports = {Team};