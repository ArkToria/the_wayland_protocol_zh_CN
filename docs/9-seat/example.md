# 扩展我们的示例代码

在前面几章中，我们建立了一个简单的客户端，它可以在显示器上展示其表面。让我们把这个代码扩展一下，建立一个可以接收输入事件的客户端。为了简单起见，我们仅仅将输入事件记录到 stderr。

这需要更多的代码，而不仅仅是将到目前为止的工作绑在一起。我们需要做的第一件事就是设置座位。

## 设置座位

我们首先需要的是一个对座位的引用。我们将把它添加到我们的 `client_state` 结构体中，并添加键盘、指针和触摸对象供后期使用。

```diff
        struct wl_shm *wl_shm;
        struct wl_compositor *wl_compositor;
        struct xdg_wm_base *xdg_wm_base;
+       struct wl_seat *wl_seat;
        /* Objects */
        struct wl_surface *wl_surface;
        struct xdg_surface *xdg_surface;
+       struct wl_keyboard *wl_keyboard;
+       struct wl_pointer *wl_pointer;
+       struct wl_touch *wl_touch;
        /* State */
        float offset;
        uint32_t last_frame;
        int width, height;
```

我们还需要更新 `registry_global`，为该座位注册一个监听器。


```diff
                                wl_registry, name, &xdg_wm_base_interface, 1);
                xdg_wm_base_add_listener(state->xdg_wm_base,
                                &xdg_wm_base_listener, state);
+       } else if (strcmp(interface, wl_seat_interface.name) == 0) {
+               state->wl_seat = wl_registry_bind(
+                               wl_registry, name, &wl_seat_interface, 7);
+               wl_seat_add_listener(state->wl_seat,
+                               &wl_seat_listener, state);
        }
 }
```

请注意，我们绑定的是最新版本的座位接口，即第 7 版。让我们把监听器也加上：

```c
static void
wl_seat_capabilities(void *data, struct wl_seat *wl_seat, uint32_t capabilities)
{
       struct client_state *state = data;
       /* TODO */
}

static void
wl_seat_name(void *data, struct wl_seat *wl_seat, const char *name)
{
       fprintf(stderr, "seat name: %s\n", name);
}

static const struct wl_seat_listener wl_seat_listener = {
       .capabilities = wl_seat_capabilities,
       .name = wl_seat_name,
};
```

如果你现在编译 `(cc -o client client.c xdg-shell-protocol.c)` 并运行这个，你的座位名字就应该被打印到 stderr。

## 接入指针事件

让我们来谈谈光标指针事件。如果你还记得，前面我们提到来自 Wayland 服务端的指针事件会被累积为一个单一逻辑事件。因此，我们需要定义一个结构体来存储这些事件。

```c
enum pointer_event_mask {
       POINTER_EVENT_ENTER = 1 << 0,
       POINTER_EVENT_LEAVE = 1 << 1,
       POINTER_EVENT_MOTION = 1 << 2,
       POINTER_EVENT_BUTTON = 1 << 3,
       POINTER_EVENT_AXIS = 1 << 4,
       POINTER_EVENT_AXIS_SOURCE = 1 << 5,
       POINTER_EVENT_AXIS_STOP = 1 << 6,
       POINTER_EVENT_AXIS_DISCRETE = 1 << 7,
};

struct pointer_event {
       uint32_t event_mask;
       wl_fixed_t surface_x, surface_y;
       uint32_t button, state;
       uint32_t time;
       uint32_t serial;
       struct {
               bool valid;
               wl_fixed_t value;
               int32_t discrete;
       } axes[2];
       uint32_t axis_source;
};
```

这里我们使用一个位掩码来识别我们接受到的单个指针帧中的事件，并将每个事件的相关信息存储到各自的字段中。让我们也将此添加到我们的状态结构体中：

```diff
        /* State */
        float offset;
        uint32_t last_frame;
        int width, height;
        bool closed;
+       struct pointer_event pointer_event;
 };
```

