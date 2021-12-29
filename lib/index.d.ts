/**
 *
 * @param {string} prefix 当前controller请求统一前缀
 */
declare function route(prefix?: string): any

/**
 * http方法装饰器 get
 * @param {string} path 路由地址，会自动拼接route中的prefix以及全局的prefix
 * @param {string} name 路由名称，一般不用写
 */
declare function get(path?: string, name?: string): any

/**
 * http方法装饰器 del
 * @param {string} path 路由地址，会自动拼接route中的prefix以及全局的prefix
 * @param {string} name 路由名称，一般不用写
 */
declare function del(path?: string, name?: string): any

/**
 * http方法装饰器 patch
 * @param {string} path 路由地址，会自动拼接route中的prefix以及全局的prefix
 * @param {string} name 路由名称，一般不用写
 */
declare function patch(path?: string, name?: string): any

/**
 * http方法装饰器 post
 * @param {string} path 路由地址，会自动拼接route中的prefix以及全局的prefix
 * @param {string} name 路由名称，一般不用写
 */
declare function post(path?: string, name?: string): any

/**
 * http方法装饰器 put
 * @param {string} path 路由地址，会自动拼接route中的prefix以及全局的prefix
 * @param {string} name 路由名称，一般不用写
 */
declare function put(path?: string, name?: string): any

/**
 * http方法装饰器 all
 * @param {string} path 路由地址，会自动拼接route中的prefix以及全局的prefix
 * @param {string} name 路由名称，一般不用写
 */
declare function all(path?: string, name?: string): any

/**
 * 中间件装饰器
 * @param {function} middleware 中间件
 * @param {number} index 中间件顺序
 */
declare function middleware(middleware, index?: string): any

/**
 * 校验装饰器，校验header
 * @param descriptor
 */
declare function header(descriptor?: any): any

/**
 * 校验装饰器，校验param
 * @param descriptor
 */
declare function param(descriptor?: any): any

/**
 * 校验装饰器，校验path
 * @param descriptor
 */
declare function path(descriptor?: any): any

/**
 * 校验装饰器，校验query
 * @param descriptor
 */
declare function query(descriptor?: any): any

/**
 * 校验装饰器，校验body
 * @param descriptor
 */
declare function body(descriptor?: any): any

/**
 * swagger文档装饰器，description
 * @param description
 */
declare function description(description?: string): any

/**
 * swagger文档装饰器，response
 * @param response
 */
declare function response(response?: any): any

/**
 * swagger文档装饰器，summary
 * @param summary
 */
declare function summary(summary?: string): any

/**
 * swagger文档装饰器，tags
 * @param tags
 */
declare function tags(tags?: any): any

export {
    route,
    get,
    del,
    patch,
    post,
    put,
    all,
    middleware,
    header,
    param,
    path,
    query,
    body,
    description,
    response,
    summary,
    tags
}
