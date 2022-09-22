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
    // const parent = document.querySelector(el);
    this.$el = document.querySelector(el);
    // 2 获取data
    // const data = this._data;

    const updateComponent = () => {
        // 先清空宿主
        parent.innerHTML = ''

        // 3. 数据出来之后渲染node, 追加到父节点中
        // const node = this.$options.render.call(this)
        // parent.appendChild(node)

        // VNode实现
        const vnode = this.$options.render.call(this, this.$createElement)
        console.log('vnode', vnode);
        // createElm(vnode, parent)
        this._update(vnode)
    }

    // 创建 Watcher 实例, 作为组件渲染 Watcher
    new Watcher(this, updateComponent)
}

Vue.prototype._update = function (vnode) {
    // 获取上一次的vnode
    const preVnode = this._vnode
    // 保存最新的vnode
    this._vnode = vnode
    if (!preVnode) {
        // init
        this.patch(this.$el, vnode)
    } else {
        // update
        this.patch(preVnode, vnode)
    }
}

Vue.prototype.patch = function (oldVnode, vnode) {
    // 如果是真实的dom, 就走初始化
    if (oldVnode.nodeType) {
        createElm(vnode, oldVnode)
    } else {
        // 否则就是更新流程, 对比新老vnode, 进行diff
        patchVnode(oldVnode, vnode)
    }
}

function patchVnode(oldVnode, vnode) {
    console.log('oldVnode, vnode', oldVnode, vnode);
    // 更新的目标dom
    const elm = vnode.elm = oldVnode.elm
    // 获取双方的子元素
    const oldCh = oldVnode.children
    const ch = vnode.children

    if (isUndef(vnode.text)) {
        if (isDef(ch) && isDef(oldCh)) {
            // 新老都有子元素
            // diff 比对传入的子元素
            updateChildren()
        }
    } else if (oldVnode.text !== vnode.text) {
        // 都有文本且不相等
        elm.textContent = vnode.text;
    }
}

function updateChildren(parentElm, oldCh, newCh) {
    // 后续待补齐相关代码
}

function isUndef(v) {
    return v === undefined || v === null
}

function isDef(v) {
    return v !== undefined && v !== null
}

// 递归遍历vnode, 创建dom树, 添加到parentElm
function createElm(vnode, parentElm) {
    // 1. 先获取tag并创建元素
    const tag = vnode.tag

    // 2. 获取children情况, 递归处理
    const children = vnode.children;

    // 3. 处理属性
    const data = vnode.data

    if (tag) {
        // element
        vnode.elm = document.createElement(tag)
        // 先递归处理子元素
        if (typeof children === 'string') {
            // 文本情况
            createElm({ text: children }, vnode.elm)
        } else if (Array.isArray(children)) {
            // 若干子元素
            for (const child of children) {
                createElm(child, vnode.elm)
            }
        }

        // 处理元素的属性
        if (data) {
            // 对元素做 setAttribute
            if (data.attrs) {
                for (const attr in data.attrs) {
                    vnode.elm.setAttribute(attr, data.attrs[attr])
                }
            }
        }

        parentElm.appendChild(vnode.elm)
    } else {
        // text
        vnode.elm = document.createTextNode(vnode.text)
        parentElm.appendChild(vnode.elm)
    }
}

Vue.prototype.$createElement = (tag, data, children) => {
    // 根据tag处理元素和文本两种情况
    if (tag) {
        // element
        return { tag, data, children }
    } else {
        // text
        return { text: data }
    }
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
                    // 专门针对于数组场景的依赖收集, 如果对象中key通过指针指向的数组内容有变化,
                    // 则需要专门收集一个单独的依赖, 方便数组内容有变化时, 做处理更新
                    childOb.dep.depend()
                    // // console.log('childOb dep', childOb.dep.subs);
                    // // 对数组做额外的依赖收集
                    // 这里则是针对于数组中, 嵌套了对象或另外的数组等复杂数据做依赖收集, 用于视图更新
                    // *暂时没有想到太好的业务场景进行验证这里的东西
                    if (Array.isArray(val)) {
                        dependArray(val)

                        // dependArray 函数中的逻辑, 放在这里方便理解
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

let wid = 0
class Watcher {
    constructor(vm, expOrFun) {
        this.id = ++wid;
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
        // this.get()
        // 异步更新
        // 排队
        queueWatcher(this)
    }

    run() {
        this.get()
    }
}

const queue = [] // 存放待执行的 watcher
const has = {}
let waiting = false
function queueWatcher(watcher) {
    const id = watcher.id;
    // 去重, 
    if (has[id] != null) {
        return
    }
    // 不存在才入队
    queue.push(watcher)
    if (!waiting) {
        waiting = true
        // 异步执行 flushScheduleQueue
        nextTick(flushScheduleQueue)
    }
}

const callbacks = [] // 用于存放异步任务
let pending = false;
const timeFunc = () => Promise.resolve().then(flushCallbacks)
function nextTick(cb) {
    // 1. 将cb存入callbscks数组中
    callbacks.push(cb)

    if (!pending) {
        pending = true
        // 异步启动
        timeFunc()
    }
}

function flushCallbacks() {
    pending = false
    // 先备份, 防止正在执行任务时, 还有任务进入队列, 先进行一次快照
    const copies = callbacks.slice(0)
    callbacks.length = 0
    for (const cb of copies) {
        cb()
    }
}

let flushing = false
function flushScheduleQueue() {
    let id;
    flushing = true
    for (const watcher of queue) {
        // 去掉 id , 去重失效了
        id = watcher.id
        has[id] = null
        // 真正的更新函数调用
        watcher.run()
    }

    // 还原状态
    flushing = waiting = false

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


