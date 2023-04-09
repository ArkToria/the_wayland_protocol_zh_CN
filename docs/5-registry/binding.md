# 绑定到全局

创建注册表对象后，服务端将为服务器上每个可用的全局对象发起全局事件。然后，您可以绑定到所需要的全局对象。

这个为已知对象分配 ID 的过程称为对象绑定。一旦客户端像这样绑定到注册表，服务器就会多次发起全局事件，以告知它支持的接口。每个全局对象都有一个独一无二的ID名称，这个ID名称是一个无符号整数。接口字符串映射到协议中找到的接口名称：在上面 XML 中的 `wl_display` 就是这样一个名称的示例。此外，版本号也在这里定义——关于接口版本的更多信息，请查看附录 C。

要绑定到任意一个接口时，我们需要使用绑定请求，其工作方式类似于我们绑定到 `wl_registry` 的神奇过程。例如，考虑下面的通信协议交换：

```
C->S    00000001 000C0001 00000002            .... .... ....

S->C    00000002 001C0000 00000001 00000007   .... .... .... ....
        776C5f73 686d0000 00000001            wl_s hm.. ....
        [...]

C->S    00000002 00100000 00000001 00000003   .... .... .... ....
```

第一个消息与我们已经剖析过的消息相同。第二个消息是来自服务端的事件：对象 2 （客户端在第一个消息中分配了 `wl_registry`）操作码 0（"global"），参数 1、`wl_shm` 和 1 分别是这个全局对象的名称、接口和版本。客户端通过调用对象ID 2（`wl_registry::bind`）的操作码 0 进行响应，并将对象 ID 3 分配给全局名称 1 ——即绑定到全局的 `wl_shm `。这个对象的未来事件和请求是由 `wl_shm` （shared memory support）协议定义，你可以在 `wayland.xml` (`/usr/share/wayland/wayland.xml`) 中找到。

一旦您创建了这个对象，你就可以利用其接口来完成各种任务——在 `wl_shm` 的例子中，管理客户端和服务端之间的共享内存。本书剩下的大部分内容都致力于解释这些全局对象的用法。

有了这些信息，我们就可以写出我们第一个有用的 Wayland 客户端：它可以简单地打印出服务端上所有可用的全局接口。

```c
#include <stdint.h>
#include <stdio.h>
#include <wayland-client.h>

static void
registry_handle_global(void *data, struct wl_registry *registry,
		uint32_t name, const char *interface, uint32_t version)
{
	printf("interface: '%s', version: %d, name: %d\n",
			interface, version, name);
}

static void
registry_handle_global_remove(void *data, struct wl_registry *registry,
		uint32_t name)
{
	// This space deliberately left blank
}

static const struct wl_registry_listener
registry_listener = {
	.global = registry_handle_global,
	.global_remove = registry_handle_global_remove,
};

int
main(int argc, char *argv[])
{
	struct wl_display *display = wl_display_connect(NULL);
	struct wl_registry *registry = wl_display_get_registry(display);
	wl_registry_add_listener(registry, &registry_listener, NULL);
	wl_display_roundtrip(display);
	return 0;
}
```

请参考之前的章节来解释这个程序。我们连接到显示器（4.1 章），获得注册表（本章），然后给它添加一个监听器（3.4 章），最后打印这个混成器上可用的全局接口来处理全局事件。自己试试吧。

```bash
$ cc -o globals -lwayland-client globals.c
```

执行程序后输出结果如下：

```
interface: 'wl_shm', version: 1, name: 1
interface: 'wl_drm', version: 2, name: 2
interface: 'zwp_linux_dmabuf_v1', version: 3, name: 3
...
```

注意：本章是我们最后一次展示线程协议输出到十六进制，可能也是你最后一次在文中看到它们总体的情况。追踪你的 Wayland 客户端或服务端的一个更好的方法是，在运行你的程序之前，将环境中的 `WAYLAND_DEBUG` 变量设为 1。现在就用 `globals` 程序试试吧!

