# 子表面

在核心 Wayland 协议中，`wayland.xml` 只定义了一种[^1]表面角色：子表面。它们拥有一个相对于父表面但并不受到其父表面边界的限制的 X、Y 位置，以及一个相对于其兄弟和父表面的 Z 轴顺序。

这个功能的一些使用情况包括：以其原始像素格式播放带有视频的表面，并在上面显示 RGBA 用户界面或字幕；使用 OpenGL 表面作为你主要的应用界面，并在软件中使用子表面来渲染窗口装饰，或在用户界面各个部分移动而不必在客户端重新绘制。在硬件表面的帮助下，混成器也可能不需要绘制任何东西来更新你的子表面。特别是在嵌入式系统上，当它符合你的使用情况时，这可能特别有用。一个巧妙设计的应用程序可以利用子表面来提高运行效率。

用 `wl_subcompositor` 接口来管理这些请求。`get_subcompositor` 请求是 `subcompositor` 的主要接入点：

```xml
<request name="get_subsurface">
  <arg name="id" type="new_id" interface="wl_subsurface" />
  <arg name="surface" type="object" interface="wl_surface" />
  <arg name="parent" type="object" interface="wl_surface" />
</request>
```

一旦你有了一个与 `wl_surface` 关联的 `wl_subsurface` 对象，那么它就会成为这个表面的子表面。子表面本身也可以有子表面，从而在任何顶层（top-level）表面下形成一个有序的表面树。对这些子表面的操作是通过 `wl_subsurface` 接口完成的。 

```xml
<request name="set_position">
  <arg name="x" type="int" summary="x coordinate in the parent surface"/>
  <arg name="y" type="int" summary="y coordinate in the parent surface"/>
</request>

<request name="place_above">
  <arg name="sibling" type="object" interface="wl_surface" />
</request>

<request name="place_below">
  <arg name="sibling" type="object" interface="wl_surface" />
</request>

<request name="set_sync" />
<request name="set_desync" />
```

一个子表面的 Z 轴顺序可以放在任何与它有相同父表面的兄弟或父表面本身的上方或者下方。

`wl_subsurface` 的各种属性同步在这里需要做出一些解释。这些位置和 Z 轴属性是与父表面的生命周期同步的。当主表面的 `wl_surface.commit` 请求被发送的时候，它所有的子表面的位置和 Z 轴顺序的变化都会一并被应用。

然而，与这个子表面相关的 `wl_surface` 状态，例如，缓冲区的附加和损坏区域的累积，则不需要与父表面的生命周期相联系。这就是 `set_sync` 和 `set_desync` 请求的目的。与父表面同步的子表面会在父表面提交时提交其所有的状态。解除同步的表面会像别的表面一样管理自己提交的生命周期。

简而言之，同步和解同步的请求是无缓冲的，会立即被应用。位置和 Z 轴顺序请求是有缓冲的，并不受曲面的同步或异步属性影响——它们总是和父表面一同提交。在相关的 `wl_surface` 上，剩下的表面状态，会根据子表面的同步或异步状态来提交。

[^1]: 忽略弃用的 `wl_shell` 接口