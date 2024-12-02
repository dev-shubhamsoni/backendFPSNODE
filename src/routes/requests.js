const route = require('express').Router()
const { request, oAuth } = require('../controllers/requests/requests');


route.get("/request", request)
    .get("/oauth", oAuth)

module.exports = route