# 接口与监听器

终于，我们到达了 libwayland 抽象的顶层：接口和监听器。这一想法在先前的 wl_proxy, wl_resource 和原语一章中提到过，它们是 libwayland 中的单一实现，为这一层提供支持。当你通过 wayland-scanner 运行一个 XML 文件，它会生成接口和监听器，以及它们与底层接口之间的胶水代码，所有具体的实现都在包含高级协议所定义的每个接口中。

回想一下，Wayland 连接上的每个参与者都可以接受和发送消息。客户端监听事件并发送请求，服务端监听请求并发送事件。各方都使用特定名称的 wl_listener 监听另一方的消息。下面是这个接口的一个例子：

> 译者注：surface 有多重含义，但就 wayland 的使用场景来说往往指代窗口上的内容，而 shell surface 实际上就指代传统意义上的窗口。下面这个监听器包含进入和离开事件

```c
struct wl_surface_listener {
	/** surface enters an output */
	void (*enter)(void *data,
		      struct wl_surface *wl_surface,
		      struct wl_output *output);

	/** surface leaves an output */
	void (*leave)(void *data,
		      struct wl_surface *wl_surface,
		      struct wl_output *output);
};
```

这是客户端 wl_surface 对应的监听器。wayland-scanner 生成要用到的 XML 文件如下：

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

这下清楚了这些事件是如何构成一个监听接口的。每个函数指针接受任意一些用户数据，以及对所属资源的引用和该事件的参数，我们可以像这样将监听器绑定到 wl_surface：

> listener 结构体内带有对应的函数指针，将 listener 添加到 surface

```c
static void wl_surface_enter(void *data,
        struct wl_surface *wl_surface, struct wl_output *output) {
    // ...
}

static void wl_surface_leave(void *data,
        struct wl_surface *wl_surface, struct wl_output *output) {
    // ...
}

static const struct wl_surface_listener surface_listener = {
    .enter = wl_surface_enter,
    .leave = wl_surface_leave,
};

// ...cotd...

struct wl_surface *surf;
wl_surface_add_listener(surf, &surface_listener, NULL);
```

wl_surface 接口也为客户端定义了一些可用的请求：

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

wayland-scanner 生成以下原型，以及编组此消息的胶水代码。

```c
void wl_surface_attach(struct wl_surface *wl_surface,
    struct wl_buffer *buffer, int32_t x, int32_t y);
```

接口和监听器的服务端代码是相同的，不同的是它为请求生成监听器而为事件生成代码。当 libwayland 受到一条消息时，它会查找对象 ID 及其接口，然后使用它来解码消息的剩余部分。再在对象上寻找监听器并用消息的参数来调用你的函数。（传入的函数指针）

这便是它的全貌了！我们用了几个抽象层才到达这一步，因此你现在应该了解一个事件是如何从你的服务端代码开始，在线路上变成一条消息，再到被客户端解读，并被分派到你的客户端代码。然而，还有一个未解决的问题。所有这些都假设你已经拥有了对 Wayland 对象的引用，而它又是如何得到的呢？