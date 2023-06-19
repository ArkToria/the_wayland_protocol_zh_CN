# XDG 表面

在 `xdg-shell` 领域内的表面被称为 `xdg_surfaces`，这个接口带来了两种 XDG 表面所共有的功能——toplevels 和 popups（也即之前提到的顶层窗口和弹窗）。每种 XDG 表面的语义仍然不同，所以必须通过一个额外的角色来明确指定它们。

`xdg_surface` 接口提供了额外的请求来分配更具体的 popup 和 toplevel 角色。一旦我们将一个全局对象绑定到全局接口 `xdg_wm_base`，我们就可以使用 `get_xdg_surface` 请求来获得一个 `wl_suraface`。

```xml
<request name="get_xdg_surface">
  <arg name="id" type="new_id" interface="xdg_surface"/>
  <arg name="surface" type="object" interface="wl_surface"/>
</request>
```

`xdg_surface` 接口除了要求你给表面分配一个更具体的 toplevel 或 popup 角色外，还包括一些两个角色共有的重要功能。在我们继续讨论这二者的具体语义之前，先让我们回顾一下：

```xml
<event name="configure">
  <arg name="serial" type="uint" summary="serial of the configure event"/>
</event>

<request name="ack_configure">
  <arg name="serial" type="uint" summary="the serial from the configure event"/>
</request>
```

`xdg-surface` 最重要的 API 就是 `configure` 和 `ack_configure` 这一对。你可能还记得，Wayland 的一个目标是让每一帧都完美呈现。这意味着任何一帧都没有应用了一半的状态变化（原子性，避免画面撕裂），为了实现这个目标，我们必须要在客户端和服务端之间同步这些变化。对于 XDG 表面来说，这对消息（这两个 API 传递的内容）正是实现这一目的的机制。

我们目前只关注基础内容，因此我们会总结这两个事件的重点如下：当来自服务端的事件通知你配置（或重新配置）一个表面时，将它们设置到一个待定状态。当一个 configure 事件到来时，会应用先前准备好的变化，使用 `ack_configure` 来确定你已经这样做了，然后渲染并提交一个新的帧。我们将在下一章节中展示这一做法，并在 8.1 章中详细解释。

```xml
<request name="set_window_geometry">
  <arg name="x" type="int"/>
  <arg name="y" type="int"/>
  <arg name="width" type="int"/>
  <arg name="height" type="int"/>
</request>
```

`set_window_geometry` 请求主要用于使用应用程序的 CSD（client-side decorations），以区分其表面上被认为是窗口和不是窗口的部分。它最常用于排除窗口后面渲染的客户端阴影，使其不被视为窗口的一部分（即窗口阴影和窗口本体分离）。混成器可以使用这些信息来管理它自己的行为，以布置窗口和交互。