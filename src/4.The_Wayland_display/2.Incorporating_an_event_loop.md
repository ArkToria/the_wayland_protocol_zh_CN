# 加入一个事件循环

`libwayland` 为 Wayland 服务端提供了自己的事件循环实现，但维护者需要知道这是一种设计上的僭越行为。

## Wayland 服务端事件循环

由 `libwayland-server` 创建的每一个 `wl_display` 都有一个对应的 `wl_event_loop`，你可以通过 `wl_display_get_event_loop` 来获取其引用。如果你正在写一个新的 Wayland 混成器，你很可能想把它作为唯一的事件循环。你可以用 `wl_event_loop_add_fd` 来添加一个文件描述符，用 `wl_event_loop_add_timer` 来添加一个计时器。还可以通过 `wl_event_loop_add_signal` 来处理信号，这可能是非常便捷的做法。

可以根据你的喜好配置事件循环，以监控混成器所需响应的全部事件。你可以通过调用 `wl_display_run` 来一次性处理事件和调度 Wayland 客户端。它将处理并陷入事件循环，直到通过 `wl_display_terminate` 进行终止。大多数 Wayland 混成器从一开始就考虑到 Wayland 的这种用法（而不是从 X11 移植过来）。


然而，也可以采用轮询的方式将 Wayland 显示服务纳入你自己的事件循环。`wl_display` 在内部使用事件循环来处理客户端，你可以选择自己监控 Wayland 事件循环，在必要的时候对其进行调度，或者也可以完全忽略，手动处理客户端的更新请求。如果你希望让 Wayland 事件循环自己运行，并将其视作你自己事件循环的附属品，你可以使用 `wl_event_loop_get_fd` 来过的一个可以回调的文件描述符，然后在该文件描述符发生活动时调用 `wl_event_loop_dispatch` 来处理事件。当你有数据需要写入客户端时，你也需要调用 `wl_display_flush_clients`。 

## Wayland 客户端事件循环

另一方面，`libwayland-client` 并没有自己的事件循环。然而，由于通常只有一个文件描述符，所以没有自己的事件循环更容易管理。如果你的程序期望响应唯一的 Wayland 事件，那么这个简单的循环就足够了。

```c
while (wl_display_dispatch(display) != -1) {
    /* This space deliberately left blank */
}
```

然而，如果你有一个更复杂的应用程序，你可以以任何方式建立你自己的事件循环，并通过 `wl_display_get_fd` 获得 Wayland 显示器的文件描述符。在 POLLIN 事件中调用 `wl_display_dispatch` 来处理传入的事件。要刷新输出的请求则用 `wl_display_flush`。

## 小节

至此，你已经拥有了所有设置 Wayland 显示器和处理事件和请求的背景知识。剩下的唯一步骤是分配对象，以便与连接的对方通讯。为此，我们使用 registry 注册。在下一章结束时，我们将拥有自己第一个可用的 Wayland 客户端。