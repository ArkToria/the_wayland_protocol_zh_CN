# 上层协议

在 1.3 节有说，`wayland.xml` 基本上会随着 Wayland 包安装在你的系统里，找到并用文本编辑器打开这个文件。
就是通过此类文件，我们定义了 Wayland 客户端或服务端所支持的接口。

::: tip
本页右上角有协议在线版查看入口，即 https://waayland.app/

```shell
# Arch Linux
$ pacman -F wayland.xml usr/share/wayland/wayland.xml
```

:::

此文件使用 XML 格式，其中定义了每个接口，以及对应的请求、事件和各自的签名。
看看上一章中讨论的 `wl_surface` 示例：

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

::: info
片段为了简洁有删减，如果你有找到本机的 `wayland.xml` 文件，请找到这个接口并亲自检查一下，其中有额外的文档，这些文档解释了每个请求事件的目的、准确语义。
:::

在处理此 XML 文件时，我们按照它们出现的顺序给每个请求和事件分配一个操作码（都是从 0 开始编号，依次递增）。
结合参数列表，我们可以解码 Wire 协议传输来的请求和事件，并且基于 XML 文档，决定如何进行软件编程以得体行事。
解析 XML 的工作通常不需要手写，会有代码生成器自动生成，我们将在第 3 章讨论 libwayland 如何实现这一点。

从第 4 章开始，本书其余大部分内容专门用于解释该协议文件，以及一些补充扩展协议。
