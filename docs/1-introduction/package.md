# Wayland 软件包

在 Linux 发行版中安装 "wayland"，您最终会获得 freedesktop.org 分发的
libwayland-client、libwayland-server、wayland-scanner 和 wayland.xml。
它们分别位于 `/usr/lib`、`/usr/include`、`/usr/bin` 和 `/usr/share/wayland`。
此包代表了 Wayland 协议最主流的实现，但它不是唯一选择。
本书第三章详细介绍这种实现；这本书其余部分同样适用于 Wayland 的任何实现。

## wayland.xml

Wayland 协议通过 XML 文件进行定义。
如果能够定位并以文本格式打开 "wayland.xml" 文件，您将会找到 Wayland 核心协议 XML 规范。
这是一个高级协议，它建立在我们将在下一章要讨论的 wire 协议之上。
本书的大部分内容致力于解释该文件。

## wayland-scanner

"wayland-scanner" 工具能够处理上述 XML 文件并生成对应代码。
其最常用的实现正如你现在所见，它可以由 wayland.xml 之类的文件生成 C 语言的头文件和上下文胶水代码。
也有其他语言对应的 scanner，如 wayland-rs (Rust)、waymonad-scanner (Haskell) 等。

## libwayland

libwayland-client 和 libwayland-server 这两个库包含了一个 wire 协议的双端通信实现。
libwayland 同时提供一些常用工具，用于处理 Wayland 数据结构、简易事件循环等。
此外，libwayland 还包含一份使用 wayland-scanner 生成的 Wayland 核心协议的预编译副本。
