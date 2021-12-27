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


/**
 * 校验中间件
 * @param options
 * @returns {(function(*, *): *)|(function(*=, *): Promise<void>)|*}
 */
function validateMiddleware(options) {
    if (!options || !options.length) return (ctx, next) => next();

    // ctx.headers ctx.params ctx.query ctx.request.body
    // options = [ { query: { name: [Object], age: [Array], enabled: [Object] } } ]

    return async (ctx, next) => {
        try {
            const { headers, params, path, query, body } = options;

            if (headers) await ctx.validate(headers, ctx.headers);
            if (params) await ctx.validate(params, ctx.params);
            if (path) await ctx.validate(path, ctx.params);
            if (query) await ctx.validate(query, ctx.query);
            if (body) await ctx.validate(body, ctx.request.body);
            await next();
        } catch (err) {
            let wrapperResult = ctx.app.config.routeDecorator.wrapperResult;

            // 配置不包裹
            if (!wrapperResult) {
                ctx.status = 422;
                ctx.body = err;
                return;
            }

            const {
                error = function(error, ctx) {
                    // 对错误信息进行包装
                    ctx.body = {
                        code: 422,
                        error,
                        message: error && error.message
                    };
                }
            } = wrapperResult === true ? {} : wrapperResult;
            // 对错误信息进行包装
            await error(err, ctx);
        }
    };
}


module.exports = {
    compare,
    wrapperMiddleware,
    validateMiddleware
}
