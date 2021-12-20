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

const getWrapper = (value, instance) => {
    async function wrapper(...args) {
        const _this = instance || this
        console.log(_this)

        let wrapperResult = _this.app.config.routeDecorator.wrapperResult

        // 配置不包装
        if (!wrapperResult) {
            return await value.apply(_this, args)
        }

        const {
            success = function(data) {
                // 函数有返回值，进行包装，如果没有返回值，不包装
                if (data !== undefined) {
                    _this.ctx.body = {
                        code: 0,
                        data
                    }
                }
            },
            error = function(error) {
                // 对错误信息进行包装
                _this.ctx.body = {
                    code: 9999,
                    error,
                    message: error && error.message
                }
            }
        } = wrapperResult === true ? {} : wrapperResult

        try {
            const data = await value.apply(_this, args)
            success.apply(_this, [data])
        } catch (err) {
            error.apply(_this, [err])
        }
    }

    return wrapper
}

module.exports = {
    compare,
    getWrapper
}
