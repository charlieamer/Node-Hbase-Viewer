module.exports = {
  bodyToObjParams: function(body, obj) {
    var params = {};
    if (body) {
      for (var key in body) {
        if (obj.attributes[key] && typeof(obj.attributes[key]) != "function")
          params[key] = body[key];
      }
    }
    return params;
  }
}