然后我们需要更新我们的 `wl_seat_capabilities`，为有光标指针输入功能的座位指定指针对象。

```diff
 static void
 wl_seat_capabilities(void *data, struct wl_seat *wl_seat, uint32_t capabilities)
 {
        struct client_state *state = data;
-       /* TODO */
+
+       bool have_pointer = capabilities & WL_SEAT_CAPABILITY_POINTER;
+
+       if (have_pointer && state->wl_pointer == NULL) {
+               state->wl_pointer = wl_seat_get_pointer(state->wl_seat);
+               wl_pointer_add_listener(state->wl_pointer,
+                               &wl_pointer_listener, state);
+       } else if (!have_pointer && state->wl_pointer != NULL) {
+               wl_pointer_release(state->wl_pointer);
+               state->wl_pointer = NULL;
+       }
}
```

这里值得解释一下。回想一下，功能 `capabilities` 是此座位支持的设备类型的位掩码，即如果支持，则进行位与运算 (&) 将产生非零值。然后，如果我们有一个光标指针，并且还没有配置它，我们就访问第一个分支 (第一个 if)，使用 `wl_seat_get_pointer` 来分配一个光标指针的引用并将它存储在我们的状态 (state) 中。如果座位不支持光标指针，但我们却已经配置了一个，那么需要使用 `wl_pointer_release` 来释放这个引用。请记住，一个座位的 `capabilities` 可能在运行时改变，例如，当用户重新插拔他们的鼠标时座位所拥有的功能就会改变。

我们还为指针配置了一个监听器。让我们将它也添加到结构体中：

```c
static const struct wl_pointer_listener wl_pointer_listener = {
       .enter = wl_pointer_enter,
       .leave = wl_pointer_leave,
       .motion = wl_pointer_motion,
       .button = wl_pointer_button,
       .axis = wl_pointer_axis,
       .frame = wl_pointer_frame,
       .axis_source = wl_pointer_axis_source,
       .axis_stop = wl_pointer_axis_stop,
       .axis_discrete = wl_pointer_axis_discrete,
};
```

指针拥有许多事件，让我们来看看它们。

```c
static void
wl_pointer_enter(void *data, struct wl_pointer *wl_pointer,
               uint32_t serial, struct wl_surface *surface,
               wl_fixed_t surface_x, wl_fixed_t surface_y)
{
       struct client_state *client_state = data;
       client_state->pointer_event.event_mask |= POINTER_EVENT_ENTER;
       client_state->pointer_event.serial = serial;
       client_state->pointer_event.surface_x = surface_x,
               client_state->pointer_event.surface_y = surface_y;
}

static void
wl_pointer_leave(void *data, struct wl_pointer *wl_pointer,
               uint32_t serial, struct wl_surface *surface)
{
       struct client_state *client_state = data;
       client_state->pointer_event.serial = serial;
       client_state->pointer_event.event_mask |= POINTER_EVENT_LEAVE;
}
```

进入 "enter" 和离开 "leave" 事件是非常直截了当的，它们为其余的执行工作提供了舞台。我们更新事件掩码以包括适当的事件，然后用我们提供的数据填充进去。运动 "motion" 和按钮 "button" 事件也是十分类似的：

```c
static void
wl_pointer_motion(void *data, struct wl_pointer *wl_pointer, uint32_t time,
               wl_fixed_t surface_x, wl_fixed_t surface_y)
{
       struct client_state *client_state = data;
       client_state->pointer_event.event_mask |= POINTER_EVENT_MOTION;
       client_state->pointer_event.time = time;
       client_state->pointer_event.surface_x = surface_x,
               client_state->pointer_event.surface_y = surface_y;
}

static void
wl_pointer_button(void *data, struct wl_pointer *wl_pointer, uint32_t serial,
               uint32_t time, uint32_t button, uint32_t state)
{
       struct client_state *client_state = data;
       client_state->pointer_event.event_mask |= POINTER_EVENT_BUTTON;
       client_state->pointer_event.time = time;
       client_state->pointer_event.serial = serial;
       client_state->pointer_event.button = button,
               client_state->pointer_event.state = state;
}
```

