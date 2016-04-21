/**
* Hbase.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    ip: {
      type: 'string',
      required: true
    },
    port: {
      type: 'integer',
      min: 0,
      max: 65535,
      required: true
    },
    owner: {
      model: 'User'
    },
    initOthers: function() {
      var hbaseId = this.id;
      var hbaseOwner = this.owner;
      HbaseSubscription.create({
        hbase: hbaseId,
        role: roles.defaults.owner,
        owner: hbaseOwner
      }).then(function(sub) {
        sails.log.debug("Successfuly created hbase subscription.");
      }).catch(function(err) {
        sails.log.error("Error creating hbase subscription.");
        sails.log.error(err);
      });
    }
  }
};

