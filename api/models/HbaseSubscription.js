/**
* HbaseSubscription.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    owner: {
      model: 'User'
    },
    hbase: {
      model: 'Hbase'
    },
    role: {
      type: 'integer',
      required: true
    }
  }
};

