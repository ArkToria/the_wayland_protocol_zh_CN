# 弹出窗口

在设计有应用程序窗口的软件时，存在许多较小的辅助表面被用于各种目的。例如，右键显示的上下文菜单，从一系列选项中选择一个值的下拉菜单，当你鼠标悬停在 UI 元素上时显示的上下文提示，或者贴着窗口顶部和底部的弹出的菜单栏和工具栏。通常这些都是嵌套的窗口，例如按照 “文件 → 最近的文档 → 例子.odt” 这样的路径。

Wayland 环境下，XDG shell 提供了管理这些弹出式窗口的工具。我们在前面看到了 `xdg_surface` 的 `get_toplevel` 请求，用于创建顶层的应用程序窗口。在弹出式窗口的的情况下，使用 `get_popup` 请求代替。

```xml
<request name="get_popup">
  <arg name="id" type="new_id" interface="xdg_popup"/>
  <arg name="parent" type="object" interface="xdg_surface" allow-null="true"/>
  <arg name="positioner" type="object" interface="xdg_positioner"/>
</request>
```

第一个和第二个参数是不言而喻的，但第三个参数引入了一个新的概念：定位器。定位器的实现目的正如其名，是为了定位新的弹出式窗口。这是用来让混成器使用器特权信息参与弹出窗口的定位，例如避免弹出窗口延伸到显示器的边缘之外。我们将在第 10.4 章节中讨论定位器，现在你在没有进一步配置的情况下简单地创建一个定位器，并实现适当的 `xdg_wm_base` 请求。

```xml
<request name="create_positioner">
  <arg name="id" type="new_id" interface="xdg_positioner"/>
</request>
```

简而言之我们可以：

1. 创建一个新的 `wl_surface`
2. 为其分配一个 `xdg_surface`
3. 创建一个新的 `xdg_positioner` 定位器，并按 10.4 章节中那样保存它的配置
4. 从我们的 XDG 表面和定位器创建一个 `xdg_popup` 弹窗，将其父级分配给我们先前创建的 `xdg_toplevel` 顶层窗口

然后，我们可以通过先前讨论过的相同生命周期实现来渲染和附加缓冲区。我们还可以访问其他一些弹窗特有的功能。

## 配置

就像 XDG toplevel 顶层窗口的配置事件一样，它可以用来建议你弹出窗口的尺寸。然而，与 toplevel 不同的是，它还包括一个定位事件，用于通知客户端弹出窗口相对于其父表面的位置。

```xml
<event name="configure">
  <arg name="x" type="int"
 summary="x position relative to parent surface window geometry"/>
  <arg name="y" type="int"
 summary="y position relative to parent surface window geometry"/>
  <arg name="width" type="int" summary="window geometry width"/>
  <arg name="height" type="int" summary="window geometry height"/>
</event>
```

客户端可以通过 XDG 定位器来影响这些值，这也将在第 10.4 章节中讨论。

## 弹出式窗口输入抓取

弹出式界面通常希望能 “抓取” 所有的输入，例如允许用户使用方向键来选择不同的菜单项目。这可以通过抓取请求来实现。

```xml
<request name="grab">
  <arg name="seat" type="object" interface="wl_seat" />
  <arg name="serial" type="uint" />
</request>
```

响应这个请求的前提是接收到一个合格的输入事件，比如右键。这个输入事件的序列应该被用于该请求中。这些语义将在第 9 章中详细介绍。混成器可以在其后取消这个抓取，例如用户按了 escape 按键或者点击了弹出窗口之外的地方。

## 驳回弹窗 (Dismissal)

在这种情况下，混成器会驳回你的弹出窗口，例如按下 escape 键之后，会发送以下事件：

```xml
<event name="popup_done" />
```

为了避免发生竞争条件，混成器将弹出式窗口的结构体保留在内存中，即便弹出式窗口驳回后也会为它们的请求提供服务。关于对象的寿命和竞争条件的更多细节在第 2.4 章节中阐述过了。

## 销毁弹窗

客户端实现销毁弹窗是非常直截了当的：

```xml
<request name="destroy" type="destructor" />
```

然而，有一个细节值得一提：你必须自顶向下销毁弹出窗口。在任何时候，你唯一可以销毁的弹出窗口只能是最上层的那个。如果不这样做，你就会因为协议错误而被断开连接。