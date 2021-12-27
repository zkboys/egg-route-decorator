const router = require('./router')
const filters = require('./filter')
const middleware = require('./middleware')
const validate = require('./validate')

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
    filters
}
