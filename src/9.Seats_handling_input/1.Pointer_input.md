# 光标指针输入

使用 `wl_seat.get_pointer` 请求，客户端可以获得一个 `wl_pointer` 对象。只要用户移动他们的指针、按下鼠标按钮、使用滚轮等——只要指针在你的一个表面上，服务端就会向它发送事件。我们可以通过 `wl_pointer.enter` 事件来判断是否满足条件。

```xml
<event name="enter">
  <arg name="serial" type="uint" />
  <arg name="surface" type="object" interface="wl_surface" />
  <arg name="surface_x" type="fixed" />
  <arg name="surface_y" type="fixed" />
</event>
```

当指针在我们的一个表面上移动的时候，服务端将发送这一事件，并指定 “进入” 的表面，以及指针所处的表面本地坐标（从左上角开始）。这里的坐标使用 `fixed` 类型指定，你可能还记得第 2.1 章节，它代表一个 24 位长度（8 位色深）的固定精度数字（`wl_fixed_to_double` 会把它转换成 C 语言的 `double` 类型）。

当指针从你的表面移开时，相应的事件就会更短小：

```xml
<event name="leave">
  <arg name="serial" type="uint" />
  <arg name="surface" type="object" interface="wl_surface" />
</event>
```

一旦指针进入到你的表面，你将会接受到它的额外事件，我们将很快对此作出讨论。然而，你可能想做的第一件事是提供一个光标的图像。这个过程如下：

1. 用 `wl_compositor` 创建一个新的 `wl_surface`。
2. 使用 `wl_pointer.set_cursot` 将表面附加到指针上。
3. 将光标图像的 `wl_buffer` 附加到该表面并提交。

这里唯一引入的新 API 是 `wl_pointer.set_cursor`。

```xml
<request name="set_cursor">
  <arg name="serial" type="uint" />
  <arg name="surface" type="object" interface="wl_surface" allow-null="true" />
  <arg name="hotspot_x" type="int" />
  <arg name="hotspot_y" type="int" />
</request>
```

这里的序列必须来自输入事件。`hotspot_x` 和 `hotspot_y` 参数 指定了光标 “热点” 在表面的本地坐标，或者指针在光标图像中的有效位置（例如，在尖头的顶端）。还要注意，表面可以是空的——用它来完全隐藏光标。

如果你正在寻找一个好的指针图标来源，`libwayland` 带有一个单独的 `wayland-cursor` 库，它可以从磁盘上加载 X 光标主题并为它们创建 `wl_buffers`。详见 `wayland-cursor.h`，或者参考第 9.5 章中对我们客户端示例的更新。

*注意：`wayland-cursor` 包括处理动画光标的代码，这即便是在 1998 年也不酷。如果我是你，我就不会去管这些。从来没有人抱怨过我的 Wayland 客户端不支持光标动画。*

在光标进入你的表面，并且你附加了一个合适的光标图片后，你就可以开始处理输入事件了。有运动、按钮和轴事件。

## 指针帧

服务端上的一帧输入处理可以携带许多变化的信息——例如，轮询一次鼠标可以在一个数据包中返回一个更新的位置和一个释放的按钮。服务端将这些变化作为单独的 Wayland 事件发送，并使用 “帧” 事件将它们组合在一起。

```xml
<event name="frame"></event>
```

客户端应该在受到所有 `wl_pointer` 事件时将它们累积起来，一旦受到 “帧” 事件，就将这些未决的输入作为一二个单一的指针事件来处理。

## 运动事件

运动事件与进入事件使用的相同坐标空间，并在进入时指定，且其定义也非常直接：

```xml
<event name="motion">
  <arg name="time" type="uint" />
  <arg name="surface_x" type="fixed" />
  <arg name="surface_y" type="fixed" />
</event>
```

就像所有包含时间戳的输入事件一样，时间值是一个与此输入事件相关的，单调增长的，毫秒级的时间戳。

## 按键事件

按键事件大多数都不言而喻：

```xml
<enum name="button_state">
  <entry name="released" value="0" />
  <entry name="pressed" value="1" />
</enum>

<event name="button">
  <arg name="serial" type="uint" />
  <arg name="time" type="uint" />
  <arg name="button" type="uint" />
  <arg name="state" type="uint" enum="button_state" />
</event>
```

然而，按键的参数值值得作一些额外的解释。这些数字是一个特定平台的输入事件，尽管注意到 FreeBSD 平台也重用了 Linux 的数值。你可以在 `linux/input-event-codes.h` （一般由 linux-headers 或者 linux-api-headers 包提供）中找到这些 Linux 下的数值，最有用的数值可能是由常量 `BTN_LEFT`、`BTN_RIGHT` 和 `BTN_MIDDLE` 表示的。除此之外还有更多定义，在你闲暇的时候可以浏览一下头文件。

```c
 342   │ #define BTN_MISC        0x100
 343   │ #define BTN_0           0x100
 344   │ #define BTN_1           0x101
 345   │ #define BTN_2           0x102
 346   │ #define BTN_3           0x103
 347   │ #define BTN_4           0x104
 348   │ #define BTN_5           0x105
 349   │ #define BTN_6           0x106
 350   │ #define BTN_7           0x107
 351   │ #define BTN_8           0x108
 352   │ #define BTN_9           0x109
```

## 轴事件

轴事件用于描述滚轮动作，例如旋转你的滚轮或者左右摇动它。最基本的形式看起来像这样：

```xml
<enum name="axis">
  <entry name="vertical_scroll" value="0" />
  <entry name="horizontal_scroll" value="1" />
</enum>

<event name="axis">
  <arg name="time" type="uint" />
  <arg name="axis" type="uint" enum="axis" />
  <arg name="value" type="fixed" />
</event>
```

然而，轴事件是复杂的，这也是 `wl_pointer` 接口中多年来受到最多关注的部分。有几个额外的事件存在，它们增加了轴事件的特殊性：

```xml
<enum name="axis_source">
  <entry name="wheel" value="0" />
  <entry name="finger" value="1" />
  <entry name="continuous" value="2" />
  <entry name="wheel_tilt" value="3" />
</enum>

<event name="axis_source" since="5">
  <arg name="axis_source" type="uint" enum="axis_source" />
</event>
```

`axis_source` 事件告诉你哪种轴被驱动了——滚轮、触摸板上的手指移动、向旁边倾斜的摇杆、或更新颖的东西。这个事件本身很简单，但其余的就不那么简单了：

```xml
<event name="axis_stop" since="5">
  <arg name="time" type="uint" />
  <arg name="axis" type="uint" enum="axis" />
</event>

<event name="axis_discrete" since="5">
  <arg name="axis" type="uint" enum="axis" />
  <arg name="discrete" type="int" />
</event>
```

这两个事件的精确语义很复杂，如果你想利用它们，我建议仔细阅读 `wayland.xml` 中的摘要。简而言之，`axis_discrete` 事件用于区分任意规模的轴事件和离散的步骤，例如，滚轮的每一次 “点击” 代表书轴值的一次离散的变化。`axis_stop` 事件标志着一个离散的用户运动行为已经完成，并用于计算发生在几个帧之间的滚动事件。任何未来的事件都应该被解释为一个单独的运动。