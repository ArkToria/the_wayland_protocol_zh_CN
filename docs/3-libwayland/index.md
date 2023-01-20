# 关于 libwayland 的实现

我们在 1.3 节中介绍了 libwayland 这一最受欢迎的 Wayland 实现。本书的大部分内容适用于任何实现，但是接下来的两章将使你熟悉 libwayland。

Wayland 软件包包括用于 Wayland-Client 和 Wayland-Server 的 pkg-config 规范——请参阅构建系统的文档以获取有关它们的链接介绍。当然，大多数应用程序只会连接到其中一个。该库包含一些简单的原语（如链表）和 Wayland 的核心协议 ——`Wayland.xml` 的预编译版本。

我们将从原语开始介绍。