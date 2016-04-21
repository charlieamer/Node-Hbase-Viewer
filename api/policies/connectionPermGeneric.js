module.exports = function(role) {
  return function(req, res, next) {
    sails.log.silly("Checking for role: " + role + " on " + req.path);
    if (!req.session.authenticated || !req.session.user)
      return res.forbidden("You need to be logged in");

    HbaseSubscription.findOne({owner: req.session.user.id, id: req.params.id}).then(function(sub) {
      if (!sub)
        return res.forbidden("You are not subscribed to this connection");
      if (!roles.allowed(sub.role, role))
        return res.forbidden("Connection owner doesn't allow you this action");
      return next();
    }).catch(function(err) {
      sails.log.error("Error fetching hbase subscription from connection permission policy.");
      sails.log.error(err);
      res.status(500).json("Error fetching hbase subscription from connection permission policy.");
    });
  }
}