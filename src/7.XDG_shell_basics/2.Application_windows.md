# 应用程序窗口

我们历尽艰难终于走到了这里，但现在是时候了：XDG toplevel 是我们最终要来显示一个应用程序的接口。XDG toplevel 接口管理有许多管理应用程序窗口的请求和事件，包括最小化和最大化状态，设置窗口标题等。我们将在以后的章节中详细讨论它的每一部分，因此先让我们来关注最基本的内容。

基于上一章的知识，我们知道可以从 `wl_surface` 获得一个 `xdg_surface`，但这只是第一步：把一个 surface 夹带进 XDG shell。下一步是把 XDG 表面变成一个 XDG toplevel——一个 “顶层” 应用程序窗口，它因最终处于 XDG shell 创建的窗口和弹出菜单的顶层而得名。要创建一个这样的窗口，我们可以使用 `xdg_surface` 接口来合理请求。

```xml
<request name="get_toplevel">
  <arg name="id" type="new_id" interface="xdg_toplevel"/>
</request>
```

这个新的 `xdg_toplevel` 接口为我们提供了许多请求和事件，用于管理应用程序窗口的生命周期。第 10 章深入讨论了这些问题，但我知道你很想先在屏幕上得到一些东西。如果你按照这些的步骤，处理好上一章 XDG 表面的 `configure` 和 `ack_configure` 上下文，并将一个 `wl_buffer` 提交到我们的 `wl_surface`，一个应用程序窗口就会出现，并向用户展示你的缓冲区内容。下一章将提供这样的示例代码，示例还利用了一个额外的 XDG toplevel 请求，我们目前还没有涉及：

```xml
<request name="set_title">
  <arg name="title" type="string"/>
</request>
```

不过这应该是不言自明的。还有一个类似的请求我们在示例代码中没有使用，但它可能适合你的应用：

```xml
<request name="set_app_id">
  <arg name="app_id" type="string"/>
</request>
```

标题通常显示在窗口装饰，任务栏等地方，而应用 ID 则用于识别你的应用程序或将你的窗口组合到一起。你可以通过将你的窗口标题设置为 "Application windows - The Wayland Protocol - Firefox"，以及将你的应用程序 ID 设为 "firefox" 的方式来使用它。

总而言之，以下步骤将会带你从零开始创建一个屏幕上的窗口：

1. 绑定到 `wl_compositor` 并使用它来创建一个 `wl_surface`
2. 绑定到 `xdg_wm_base` 并用它为你的 `wl_surface` 创建一个 `xdg_surface`
3. 通过 `xdg_surface.get_toplevel` 从 `xdg_surface` 创建一个 `xdg_toplevel`
4. 为 `xdg_surface` 创建一个监听器，并且等待 `configure` 事件的发生。
5. 绑定到你选择的缓冲区分配机制（如 `wl_shm`），并分配一个共享缓冲区，然后将你要显示的内容渲染后传入。
6. 使用 `wl_surface.attach` 将 `wl_buffer` 附加到 `wl_surface` 上。
7. 使用 `xdg_surface.ack_configure` 把 `configure` 的序列信息传给它，确认你已经准备好了一个合适的帧。
8. 发送一个 `wl_surface.commit` 请求。

翻到下一页，可以看到这些步骤的具体操作。