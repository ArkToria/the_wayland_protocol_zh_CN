# 注册全局对象

用 `libwayland-server` 注册全局对象的方式与之前有些不同。当你用`wayland-scanner` 生成服务端代码时，它会创建接口（类似于监听器）和发送事件的胶水代码。第一项任务是注册全局对象，当全局对象被绑定时，用一个函数来启动资源[^1]。就代码而言，其结果看起来像这样。

```c
static void
wl_output_handle_bind(struct wl_client *client, void *data,
    uint32_t version, uint32_t id)
{
    struct my_state *state = data;
    // TODO
}

int
main(int argc, char *argv[])
{
    struct wl_display *display = wl_display_create();
    struct my_state state = { ... };
    // ...
    wl_global_create(wl_display, &wl_output_interface,
        1, &state, wl_output_handle_bind);
    // ...
}
```

如果你采用这段代码，例如把它修补到 4.1 章的服务端示例中，你会让一个 `wl_output` 全局接口对我们上次写的 "globals" 程序可见[^2]。然而，任何试图绑定到这个全局接口的对象都会将运行到我们的 TODO 处。为了完善这一点，我们还需要提供一个 `wl_output` 接口的实现。

```c
static void
wl_output_handle_resource_destroy(struct wl_resource *resource)
{
    struct my_output *client_output = wl_resource_get_user_data(resource);

    // TODO: Clean up resource

    remove_to_list(client_output->state->client_outputs, client_output);
}

static void
wl_output_handle_release(struct wl_client *client, struct wl_resource *resource)
{
    wl_resource_destroy(resource);
}

static const struct wl_output_interface
wl_output_implementation = {
    .release = wl_output_handle_release,
};

static void
wl_output_handle_bind(struct wl_client *client, void *data,
    uint32_t version, uint32_t id)
{
    struct my_state *state = data;

    struct my_output *client_output = calloc(1, sizeof(struct client_output));

    struct wl_resource *resource = wl_resource_create(
        client, &wl_output_implementation, wl_output_interface.version, id);

    wl_resource_set_implementation(resource, &wl_output_implementation,
        client_output, wl_output_handle_resource_destroy);

    client_output->resource = resource;
    client_output->state = state;

    // TODO: Send geometry event, et al

    add_to_list(state->client_outputs, client_output);
}
```

光这样是很难理解的，因此让我们来逐一解释。在底部，我们已经扩展了我们的 "bind handle"， 以创建一个 `wl_resource` 来跟踪这个对象的服务端状态（使用客户端 ID）。当我们这样做的时候，我们向 `wl_resource_create` 提供了一个指向我们的接口实现的指针，即 `wl_output_implementation`，在这段代码中是一个常量静态结构体。这个类型 (`struct wl_output_interface`) 是由 `wayland-scanner` 生成的，包含了这个接口所支持的每个请求的一个函数指针。我们还借此机会分配了一个小容器，用于存储我们需要的，libwayland 不为我们处理的任何额外状态，其具体性质因协议不同而不同。

**注意：** 这里有两个不同的东西，但是使用同一个名字: `struct wl_output_interface` 是接口的实例，另一个 `wl_output_interface` 是 `wayland-scanner` 生成的一个全局常规变量，它包含与实现有关的元数据（比如上面例子中使用的版本）。

当客户端发送释放请求的时候，我们的 `wl_output_handle_release` 函数就会被调用，表明它们不再需要这个资源——所以我们应该销毁它。这反过来触发了 `wl_output_handle_resource_destroy` 函数，稍后我们将扩展该函数以释放我们先前为它本配的所有状态。这个函数也被传递到 `wl_resource_create` 中作为析构器，如果客户端在没有明确发送释放请求的情况下意外终止，它将会被调用。

我们代码中剩下的另一个 "TODO" 是发送 "name" 以及其他一些事件。如果我们回顾一下 `wayland.xml`，我们会在接口上看到这个事件：

```xml
<event name="geometry">
  <description summary="properties of the output">
The geometry event describes geometric properties of the output.
The event is sent when binding to the output object and whenever
any of the properties change.

The physical size can be set to zero if it doesn't make sense for this
output (e.g. for projectors or virtual outputs).
  </description>
  <arg name="x" type="int" />
  <arg name="y" type="int" />
  <arg name="physical_width" type="int" />
  <arg name="physical_height" type="int" />
  <arg name="subpixel" type="int" enum="subpixel" />
  <arg name="make" type="string" />
  <arg name="model" type="string" />
  <arg name="transform" type="int" enum="transform" />
</event>
```

当输出被绑定后，应该交由我们来发送这个事件，这很容易实现：

```c
static void
wl_output_handle_bind(struct wl_client *client, void *data,
    uint32_t version, uint32_t id)
{
    struct my_state *state = data;

    struct my_output *client_output = calloc(1, sizeof(struct client_output));

    struct wl_resource *resource = wl_resource_create(
        client, &wl_output_implementation, wl_output_interface.version, id);

    wl_resource_set_implementation(resource, wl_output_implementation,
        client_output, wl_output_handle_resource_destroy);

    client_output->resource = resource;
    client_output->state = state;

    // 发送事件（对应于 wayland.xml 中声明的 event arg）
    wl_output_send_geometry(resource, 0, 0, 1920, 1080,
        WL_OUTPUT_SUBPIXEL_UNKNOWN, "Foobar, Inc",
        "Fancy Monitor 9001 4K HD 120 FPS Noscope",
        WL_OUTPUT_TRANSFORM_NORMAL);

    add_to_list(state->client_outputs, client_output);
}
```

**注意：** 这里所用的 `wl_output::geometry` 是为了解释说明，但在实践中对它的使用有一些特殊考虑。在你的客户端或服务端中实现这个事件之前，请查看协议的 XML 文件定义。

[^1]: 
资源代表每个客户的对象实例的服务端状态。

[^2]:
如果你对更强大的东西感兴趣，可以从 Weston 项目中获得一个稍微复杂的 "globals" 程序版本，名为 `weston-info`。
