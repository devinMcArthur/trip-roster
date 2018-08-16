const mongoose = require('mongoose');

var AssociationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  abbreviation: {
    type: String,
    trim: true
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  managers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager'
  }],
  directors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  busCompanies: [{
    type: String, 
    trim: true
  }]
});

AssociationSchema.statics.getAll = function() {
  var Association = this
  var associationArray = [];
  return Association.find({}).sort({name: 'asc'}).then((associations) => {
    if (!associations) {return Promise.reject();}
    return new Promise(async (resolve, reject) => {
      await associations.forEach((association) => {
        associationArray[association._id] = association;
      });
      if (Object.keys(associationArray).length > 0) {
        resolve(associationArray);
      } else {
        reject('Error: Unable to create Association array (check to ensure Associations have been created)');
      }
    });
  });
};

var Association = mongoose.model('Association', AssociationSchema);

module.exports = {Association};