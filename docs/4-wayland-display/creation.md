# 创建一个显示

启动你的文本编辑器——是时候编写我们的第一行代码了。

## Wayland 客户端

连接到 Wayland 服务端并创建一个 `wl_display` 来管理连接状态是非常容易的：

```cpp
#include <stdio.h>
#include <wayland-client.h>

int
main(int argc, char *argv[])
{
    struct wl_display *display = wl_display_connect(NULL);
    if (!display) {
        fprintf(stderr, "Failed to connect to Wayland display.\n");
        return 1;
    }
    fprintf(stderr, "Connection established!\n");

    wl_display_disconnect(display);
    return 0;
}
```

让我们来编译并运行这个程序。假设你在阅读文本的时候使用的是 Wayland 混成器，那么结果应该是这样的：

```bash
$ cc -o client client.c -lwayland-client # cc 实际上是 gcc 的软链接
$ ./client
Connection established!
```

`wl_display_connect` 是客户端建立 Wayland 连接最常见的方式，其声明如下：

```cpp
struct wl_display *wl_display_connect(const char *name);
```

参数 `name` 是 Wayland 显示服务的名称，通常是 "wayland-0"（可以通过 `$WAYLAND_DISPLAY` 环境变量查看）。你可以在我们的测试客户端中把 `NULL` 换成这个，然后自己试试——这很可能是可行的。这与 `$XDG_RUNTIME_DIR` 中的 Unix 套接字的名称相对应。但是 `NULL` 是推荐选项，如果选用，`libwayland` 会有如下操作：

- 1. 如果 `$WAYLAND_DISPLAY` 已经被设置，则尝试连接到 `$XDG_RUNTIME_DIR/$WAYLAND_DISPLAY`
- 2. 试图连接 `$XDG_RUNTIME_DIR/wayland-0`
- 3. 失败

这允许用户通过设置 `$WAYLAND_DISPLAY` 变量来特别指定他们想在哪个 Wayland 显示器上运行他们的客户端。如果有更复杂的需求，你也可以自行建立连接，并从文件描述符中创建一个 Wayland 显示服务：

```cpp
struct wl_display *wl_display_connect_to_fd(int fd);
```

你也可以通过 `wl_display_get_fd` 获得 `wl_display` 正在使用的文件描述符，无论你是如何创建这个显示服务的。

```cpp
int wl_display_get_fd(struct wl_display *display);
```

## Wayland 服务端

这个过程对服务端来说也是相当简单的。显示服务的创建和套接字绑定是分离的，以使得你有时间在任何客户端能够连接到显示服务之前配置它。这里是另一个简例：

```cpp
#include <stdio.h>
#include <wayland-server.h>

int
main(int argc, char *argv[])
{
    struct wl_display *display = wl_display_create();
    if (!display) {
        fprintf(stderr, "Unable to create Wayland display.\n");
        return 1;
    }

    const char *socket = wl_display_add_socket_auto(display);
    if (!socket) {
        fprintf(stderr, "Unable to add socket to Wayland display.\n");
        return 1;
    }

    fprintf(stderr, "Running Wayland display on %s\n", socket);
    wl_display_run(display);

    wl_display_destroy(display);
    return 0;
}
```

让我们继续编译并运行：

```bash
$ cc -o server server.c -lwayland-server
$ ./server &
Running Wayland display on wayland-1
$ WAYLAND_DISPLAY=wayland-1 ./client
Connection established!
```

使用 `wl_display_add_socket_auto` 将会允许 `libwayland` 自动决定显示服务的名称，默认为 `wayland-0`，或者 `wayland-$n`，这取决于是否有其他的 Wayland 混成器在 `$XDG_RUNTIME_DIR` 中存有套接字。然而，与客户端一样，你还有一些其他的选项来配置显示服务：

```cpp
int wl_display_add_socket(struct wl_display *display, const char *name);

int wl_display_add_socket_fd(struct wl_display *display, int sock_fd);
```

在添加套接字后，调用 `wl_display_run` 将会运行 `libwayland` 的内部事件循环，并阻塞至调用 `wl_display_terminate` 终止。这个事件循环是什么？让我们翻开下一页就明白了！