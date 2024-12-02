const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const mobileNumberRegex = /^[6789]\d{9}$/
const passwordRegex = /^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{6,15}$/
const dateFormate = /^\d{4}-\d{2}-\d{2}$/
const passwordSpecialChar = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,16}$/


const isValidEmail = (email) => {
  return emailRegex.test(email)
}

const isValidMobileNumber = (number) => {
  return mobileNumberRegex.test(number)
}

const isValidPassword = (pwd) => {
  return passwordRegex.test(pwd)
}

const isAdminPassword = (pwd)=>{
  return passwordSpecialChar.test(pwd)
}

const isValidDateFormat = (date) => {
  return dateFormate.test(date)
}

const isValidHtml = (data) => {
  try {
    const dom = new JSDOM(htmlString)
    const doc = dom.window.document
    const parseErrors = doc.querySelectorAll('parsererror')
    return parseErrors.length === 0 && doc.body !== null
  } catch (error) {
    return false
  }
}

const isValidJson = (str) => {
  try {
    JSON.parse(str)
    return true
  } catch (error) {
    return false
  }
}

const isArrayCheck = (array, key) => {
  if(isValidJson(array)){
    let nData = JSON.parse(array || "[]");
    return Array.isArray(nData);
  } else {
    throw Error(`${key} not valid json`);
  }
}
function isBase64(str) {
  try {
      return btoa(atob(str)) === str;
  } catch (err) {
      return false;
  }
}
module.exports = {
  isValidEmail,
  isValidMobileNumber,
  isValidPassword,
  isValidDateFormat,
  isValidHtml,
  isValidJson,
  isAdminPassword,
  isArrayCheck,
  isBase64
}