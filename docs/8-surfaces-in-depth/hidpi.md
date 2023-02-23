# 高分辨率表面（HiDPI）

在过去的几年时间里，高端显示器的像素密度取得了巨大的飞跃，新的显示器在相同的物理显示面积上装入了两倍于我们过去几年所见的像素量。我们称这些显示器为 “HiDPI” 显示器（高分屏），是 “像素每英寸” 的简称。然而这些显示器要远远领先于它们的 “低分屏” 同行，要正确利用它们，必须在应用层面作出改变。通过在相同的空间内将屏幕的分辨率提高一倍，如果我们不特别考虑它们的话，我们所有的用户界面尺寸都会减少一半。对于大多数显示器而言，这将使得文字无法阅读，交互元素也会变得很小，令人不悦。

然而，作为交换，其为我们的矢量图形提高了图形的保真度，最明显的是在文本渲染方面。Wayland 通过为每个输出添加一个 “比例因子”（scale factor） 来解决这个问题，而客户端也被期望将这个比例因子应用到它们的界面上。此外，没有意识到 HiDPI 的客户端通过无动作来传达这一限制信号，让混成器放大他们的缓冲区来弥补这一限制。混成器通过适当的事件发出每个输出的比例因子信号：

```xml
<interface name="wl_output" version="3">
  <!-- ... -->
  <event name="scale" since="2">
    <arg name="factor" type="int" />
  </event>
</interface>
```

请注意，这是在版本 2 中添加的，因此当绑定到 `wl_output` 全局量的时候你需要将版本至少设置为 2 以接收这些事件。然而， 这还不足以决定你在客户端用上 HiDPI。为了进行这一调用，混成器还必须为你的 `wl_surface` 发送 `enter` 事件，以表明它已经 “进入”（正在显示在）一个或多个特定的输出端。

```xml
<interface name="wl_surface" version="4">
  <!-- ... -->
  <event name="enter">
    <arg name="output" type="object" interface="wl_output" />
  </event>
</interface>
```

一旦你知道客户端显示的输出集合，就应该取比例因子中的最大值，将其中缓冲区的大小（以像素为单位）乘以这个值，然后以 2 倍或 3 倍（或 N 倍）的比例渲染 UI。然后像这样指出缓冲区准备的比例：

```xml
<interface name="wl_surface" version="4">
  <!-- ... -->
  <request name="set_buffer_scale" since="3">
    <arg name="scale" type="int" />
  </request>
</interface>
```

**注意：** 这需要版本 3 或者更新的 `wl_surface`。当你与 `wl_compositor` 绑定时，你应该把这个版本号传递给 `wl_registry`。

在下一次 `wl_surface.commit` 时，你的表面会假定这个比例因子。如果它大于表面显示的比例系数，混成器会将其缩小。如果它小于输出的比例系数，混成器则会将其放大。