# 交互式移动和尺寸调整

许多应用程序窗口都有交互式 UI 元素，用户可以用它来拖动或者调整窗口大小。在默认情况下，许多 Wayland 客户端都希望负责自己的窗口装饰，并提供这些交互元素。在 X11 上，应用程序窗口可以在屏幕上的任何地方自行定位（即知道自己的绝对位置），并以此来推动这些交互。

然而，Wayland 的一个设计特性是让应用程序窗口不知道它们在屏幕上的确切位置或是与其他窗口的相对位置。这一决定为 Wayland 混成器提供了更多的灵活性，例如：窗口可以同时显示在几个地方，排列在 VR 场景的 3D 空间中，或以任何其他新颖的方式呈现。Wayland 的设计旨在通用，广泛适用与许多设备和不同外形。

为了平衡移动和调整尺寸这两种需要，XDG toplevels 提供了两个请求，可以用来要求混成器执行一个交互式移动或者调整大小的操作。部分相关接口如下：

```xml
<request name="move">
  <arg name="seat" type="object" interface="wl_seat" />
  <arg name="serial" type="uint" />
</request>
```

就像上一章节解释的弹出式窗口里创建请求一样，你必须提供一个输入事件序列来执行一个交互式操作。例如，当你收到一个向下的鼠标移动的事件时，你可以使用该事件的序列来执行交互式移动操作。混成器将从此处接管，并且在其内部的坐标空间中对窗口进行交互式操作。

调整尺寸则相对复杂一些，因为需要指定操作中涉及到窗口的哪些边或角。

```xml
<enum name="resize_edge">
  <entry name="none" value="0"/>
  <entry name="top" value="1"/>
  <entry name="bottom" value="2"/>
  <entry name="left" value="4"/>
  <entry name="top_left" value="5"/>
  <entry name="bottom_left" value="6"/>
  <entry name="right" value="8"/>
  <entry name="top_right" value="9"/>
  <entry name="bottom_right" value="10"/>
</enum>

<request name="resize">
  <arg name="seat" type="object" interface="wl_seat" />
  <arg name="serial" type="uint" />
  <arg name="edges" type="uint" />
</request>
```

但除此之外，它的功能大致相同。如果用户沿着你窗口的左下角点击并拖动，你可能想发送一个交互式调整大小的请求，并将边缘参数设置为 `buttom_left`。

对于自行实现 CSD 的客户端来说，有一个必要的额外请求：

```xml
<request name="show_window_menu">
  <arg name="seat" type="object" interface="wl_seat" />
  <arg name="serial" type="uint" />
  <arg name="x" type="int" />
  <arg name="y" type="int" />
</request>
```

当点击窗口装饰时，通常会出现一个提供窗口操作的上下文菜单，例如关闭或最小化窗口。对于窗口装饰由其自行管理的客户端来说，这有助于将客户端驱动的交互事件与混成器驱动的元操作（如最小化窗口）联系起来。如果你的客户端使用了 CSD，则可以为此目的使用此请求。

## xdg-decoration

在讨论客户端 CSD 的行为时，最后一个值得一提的细节是管理其初次用于协商的协议。不同的 Wayland 客户端和服务端可能对 CSD (client-side decoration) 或 SSD (server-side decoration) 有不同的偏好。为了表达这一意图，我们使用了一个扩展协议：`xdg-decoration`。它可以在 `wayland-protocols` 中找到，该协议提供了一个全局的接口：

```xml
<interface name="zxdg_decoration_manager_v1" version="1">
  <request name="destroy" type="destructor" />

  <request name="get_toplevel_decoration">
    <arg name="id" type="new_id" interface="zxdg_toplevel_decoration_v1"/>
    <arg name="toplevel" type="object" interface="xdg_toplevel"/>
  </request>
</interface>
```

你可以将你的 `xdg_toplevel` 对象传递到 `get_toplevel_decoration` 请求中，以获得一个具有以下接口的对象：

```xml
<interface name="zxdg_toplevel_decoration_v1" version="1">
  <request name="destroy" type="destructor" />

  <enum name="mode">
    <entry name="client_side" value="1" />
    <entry name="server_side" value="2" />
  </enum>

  <request name="set_mode">
    <arg name="mode" type="uint" enum="mode" />
  </request>

  <request name="unset_mode" />

  <event name="configure">
    <arg name="mode" type="uint" enum="mode" />
  </event>
</interface>
```

`set_mode` 请求用于表达客户端的偏好，`unset_mode` 用于表达没有偏好。然后，混成器将使用 `configure` 事件来告知客户端是否使用 CSD。更多细节请查阅完整的 XML。

