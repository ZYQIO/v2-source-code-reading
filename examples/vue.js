// min-vue
function Vue(options) {
    this._init(options)
}

Vue.prototype._init = function (options) {
    // 1. 选项合并 options
    this.$options = options;
    // 2. 成员初始化 member init
    this.$parent = options.parent
    // 3. 派发事件, beforeCreate
    callHook(this, 'beforeCreate')
    // state init
    initState(this)
    // 4. created
    callHook(this, 'created')
}

function initState(vm) {
    const opts = vm.$options;
    // props
    // setup
    // methods
    // data
    if (opts.data) {
        initData(vm)
    }
    // computed
    // watch
}

function initData(vm) {
    // 获取data函数的返回值
    const data = vm._data = vm.$options.data.call(vm, vm)

    // 遍历data中所有key, 对它们做代理
    const keys = Object.keys(data);
    let i = keys.length;
    while (i--) {
        const key = keys[i]
        proxy(vm, '_data', key)
    }

    // 对 data 做响应式处理
    observe(data)
}

function callHook(vm, hook) {
    const hooks = vm.$options[hook];
    if (hooks) {
        hooks.call(vm)
    }
}

Vue.prototype.$mount = function (el) {
    // 1. 找到parent
    const parent = document.querySelector(el);
    // 2 获取data
    // const data = this._data;
    // 3. 数据出来之后渲染node, 追加到父节点中
    const node = this.$options.render.call(this)
    parent.appendChild(node)
}

// 用于代理指定对象的某个 key 到 sourceKey
function proxy(target, sourceKey, key) {
    Object.defineProperty(target, key, {
        get() {
            return this[sourceKey][key]
        },
        set(newVal) {
            this[sourceKey][key] = newVal
        }
    })
}

// 将传入的obj, key 做拦截, 从而实现响应式
function defineReactive(obj, key, val = {}) {

    // 递归处理
    observe(val)

    Object.defineProperty(obj, key, {
        get() {
            console.log('get', key);
            return val;
        },
        set(newVal) {
            val = newVal
            console.log('set', key);
        }
    })
}


function observe(obj) {
    // 传入的必须是对象
    if (!(obj !== null && typeof obj === 'object')) {
        return
    }

    // 创建的Observer实例, 以防重复创建, 我们先判断是否
    // 存在 __ob__ 属性, 存在则直接返回
    let ob;
    if (Object.prototype.hasOwnProperty.call(obj, '__ob__')) {
        ob = value.__ob__;
    } else {
        new Observer(obj)
    }

    return ob;
}


class Observer {
    constructor(value) {
        // 定义 __ob__ 属性
        Object.defineProperty(value, '__ob__', {
            value: this,
            enumerable: false,
            writable: true,
            configurable: true
        })
        if (Array.isArray(value)) {
            // array
        } else {
            // Object
            this.walk(value)
        }
    }

    walk(obj) {
        // 循环obj对象所有key, 依次进行拦截
        const keys = Object.keys(obj)
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const val = obj[key];
            // 响应式处理
            defineReactive(obj, key, val)
        }
    }
}

