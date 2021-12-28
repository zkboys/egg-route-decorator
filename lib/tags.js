module.exports = function(options) {
    return (target, key = '__class__', descriptor) => {
        target.__tags__ = target.__tags__ || {}

        target.__tags__[key] = options

        return descriptor
    }
}
