const path = require('path')
const staticCache = require('koa-static-cache')
const userSchema = {
    type: 'object',
    properties: {
        code: {
            type: 'number'
        },
        data: {
            type: 'object',
            properties: {
                count: { type: 'number' },
                rows: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', example: '示例张三' },
                            age: { type: 'number', example: 23 }
                        }
                    }
                }
            }
        }
    }
}

function getSwaggerDoc(app, routes) {
    // 以controller进行分组
    const controllers = []
    Object.values(routes).forEach(item => {
        const {
            target,
            action: { method, key, path }
        } = item
        let record = controllers.find(it => it.target === target)
        if (!record) {
            record = { target, actions: [] }
            controllers.push(record)
        }

        record.actions.push({
            method,
            key,
            path
        })
    })

    const paths = {}

    controllers.forEach(item => {
        const { target, actions } = item

        // 校验规则
        const classValidates = (target.__validate__ || {})['__class__'] || {}
        const methodValidates = target.prototype.__validate__ || {}
        const methodSummaries = target.prototype.__summary__ || {}
        const methodDescriptions = target.prototype.__description__ || {}

        let classTags = (target.__tags__ || {})['__class__'] || []
        if (!Array.isArray(classTags)) classTags = [classTags]
        const methodTags = target.prototype.__tags__ || {}

        actions.forEach(it => {
            const { method, key, path } = it
            const validates = methodValidates[key] || {}
            if (!paths[path]) paths[path] = {}

            const summary = methodSummaries[key]
            const description = methodDescriptions[key]
            let tags = methodTags[key] || []
            if (!Array.isArray(tags)) tags = [tags]

            tags = classTags.concat(tags)
            // 默认controller名
            tags = tags.length ? tags : [target.name]

            const parameters = []

            const inMap = {
                params: 'path',
                headers: 'header'
            }
            Object.entries(validates).forEach(([key, descriptor]) => {
                const classDescriptor = classValidates[key] || {}
                const descriptors = {
                    ...classDescriptor,
                    ...descriptor
                }

                Object.entries(descriptors).forEach(([field, rule]) => {
                    const rules = Array.isArray(rule) ? rule : [rule]
                    let description
                    let required
                    let type
                    let defaultValue
                    let example
                    let fields

                    rules.forEach(item => {
                        if (item.name) description = item.name
                        if (item.required) required = item.required
                        if (item.type) type = item.type
                        if (item.default) defaultValue = item.default
                        if (item.example) example = item.example
                        if (item.eg) example = item.eg

                        if (item.fields) fields = item.fields
                    })

                    let inKey = inMap[key] || key
                    parameters.push({
                        name: field,
                        in: inKey,
                        description: description || field,
                        required: required || false,
                        type: type || 'string',
                        default: defaultValue,
                        example: example !== undefined ? example : defaultValue
                    })
                })
            })

            paths[path][method] = {
                summary,
                description: description || summary,
                operationId: key,
                tags,
                parameters
            }
        })
    })

    const { swagger } = app.config.routeDecorator

    return {
        host: '',
        swagger: '2.0',
        basePath: swagger.basePath,
        info: swagger.apiInfo,
        schemes: swagger.schemes,
        tags: [],
        paths,
        // paths: {
        //     '/users': {
        //         get: {
        //             summary: '用户分页查询',
        //             description: '基于分页信息，进行用户查询',
        //             operationId: 'index',
        //             tags: ['用户'],
        //             parameters: [
        //                 {
        //                     name: 'username',
        //                     in: 'query',
        //                     description: '用户名，模糊查询',
        //                     required: false,
        //                     type: 'string',
        //                     default: '张三',
        //                     example: '用户名示例'
        //                 }
        //                 // {
        //                 //     name: 'user',
        //                 //     in: 'body',
        //                 //     type: 'object',
        //                 //     // schema: userSchema,
        //                 //     properties: userSchema.properties.data.properties.rows.items.properties
        //                 // }
        //             ],
        //             responses: {
        //                 200: {
        //                     description: 'OK',
        //                     schema: userSchema
        //                 }
        //             }
        //         }
        //     }
        // },
        securityDefinitions: swagger.securityDefinitions
        // definitions
    }
}

function initSwagger(app, routes) {
    const { logging = true } = app.config.routeDecorator

    // swaggerUI json字符串访问地址
    app.get('/swagger-doc', ctx => {
        ctx.response.status = 200
        ctx.response.type = 'application/json'
        ctx.response.body = getSwaggerDoc(app, routes)
    })

    if (logging) {
        app.logger.info(`[egg-swagger-doc] =================== swagger UI =====================`)
        app.logger.info('[egg-swagger-doc] register router: get /swagger-doc')
    }

    // swaggerUI的静态资源加入缓存，配置访问路由
    const swaggerH5 = path.join(__dirname, '../app/public')
    app.use(staticCache(swaggerH5, {}, {}))
    if (logging) {
        app.logger.info('[egg-swagger-doc] register router: get /swagger-ui.html')
    }
}

module.exports = {
    initSwagger
}