轴事件有点复杂，因为存在两个方向的轴：水平和垂直。因此，我们的 `pointer_event` 结构体也包含具有两组轴事件的数组。我们处理这些的代码最终如下：

```c
static void
wl_pointer_axis(void *data, struct wl_pointer *wl_pointer, uint32_t time,
               uint32_t axis, wl_fixed_t value)
{
       struct client_state *client_state = data;
       client_state->pointer_event.event_mask |= POINTER_EVENT_AXIS;
       client_state->pointer_event.time = time;
       client_state->pointer_event.axes[axis].valid = true;
       client_state->pointer_event.axes[axis].value = value;
}

static void
wl_pointer_axis_source(void *data, struct wl_pointer *wl_pointer,
               uint32_t axis_source)
{
       struct client_state *client_state = data;
       client_state->pointer_event.event_mask |= POINTER_EVENT_AXIS_SOURCE;
       client_state->pointer_event.axis_source = axis_source;
}

static void
wl_pointer_axis_stop(void *data, struct wl_pointer *wl_pointer,
               uint32_t time, uint32_t axis)
{
       struct client_state *client_state = data;
       client_state->pointer_event.time = time;
       client_state->pointer_event.event_mask |= POINTER_EVENT_AXIS_STOP;
       client_state->pointer_event.axes[axis].valid = true;
}

static void
wl_pointer_axis_discrete(void *data, struct wl_pointer *wl_pointer,
               uint32_t axis, int32_t discrete)
{
       struct client_state *client_state = data;
       client_state->pointer_event.event_mask |= POINTER_EVENT_AXIS_DISCRETE;
       client_state->pointer_event.axes[axis].valid = true;
       client_state->pointer_event.axes[axis].discrete = discrete;
}
```

除了更新受到影响的轴这一主要变化之外，其余部分也同样非常直截了当。请注意 "valid" 布尔值的使用：我们有可能受到更新了一个轴但没更新另一个的指针帧 (pointer frame)，所以我们使用 "valid" 值来确定该帧事件中哪些轴被有效更新。

说到这里，现在是该集中注意力的地方了：我们的 "frame" 句柄。

```c
static void
wl_pointer_frame(void *data, struct wl_pointer *wl_pointer)
{
       struct client_state *client_state = data;
       struct pointer_event *event = &client_state->pointer_event;
       fprintf(stderr, "pointer frame @ %d: ", event->time);

       if (event->event_mask & POINTER_EVENT_ENTER) {
               fprintf(stderr, "entered %f, %f ",
                               wl_fixed_to_double(event->surface_x),
                               wl_fixed_to_double(event->surface_y));
       }

       if (event->event_mask & POINTER_EVENT_LEAVE) {
               fprintf(stderr, "leave");
       }

       if (event->event_mask & POINTER_EVENT_MOTION) {
               fprintf(stderr, "motion %f, %f ",
                               wl_fixed_to_double(event->surface_x),
                               wl_fixed_to_double(event->surface_y));
       }

       if (event->event_mask & POINTER_EVENT_BUTTON) {
               char *state = event->state == WL_POINTER_BUTTON_STATE_RELEASED ?
                       "released" : "pressed";
               fprintf(stderr, "button %d %s ", event->button, state);
       }

       uint32_t axis_events = POINTER_EVENT_AXIS
               | POINTER_EVENT_AXIS_SOURCE
               | POINTER_EVENT_AXIS_STOP
               | POINTER_EVENT_AXIS_DISCRETE;
       char *axis_name[2] = {
               [WL_POINTER_AXIS_VERTICAL_SCROLL] = "vertical",
               [WL_POINTER_AXIS_HORIZONTAL_SCROLL] = "horizontal",
       };
       char *axis_source[4] = {
               [WL_POINTER_AXIS_SOURCE_WHEEL] = "wheel",
               [WL_POINTER_AXIS_SOURCE_FINGER] = "finger",
               [WL_POINTER_AXIS_SOURCE_CONTINUOUS] = "continuous",
               [WL_POINTER_AXIS_SOURCE_WHEEL_TILT] = "wheel tilt",
       };
       if (event->event_mask & axis_events) {
               for (size_t i = 0; i < 2; ++i) {
                       if (!event->axes[i].valid) {
                               continue;
                       }
                       fprintf(stderr, "%s axis ", axis_name[i]);
                       if (event->event_mask & POINTER_EVENT_AXIS) {
                               fprintf(stderr, "value %f ", wl_fixed_to_double(
                                                       event->axes[i].value));
                       }
                       if (event->event_mask & POINTER_EVENT_AXIS_DISCRETE) {
                               fprintf(stderr, "discrete %d ",
                                               event->axes[i].discrete);
                       }
                       if (event->event_mask & POINTER_EVENT_AXIS_SOURCE) {
                               fprintf(stderr, "via %s ",
                                               axis_source[event->axis_source]);
                       }
                       if (event->event_mask & POINTER_EVENT_AXIS_STOP) {
                               fprintf(stderr, "(stopped) ");
                       }
               }
       }

       fprintf(stderr, "\n");
       memset(event, 0, sizeof(*event));
}
```

