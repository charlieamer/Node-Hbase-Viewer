// Roles as bits of a number:
// bit 0 - can view data
// bit 1 - can modify data
// bit 2 - can modify users
// bit 3 - can control hbase connection

module.exports = {
  defaults: {
    owner: 0b1111
  },
  bits: {
    viewData: 1 << 0,
    modifyData: 1 << 1,
    modifyUsers: 1 << 2,
    connectionControl: 1 << 3
  },
  allowed: function(realRole, requiredRole) {
    while (requiredRole > 0) {
      if (requiredRole & 1 == 1 && realRole & 1 == 0)
        return false;
      requiredRole = requiredRole >> 1;
      realRole = realRole >> 1;
    }
    return true;
  }
}