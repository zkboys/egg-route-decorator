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
    const { swagger } = app.config.routeDecorator

    return {
        host: '',
        swagger: '2.0',
        basePath: swagger.basePath,
        info: swagger.apiInfo,
        schemes: swagger.schemes,
        tags: [],
        paths: {
            '/users': {
                get: {
                    summary: '用户分页查询',
                    description: '基于分页信息，进行用户查询',
                    operationId: 'index',
                    tags: ['用户'],
                    parameters: [
                        {
                            name: 'username',
                            in: 'query',
                            description: '用户名，模糊查询',
                            required: false,
                            type: 'string',
                            default: '张三',
                            example: '用户名示例'
                        },
                        // {
                        //     name: 'user',
                        //     in: 'body',
                        //     type: 'object',
                        //     // schema: userSchema,
                        //     properties: userSchema.properties.data.properties.rows.items.properties
                        // }
                    ],
                    responses: {
                        200: {
                            description: 'OK',
                            schema: userSchema
                        }
                    }
                }
            }
        },
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
