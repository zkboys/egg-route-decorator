'use strict'

const { app, routes } = require('./state')
const { wrapperMiddleware, validateMiddleware } = require('./util')
const { initSwagger } = require('./swagger')
const { match } = require('path-to-regexp')

app.ready(() => {
    const { prefix = '', logging = true, swagger } = app.config.routeDecorator

    if (logging) {
        app.logger.info(`[router] =================== route decorator =====================`)
    }

    // 添加全局前缀
    if (prefix) {
        Object.values(routes).forEach(value => {
            value.route[1] = `${prefix}${value.route[1]}`
        })
    }

    Object.keys(routes).forEach(key => {
        const method = routes[key].method
        const path = routes[key].route[1]

        // 检测重复
        const exists = Object.entries(routes).find(([k, v]) => {
            const _method = v.method
            const _path = v.route[1]

            return (
                routes[key] !== v &&
                method === _method &&
                (path === _path ||
                    match(path, { decode: decodeURIComponent })(_path) ||
                    match(_path, { decode: decodeURIComponent })(path))
            )
        })

        if (exists) throw Error(`路由 ${key} 与 ${exists[0]} 冲突！`)

        // log路由注册信息
        if (logging) {
            app.logger.info(`[router] pid: ${process.pid}, route initialized: '${method} ${path}'`)
        }
        // 注册路由
        app.router[method].apply(app.router, routes[key].route)
    })

    if (swagger && swagger.enable) {
        initSwagger(app, routes)
    }
})

/**
 * 生成路由
 * @param method http 方法 get post 等
 * @param path
 * @param name
 * @returns {function(*=): function(*, *=, *=): *}
 */
function generateRoute(method, path, name) {
    return (target, key, descriptor) => {
        // 设置默认值 为 []
        target.__actions__ = target.__actions__ || []
        const _path = path || `/${key}`

        target.__actions__.push({
            key: key,
            name: name,
            path: _path,
            fullPath: _path, // 会在route装饰器中拼接统一前缀
            method: method,
            descriptor: descriptor
        })

        return descriptor
    }
}

/**
 * 在 controller 类上使用的装饰器
 * @param prefix 当前类所有路由的统一前缀
 * @returns {function(*): *}
 */
const route = function(prefix) {
    return target => {
        let actions = target.prototype.__actions__ || []

        // 中间件
        const classMiddlewares = (target.__middlewares__ || {})['__class__'] || []
        const methodMiddlewares = target.prototype.__middlewares__ || {}

        // 校验规则
        const classValidates = (target.__validate__ || {})['__class__'] || {}
        const methodValidates = target.prototype.__validate__ || {}

        app.beforeStart(() => {
            actions.forEach(action => {
                // 添加前缀，存储到 fullPath中
                let fullPath = (prefix || '') + action.fullPath
                if (fullPath.endsWith('/')) fullPath = fullPath.substr(0, fullPath.length - 1)
                action.fullPath = fullPath

                const { key, name, path, method } = action
                const middlewares = methodMiddlewares[key] || []
                const validates = methodValidates[key]

                // controller中的方法
                let final = null

                // controller.hello
                const pathName = target.prototype.pathName

                pathName
                    .split('.')
                    .concat([key]) // key为函数名字 index
                    .forEach(pt => {
                        final = final ? final[pt] : app[pt]
                    })

                if (!final) return

                routes[`${pathName}.${key} @${method}('${path}')`] = {
                    method,
                    target,
                    action,
                    route: [name, fullPath] // 名称和路径
                        .concat(
                            // 类级别中间件
                            classMiddlewares.sort((i, j) => i.index - j.index).map(item => item.value)
                        )
                        .concat(
                            // 方法级别中间件
                            middlewares.sort((i, j) => i.index - j.index).map(item => item.value)
                        )
                        .concat(
                            // 类级别校验中间件
                            [validateMiddleware(classValidates)]
                        )
                        .concat(
                            // 方法级别校验中间件
                            [validateMiddleware(validates)]
                        )
                        .concat(
                            // 最终实现
                            [wrapperMiddleware, final]
                        )
                }
            })
        })
    }
}

const methods = ['get', 'post', 'put', 'delete', 'patch', 'all'].reduce((prev, method) => {
    return {
        ...prev,
        [method]: (path, name) => generateRoute(method, path, name)
    }
}, {})

// const get = function(path, name) {
//   return generateRoute('get', name)(path)
//   // return (target, key, descriptor) => {
//   //   return generateRoute('get', name)(path)(target, key, descriptor)
//   // }
// }

module.exports = {
    route,
    ...methods
}
