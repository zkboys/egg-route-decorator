const router = require('./router')
const filters = require('./filter')
const middleware = require('./middleware')
const validate = require('./validate')
const deprecated = require('./deprecated')
const description = require('./description')
const response = require('./response')
const summary = require('./summary')

module.exports = {
    route: router.route,
    get: router.get,
    del: router.delete,
    patch: router.patch,
    post: router.post,
    put: router.put,
    all: router.all,
    middleware,
    validate,
    deprecated,
    description,
    response,
    summary,
    filters
}
