/**
 * SessionController
 *
 * @description :: Server-side logic for managing sessions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	login: function(req, res) {
    var query = {
      or: [{
        username: req.body.identifier || '', password: req.body.password || ''
      },{ 
        email: req.body.identifier || '', password: req.body.password || ''
      }
    ]};
    User.findOne(query).then(function(user) {
      if (!user)
        return res.status(400).json("Invalid credentials");
      req.session.authenticated = true;
      req.session.user = user;
      return res.json(user);
    }).catch(function(error) {
      sails.log.error("Error occured finding user");
      sails.log.error(error);
      return res.status(500).json("Internal server error");
    });
  },
  logout: function(req, res) {
    delete req.session.user;
    req.session.authenticated = false;
    res.json(true);
  },
  check: function(req, res) {
    res.json(req.session.user || null);
  }
};

