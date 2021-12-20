'use strict'

const { app, methodRoutes } = require('./state')
const { compare, getWrapper } = require('./util')

app.ready(() => {
    const prefix = app.config.routeDecorator.prefix || ''

    Object.keys(methodRoutes)
        .sort((i, j) => compare(j, i))
        .forEach(key => {
            // 添加全局前缀
            methodRoutes[key].route[1] = `${prefix}${methodRoutes[key].route[1]}`

            // log路由注册信息
            app.logger.info(
                `[method-router] pid: ${process.pid}, route initialized: '${methodRoutes[key].route[1]}'`
            )

            // 注册路由
            app.router[methodRoutes[key].method].apply(app.router, methodRoutes[key].route)
        })
})

/**
 * 在 controller 类上使用的装饰器
 * @param prefix 当前类所有路由的统一前缀
 * @returns {function(*, *, *=): *}
 */
const methodRoute = function(prefix = '') {
    return (target, key, descriptor) => {
        app.beforeStart(() => {
            const controllerName = target.prototype.pathName.split('.').pop()
            const controller = app.controller[controllerName]
            const methods = Object.keys(controller)

            methods.forEach(methodName => {
                if (!controller) return

                // 请求方法
                const httpMethod = 'get'

                // 默认前缀
                const _prefix = prefix || controllerName
                const path = `/${_prefix}/${methodName}`
                // 路由名称
                const name = undefined

                const value = controller[methodName]

                controller[methodName] = getWrapper(value, controller)
                console.log(controller[methodName])
                methodRoutes[`method_route&${_prefix}&${methodName}`] = {
                    method: httpMethod,
                    route: [name, path]
                        .concat(
                            // 中间件
                            (target.__middlewares__ || [])
                                .sort((i, j) => i.index - j.index)
                                .map(item => item.value)
                        )
                        .concat(
                            // 最终实现
                            [controller[methodName]]
                        )
                }
            })
        })

        return descriptor
    }
}

module.exports = methodRoute
