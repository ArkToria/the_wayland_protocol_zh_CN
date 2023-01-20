# Wayland 软件包内容

当你在遵循 freedesktop.org 规范的 Linux 发行版中安装 "wayland" 的时候，很可能最后得到  `libwayland-client`、`libwayland-server`、`wayland-scanner` 和 `wayland.xml` 这些文件。它们或分别位于 `/usr/lib`、`/usr/include`、`/usr/bin` 和 `/usr/share/wayland` 中。该软件包代表了 Wayland 协议最主流的实现，但这并不是唯一的。第三章详细介绍了 Wayland 的实现；这本书其余部分同样适用于任何实现。

## wayland.xml

Wayland 协议通过 XML 文件进行定义。如果定位到并在编辑器中打开了 "wayland.xml" 文件，你将会发现 Wayland 核心协议的 XML 规范。这是一个高级协议，它建立在我们在下一章将要讨论的线协议之上。本书的大部分内容致力于解释该文件。

## wayland-scanner

"wayland-scanner" 工具被用于处理这些 XML 文件并生成对应代码，其最常用的实现正如你现在所见的 `wayland-scanner`，它可以用于从诸如 wayland.xml 之类的文件生成 C 头文件和上下文代码。在其它的编程语言中有对应的 scanner，如 wayland-rs (Rust)、waymonad-scanner (Haskell) 等。

## libwayland

`libwayland-client` 和 `libwayland-server` 这两个库包含了一个双端通信线协议的实现，提供了一些常用的实用工具来处理 Wayland 的数据结构、简单的事件循环等。此外，这些库还包含 `wayland-scanner` 生成的 Wayland 核心协议的预编译副本。