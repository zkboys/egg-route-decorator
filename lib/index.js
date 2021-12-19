const router = require('./router')
const filters = require('./filter')
const middleware = require('./middleware')

module.exports = {
    route: router.route,
    get: router.get,
    del: router.del,
    patch: router.patch,
    post: router.post,
    put: router.put,
    all: router.all,
    middleware,
    filters
}
