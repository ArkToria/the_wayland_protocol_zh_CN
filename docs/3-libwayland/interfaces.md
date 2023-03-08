# 接口与监听

终于，我们到达了 libwayland 顶层的抽象：接口与监听。
前几章讨论的 wl_proxy、wl_resource 以及原语是 libwayland 中的单一实现，它们的存在是为了支持本层抽象。
调用 wayland-scanner 处理 XML 文件时，它会针对高级协议中的每个接口，生成接口、监听及其与底层 Wire 协议之间的胶水代码。

回想一下，Wayland 连接上的每个参与者都可以接受和发送消息。客户端监听事件并发送请求，服务端监听请求并发送事件。
各方都使用特定名称的 wl_listener 监听另一方的消息。
下面是这个接口的一个例子：

> 译者注：surface 有多重含义，但就 wayland 的使用场景来说往往指代窗口上的内容，而 shell surface 实际上就指代传统意义上的窗口。
> 下面这个监听器包含进入和离开事件

```c
struct wl_surface_listener {
    /** surface enters an output */
    void (*enter)(
        void *data,
        struct wl_surface *wl_surface,
        struct wl_output *output);

    /** surface leaves an output */
    void (*leave)(
        void *data,
        struct wl_surface *wl_surface,
        struct wl_output *output);
};
```

这是客户端 wl_surface 对应的监听。
用来生成该片段的 XML 如下：

```xml
<interface name="wl_surface" version="4">
  <event name="enter">
    <arg name="output"
      type="object"
      interface="wl_output"/>
  </event>

  <event name="leave">
    <arg name="output"
      type="object"
      interface="wl_output"/>
  </event>
  <!-- additional details omitted for brevity -->
</interface>
```

应该非常清晰地可以看到事件是如何转变成监听接口的：
每个函数指针接收用户数据、事件涉及资源的引用、事件的参数。
我们可以像这样将监听绑定到 wl_surface 上：

```c
static void wl_surface_enter(
    void *data,
    struct wl_surface *wl_surface,
    struct wl_output *output) {
    // ...
}

static void wl_surface_leave(
    void *data,
    struct wl_surface *wl_surface,
    struct wl_output *output) {
    // ...
}

static const struct wl_surface_listener surface_listener = {
    .enter = wl_surface_enter,
    .leave = wl_surface_leave,
};

// ...略...

struct wl_surface *surf;
wl_surface_add_listener(surf, &surface_listener, NULL);
```

wl_surface 接口也定义了客户端可以进行的一些请求：

```xml
<interface name="wl_surface" version="4">
  <request name="attach">
    <arg name="buffer"
      type="object"
      interface="wl_buffer"
      allow-null="true"/>
    <arg name="x" type="int"/>
    <arg name="y" type="int"/>
  </request>
  <!-- additional details omitted for brevity -->
</interface>
```

wayland-scanner 生成以下原型，以及序列化消息的胶水代码：

```c
void wl_surface_attach(
    struct wl_surface *wl_surface,
    struct wl_buffer *buffer,
    int32_t x, int32_t y);
```

服务端接口和监听的代码是相同的，但要逆转过来——为请求生成监听，为事件生成胶水代码。
当 libwayland 收到消息时，它会查找对象的 ID、接口，然后用找到的接口解码消息的剩余部分。
再寻找这个对象上的监听，用消息上带的参数调用监听函数。

这便是 libwayland 的全貌！
我们花了好几层抽象才到这一步，您现在应该了解事件如何从服务端开始，成为 Wire 的消息，再被客户端理解并分派。
然而，还有一个悬而未决的问题：
所有这些都假设你已经拥有了对 Wayland 对象的引用，而它又是如何得到的呢？
