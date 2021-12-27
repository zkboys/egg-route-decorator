module.exports = function(options) {
    return (target, key = '__class__', descriptor) => {
        target.__summary__ = target.__summary__ || {}

        target.__summary__[key] = options

        return descriptor
    }
}