毋庸置疑，这是最长的一串代码了。但愿它不会令人感到困惑。我们在这里所做的就是把这一帧期间累积的状态漂亮地打印到 stderr 上。如果你现在再编译并运行这个程序，你应该可以在窗口上晃动你的鼠标，并看到输入事件被打印出来!

## 接入键盘事件

让我们用一些字段更新我们的 `client_state` 结构，以存储 XKB 的状态。

```diff
@@ -105,6 +107,9 @@ struct client_state {
        int width, height;
        bool closed;
        struct pointer_event pointer_event;
+       struct xkb_state *xkb_state;
+       struct xkb_context *xkb_context;
+       struct xkb_keymap *xkb_keymap;
};
```

我们需要 `xkbcommon` 头文件来定义这些。通常当我们这样做的时候，我将会把 `assert.h` 也拉进来。

```diff
@@ -1,4 +1,5 @@
 #define _POSIX_C_SOURCE 200112L
+#include <assert.h>
 #include <errno.h>
 #include <fcntl.h>
 #include <limits.h>
@@ -9,6 +10,7 @@
 #include <time.h>
 #include <unistd.h>
 #include <wayland-client.h>
+#include <xkbcommon/xkbcommon.h>
 #include "xdg-shell-client-protocol.h"
```

我们还需要在我们的主函数中初始化 `xkb_context`:

```diff
@@ -603,6 +649,7 @@ main(int argc, char *argv[])
        state.height = 480;
        state.wl_display = wl_display_connect(NULL);
        state.wl_registry = wl_display_get_registry(state.wl_display);
+       state.xkb_context = xkb_context_new(XKB_CONTEXT_NO_FLAGS);
        wl_registry_add_listener(state.wl_registry, &wl_registry_listener, &state);
        wl_display_roundtrip(state.wl_display);
```

下一步，让我们来更新我们座位的功能函数，把我们的键盘监听器也接入。

```diff
        } else if (!have_pointer && state->wl_pointer != NULL) {
                wl_pointer_release(state->wl_pointer);
                state->wl_pointer = NULL;
        }
+
+       bool have_keyboard = capabilities & WL_SEAT_CAPABILITY_KEYBOARD;
+
+       if (have_keyboard && state->wl_keyboard == NULL) {
+               state->wl_keyboard = wl_seat_get_keyboard(state->wl_seat);
+               wl_keyboard_add_listener(state->wl_keyboard,
+                               &wl_keyboard_listener, state);
+       } else if (!have_keyboard && state->wl_keyboard != NULL) {
+               wl_keyboard_release(state->wl_keyboard);
+               state->wl_keyboard = NULL;
+       }
 }
```

