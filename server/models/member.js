const mongoose = require('mongoose');

var MemberSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
    minlength: 1,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  player: {
    type: Boolean,
    required: true,
    default: false
  },
  relationships: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  }],
  emergencyName: {
    type: String,
    trim: true
  },
  emergencyPhone: {
    type: String,
    trim: true
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  trips: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  }]
});

MemberSchema.statics.getAll = function () {
  var Member = this
  var memberArray = [];
  return Member.find({}).sort({name: 'asc'}).then((members) => {
    if (!members) {return Promise.reject();}
    return new Promise(async (resolve, reject) => {
      await members.forEach((member) => {
        memberArray[member._id] = member;
      });
      if (Object.keys(memberArray).length > 0) {
        resolve(memberArray);
      } else {
        reject('Error: Unable to create Member array (check to ensure Members have been created)');
      }
    });
  });
}

var Member = mongoose.model('Member', MemberSchema);

module.exports = {Member};