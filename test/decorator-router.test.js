'use strict'

const mock = require('egg-mock')
const assert = require('assert')

describe('test/decorator-router.test.js', () => {
    let app
    before(() => {
        app = mock.app({
            baseDir: 'apps/decorator-router-test'
        })
        return app.ready()
    })

    after(() => app.close())
    afterEach(mock.restore)

    it('should GET /api', () => {
        return app
            .httpRequest()
            .get('/api')
            .expect(200)
            .expect({
                code: 0,
                data: 'routeDecorator'
            })
    })

    it('should POST /api', () => {
        const postData = { name: 'test', num: 1 }

        return app
            .httpRequest()
            .post('/api')
            .send(postData)
            .expect('post data: ' + JSON.stringify(postData))
            .expect(200)
    })

    it('should get /swagger-doc', () => {
        return app
            .httpRequest()
            .get('/swagger-doc')
            .expect(res => {
                console.log(JSON.stringify(res.body, null, 2))
            })
            .expect(200)
    })

    it('should get /swagger-ui.html', () => {
        return app
            .httpRequest()
            .get('/swagger-doc')
            .expect(200)
    })

    it('should get /api/users', () => {
        return app
            .httpRequest()
            .get('/api/users')
            .query({ name: 'haha' })
            .expect({
                code: 0,
                data: {
                    name: 123,
                    age: 23
                }
            })
            .expect(200)
    })
})
