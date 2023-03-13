# Wayland Display 显示

到目前为止，我们在解释 Wayland 如何管理客户端和服务器之间对象的所有权时，遗漏了一个关键细节：
对象首先是如何创建出来的？
Wayland Display 显示，即 `wl_display` 隐式存在于每次 Wayland 连接中，它具有以下接口：

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

对于大部分 Wayland 受众来说，其中最有趣的是 `get_registry`，我们将会在接下来的章节中讨论其细节。
简而言之，registry 注册函数是用来分配其他对象的。
其余接口用于连接的状态维护，通常不重要，除非您想编写自己的 libwayland 替代实现。

所以，本章会关注 libwayland 中一些与 `wl_display` 有关——用于建立和维护 Wayland 连接的函数。
这些函数能操作 libwayland 的内部状态，避免您在 Wire 协议层直接涉及相关的请求和事件。

我们将从函数中最重要的一个开始：建立 display 显示。
对于客户端，它涵盖了连接的实际过程；对于服务器，则是配置显示以供连接。
