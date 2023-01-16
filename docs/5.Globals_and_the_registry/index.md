# 全局和注册

如果你还能回想起 2.1 章的内容——每个请求和事件都有一个对象 ID 与之关联。但到目前为止，我们还没有讨论对象是如何被创建的。当我们收到一个 Wayland 消息时，我们必须知道对象 ID 所代表的接口，以便对其进行编码。我们还必须以某种方式协商可用的对象，创建新的对象，以及为它们分配 ID。在 Wayland 上，我们同时解决这两个问题——当我们帮顶一个对象 ID 时，我们认为在未来所有的消息中使用其接口，并在我们本地状态中存储一个对象 ID 到接口的映射。

为了引导这些，服务端提供了一个全局对象的列表。这些全局对象已经根据自身特点来提供信息和功能，且最常见的是它们被用来代理其他对象以实现各种目的——比如创建应用程序的窗口。这些全局对象它们自己也有对象 ID 和接口，我们必须以某种方式来分配和同意这些对象。

毫无疑问地，你现在已经想到了鸡生蛋的问题，我们将揭示其奥秘：对象 ID 为 1 的已经被隐式分配给了 `wl_display` 接口。当你想要调用这个接口时，注意使用 `wl_display::get_registry` 请求：

```xml
<interface name="wl_display" version="1">
  <request name="sync">
    <arg name="callback" type="new_id" interface="wl_callback" />
  </request>

  <request name="get_registry">
    <arg name="registry" type="new_id" interface="wl_registry" />
  </request>

  <!-- cotd -->
</interface>
```

`wl_display::get_registry` 请求可以用来将一个对象 ID 绑定定到 `wl_registry` 接口，这是在 `wayland.xml` 中找到的下一个接口。鉴于 `wl_display` 总是有 ID 为 1 的对象，下面的线程信息应该是有意义的（以大端序为例）

```
C->S    00000001 000C0001 00000002            .... .... ....
```

当我们将其分解时，第一串序列是对象 ID，第二串序列中前 16 位是消息总长度（以字节为单位），其后的位是请求操作码。剩下的字（只有一个）是参数。简而言之，这是对象 ID 1 `(wl_display)` 上调用的请求 1
（从 0 开始），它接受一个参数：一个新对象生成的 ID。在 XML 文档中注意，这个新 ID 是提前定义好的，由 `wl_registry` 接口来管理。

```xml
<interface name="wl_registry" version="1">
  <request name="bind">
    <arg name="name" type="uint" />
    <arg name="id" type="new_id" />
  </request>

  <event name="global">
    <arg name="name" type="uint" />
    <arg name="interface" type="string" />
    <arg name="version" type="uint" />
  </event>

  <event name="global_remove">
    <arg name="name" type="uint" />
  </event>
</interface>
```

 这些接口我们将在后续的章节中讨论。