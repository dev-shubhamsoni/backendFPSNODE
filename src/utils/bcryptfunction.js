const phpPassword = require("node-php-password");


exports.hashPassword = async (password) => {
  return phpPassword.hash(password, "PASSWORD_DEFAULT");
};

exports.compareHashPassword = async (password, hash) => {
  return phpPassword.verify(password, hash);
};
