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

    const updateComponent = () => {
        // 先清空宿主
        parent.innerHTML = ''

        // 3. 数据出来之后渲染node, 追加到父节点中
        const node = this.$options.render.call(this)
        parent.appendChild(node)
    }

    // 创建 Watcher 实例, 作为组件渲染 Watcher
    new Watcher(this, updateComponent)
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

    const dep = new Dep()

    // console.log('obj, key,', obj, key)
    // console.log('dep key', dep, '-->', key);

    // 递归处理
    const childOb = observe(val)

    Object.defineProperty(obj, key, {
        get() {
            console.log('get', key, 'dep', dep);
            console.log('Dep.target', Dep.target);

            // 测试依赖收集目标是否存在
            if (Dep.target) {
                dep.depend()

                console.log('dep key', key, dep, 'childOb', childOb);
                // console.log('Dep.target', Dep.target);

                // 嵌套对象的Observer实例中的dep也要和watcher建立依赖关系
                if (childOb) {
                    childOb.dep.depend()
                    // // console.log('childOb dep', childOb.dep.subs);
                    // // 对数组做额外的依赖收集
                    if (Array.isArray(val)) {
                        dependArray(val)
                        // for (const item of val) {
                        //     if (item && item.__ob__) {
                        //         // 这一项是响应式对象, 则对其伴生的ob内部的dep做依赖收集
                        //         item.__ob__.dep.depend()
                        //     }
                        //     // 如果当前item又是数组, 向下递归
                        //     if (Array.isArray(item)) {
                        //         dependArray(item)
                        //     }
                        // }
                    }
                }
            }
            return val;
        },
        set(newVal) {
            val = newVal
            console.log('set', key);
            // 变更通知
            dep.notify()
        }
    })
}

// 数组内所有对象都需要做依赖收集
function dependArray(items) {
    for (const item of items) {
        if (item && item.__ob__) {
            // 这一项是响应式对象, 则对其伴生的ob内部的dep做依赖收集
            item.__ob__.dep.depend()
        }
        // 如果当前item又是数组, 向下递归
        if (Array.isArray(item)) {
            dependArray(item)
        }
    }
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
        ob = new Observer(obj)
    }

    return ob;
}


class Observer {
    constructor(value) {
        // 创建一个伴生的Dep实例
        this.dep = new Dep()

        // 定义 __ob__ 属性
        Object.defineProperty(value, '__ob__', {
            value: this,
            enumerable: false,
            writable: true,
            configurable: true
        })

        if (Array.isArray(value)) {
            // array
            // 覆盖数组实例的原型
            value.__proto__ = arrayMethods
            // 对当前数组实例做响应式
            this.observeArray(value)
        } else {
            // Object
            this.walk(value)
        }
    }

    observeArray(items) {
        for (const item of items) {
            observe(item)
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


class Watcher {
    constructor(vm, expOrFun) {
        this.vm = vm;
        this.getter = expOrFun;

        // 保存管理的所有deps
        this.newDepIds = new Set()
        this.newDeps = []

        // 立刻触发getter函数执行
        this.get()
    }

    get() {
        // 0. 设置依赖目标
        Dep.target = this;
        const vm = this.vm;
        // 1. 调用getter函数
        try {
            this.getter.call(vm, vm)
        } catch (error) {
            throw error
        } finally {
            // 执行结束, 还原依赖目标为空, 防止重复添加
            Dep.target = undefined
        }
    }

    addDep(dep) {
        const id = dep.id;

        if (!this.newDepIds.has(id)) {
            this.newDepIds.add(id)
            this.newDeps.push(dep)

            // 反过来将自己添加到dep中
            dep.addSub(this)
        }
    }

    update() {
        this.get()
    }
}

let uid = 0
class Dep {
    constructor() {
        this.id = uid++;
        this.subs = []
    }

    // 通知watch添加自己
    // 从而建立当前dep和wathcer之间的关系
    depend() {
        Dep.target.addDep(this)
    }

    addSub(watcher) {
        this.subs.push(watcher)
    }

    notify() {
        for (const sub of this.subs) {
            sub.update()
        }
    }
}


// 全局注册api
Vue.set = set
Vue.del = del

// 实例api
Vue.prototype.$set = set
Vue.prototype.$delete = del


function set(obj, key, val) {
    // 如果是数组的话
    if (Array.isArray(obj)) {
        // 获取key和length之间的较大者, 并对length扩容
        obj.length = Math.max(obj.length, key)
        obj.splice(key, 1, val)
        // 由于splice操作会自动通知更新, 因此直接退出
        return val
    }
    const ob = obj.__ob__;

    if (!ob) {
        obj[key] = val
    } else {
        // 1. 设置动态属性拦截
        defineReactive(obj, key, val)
        // 2. 变更通知
        ob.dep.notify()
    }
}

function del(obj, key) {
    // 数组直接删除元素并退出
    if (Array.isArray(obj)) {
        obj.splice(key, 1)
        return
    }
    const ob = obj.__ob__;
    delete obj[key]
    if (ob) {
        ob.dep.notify()
    }
}

// 获取数组原型, 做一份克隆
const arrayProto = Array.prototype
const arrayMethods = Object.create(arrayProto)
// 列出7个变更方法
const methodsToPatch = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
]
// 扩展这7个方法, 使之能够做变更通知
methodsToPatch.forEach(function (method) {
    // 原始方法
    const original = arrayProto[method]
    // 覆盖原始函数
    Object.defineProperty(arrayMethods, method, {
        value: function (...args) {
            // 执行原始操作
            const result = original.apply(this, args)
            // 扩展: 增加变更通知能力
            const ob = this.__ob__
            // 判断是否有新元素进来
            let inserted
            switch (method) {
                case 'push':
                case 'unshift':
                    inserted = args
                    break;
                case 'splice':
                    inserted = args.slice()
            }

            if (inserted) {
                // 对它执行响应式处理
                ob.observeArray(inserted)
            }
            // 变更通知
            ob.dep.notify()
            return result
        }
    })


})


