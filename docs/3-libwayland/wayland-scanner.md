# wayland-scanner

Wayland 包中含有一个二进制文件：`wayland-scanner`。该工具基于 2.3 节中所提及的定义 Wayland 协议的 XML 文件来生成 C 头文件和对应的胶水代码。生成的头文件为 `wayland-client-protocol.h` 和 `wayland-server-protocol.h`，此外通常还包括对协议进行封装的头文件 `wayland-client.h` 和 `wayland-server.h` ，而不是直接使用它们。

该工具的用法非常简单（并可以在 `wayland-scanner -h` 看到用法总结），但仍可概述如下：

- 生成客户端头文件
```shell
$ wayland-scanner client-header < protocol.xml > protocol_client.h
```

- 生成服务端头文件
```shell
$ wayland-scanner server-header < protocol.xml > protocol_server.h
```

- 生成胶水代码
```shell
$ wayland-scanner private-code < protocol.xml > protocol.c
```

不同的构建系统将使用不同的方法来自定义命令——请查阅构建系统的文档。一般来说，您将需要在构建时运行 `wayland-scanner`，然后编译并将你的应用程序链接到胶水代码。

如果你方便的话可以立即尝试任意的 Wayland 协议（示例 `wayland.xml` 可能在 `/usr/share/wayland`）。打开胶水代码和头文件，并在阅读下面的章节时进行参考，以了解 `libwayland` 提供的原语在生成的代码中如何实际应用。