我们也要在这里定义我们使用的 `wl_keyboard_listener`。


```c
static const struct wl_keyboard_listener wl_keyboard_listener = {
       .keymap = wl_keyboard_keymap,
       .enter = wl_keyboard_enter,
       .leave = wl_keyboard_leave,
       .key = wl_keyboard_key,
       .modifiers = wl_keyboard_modifiers,
       .repeat_info = wl_keyboard_repeat_info,
};
```

现在开始有了一些变化，让我们从 keymap 开始：

```c
static void
wl_keyboard_keymap(void *data, struct wl_keyboard *wl_keyboard,
               uint32_t format, int32_t fd, uint32_t size)
{
       struct client_state *client_state = data;
       assert(format == WL_KEYBOARD_KEYMAP_FORMAT_XKB_V1);

       char *map_shm = mmap(NULL, size, PROT_READ, MAP_SHARED, fd, 0);
       assert(map_shm != MAP_FAILED);

       struct xkb_keymap *xkb_keymap = xkb_keymap_new_from_string(
                       client_state->xkb_context, map_shm,
                       XKB_KEYMAP_FORMAT_TEXT_V1, XKB_KEYMAP_COMPILE_NO_FLAGS);
       munmap(map_shm, size);
       close(fd);

       struct xkb_state *xkb_state = xkb_state_new(xkb_keymap);
       xkb_keymap_unref(client_state->xkb_keymap);
       xkb_state_unref(client_state->xkb_state);
       client_state->xkb_keymap = xkb_keymap;
       client_state->xkb_state = xkb_state;
}
```

现在我们可以看到为什么我们需要添加 `assert.h`——我们在这里用断言来确保 keymap 的格式是我们所期望的。然后，我们用 mmap 将混成器发送给我们的文件描述符 fd 映射成一个 `char*` 指针，我们可以将其传入 `xkb_keymap_new_from_string`。不要忘记 `munmap` 并在之后关闭这个文件描述符，然后设置我们的 XKB 状态。还要注意的是，我们也用 "*_unref" 去掉了先前在调用此函数时所设置的一切 XKB keymap 或 state 引用，以防混成器在运行时改变 keymap[^1]。

```c
static void
wl_keyboard_enter(void *data, struct wl_keyboard *wl_keyboard,
               uint32_t serial, struct wl_surface *surface,
               struct wl_array *keys)
{
       struct client_state *client_state = data;
       fprintf(stderr, "keyboard enter; keys pressed are:\n");
       uint32_t *key;
       wl_array_for_each(key, keys) {
               char buf[128];
               xkb_keysym_t sym = xkb_state_key_get_one_sym(
                               client_state->xkb_state, *key + 8);
               xkb_keysym_get_name(sym, buf, sizeof(buf));
               fprintf(stderr, "sym: %-12s (%d), ", buf, sym);
               xkb_state_key_get_utf8(client_state->xkb_state,
                               *key + 8, buf, sizeof(buf));
               fprintf(stderr, "utf8: '%s'\n", buf);
       }
}
```

当键盘 "进入" 我们的表面时，我们已经获得了键盘的输入焦点。混成器会将这之前所按键的队列转发出来，这里我们只是枚举它们并记录它们的 keysym 名称和 UTF-8 等效值。当按键被按下的时候，我们会做类似如下的事情：

```c
static void
wl_keyboard_key(void *data, struct wl_keyboard *wl_keyboard,
               uint32_t serial, uint32_t time, uint32_t key, uint32_t state)
{
       struct client_state *client_state = data;
       char buf[128];
       uint32_t keycode = key + 8;
       xkb_keysym_t sym = xkb_state_key_get_one_sym(
                       client_state->xkb_state, keycode);
       xkb_keysym_get_name(sym, buf, sizeof(buf));
       const char *action =
               state == WL_KEYBOARD_KEY_STATE_PRESSED ? "press" : "release";
       fprintf(stderr, "key %s: sym: %-12s (%d), ", action, buf, sym);
       xkb_state_key_get_utf8(client_state->xkb_state, keycode,
                       buf, sizeof(buf));
       fprintf(stderr, "utf8: '%s'\n", buf);
}
```

