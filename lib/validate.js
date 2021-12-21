module.exports = function(options) {
    return (target, key = '__class__', descriptor) => {
        target.__validate__ = target.__validate__ || {}
        target.__validate__[key] = target.__validate__[key] || []

        target.__validate__[key].push(options)

        return descriptor
    }
}
