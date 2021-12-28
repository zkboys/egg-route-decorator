require('egg')

let _app = null

module.exports = {
    get app() {
        if (!_app) {
            throw new Error('egg-route-decorator plugin is not enable!')
        }

        return _app
    },
    set app(value) {
        _app = value
    },
    routes: {},
    methodRoutes: {}
}
