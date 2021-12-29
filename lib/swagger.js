const path = require('path')
const staticCache = require('koa-static-cache')

/**
 * 成功包裹
 * @param data
 * @returns {{type: string, properties: {code: {type: string}, data}}}
 */
const successSchema = data => {
    return {
        type: 'object',
        properties: {
            code: {
                type: 'number'
            },
            data
        }
    }
}

/**
 * 从头 descriptors 获取properties
 * @param descriptors
 * @returns {{}}
 */
function getProperties(descriptors) {
    if (!descriptors) return
    const properties = {}
    Object.entries(descriptors).forEach(([field, rule]) => {
        const rules = Array.isArray(rule) ? rule : [rule]
        const fieldsRecord = rules.find(item => item.fields)

        properties[field] = getParameter(field, rules)
        if (fieldsRecord) {
            properties[field].properties = getProperties(fieldsRecord.fields)
        }
    })
    return properties
}

/**
 * 获取 parameter
 * @param field
 * @param rule
 * @returns {{default, description: *, type: string, items, required, example: *}}
 */
function getParameter(field, rule) {
    const rules = Array.isArray(rule) ? rule : [rule]
    let description
    let required
    let type
    let defaultValue
    let example
    let items

    rules.forEach(item => {
        if (item.name) description = item.name
        if (item.required) required = item.required
        if (item.type) type = item.type
        if (item.default) defaultValue = item.default
        if (item.example) example = item.example
        if (item.eg) example = item.eg
        if (item.items) items = item.items
    })

    return {
        description: description || field,
        required: required,
        type: type || 'string',
        default: defaultValue,
        example: example !== undefined ? example : defaultValue,
        items
    }
}

/**
 * 获取 parameters
 * @param classValidates
 * @param validates
 * @returns {*[]}
 */
function getParameters(classValidates, validates) {
    const parameters = []

    Object.entries(validates).forEach(([source, descriptor]) => {
        const classDescriptor = classValidates[source] || {}
        const descriptors = {
            ...classDescriptor,
            ...descriptor
        }

        if (source === 'body') {
            parameters.push({
                name: 'body',
                in: 'body',
                type: 'object',
                schema: {
                    type: 'object',
                    properties: getProperties(descriptors)
                }
            })
            return
        }

        let inKey = source
        if (inKey === 'params') inKey = 'path'
        if (inKey === 'headers') inKey = 'header'

        Object.entries(descriptors).forEach(([field, rule]) => {
            const parameter = getParameter(field, rule)
            parameters.push({
                name: field,
                in: inKey,
                ...parameter
            })
        })
    })

    return parameters
}

/**
 * 获取返回结果
 * @param responses
 * @param app
 * @returns {{'200': {schema: ({type: string, properties: {code: {type: string}, data}}|{type: string, items: {type: string, properties: {}}}|{type: string}|{type: string}|{type: string}|{type: string, properties: {}}), description: string}}}
 */
function getResponses(responses = {}, app) {
    const { wrapperResult } = app.config.routeDecorator
    let { description, schema } = (() => {
        // responses 直接就是描述
        if (typeof responses === 'string') {
            return { description: responses }
        }

        // responses 指定了 description、schema
        const { description, schema } = responses
        if (description || schema) {
            return responses
        }

        // responses 直接作为schema
        return { schema: responses }
    })()

    schema = (() => {
        if (Array.isArray(schema)) {
            return {
                type: 'array',
                items: { type: 'object', properties: getProperties(schema[0]) }
            }
        }

        if (schema === Boolean) return { type: 'boolean' }
        if (schema === Number) return { type: 'number' }
        if (schema === String) return { type: 'string' }

        return {
            type: 'object',
            properties: getProperties(schema)
        }
    })()

    return {
        200: {
            description: description || 'OK',
            schema: wrapperResult ? successSchema(schema) : schema
        }
    }
}

/**
 * 获取swagger文档所需数据结构
 * @param app
 * @param routes
 * @returns {{basePath: (string|*), paths: {}, host: string, schemes: (string[]|*|[*]), securityDefinitions: *, swagger: string, info: {description: string, title: string, version: string}, tags: *[]}}
 */
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
        // summary
        const methodSummaries = target.prototype.__summary__ || {}
        // description
        const methodDescriptions = target.prototype.__description__ || {}
        // responses
        const methodResponses = target.prototype.__response__ || {}

        // tags
        let classTags = (target.__tags__ || {})['__class__'] || []
        if (!Array.isArray(classTags)) classTags = [classTags]
        const methodTags = target.prototype.__tags__ || {}

        actions.forEach(it => {
            const { method, key, path } = it
            const validates = methodValidates[key] || {}
            if (!paths[path]) paths[path] = {}

            const summary = methodSummaries[key]
            const description = methodDescriptions[key]
            const response = methodResponses[key]
            let tags = methodTags[key] || []
            if (!Array.isArray(tags)) tags = [tags]

            tags = classTags.concat(tags)
            // 默认controller名
            tags = tags.length ? tags : [target.name]

            const parameters = getParameters(classValidates, validates)
            const responses = getResponses(response, app)

            paths[path][method] = {
                summary,
                description: description || summary,
                operationId: key,
                tags,
                parameters,
                responses
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
        securityDefinitions: swagger.securityDefinitions
        // definitions
    }
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
    // const userSchema = {
    //     type: 'object',
    //     properties: {
    //         code: {
    //             type: 'number'
    //         },
    //         data: {
    //             type: 'object',
    //             properties: {
    //                 count: { type: 'number' },
    //                 rows: {
    //                     type: 'array',
    //                     items: {
    //                         type: 'object',
    //                         properties: {
    //                             name: { type: 'string', example: '示例张三' },
    //                             age: { type: 'number', example: 23 }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }
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
