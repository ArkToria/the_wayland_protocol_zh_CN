# 键盘输入

在了解如何使用 XKB 之后，让我们来扩展我们的 Wayland 代码，为我们的键入事件提供输入。与我们获得 `wl_pointer` 资源的方法类似，我们可以使用 `wl_sear.get_keyboard` 请求来为一个有着 `WL_SEAT_CAPABILITY_KEYBOARD` 功能的座位（seat）创建一个 `wl_keyboard`。当你创建完成后，你应该发送 "release" 来释放请求：

```xml
<request name="release" type="destructor" since="3">
</request>
```

这将使服务器能够清理与该键盘相关的资源。

但是，你实际上如何使用它呢？让我们从基础知识开始。

## 键位映射

当你绑定到 `wl_keyboard` 时，服务端可能发送的第一个事件是 `keymap`。

```xml
<enum name="keymap_format">
  <entry name="no_keymap" value="0" />
  <entry name="xkb_v1" value="1" />
</enum>

<event name="keymap">
  <arg name="format" type="uint" enum="keymap_format" />
  <arg name="fd" type="fd" />
  <arg name="size" type="uint" />
</event>
```

`keymap_format` 枚举类型是我们想出一种新的 keymaps 格式的情况下提供的（预留），但在本文撰写时，XKB keymaps 仍旧是服务端可能发送的唯一格式。

像这样的批量数据是通过文件描述符传输的。我们可以简单地从文件描述符中读取，但一般来说，建议用 `mmap` 代替。在 C 语言中，类似可能的实现如下：

```c
#include <sys/mman.h>
// ...

static void wl_keyboard_keymap(void *data, struct wl_keyboard *wl_keyboard,
        uint32_t format, int32_t fd, uint32_t size) {
    assert(format == WL_KEYBOARD_KEYMAP_FORMAT_XKB_V1);
    struct my_state *state = (struct my_state *)data;

    char *map_shm = mmap(NULL, size, PROT_READ, MAP_PRIVATE, fd, 0);
    assert(map_shm != MAP_FAILED);

    struct xkb_keymap *keymap = xkb_keymap_new_from_string(
        state->xkb_context, map_shm, XKB_KEYMAP_FORMAT_TEXT_V1,
        XKB_KEYMAP_COMPILE_NO_FLAGS);
    munmap(map_shm, size);
    close(fd);

    // ...do something with keymap...
}
```

一旦我们有了一个键位映射，我们就可以为这个 `wl_keyboard` 解释未来的按键事件。请注意，服务端一可以在任何时候发送一个新的键映射，所有未来的按键事件都应该从这个新的映射来解释。

## 键盘焦点

```xml
<event name="enter">
  <arg name="serial" type="uint" />
  <arg name="surface" type="object" interface="wl_surface" />
  <arg name="keys" type="array" />
</event>

<event name="leave">
  <arg name="serial" type="uint" />
  <arg name="surface" type="object" interface="wl_surface" />
</event>
```

就像 `wl_pointer` 里的 "enter" 和 "leave" 事件是当指针在你的表面上移动的时候发出的，服务端在表面收到键盘焦点时发送 `wl_keyboard.enter`，而失去焦点的时候发送 `wl_keyboard.leave`。许多应用程序会在这些条件下改变它们的外观——比如，开始绘制一个闪烁的光标。

"enter" 事件还包括 array 数组，里面涵盖了当前输入的按键。这是一个由 32 位无符号整数组成的数组，每一个都代表一个所按按键的扫描编码 scancode。

## 输入事件

一旦将键盘进入你的表面，你就可以期待开始接受输入事件。

```xml
<enum name="key_state">
  <entry name="released" value="0" />
  <entry name="pressed" value="1" />
</enum>

<event name="key">
  <arg name="serial" type="uint" />
  <arg name="time" type="uint" />
  <arg name="key" type="uint" />
  <arg name="state" type="uint" enum="key_state" />
</event>

<event name="modifiers">
  <arg name="serial" type="uint" />
  <arg name="mods_depressed" type="uint" />
  <arg name="mods_latched" type="uint" />
  <arg name="mods_locked" type="uint" />
  <arg name="group" type="uint" />
</event>
```

"key" 事件在用户按下或者释放一个键的时候被发送。像许多输入事件一样，它包括一个序列，你可以用它来将未来的请求与这个输入事件联系起来。"key" 是所按按键的编码，"state" 是该按键的按下或释放状态。

**重要：** 这个事件的 scancode 是 Linux evdev scancode。若要将其转换为 XKB 的 scancode，你必须在 evdev scancode 中加 8。

修饰事件包括一个类似的序列，还有按下、锁存和锁定修饰键的掩码，以及当前正在使用的输入组的索引。一个修饰键被按下，就像当你按住 Shift 的时候。修饰键可以锁存，例如启用粘滞键（专为同时按下两个键或多个按键有困难的人而设计的）后先按下一个修饰键 Shift 松开，直到再按下另一个非修饰键时生效。修饰键也可以被锁定，比如当大写锁定开关被打开或关闭时。输入组用于在各种键盘布局之间切换，例如在 ISO 和 ANSI 布局之间，或者用于更多特殊语言的特性。

修饰键的解释因 keymap 而异。你应该把它们都转发给 XKB 来处理。大多数 “修饰键” 事件的实现是非常直接的：

```c
static void wl_keyboard_modifiers(void *data, struct wl_keyboard *wl_keyboard,
        uint32_t serial, uint32_t depressed, uint32_t latched,
        uint32_t locked, uint32_t group) {
    struct my_state *state = (struct my_state *)data;
    xkb_state_update_mask(state->xkb_state,
        depressed, latched, locked, 0, 0, group);
}
```

## 按键重复

最后让我们来考虑 "repeat_info" 事件：

```xml
<event name="repeat_info" since="4">
  <arg name="rate" type="int" />
  <arg name="delay" type="int" />
</event>
```

在 Wayland 中，客户端负责实现 “按键重复”——只要你按住按键，就会持续输入字符的功能。发送这个事件是为了将用户对重复事设置的偏好通知给客户端。延迟 "delay" 是指在按键重复启动前的需要保持按下的毫秒数，速率 "rate" 是指直到按键被释放每秒重复输入的字符数。
