# Seats: 处理输入

向用户显示你的应用程序只是 I/O 方式中的一半，大多数应用程序还需要处理输入。为此，座位 (Seats) 为 Wayland 上的输入事件提供了一个抽象的概念。从哲学的角度上讲，一个 Wayland 座位是指用户作者操作电脑的一个座位，它与最多一个键盘和最多一个 “指针” 设备（即鼠标或触摸板）相关。类似的关系也被定义为触摸屏、数位板设备等。

重要的是要记住，这只是一个抽象概念，Wayland 显示屏上显示的座位情况可能与实际情况不完全一致。在实践中，Wayland 会话中很少有超过一个座位的情况。如果你在电脑上插入第二个键盘，它通常会被分配到与第一个键盘相同的座位上，当你开始在每个座位上打字的时候，键盘布局等都会动态地切换。这些是实施细节留给 Wayland 混成器去考虑吧。

从客户端的角度来看，这是很直接的。如果你绑定了全局的 `wl_seat`，那么你可以访问以下接口：

```xml
<interface name="wl_seat" version="7">
  <enum name="capability" bitfield="true">
    <entry name="pointer" value="1" />
    <entry name="keyboard" value="2" />
    <entry name="touch" value="4" />
  </enum>

  <event name="capabilities">
    <arg name="capabilities" type="uint" enum="capability" />
  </event>

  <event name="name" since="2">
    <arg name="name" type="string" />
  </event>

  <request name="get_pointer">
    <arg name="id" type="new_id" interface="wl_pointer" />
  </request>

  <request name="get_keyboard">
    <arg name="id" type="new_id" interface="wl_keyboard" />
  </request>

  <request name="get_touch">
    <arg name="id" type="new_id" interface="wl_touch" />
  </request>

  <request name="release" type="destructor" since="5" />
</interface>
```

**注意：** 这个接口已经更新了很多次——当你绑定到全局接口的时候要注意版本。本书假设你绑定的是最新的版本，在撰写本书的时候是第 7 版。

这个接口相对来说比较简单的。服务端向客户端发送一个能力事件，以表明本座位支持哪些类型的输入设备——用能力值 (capability values) 的位域表示——客户端可以相应地绑定到它希望能够使用的输入设备。例如，如果服务端发送的能力中 `(caps & WL_SEAT_CAPABILITY_KEYBOARD) > 0` 为真，那么客户端就可以使用 `get_keyboard` 请求来获取这个座位的 `wl_keyboard` 对象。每个特定输入设备的语义将在其余章节中介绍。

在我们讨论这些问题之前，让我们先谈一谈一些常见的语义。

## 事件序列

Wayland 客户端可能在执行某些操作的时候需要以序列的形式输入事件，以进行一些常用形式的身份验证。例如，一个打开弹窗的客户端（用右键调出的上下文菜单是弹出窗口的一种）可能希望在服务端 “抓取” 受影响座位上的所有输入事件，直到弹窗被取消。为了防止这个功能被滥用，服务端可以给它发送的每个输入事件分配序列，并要求客户端在请求中包括这些序列之一。

当服务端收到这样的请求时，它会查找与给定序列相关的输入事件，并作出判断。如果该事件发生的事件太长，或是在错误的表面，亦或是事件类型不正确——例如，当你摆动鼠标的时候，拒绝抓取，而当你点击的时候却要允许抓取——这样的请求服务端可以拒绝。

对于服务端而言，它们可以简单地在每个输入事件中发送一个递增的整数，并记录被认定为对特定使用情况有效的序列，以便以后验证。客户端从它们的输入事件处理程序中收到这些序列，并可以简单地将它们回传，以执行所需要的操作。

我们将在后面的章节中更详细地讨论这些问题，届时我们将开始涉及需要输入事件序列来验证的具体请求。

## 输入帧

由于现实原因，一个来自输入设备的单一输入事件可能会被分解成几个 Wayland 事件。例如，当你使用滚轮的时候，一个 `wl_pointer` 会发出一套轴事件，它会分别发出一个事件告诉你这是哪种轴：滚轮、手指在触摸板上、将滚轮倾斜到一边，等等。如果用户的输入动作足够快的话，来自输入源的同一个输入事件可能还包括鼠标的一些动作，或者点击一个按钮。

这些相关事件的语义分组在不同的输入类型中略有不同，但帧事件在它们之间通常是相通的。简而言之，如果你把从设备上采集到的所有输入事件都放入缓冲，然后等待帧事件发出信号，表示你已经受到了一个输入 “帧” 的所有事件，你就可以把缓冲区里的 Wayland 事件解释为一整个输入事件，然后重置缓冲区，开始收集下一帧的事件。

如果这听起来太过复杂，请不要担心。许多应用程序并不需要担心输入帧。只有当你开始做更复杂的输入事件处理的时候，才会想去关心这个。

## 释放设备

当你使用完一个设备后，每个接口都有一个释放请求，你可以用它们来清理，就像下面这样：

```xml
<request name="release" type="destructor" />
```

这已经足够简单了。