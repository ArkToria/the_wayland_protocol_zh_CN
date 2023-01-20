# 代理与资源

对象是客户端和服务端都知道的具有某种状态的实体，通过线协议协商来对其进行更改。在客户端，`libwayland` 通过 `wl_proxy` 接口引用这些对象。这些接口是对 C 语言友好的，是抽象对象的具体“代理”，并为客户端提供了间接函数，以将请求编组转化为线协议格式。如果你查看 `wayland-client.core.h` 文件，会发现一些实现该目的的底层函数。而通常你不会直接使用它们。

```c
// /usr/include/wayland-client-core.h
// ...
void wl_proxy_marshal(struct wl_proxy *p, uint32_t opcode, ...);

struct wl_proxy * wl_proxy_create(struct wl_proxy *factory, const struct wl_interface *interface);
// ...
```

在服务端，对象是通过 `wl_resource` 抽象的，这与客户端非常相似，但另有更复杂的内容——服务端必须跟踪哪个对象属于哪个客户端。每个 `wl_resource` 均由单个客户端所有。除此之外，该这两个接口基本相同，并且为编组事件发送到关联的客户端提供了底层的抽象。与直接在客户端上使用 `wl_proxy` 相比，直接在服务端上使用 `wl_resource` 的频率更高。这种用法的一个例子是获取对 `wl_client` 的引用，该 `wl_client` 拥有你所在上下文之外的操作资源，或者在客户端尝试无效操作的时候发送协议错误。

此外还有另一组高级接口，大多数 Wayland 客户端和服务端的代码都与之交互以完成其大部分任务。