/**
 * 对比两个字符串
 * @param string1
 * @param string2
 * @returns {number}
 */
function compare(string1, string2) {
    for (let i = 1; i < string1.length; i++) {
        let val1 = string1[i]
        let val2 = string2[i]
        if (val1 < val2) {
            return -1
        } else if (val1 > val2) {
            return 1
        }
    }
    return 0
}

async function wrapperMiddleware(ctx, next) {
    let wrapperResult = ctx.app.config.routeDecorator.wrapperResult

    // 配置不包裹
    if (!wrapperResult) {
        await next()
        return
    }

    const {
        success = function(data, ctx) {
            // 函数有返回值，进行包装，如果没有返回值，不包装
            if (data !== undefined) {
                ctx.body = {
                    code: 0,
                    data
                }
            }
        },
        error = function(error, ctx) {
            // 对错误信息进行包装
            ctx.body = {
                code: 9999,
                error,
                message: error && error.message
            }
        }
    } = wrapperResult === true ? {} : wrapperResult

    try {
        const data = await next()
        await success(data, ctx)
    } catch (err) {
        await error(err, ctx)
    }
}

function getMethodActions(app, target, actions) {
    let controller = null

    target.prototype.pathName.split('.').forEach(pt => {
        controller = controller ? controller[pt] : app[pt]
    })

    if (!controller) return

    // const controllerName = target.prototype.pathName.split('.').pop()
    const methodNames = Object.keys(controller)
    const method = app.config.routeDecorator.defaultMethod || 'get'

    return methodNames
        .filter(key => !actions.some(item => item.key === key)) // 过滤掉已经使用路由装饰器的函数
        .map(key => {
            return {
                key: key,
                // name: key,
                path: `/${key}`,
                fullPath: `/${key}`, // 会在route装饰器中拼接统一前缀
                method
            }
        })
}

module.exports = {
    compare,
    wrapperMiddleware,
    getMethodActions
}
