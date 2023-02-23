# 表面区域

我们已经通过 `wl_compositor` 的接口 `wl_compositor.create_surface` 创建了一个 `wl_surfaces`。然而，请注意，这里还有第二个请求：`create_region`。

```xml
<interface name="wl_compositor" version="4">
  <request name="create_surface">
    <arg name="id" type="new_id" interface="wl_surface" />
  </request>

  <request name="create_region">
    <arg name="id" type="new_id" interface="wl_region" />
  </request>
</interface>
```

`wl_region` 接口定义了一组矩形，它们共同组成了一个任意形状的几何区域。其定义的请求允许你对其所定义的几何体进行位操作，即从其中添加或减去矩形。

```xml
<interface name="wl_region" version="1">
  <request name="destroy" type="destructor" />

  <request name="add">
    <arg name="x" type="int" />
    <arg name="y" type="int" />
    <arg name="width" type="int" />
    <arg name="height" type="int" />
  </request>

  <request name="subtract">
    <arg name="x" type="int" />
    <arg name="y" type="int" />
    <arg name="width" type="int" />
    <arg name="height" type="int" />
  </request>
</interface>
```

例如，要制作一个有孔的矩形，你可以这样：

1. 发送 `wl_compositor.create_region` 请求来分配一个 `wl_region` 对象。
2. 发送 `wl_region.add(0, 0, 512, 512)` 来创建一个 512x512 的矩形。
3. 发送 `wl_region.subtract(128, 128, 256, 256)`，从区域中间移除一个 256x256 的矩形。

这些区域也可以是没有交集的，它不需要是一个连续的多边形。一旦你创建了这些区域的其中之一，你就可以把它传递给 `wl_surface` 接口，即用 `set_opaque_region` 和 `set_input_region` 请求。

```xml
<interface name="wl_surface" version="4">
  <request name="set_opaque_region">
    <arg name="region" type="object" interface="wl_region" allow-null="true" />
  </request>

  <request name="set_input_region">
    <arg name="region" type="object" interface="wl_region" allow-null="true" />
  </request>
</interface>
```

不透明区域是给混成器的一个提示，告诉它你的表面哪些部分被认为是不透明的。基于这些信息，混成器可以优化它的渲染过程。例如，你的表面是完全不透明的，并且遮挡了它下面的另一个窗口，那么混成器就不会在重新绘制下面窗口上浪费任何时间。默认情况下是没有这个提示的， 它假定你表面的任何部分都可能是透明的。这使得默认情况下绘制效率最低，但效果也最正确。

输入区域表示你的表面哪些部分可以接受光标和触摸输入事件。例如，你可以在你的表面下绘制一个下拉阴影，但发生在这个区域的输入事件应该被传递到你内部的的客户端。或者，如果你的窗口是一个不寻常的形状，你也可以在此创建一个符合形状的输入区域。在默认情况下，对于大多数表面类型，你的整个表面都接受输入。

这两个请求都可以通过传入 null 而不但是 `wl_region` 对象来设置一个空的区域。它们也都是带有双缓冲区的——所以发送一个 `wl_surface.commit` 来使得你的改变生效。一旦你发送了 `set_opaque_region` 或 `set_input_region` 请求，你就可以销毁 `wl_region` 对象以释放其资源。在你发送这些请求后，再更新这一区域不会更新表面的状态。