'use strict'

const Controller = require('egg').Controller
const { route, get, post, query } = require('../../../../../../lib')

@route()
class UserController extends Controller {
    @get('/users')
    @query({
        name: { type: 'string', name: '用户名', required: true }
    })
    async index() {
        return { name: 123, age: 23 }
    }

    @post('/users')
    async create() {
        const { ctx } = this

        ctx.body = 'post data: ' + JSON.stringify(ctx.request.body)
    }
}

module.exports = UserController
