# Wayland 显示

截至目前，我们已经解释了 Wayland 协议如何在客户端和服务端中通过对象管理节点所有权，但还留下了一个重要的细节：如何在一开始创建这些对象。Wayland 的显示服务或默认的 `wl_display` 实现隐含在每个 Wayland 连接内。它通常有如下接口：

```xml
<interface name="wl_display" version="1">
  <request name="sync">
    <arg name="callback" type="new_id" interface="wl_callback"
       summary="callback object for the sync request"/>
  </request>

  <request name="get_registry">
    <arg name="registry" type="new_id" interface="wl_registry"
      summary="global registry object"/>
  </request>

  <event name="error">
    <arg name="object_id" type="object" summary="object where the error occurred"/>
    <arg name="code" type="uint" summary="error code"/>
    <arg name="message" type="string" summary="error description"/>
  </event>

  <enum name="error">
    <entry name="invalid_object" value="0" />
    <entry name="invalid_method" value="1" />
    <entry name="no_memory" value="2" />
    <entry name="implementation" value="3" />
  </enum>

  <event name="delete_id">
    <arg name="id" type="uint" summary="deleted object ID"/>
  </event>
  <!-- event 相当于接口的声明，其内部指定了变量名称，类型和说明 -->
</interface>
```

对于大多数 Wayland 用户来说，最有趣的接口是 `get_registry`，我们将会在接下来的章节中讨论其细节。简而言之，注册函数是用来分配其他对象的。其他的接口用于连接的状态维护，并且除非你正在写你自己的 libwayland 替代，否则这通常不重要。

相反，本章节将重点讨论 libwayland 与 wl_display 对象相关的一些函数，用于建立和维护你与 Wayland 的连接。这些函数是用来操作 libwayland 内部状态的，而不是直接与线性协议请求和事件相关。

我们将从这些函数中最重要的部分开始：建立显示服务。对于客户端来说，这将涵盖到连接服务器的实际过程。而对于服务端来说，则是为客户端连接配置显示服务的过程。