```
[4144282.115]  -> wl_display@1.get_registry(new id wl_registry@2)
[4144282.149]  -> wl_display@1.sync(new id wl_callback@3)
[4144282.551] wl_display@1.delete_id(3)
[4144282.575] wl_registry@2.global(1, "wl_shm", 1)
interface: 'wl_shm', version: 1, name: 1
[4144282.605] wl_registry@2.global(2, "wl_drm", 2)
interface: 'wl_drm', version: 2, name: 2
[4144282.625] wl_registry@2.global(3, "zwp_linux_dmabuf_v1", 3)
interface: 'zwp_linux_dmabuf_v1', version: 3, name: 3
[4144282.644] wl_registry@2.global(4, "wl_compositor", 4)
interface: 'wl_compositor', version: 4, name: 4
[4144282.661] wl_registry@2.global(5, "wl_subcompositor", 1)
interface: 'wl_subcompositor', version: 1, name: 5
[4144282.678] wl_registry@2.global(6, "wl_data_device_manager", 3)
interface: 'wl_data_device_manager', version: 3, name: 6
[4144282.696] wl_registry@2.global(7, "zwlr_gamma_control_manager_v1", 1)
interface: 'zwlr_gamma_control_manager_v1', version: 1, name: 7
[4144282.719] wl_registry@2.global(8, "zxdg_output_manager_v1", 3)
interface: 'zxdg_output_manager_v1', version: 3, name: 8
[4144282.738] wl_registry@2.global(9, "org_kde_kwin_idle", 1)
interface: 'org_kde_kwin_idle', version: 1, name: 9
[4144282.759] wl_registry@2.global(10, "zwp_idle_inhibit_manager_v1", 1)
interface: 'zwp_idle_inhibit_manager_v1', version: 1, name: 10
[4144282.775] wl_registry@2.global(11, "zwlr_layer_shell_v1", 4)
interface: 'zwlr_layer_shell_v1', version: 4, name: 11
[4144282.793] wl_registry@2.global(12, "xdg_wm_base", 2)
interface: 'xdg_wm_base', version: 2, name: 12
[4144282.810] wl_registry@2.global(13, "zwp_tablet_manager_v2", 1)
interface: 'zwp_tablet_manager_v2', version: 1, name: 13
[4144282.828] wl_registry@2.global(14, "org_kde_kwin_server_decoration_manager", 1)
interface: 'org_kde_kwin_server_decoration_manager', version: 1, name: 14
[4144282.843] wl_registry@2.global(15, "zxdg_decoration_manager_v1", 1)
interface: 'zxdg_decoration_manager_v1', version: 1, name: 15
[4144282.872] wl_registry@2.global(16, "zwp_relative_pointer_manager_v1", 1)
interface: 'zwp_relative_pointer_manager_v1', version: 1, name: 16
[4144282.890] wl_registry@2.global(17, "zwp_pointer_constraints_v1", 1)
interface: 'zwp_pointer_constraints_v1', version: 1, name: 17
[4144282.905] wl_registry@2.global(18, "wp_presentation", 1)
interface: 'wp_presentation', version: 1, name: 18
[4144282.924] wl_registry@2.global(19, "zwlr_output_manager_v1", 2)
interface: 'zwlr_output_manager_v1', version: 2, name: 19
[4144282.942] wl_registry@2.global(20, "zwlr_output_power_manager_v1", 1)
interface: 'zwlr_output_power_manager_v1', version: 1, name: 20
[4144282.962] wl_registry@2.global(21, "zwp_input_method_manager_v2", 1)
interface: 'zwp_input_method_manager_v2', version: 1, name: 21
[4144282.978] wl_registry@2.global(22, "zwp_text_input_manager_v3", 1)
interface: 'zwp_text_input_manager_v3', version: 1, name: 22
[4144282.995] wl_registry@2.global(23, "zwlr_foreign_toplevel_manager_v1", 3)
interface: 'zwlr_foreign_toplevel_manager_v1', version: 3, name: 23
[4144283.012] wl_registry@2.global(24, "zwlr_export_dmabuf_manager_v1", 1)
interface: 'zwlr_export_dmabuf_manager_v1', version: 1, name: 24
[4144283.029] wl_registry@2.global(25, "zwlr_screencopy_manager_v1", 3)
interface: 'zwlr_screencopy_manager_v1', version: 3, name: 25
[4144283.044] wl_registry@2.global(26, "zwlr_data_control_manager_v1", 2)
interface: 'zwlr_data_control_manager_v1', version: 2, name: 26
[4144283.060] wl_registry@2.global(27, "zwp_primary_selection_device_manager_v1", 1)
interface: 'zwp_primary_selection_device_manager_v1', version: 1, name: 27
[4144283.078] wl_registry@2.global(28, "wp_viewporter", 1)
interface: 'wp_viewporter', version: 1, name: 28
[4144283.102] wl_registry@2.global(29, "zxdg_exporter_v1", 1)
interface: 'zxdg_exporter_v1', version: 1, name: 29
[4144283.119] wl_registry@2.global(30, "zxdg_importer_v1", 1)
interface: 'zxdg_importer_v1', version: 1, name: 30
[4144283.137] wl_registry@2.global(31, "zxdg_exporter_v2", 1)
interface: 'zxdg_exporter_v2', version: 1, name: 31
[4144283.161] wl_registry@2.global(32, "zxdg_importer_v2", 1)
interface: 'zxdg_importer_v2', version: 1, name: 32
[4144283.177] wl_registry@2.global(33, "zwp_virtual_keyboard_manager_v1", 1)
interface: 'zwp_virtual_keyboard_manager_v1', version: 1, name: 33
[4144283.196] wl_registry@2.global(34, "zwlr_virtual_pointer_manager_v1", 2)
interface: 'zwlr_virtual_pointer_manager_v1', version: 2, name: 34
[4144283.212] wl_registry@2.global(35, "zwlr_input_inhibit_manager_v1", 1)
interface: 'zwlr_input_inhibit_manager_v1', version: 1, name: 35
[4144283.229] wl_registry@2.global(36, "zwp_keyboard_shortcuts_inhibit_manager_v1", 1)
interface: 'zwp_keyboard_shortcuts_inhibit_manager_v1', version: 1, name: 36
[4144283.250] wl_registry@2.global(37, "wl_seat", 7)
interface: 'wl_seat', version: 7, name: 37
[4144283.274] wl_registry@2.global(38, "zwp_pointer_gestures_v1", 1)
interface: 'zwp_pointer_gestures_v1', version: 1, name: 38
[4144283.296] wl_registry@2.global(39, "wl_output", 3)
interface: 'wl_output', version: 3, name: 39
[4144283.317] wl_callback@3.done(56994)
```


