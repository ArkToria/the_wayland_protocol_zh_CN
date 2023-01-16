# 使用 wl_compositor

有人说给事物命名是计算机科学中最为复杂的问题之一，而在这也是如此，并且证据确凿。`wl_compositor` 是全局的混成器，也是混成器的一部分。通过这个接口，你可以向服务端发送你要展示的窗口，以便与旁边其他的窗口进行混成。混成器有两项工作：创建表面和区域。

此处引用规范来介绍：一个 Wayland 表面有一个矩形区域，可以显示在 0 号（默认显示器）或者更多的输出设备上，递交缓冲区，接受用户输入，并定义一个相对坐标系。我们将在后期详细讨论这些问题，但从最根本的部分开始：获得一个表面并为其强加缓冲区。要获得一个表面，首先我们要自己的混成器绑定到全局 `wl_compositor`。通过扩展 5.1 章的例子，我们可以得到如下结果：

```c
struct our_state {
    // ...
    struct wl_compositor *compositor;
    // ...
};

static void
registry_handle_global(void *data, struct wl_registry *wl_registry,
		uint32_t name, const char *interface, uint32_t version)
{
    struct our_state *state = data;
    if (strcmp(interface, wl_compositor_interface.name) == 0) {
        state->compositor = wl_registry_bind(
            wl_registry, name, &wl_compositor_interface, 4);
    }
}

int
main(int argc, char *argv[])
{
    struct our_state state = { 0 };
    // ...
    wl_registry_add_listener(registry, &registry_listener, &state);
    // ...
}
```

注意，我们在调用 `wl_registry_bind` 时指定了版本 4，这是写作时的最新版本。有了这个引用的保证，我们就可以创建一个 `wl_surface`。

```c
struct wl_surface *surface = wl_compositor_create_surface(state.compositor);
```

在我们能够显示它之前，我们必须首先给它附加一个像素源：一个 `wl_buffer`。