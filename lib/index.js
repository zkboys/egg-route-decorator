const router = require('./router')
const filters = require('./filter')
const middleware = require('./middleware')
const validate = require('./validate')
const deprecated = require('./deprecated')
const description = require('./description')
const response = require('./response')
const summary = require('./summary')
const tags = require('./tags')

module.exports = {
    route: router.route,
    get: router.get,
    del: router.delete,
    patch: router.patch,
    post: router.post,
    put: router.put,
    all: router.all,

    middleware,

    header: validate.header,
    param: validate.param,
    path: validate.path,
    query: validate.query,
    body: validate.body,

    deprecated,
    description,
    response,
    summary,
    tags,

    filters
}
