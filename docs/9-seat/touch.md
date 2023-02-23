# 触控输入

在表面上，触摸屏输入是相当简单的，你的实现也可也非常简单。然而，该协议为你提供了很多深度 (depth)，应用程序可以利用这些深度来提供更细致的触摸驱动手势和反馈。

大多数触摸屏设备都支持多点触控：它们可以跟踪屏幕被触摸的多个位置。这些 “触摸点” 中的每一个都被分配了一个 ID，这个 ID 在当前所有触摸屏的活动点中是唯一的，但如果你抬起手指再按一次，ID 就可能被重复使用[^1]。

与其它输入设备类似，你可以用 `wl_sear.get_touch` 获得一个 `wl_touch` 资源，当你用完它时，你应该发送一个 "release" 请求来释放资源。

## 触控帧

就像光标指针一样，服务端上的一帧触控处理也可能带有许多变化的信息，但服务端会将这些信息作为离散的 Wayland 事件来发送。`wl_touch.frame` 事件是用来将这些事件组合到一起的。

```xml
<event name="frame"></event>
```

客户端应该累积所有收到的 `wl_touch` 事件，然后在收到 "frame" 事件时将待处理的输入作为一个单一的触控事件进行处理。

## 触摸和释放

我们要看的第一个事件是 "down" 和 "up"，当你把手指按在设备上，以及把手指从设备上移开的时候，这两个事件分别被触发。

```xml
<event name="down">
  <arg name="serial" type="uint" />
  <arg name="time" type="uint" />
  <arg name="surface" type="object" interface="wl_surface" />
  <arg name="id" type="int" />
  <arg name="x" type="fixed" />
  <arg name="y" type="fixed" />
</event>

<event name="up">
  <arg name="serial" type="uint" />
  <arg name="time" type="uint" />
  <arg name="id" type="int" />
</event>
```

"x" 和 "y" 坐标是触摸表面所处坐标空间中的定点坐标，在 "surface" 参数中给出。"time" 是一个单调递增的时间戳，具有任意的 epoch，并以毫秒为单位[^2]。还请注意这里包含了一个序列 "serial"，它可以包含在未来与此输入事件相关联的请求中。

## 运动

在你收到某个特定 ID 触点的 "down" 事件后，你将会开始接收到运动事件，描述该触摸点在设备上的移动。

```xml
<event name="motion">
  <arg name="time" type="uint" />
  <arg name="id" type="int" />
  <arg name="x" type="fixed" />
  <arg name="y" type="fixed" />
</event>
```

这里的 "x" 和 "y" 坐标是发送 "enter" 事件表面的相对空间坐标。

## 手势结束

触摸事件在被识别为手势之前，往往必须满足一些阈值。例如，从左到右轻扫屏幕可以被 Wayland 混成器用来在不同的应用程序之间切换。然而，直到越过某些阈值：例如，在一定时间内到达屏幕的中点，混成器才会将这种行为识别为手势。

到达这个阈值之前，混成器都为被触摸的表面发送正常的触摸事件。一旦手势被识别，混成器将发送一个 "cancel" 事件，让你直到混成器正在接管。

```xml
<event name="cancel"></event>
```

当你受到这个事件后，所有活动的触点都被取消了。

## 形状和方式

一些高端的触摸硬件能够确定更多用户交互方式信息。对于希望采用更高级的交互或触摸反馈的有合适硬件和应用的用户，提供了 "shape" 和 "orientation" 事件。

```xml
<event name="shape" since="6">
  <arg name="id" type="int" />
  <arg name="major" type="fixed" />
  <arg name="minor" type="fixed" />
</event>

<event name="orientation" since="6">
  <arg name="id" type="int" />
  <arg name="orientation" type="fixed" />
</event>
```

"shape" 事件定义了一个椭圆值来近似触屏物体的形状，其长轴和短轴在被接触表面坐标空间中的单元表示。方向事件通过指定触摸表面的长轴和 Y 轴之间的夹角来旋转该椭圆。

---

触摸是 Wayland 协议所支持的最后一种输入设备。有了这些知识，让我们来更新我们的示例代码。


[^1]: 强调 “可能” ——不要根据重复使用的一个触点 ID 而作出任何假设。
[^2]: 这意味着独立的时间戳可以相互比较，以获得事持续的事件，但不能与壁钟时间 (Wall-Clock Time，即执行时间) 相较。