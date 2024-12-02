const crypto = require('crypto');

exports.generateToken = function() {

    const randomBytes = crypto.randomBytes(128);
    let salt = randomBytes.toString('hex');
    if (!salt) {
        salt = crypto.createHash('sha256')
            .update(`${Date.now()}${Math.random()}`)
            .digest('hex');
    }
    const newToken = salt.substr(0, 70);
    return newToken;
}

exports.checkPhoneNumber = function (mobileNumber) {
    if (typeof mobileNumber !== 'number' && typeof mobileNumber !== 'string') {
        return false;
    }

    return /^\d{10}$/.test(mobileNumber);
}


exports.hasSixDigitsOnly = function (input) {
    const regex = /^\d{6}$/;
    return regex.test(input);
}

exports.isValidPassword = (password) => {
    const minLength = 8;
    const hasSpecialChar = /[!@#$%&*^()]/;
    const hasCapitalLetter = /[A-Z]/;      
    const hasNumber = /[0-9]/;             

    if (
        password.length >= minLength &&
        hasSpecialChar.test(password) &&
        hasCapitalLetter.test(password) &&
        hasNumber.test(password)
    ) {
        return true;
    } else {
        return false;
    }
}
