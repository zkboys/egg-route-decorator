module.exports = (target, key = '__class__', descriptor) => {
    target.__deprecated__ = target.__deprecated__ || {}

    target.__deprecated__[key] = true

    return descriptor
}
