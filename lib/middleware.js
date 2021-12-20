module.exports = function(middleware, index = 0) {
    return (target, key = '__class__', descriptor) => {
        target.__middlewares__ = target.__middlewares__ || {}
        target.__middlewares__[key] = target.__middlewares__[key] || []

        target.__middlewares__[key].push({
            value: middleware,
            index: index
        })

        return descriptor
    }
}
