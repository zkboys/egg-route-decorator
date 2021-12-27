const createValidate = type => options => (target, key = "__class__", descriptor) => {
  target.__validate__ = target.__validate__ || {};
  target.__validate__[key] = target.__validate__[key] || {};

  target.__validate__[key][type] = options;

  return descriptor;
};
module.exports = {
  header: createValidate("headers"),
  param: createValidate("params"),
  path: createValidate("params"),
  query: createValidate("query"),
  body: createValidate("body")
};
