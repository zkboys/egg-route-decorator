'use strict'

const Controller = require('egg').Controller
const { route, get, post } = require('../../../../../../lib')

@route()
class HomeController extends Controller {
    @get('/')
    async index() {
        const { app, ctx } = this

        ctx.body = 'hi, ' + app.plugins.routeDecorator.name
    }

    @post('/')
    async create() {
        const { ctx } = this

        ctx.body = 'post data: ' + JSON.stringify(ctx.request.body)
    }
}

module.exports = HomeController