最后，我们增加了其余三个小事件的实现：

```c
static void
wl_keyboard_leave(void *data, struct wl_keyboard *wl_keyboard,
               uint32_t serial, struct wl_surface *surface)
{
       fprintf(stderr, "keyboard leave\n");
}

static void
wl_keyboard_modifiers(void *data, struct wl_keyboard *wl_keyboard,
               uint32_t serial, uint32_t mods_depressed,
               uint32_t mods_latched, uint32_t mods_locked,
               uint32_t group)
{
       struct client_state *client_state = data;
       xkb_state_update_mask(client_state->xkb_state,
               mods_depressed, mods_latched, mods_locked, 0, 0, group);
}

static void
wl_keyboard_repeat_info(void *data, struct wl_keyboard *wl_keyboard,
               int32_t rate, int32_t delay)
{
       /* Left as an exercise for the reader */
}
```

对于修饰符，我们可以进一步解码，但大多数应用程序不需要这样做。我们只是在这里更新 XKB 的状态。至于处理按键重复，这对于你的应用来说有诸多限制。比如，你想重复输入文本吗，想重复键盘快捷键吗，这些重复的所需的时间如何与你的事件循环进行互动？这些问题的答案需要由你自己来决定。

如果你再次编译并运行，你应该能够开始在窗口中开始打字，并看到你的输入被打印到终端日志中。这值得欢呼！

## 接入触摸事件

最后，我们将新增设备的触摸功能支持。就和指针事件一样，触摸设备也存在一个 "frame" 帧事件。然而，由于有多个触摸点可能在一帧内被更新，所以它们可能变得更加复杂。我们将增加一些结构体和枚举类型来表示状态的累积。

```c
enum touch_event_mask {
       TOUCH_EVENT_DOWN = 1 << 0,
       TOUCH_EVENT_UP = 1 << 1,
       TOUCH_EVENT_MOTION = 1 << 2,
       TOUCH_EVENT_CANCEL = 1 << 3,
       TOUCH_EVENT_SHAPE = 1 << 4,
       TOUCH_EVENT_ORIENTATION = 1 << 5,
};

struct touch_point {
       bool valid;
       int32_t id;
       uint32_t event_mask;
       wl_fixed_t surface_x, surface_y;
       wl_fixed_t major, minor;
       wl_fixed_t orientation;
};

struct touch_event {
       uint32_t event_mask;
       uint32_t time;
       uint32_t serial;
       struct touch_point points[10];
};
```

请注意，我在这里选择了 10 个触摸点，假设大多数用户只会使用这么多手指。而对于较大的多用户触摸屏，你可能需要一个更高的上限。此外，有些触摸硬件同时支持的触摸点少于十个，仅有八个也是常见的，而支持触摸点数量更少的硬件在老旧设备中也十分常见。

我们把这个结构体添加到 `client_state`:

```diff
@@ -110,6 +135,7 @@ struct client_state {
        struct xkb_state *xkb_state;
        struct xkb_context *xkb_context;
        struct xkb_keymap *xkb_keymap;
+       struct touch_event touch_event;
 };
```

当触摸支持可用的时候，我们将更新座位的功能句柄，以介入一个监听器。

```diff
        } else if (!have_keyboard && state->wl_keyboard != NULL) {
                wl_keyboard_release(state->wl_keyboard);
                state->wl_keyboard = NULL;
        }
+
+       bool have_touch = capabilities & WL_SEAT_CAPABILITY_TOUCH;
+
+       if (have_touch && state->wl_touch == NULL) {
+               state->wl_touch = wl_seat_get_touch(state->wl_seat);
+               wl_touch_add_listener(state->wl_touch,
+                               &wl_touch_listener, state);
+       } else if (!have_touch && state->wl_touch != NULL) {
+               wl_touch_release(state->wl_touch);
+               state->wl_touch = NULL;
+       }
 }
```

