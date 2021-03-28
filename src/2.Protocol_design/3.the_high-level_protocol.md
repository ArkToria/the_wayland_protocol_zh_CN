# 上层协议

在第 1.3 章节我们提到：`wayland.xml` 可能与 Wayland 软件包一同被安装到你的操作系统上。立即找到并用你偏好的编辑器打开该文件。通过这样的文件，我们定义了 Wayland 客户端或服务端所支持的接口。

```shell
$ pacman -F wayland.xml
    usr/share/wayland/wayland.xml
```

文件中定义了每个接口，以及对应的请求、事件和各自的签名。为此，我们使用了 XML 格式。让我们看看上一章中讨论过的 `wl_surface` 示例：

```xml
<interface name="wl_surface" version="4">
  <request name="damage">
    <arg name="x" type="int" />
    <arg name="y" type="int" />
    <arg name="width" type="int" />
    <arg name="height" type="int" />
  </request>

  <event name="enter">
    <arg name="output" type="object" interface="wl_output" />
  </event>
</interface>
```

**注意：** 为了简单起见，我已经对该代码进行了删减，但是如果你之前有找到 `wayland.xml` 文件（实际文件和上述示例略有不同），建议查找此接口并亲自检查一下——其中有额外的文档，这些文档解释了每个请求和事件的目的和精确的语义。

在处理此 XML 文件时，我们为每个请求和事件分配一个操作码（按照它们出现的顺序，零号开始，依次递增）结合参数列表，你可以解码来自线协议中的请求和事件，并且基于 XML 文件中的文档，你可以决定如何对软件进行编程以对应相应的行为。这一部分代码通常来自于代码生成器，我们将在第 3 章中讨论 libwayland 如何实现这一点。

而从第四章开始，本书其余大部分内容专门用于解释该文件以及一些补充的扩展协议。