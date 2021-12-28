'use strict'

exports.keys = '123456'

exports.security = {
    csrf: {
        enable: false
    }
}

exports.routeDecorator = {
    prefix: '/api', // 全局统一前缀
    wrapperResult: true
}
exports.validate = {
    convert: true
}