我们对作为上触摸功能的出现和消失也做了同样处理，因此我们的代码在运行时设备热插拔处理方面都很健壮。不过，触摸设备热插拔的情况在实际中不太常见。

这里是其自身的监听器:

```c
static const struct wl_touch_listener wl_touch_listener = {
       .down = wl_touch_down,
       .up = wl_touch_up,
       .motion = wl_touch_motion,
       .frame = wl_touch_frame,
       .cancel = wl_touch_cancel,
       .shape = wl_touch_shape,
       .orientation = wl_touch_orientation,
};
```

为了解决多点触摸问题，我们需要写一个小的辅助函数:

```c
+static struct touch_point *
+get_touch_point(struct client_state *client_state, int32_t id)
+{
+       struct touch_event *touch = &client_state->touch_event;
+       const size_t nmemb = sizeof(touch->points) / sizeof(struct touch_point);
+       int invalid = -1;
+       for (size_t i = 0; i < nmemb; ++i) {
+               if (touch->points[i].id == id) {
+                       return &touch->points[i];
+               }
+               if (invalid == -1 && !touch->points[i].valid) {
+                       invalid = i;
+               }
+       }
+       if (invalid == -1) {
+               return NULL;
+       }
+       touch->points[invalid].valid = true;
+       touch->points[invalid].id = id;
+       return &touch->points[invalid];
+}
```

这个函数的基本目的是从我们添加到 `touch_event` 结构体的数组中，根据我们要接收事件的触摸点 ID，挑选一个触摸点。如果我们找到了该 ID 的现有触摸点，我们就将其返回。如果没有，则会返回第一个可用的触摸点。如果我们都找完了还没有，就会返回 `NULL`。

现在我们可以利用这点来实现我们的第一个功能：触摸。

```c
static void
wl_touch_down(void *data, struct wl_touch *wl_touch, uint32_t serial,
               uint32_t time, struct wl_surface *surface, int32_t id,
               wl_fixed_t x, wl_fixed_t y)
{
       struct client_state *client_state = data;
       struct touch_point *point = get_touch_point(client_state, id);
       if (point == NULL) {
               return;
       }
       point->event_mask |= TOUCH_EVENT_UP;
       point->surface_x = wl_fixed_to_double(x),
               point->surface_y = wl_fixed_to_double(y);
       client_state->touch_event.time = time;
       client_state->touch_event.serial = serial;
}
```

和指针事件一样，我们也是简单地将这个状态累积起来，以便后续使用。我们还不知道这个事件是否代表一个完整的触摸帧。让我们为触摸添加一些类似的东西：

```c
static void
wl_touch_up(void *data, struct wl_touch *wl_touch, uint32_t serial,
               uint32_t time, int32_t id)
{
       struct client_state *client_state = data;
       struct touch_point *point = get_touch_point(client_state, id);
       if (point == NULL) {
               return;
       }
       point->event_mask |= TOUCH_EVENT_UP;
}
```

以及运动：

```c
static void
wl_touch_motion(void *data, struct wl_touch *wl_touch, uint32_t time,
               int32_t id, wl_fixed_t x, wl_fixed_t y)
{
       struct client_state *client_state = data;
       struct touch_point *point = get_touch_point(client_state, id);
       if (point == NULL) {
               return;
       }
       point->event_mask |= TOUCH_EVENT_MOTION;
       point->surface_x = x, point->surface_y = y;
       client_state->touch_event.time = time;
}
```

触摸事件的取消与之前有所不同，因为它一次性 “取消” 了所有活动的触摸点。我们只需要将其存储在 `touch_event` 的顶层事件掩码中。

