# XDG shell 基础

XDG (cross-desktop group) shell 是 Wayland 的一个标准扩展协议，描述了应用窗口的语义。它定义了两个 `wl_surface` 角色："toplevel" 用于你的顶层应用窗口；"popup" 则用于诸如上下文菜单、下拉菜单、工具提示等等——它们是顶层窗口的子集。有了这些，你可以将其归结于一个树状结构，顶层是根，弹出式或附加式窗口处于顶层的子叶上。该协议还定义了一个定位器接口，用于辅助定位弹窗，并提供有关窗口周围事物的那些信息。

`xdg-shell`，作为一个扩展协议，它并没有在 `wayland.xml` 中定义。取而代之的是你将会在 `wayland-protocols` 包中找到它。在你的系统中，它可能被安装在类似于 `/usr/share/wayland-protocols/stable/xdg-shell/xdg-shell.xml` 的路径下。

```xml
...
1074   │   <interface name="xdg_popup" version="3">
1075   │     <description summary="short-lived, popup surfaces for menus">
...
```

## xdg_wm_base

`xdg_wm_base` 是规范中定义的唯一一个全局接口，它提供了创建你所需要的其他每个对象的请求。最基本的实现是从处理 "ping" 事件开始的——当混成器发送该事件时，你应该及时响应 "pong" 请求，以表明你还没有陷入死锁。另一个请求涉及到定位器的创建，也就是先前有提到的，我们将把这些细节留到第十章。首先我们要研究的请求是 `get_xdg_surface`。