这里展示 `wayland.xml` 协议内的具体定义，可以参考其事件及参数配置如下，可以看到 `void *data` 和 `struct wl_registry *registry` 两个参数是固定的，其余参数由文件中的 `<arg ... />` 定义。

```xml
 146   │     <event name="global">
 147   │       <description summary="announce global object">
 148   │     Notify the client of global objects.
 149   │
 150   │     The event notifies the client that a global object with
 151   │     the given name is now available, and it implements the
 152   │     given version of the given interface.
 153   │       </description>
 154   │       <arg name="name" type="uint" summary="numeric name of the global object"/>
 155   │       <arg name="interface" type="string" summary="interface implemented by the object"/>
 156   │       <arg name="version" type="uint" summary="interface version"/>
 157   │     </event>
 158   │
 159   │     <event name="global_remove">
 160   │       <description summary="announce removal of global object">
 161   │     Notify the client of removed global objects.
 162   │
 163   │     This event notifies the client that the global identified
 164   │     by name is no longer available.  If the client bound to
 165   │     the global using the bind request, the client should now
 166   │     destroy that object.
 167   │
 168   │     The object remains valid and requests to the object will be
 169   │     ignored until the client destroys it, to avoid races between
 170   │     the global going away and a client sending a request to it.
 171   │       </description>
 172   │       <arg name="name" type="uint" summary="numeric name of the global object"/>
 173   │     </event>
```