```c
static void
wl_touch_cancel(void *data, struct wl_touch *wl_touch)
{
       struct client_state *client_state = data;
       client_state->touch_event.event_mask |= TOUCH_EVENT_CANCEL;
}
```

然而，形状和方向事件类似于向上、向下和移动，因为它们告诉我们一个特定触摸点的尺寸。

```c
static void
wl_touch_shape(void *data, struct wl_touch *wl_touch,
               int32_t id, wl_fixed_t major, wl_fixed_t minor)
{
       struct client_state *client_state = data;
       struct touch_point *point = get_touch_point(client_state, id);
       if (point == NULL) {
               return;
       }
       point->event_mask |= TOUCH_EVENT_SHAPE;
       point->major = major, point->minor = minor;
}

static void
wl_touch_orientation(void *data, struct wl_touch *wl_touch,
               int32_t id, wl_fixed_t orientation)
{
       struct client_state *client_state = data;
       struct touch_point *point = get_touch_point(client_state, id);
       if (point == NULL) {
               return;
       }
       point->event_mask |= TOUCH_EVENT_ORIENTATION;
       point->orientation = orientation;
}
```

最后，在收到一个帧事件时，我们可以将所有这些累积的状态解释为一个单一的输入事件，就像我们的光标指针代码一样。

```c
static void
wl_touch_frame(void *data, struct wl_touch *wl_touch)
{
       struct client_state *client_state = data;
       struct touch_event *touch = &client_state->touch_event;
       const size_t nmemb = sizeof(touch->points) / sizeof(struct touch_point);
       fprintf(stderr, "touch event @ %d:\n", touch->time);

       for (size_t i = 0; i < nmemb; ++i) {
               struct touch_point *point = &touch->points[i];
               if (!point->valid) {
                       continue;
               }
               fprintf(stderr, "point %d: ", touch->points[i].id);

               if (point->event_mask & TOUCH_EVENT_DOWN) {
                       fprintf(stderr, "down %f,%f ",
                                       wl_fixed_to_double(point->surface_x),
                                       wl_fixed_to_double(point->surface_y));
               }

               if (point->event_mask & TOUCH_EVENT_UP) {
                       fprintf(stderr, "up ");
               }

               if (point->event_mask & TOUCH_EVENT_MOTION) {
                       fprintf(stderr, "motion %f,%f ",
                                       wl_fixed_to_double(point->surface_x),
                                       wl_fixed_to_double(point->surface_y));
               }

               if (point->event_mask & TOUCH_EVENT_SHAPE) {
                       fprintf(stderr, "shape %fx%f ",
                                       wl_fixed_to_double(point->major),
                                       wl_fixed_to_double(point->minor));
               }

               if (point->event_mask & TOUCH_EVENT_ORIENTATION) {
                       fprintf(stderr, "orientation %f ",
                                       wl_fixed_to_double(point->orientation));
               }

               point->valid = false;
               fprintf(stderr, "\n");
       }
}
```

编译并再次运行这个程序，你就可以看到当你与触摸设备交互时，触摸事件被答应到 stderr （假设你现在有支持触摸的设备）。现在我们的客户端终于了实现输入的支持！

## 接下来该做什么？

有很多不同种类的输入设备，因此扩展我们的代码以支持这些设备是一项相当庞大的工作——仅在本章中我们的代码量就增加了 2.5 倍。不过收获应该也是相当大的，因为你现在已经熟悉了足够多的 Wayland 概念（和代码），由此你可以实现多种多样的客户端了。

这之后还有更多的东西要学——在最后几章，我们将介绍弹出窗口、上下文菜单、交互式窗口的移动和大小调整、剪贴板和拖放支持，以及后来的一些有趣的扩展协议，以支持更多小众的使用场景。我强烈建议你在构建自己的客户端之前先读到第 10.1 章，因为它涵盖诸如根据混成器的要求调整窗口大小等内容。

[^1]: 这种情况在实践中确实发生了！