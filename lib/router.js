'use strict'

const { app, routes } = require('./state')
const { compare, getWrapper } = require('./util')

app.ready(() => {
    const prefix = app.config.routeDecorator.prefix || ''

    Object.keys(routes)
        .sort((i, j) => compare(j, i))
        .forEach(key => {
            // 添加全局前缀
            routes[key].route[1] = `${prefix}${routes[key].route[1]}`

            // log路由注册信息
            app.logger.info(`[router] pid: ${process.pid}, route initialized: '${routes[key].route[1]}'`)

            // 注册路由
            app.router[routes[key].method].apply(app.router, routes[key].route)
        })
})

/**
 * 生成路由
 * @param method http 方法 get post 等
 * @param name
 * @returns {function(*=): function(*, *=, *=): *}
 */
function generateRoute(method, name) {
    return function(path) {
        return function(target, key, descriptor) {
            // 设置默认值 为 []
            target.__actions__ = target.__actions__ || []

            target.__actions__.push({
                key: key,
                name: name,
                path: path || `/${key}`,
                fullPath: path || `/${key}`, // 会在route装饰器中拼接统一前缀
                method: method,
                descriptor: descriptor,
                target: target[key]
            })

            // 包装 controller 返回结果
            const { value } = descriptor
            descriptor.value = getWrapper(value)

            return descriptor
        }
    }
}

/**
 * 在 controller 类上使用的装饰器
 * @param prefix 当前类所有路由的统一前缀
 * @returns {function(*, *, *=): *}
 */
const route = function(prefix) {
    return (target, key, descriptor) => {
        let actions
        if (!descriptor) actions = target.prototype.__actions__ || []
        else actions = target.__actions__ || []

        // 添加前缀，存储到 fullPath中
        actions.forEach(action => {
            action.fullPath = (prefix || '') + action.fullPath
        })

        app.beforeStart(() => {
            actions.forEach(action => {
                let final = null // class或者是class中的函数

                target.prototype.pathName // controller.hello
                    .split('.')
                    .concat([action.key]) // 函数名字 index
                    .forEach(pt => {
                        final = final ? final[pt] : app[pt]
                    })

                if (!final) return

                routes[`${action.name || ''}&${action.fullPath}&${action.method}`] = {
                    method: action.method,
                    route: [action.name, action.fullPath] // 名称和路径
                        .concat(
                            // 中间件
                            (target.__middlewares__ || [])
                                .sort((i, j) => i.index - j.index)
                                .map(item => item.value)
                                .concat(
                                    (action.target.__middlewares__ || [])
                                        .sort((i, j) => i.index - j.index)
                                        .map(item => item.value)
                                )
                        )
                        .concat(
                            // 最终实现
                            [final]
                        )
                }
            })
        })

        return descriptor
    }
}

const methods = ['get', 'post', 'put', 'delete', 'patch', 'all'].reduce((prev, curr) => {
    return {
        ...prev,
        [curr]: function(path, name) {
            return generateRoute(curr, name)(path)
        }
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
