module.exports = function(options) {
    return (target, key = '__class__', descriptor) => {
        target.__response__ = target.__response__ || {}

        target.__response__[key] = options

        return descriptor
    }
}
