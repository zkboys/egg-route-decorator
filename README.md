# egg-route-decorator

[![NPM version][npm-image]][npm-url]
[![Test coverage][codecov-image]][codecov-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-route-decorator.svg?style=flat-square

[npm-url]: https://npmjs.org/package/egg-route-decorator

[codecov-image]: https://img.shields.io/codecov/c/github/zkboys/egg-route-decorator.svg?style=flat-square

[codecov-url]: https://codecov.io/github/zkboys/egg-route-decorator?branch=master

[snyk-image]: https://snyk.io/test/npm/egg-route-decorator/badge.svg?style=flat-square

[snyk-url]: https://snyk.io/test/npm/egg-route-decorator

[download-image]: https://img.shields.io/npm/dm/egg-route-decorator.svg?style=flat-square

[download-url]: https://npmjs.org/package/egg-route-decorator

使用装饰器来定义 egg.js 的路由和中间件

## 依赖说明

### 依赖的 egg 版本

| egg-route-decorator 版本 | egg  |
| ------------------------- | ------- |
| 2.x                       | 2.x    |

## 开启插件

```js
// config/plugin.js
exports.routeDecorator = {
    enable: true,
    package: 'egg-route-decorator'
}
```

> 基于 typescript 的 eggjs 项目可直接使用装饰器  
> 如果是 js 项目，则需要手动安装 `babel-plugin-transform-decorators-legacy` 和 `babel-plugin-transform-object-rest-spread`这两个包，并在项目里加入 `.babelrc` 文件

.babelrc 定义如下:

```json
{
  "plugins": [
    "transform-decorators-legacy",
    "transform-object-rest-spread"
  ]
}
```

## 插件配置

```javascript
exports.routeDecorator = {
    prefix: '/api', // 全局统一前缀
    defaultMethod: 'get', // 默认请求方法
    // wrapperResult: false, // 是否包装结果
    wrapperResult: { // 如下配置是默认值
        success(data, ctx) {
            // 函数有返回值，进行包装，如果没有返回值，不包装
            if (data !== undefined) {
                ctx.body = {
                    code: 10,
                    data,
                };
            }
        },
        error(error, ctx) {
            // 对错误信息进行包装
            ctx.body = {
                code: 19999,
                error,
                message: error && error.message,
            };
        },
    },
}
```

## API

| 装饰器 | 级别 | 参数 | 说明 |
| --- | --- | --- | --- |
| route(prefix?) | class | prefix：所有当前类路由的统一前缀，默认空 | 当前controller类启用装饰器路由，没有使用装饰器的方法，会默认处理为路由，规则：`post /prefix/methodName` |
| middleware(middleware, index) | class 或 method | middleware：中间件函数；index：中间件顺序 | class级别给所有的方法添加中间件，method级别给当前方法添加中间件 |
| get(path, name)、post、put、del、patch、all | method | path：路由地址；name：路由名称 | 给方法添加具体http方法的装饰器 |
| routeIgnore | method | - | 标记当前方法不处理成路由 |
| validate | class 或 method | options：校验规则：{query: {name: {required: true, message: '姓名必填'}}}，默认校验body： {name: {required: true, message: '姓名必填'}}，可以对四种数据来源进行校验：headers params query body| 检验中间件，需要项目使用 egg-validator-async插件，规则参考：https://github.com/yiminghe/async-validator |

## 使用场景

- 不用单独定义 router，直接在 controller 里通过装饰器自动生成 router
- 支持在 controller 里通过装饰器方式加入中间件，类级别以及方法级别

## 示例

```typescript
import { Controller } from 'egg';
import {
    route,
    all,
    get,
    post,
    put,
    patch,
    del,
    middleware,
    routeIgnore
} from 'egg-route-decorator'

const mi = name => (_ctx, next) => {
    console.log('passed  middleware ' + name);
    next();
};

// controller类上启用装饰器路由

// root path is '/'
@route()

// root path is '/'
@route('/')

// root path is '/routename'
@route('/routename')

// root path is '/routename/action'
@route('/routename/action')

// 支持定义参数
@route('/routename/:name')
@middleware(mi('RoleController'))
export default class RoleController extends Controller {
    // sub-path is '/index'
    public async index() {
        // this.ctx.body = '123';
        return {
            name: 'role 张三',
            age: 24,
        };
    }

    // sub-path is '/'
    @get()

    // sub-path is '/'
    @get('/')

    // sub-path is '/roles'
    @get('/roles')

    // sub-path is '/roles/:id'
    @get('/roles/:id')
    public async getRoles() {

        return {
            name: 123,
        }
    }

    // 没有使用装饰器，默认生成路由：/roles
    @middleware(mi('roles'))
    public async roles() {
        throw Error('测试错误 role');
    }

    @middleware(mi('delRoles'))
    @routeIgnore // 忽略，不生成路由
    public async delRoles() {
        return '删除角色22';
    }

}

```

## License

[MIT](LICENSE)
