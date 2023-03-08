# 接口与事件请求

Wayland 协议通过发出作用于对象的请求和事件来工作。
每个对象都有自己的接口，定义了可行的请求事件以及对应的签名。
让我们来考虑一个简单的示例接口：`wl_surface`

![wl_surface](wl_surface.png)

## Requests 请求

Surface 是可以在屏幕上显示的像素区域，
是我们构建应用程序之类窗口的基本元素之一。
它有个请求名为“damage”（损坏），客户端发送这个请求表示某个 surface 的某些部分发生了变化，需要重绘。
下面是 Wire 中的一个 damage 消息的注释示例（16 进制）：

```
0000000A    Object ID (10)
00180002    Message length (24) and request opcode (2)
00000000    X coordinate (int): 0
00000000    Y coordinate (int): 0
00000100    Width        (int): 256
00000100    Height       (int): 256
```

这是 session 会话的小片段：本次 surface 提前已分配，它的 ID 为 10。
当服务端收到这条消息后，服务端会查找 ID 为 10 的对象，发现它是一个 `wl_surface` 实例。
基于此，服务端用请求的 opcode 操作码 `2` 查找请求的签名。
然后就知道了接下来有四个整型作为参数，这样服务器就能解码这条消息，dispatch 分派内部处理。

## Events 事件

请求是从客户端发送到服务端，反之，服务端也可以给客户端广播消息，叫做“事件”。
例如，其中一个事件是 `wl_surface` 的 enter 事件，在 surface 被显示到指定的 output 时，服务端将发送该事件
（客户端可能会响应这一事件，比如为 HiDPI 高分屏调整缩放的比例因数）。
这样一条消息的示例如下：

```
0000000A    Object ID (10)
000C0000    Message length (12) and event opcode (0)
00000005    Output (object ID): 5
```

这条消息通过 ID 引用了另一对象：`wl_output`，surface 就先是在这对象上显示。
客户端收到该消息后，行为与服务端类似：查找 ID 为 10 的对象、将其与 `wl_surface` 接口关联、查找操作码 `0` 对应事件的签名。
它相应地解码其余信息（查找 ID 为 `5` 的 `wl_output`），然后分派内部处理。

## Interfaces 接口

接口定义了请求和事件的列表清单，操作码、签名与之一一对应，双方事先约定，就用可以解码消息。
欲知后事如何，且听下回分解。
