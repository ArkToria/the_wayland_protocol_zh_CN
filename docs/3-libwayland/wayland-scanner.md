# wayland-scanner

Wayland 包里有一个二进制可执行文件：wayland-scanner。
正如本书 2.3 章所说，该工具负责预处理，读取 Wayland 协议的 XML 文件生成 C 语言头文件和对应的胶水代码。
该工具在 Wayland 包的构建过程中会处理核心协议 wayland.xml，并生成名为 `wayland-client-protocol.h` 和 `wayland-server-protocol.h` 的头文件以及胶水代码，此外 Wayland 包中通常还包括对协议进行封装的头文件： `wayland-client.h` 和 `wayland-server.h`，一般直接 include 后者而不是手动使用前者。

该工具的用法非常简单（见 `wayland-scanner -h`），可概述如下：

生成客户端头文件：

```shell
$ wayland-scanner client-header < protocol.xml > protocol_client.h
```

生成服务端头文件：

```shell
$ wayland-scanner server-header < protocol.xml > protocol_server.h
```

生成胶水代码：

```shell
$ wayland-scanner private-code < protocol.xml > protocol.c
```

不同的构建系统有不同的方法来配置命令，具体查阅您的工具链文档。
一般来说，您需要在构建时运行 wayland-scanner，然后编译并链接您的程序到胶水代码。

如果条件允许，现在就能用任意的一个 Wayland 协议来执行此操作（如 `wayland.xml` 基本上在 `/usr/share/wayland`）。
阅读后续章节时，记得随时查看这些胶水代码和头文件，以了解 libwayland 原语生成的代码如何实际应用。

---

以下内容来自 [wlroots/tinywl/Makefile](https://gitlab.freedesktop.org/wlroots/wlroots/-/blob/master/tinywl/Makefile) 供参考

```makefile
{{#include Makefile}}
```
