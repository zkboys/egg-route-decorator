module.exports = function(options) {
    return (target, key = '__class__', descriptor) => {
        target.__description__ = target.__description__ || {}

        target.__description__[key] = options

        return descriptor
    }
}
