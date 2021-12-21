'use strict'

const { app, routes } = require('./state')
const { compare, wrapperMiddleware, getMethodActions } = require('./util')

app.ready(() => {
    const prefix = app.config.routeDecorator.prefix || ''

    Object.keys(routes)
        .sort((i, j) => compare(j, i))
        .forEach(key => {
            // 添加全局前缀
            routes[key].route[1] = `${prefix}${routes[key].route[1]}`

            // log路由注册信息
            app.logger.info(
                `[router] pid: ${process.pid}, route initialized: '${routes[key].method} ${routes[key].route[1]}'`
            )
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
                descriptor: descriptor
            })

            return descriptor
        }
    }
}

function validateMiddleware(options) {
    if (!options || !options.length) return (ctx, next) => next()

    // ctx.headers ctx.params ctx.query ctx.request.body
    // options = [ { query: { name: [Object], age: [Array], enabled: [Object] } } ]

    return async (ctx, next) => {
        try {
            for (let item of options) {
                const { headers, params, query, body } = item

                // 直接写的descriptor，并没有区分 'headers', 'params', 'query', 'body'， 直接默认校验body
                if (Object.keys(item).some(key => !['headers', 'params', 'query', 'body'].includes(key))) {
                    await ctx.validate(item, ctx.request.body)
                    continue
                }

                if (headers) await ctx.validate(headers, ctx.headers)
                if (params) await ctx.validate(params, ctx.params)
                if (query) await ctx.validate(query, ctx.query)
                if (body) await ctx.validate(body, ctx.request.body)
            }
            await next()
        } catch (error) {
            // 对错误信息进行包装
            ctx.body = {
                code: 422,
                error,
                message: error && error.message
            }
        }
    }
}

/**
 * 忽略方法，不生成路由
 * @param target
 * @param key
 * @param descriptor
 * @returns {*}
 */
function routeIgnore(target, key, descriptor) {
    target.__ignores__ = target.__ignores__ || []

    target.__ignores__.push({ key })
    return descriptor
}

/**
 * 在 controller 类上使用的装饰器
 * @param prefix 当前类所有路由的统一前缀
 * @returns {function(*): *}
 */
const route = function(prefix) {
    return target => {
        let actions = target.prototype.__actions__ || []
        let ignores = target.prototype.__ignores__ || []

        // 中间件
        const classMiddlewares = (target.__middlewares__ || {})['__class__'] || []
        const methodMiddlewares = target.prototype.__middlewares__ || {}

        // 校验规则
        const classValidates = (target.__validate__ || {})['__class__'] || []
        const methodValidates = target.prototype.__validate__ || {}

        app.beforeStart(() => {
            // 将没有使用装饰器的方法，注册为路由，默认post
            const methodActions = getMethodActions(app, target, actions)

            actions = [...actions, ...methodActions].filter(item => !ignores.some(it => it.key === item.key))
            // 添加前缀，存储到 fullPath中
            actions.forEach(action => {
                action.fullPath = (prefix || '') + action.fullPath
            })

            actions.forEach(action => {
                const { key, name, fullPath, method } = action
                const middlewares = methodMiddlewares[key] || []
                const validates = methodValidates[key]

                let final = null // controller中的方法

                target.prototype.pathName // controller.hello
                    .split('.')
                    .concat([key]) // 函数名字 index
                    .forEach(pt => {
                        final = final ? final[pt] : app[pt]
                    })

                if (!final) return

                routes[`${name || ''}&${fullPath}&${method}`] = {
                    method,
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
    routeIgnore,
    ...methods
}
