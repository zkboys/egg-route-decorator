'use strict'

exports.keys = '123456'

exports.security = {
    csrf: {
        enable: false
    }
}

exports.routeDecorator = {
    prefix: '/api', // 全局统一前缀
    // wrapperResult: false, // 是否包装结果
    wrapperResult: {
        // 如下配置是默认值
        success(data) {
            // 函数有返回值，进行包装，如果没有返回值，不包装
            if (data !== undefined) {
                this.ctx.body = {
                    code: 10,
                    data
                }
            }
        },
        error(error) {
            // 对错误信息进行包装
            this.ctx.body = {
                code: 19999,
                error,
                message: error && error.message
            }
        }
    }
}
