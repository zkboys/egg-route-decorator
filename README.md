# egg-route-decorator

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-route-decorator.svg?style=flat-square

[npm-url]: https://npmjs.org/package/egg-route-decorator

[travis-image]: https://img.shields.io/travis/fyl080801/egg-route-decorator.svg?style=flat-square

[travis-url]: https://travis-ci.org/fyl080801/egg-route-decorator.svg?branch=master

[codecov-image]: https://img.shields.io/codecov/c/github/fyl080801/egg-route-decorator.svg?style=flat-square

[codecov-url]: https://codecov.io/github/fyl080801/egg-route-decorator?branch=master

[david-image]: https://img.shields.io/david/fyl080801/egg-route-decorator.svg?style=flat-square

[david-url]: https://david-dm.org/fyl080801/egg-route-decorator

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
  // wrapperResult: false, // 是否包装结果，true使用默认，false关闭
  wrapperResult: {
    // 如下配置是默认值
    success(data) {
      // 函数有返回值，进行包装，如果没有返回值，不包装
      if (data !== undefined) {
        this.ctx.body = {
          code: 10,
          data
        }
      }
    },
    error(error) {
      // 对错误信息进行包装
      this.ctx.body = {
        code: 19999,
        error,
        message: error && error.message
      }
    }
  }
}
```

## 使用场景

- 不用单独定义 router，直接在 controller 里通过装饰器自动生成 router
- 支持在 controller 里通过装饰器方式加入中间件

## 规范

Http 请求的完整路径是根路径和子路径合并的结果

在 controller 中先引入依赖

```javascript
const {
  route,
  all,
  get,
  post,
  put,
  patch,
  del,
  middleware
} = require('egg-route-decorator')
```

如果使用 typescript

```typescript
import {
  route,
  all,
  get,
  post,
  put,
  patch,
  del,
  middleware
} from 'egg-route-decorator'
```

### 直接在 controller 里定义一个路由

在 controller 里定义一个根路径

```javascript
// root path is '/'
@route()

// root path is '/'
@route('/')

// root path is '/routename'
@route('/routename')

// root path is '/routename/action'
@route('/routename/action')
```

支持定义参数

```javascript
@route('/routename/:name')
```

### 定义子目录和 HttpMethod

支持 Http 方法 `get` `post` `put` `patch` `del` `all`

在 controller 方法上定义子目录

```javascript
// sub-path is '/'
@get()

// sub-path is '/'
@get('/')

// sub-path is '/action'
@get('/action')

// sub-path is '/action/:id'
@get('/action/:id')
```

### 定义中间件

```javascript
@middleware(routeM)
```

## 示例

```javascript
'use strict'

const { Controller } = require('egg')
const { route, get, middleware, filters } = require('egg-route-decorator')
const { DefaultFilter } = filters

const routeM = (ctx, next) => {
  console.log('passed route middleware')
  next()
}

const actionM = i => {
  return (ctx, next) => {
    console.log('passed action middleware ' + i)
    next()
  }
}

@route()
@middleware(routeM) class HomeController extends Controller {
  @get('/') // path: /
  async index() {
    await new Promise(resolve => {
      this.ctx.body = 'ssss'
      resolve()
    })
  }

  @get() // path: /func1
  @middleware(actionM(2), 2)
  @middleware(actionM(1), 1) func1(ctx) {
    ctx.body = 'hi, func1'
  }

  @get('/:id') // path: /:id
  @DefaultFilter('aaa') func2(ctx) {
    ctx.body = 'hi, func2 ' + ctx.params.id
  }
}

module.exports = HomeController
```

## License

[MIT](LICENSE)
