# 配置和生命周期

先前，按我们的选择创建了一个固定尺寸的窗口：640x480。然而，混成器往往会对我们的窗口应假设什么样的尺寸有意见，而我们可能也想传达自己的偏好尺寸。未能这样做往往会导致非预期行为，比如你窗口的一部分被混成器裁切掉，而混成器试图告诉你让你的表面尺寸缩小。

混成器可以为应用程序提供额外的线索，了解其显示的上下文。它可以让你知道应用是否正处于最大化或者全屏状态，亦或其窗口边的一个或多个边缘正与其他窗口或显示器的边缘平铺、正处于焦点还是后台空闲状态，等等。由于 `wl_surface` 是用来在客户端和服务端之间原子化交流表面的变化，`xdg_surface` 提供接口提供了一下两个消息，供混成器建议一些变化和客户端确认：

```xml
<request name="ack_configure">
  <arg name="serial" type="uint" />
</request>

<event name="configure">
  <arg name="serial" type="uint" />
</event>
```

就它们本身而言，这些消息只能携带很小的信息量。然而，`xdg_surface` 的每个子类 (`xdg_toplevel` 和 `xdg_popup`) 都有额外的事件，服务端可以在 "configure" 配置事件之前发送，以提出到目前为止所提到的各种建议。服务端将发送这些状态，如最大化、焦点、尺寸建议等，然后用 `serial` 来配置事件。当客户端的状态与这些建议一致的时候，它将嘎送一个带有相同序列的 `ack_configure` 请求来表明这一点。在下次提交到相关的 `wl_surface` 时，混成器将认为该状态是一致的。

## XDG 顶层窗口的生命周期

我们第 7 章的示例代码虽然可以工作，但它不是桌面的最佳范式。它并没有假定混成器推荐的尺寸，而且如果用户试图关闭窗口，它也不会消失。若要响应这些由混成器提供的事件，这里涉及到两个 Wayland `事件：configure` 和 `close` 即配置和关闭。

```xml
<event name="configure">
  <arg name="width" type="int"/>
  <arg name="height" type="int"/>
  <arg name="states" type="array"/>
</event>

<event name="close" />
```

这里的宽度 `width` 和高度 `height` 是混成器为窗口推荐的首选尺寸[^1]，而状态 `states` 则是由以下数值构成的数组:

```xml
<enum name="state">
  <entry name="maximized" />
  <entry name="fullscreen" />
  <entry name="resizing" />
  <entry name="activated" />
  <entry name="tiled_left" />
  <entry name="tiled_right" />
  <entry name="tiled_top" />
  <entry name="tiled_bottom" />
</enum>
```

关闭事件有时可以被忽略，一个典型的原因是向用户显示一个确认对话框，以保存他们还未保存的工作。我们可以很轻松地更新第 7 章中的示例代码，以支持这些事件。

```diff
diff --git a/client.c b/client.c
--- a/client.c
+++ b/client.c
@@ -70,9 +70,10 @@ struct client_state {
 	struct xdg_surface *xdg_surface;
 	struct xdg_toplevel *xdg_toplevel;
 	/* State */
-	bool closed;
 	float offset;
 	uint32_t last_frame;
+	int width, height;
+	bool closed;
 };
 
 static void wl_buffer_release(void *data, struct wl_buffer *wl_buffer) {
@@ -86,7 +87,7 @@ static const struct wl_buffer_listener wl_buffer_listener = {
 static struct wl_buffer *
 draw_frame(struct client_state *state)
 {
-	const int width = 640, height = 480;
+	int width = state->width, height = state->height;
 	int stride = width * 4;
 	int size = stride * height;
 
@@ -124,6 +125,32 @@ draw_frame(struct client_state *state)
 	return buffer;
 }
 
+static void
+xdg_toplevel_configure(void *data,
+		struct xdg_toplevel *xdg_toplevel, int32_t width, int32_t height,
+		struct wl_array *states)
+{
+	struct client_state *state = data;
+	if (width == 0 || height == 0) {
+		/* Compositor is deferring to us */
+		return;
+	}
+	state->width = width;
+	state->height = height;
+}
+
+static void
+xdg_toplevel_close(void *data, struct xdg_toplevel *toplevel)
+{
+	struct client_state *state = data;
+	state->closed = true;
+}
+
+static const struct xdg_toplevel_listener xdg_toplevel_listener = {
+	.configure = xdg_toplevel_configure,
+	.close = xdg_toplevel_close,
+};
+
 static void
 xdg_surface_configure(void *data,
 		struct xdg_surface *xdg_surface, uint32_t serial)
@@ -163,7 +190,7 @@ wl_surface_frame_done(void *data, struct wl_callback *cb, uint32_t time)
 	cb = wl_surface_frame(state->wl_surface);
 	wl_callback_add_listener(cb, &wl_surface_frame_listener, state);
 
-	/* Update scroll amount at 8 pixels per second */
+	/* Update scroll amount at 24 pixels per second */
 	if (state->last_frame != 0) {
 		int elapsed = time - state->last_frame;
 		state->offset += elapsed / 1000.0 * 24;
@@ -217,6 +244,8 @@ int
 main(int argc, char *argv[])
 {
 	struct client_state state = { 0 };
+	state.width = 640;
+	state.height = 480;
 	state.wl_display = wl_display_connect(NULL);
 	state.wl_registry = wl_display_get_registry(state.wl_display);
 	wl_registry_add_listener(state.wl_registry, &wl_registry_listener, &state);
@@ -227,6 +256,8 @@ main(int argc, char *argv[])
 			state.xdg_wm_base, state.wl_surface);
 	xdg_surface_add_listener(state.xdg_surface, &xdg_surface_listener, &state);
 	state.xdg_toplevel = xdg_surface_get_toplevel(state.xdg_surface);
+	xdg_toplevel_add_listener(state.xdg_toplevel,
+			&xdg_toplevel_listener, &state);
 	xdg_toplevel_set_title(state.xdg_toplevel, "Example client");
 	wl_surface_commit(state.wl_surface);
```

如果你再次编译并运行这个客户端，你会注意到它的行为表现得比之前更加完善了。

## 请求改变状态

客户端也可以向混成器请求将自己置入这些状态中（最大、最小化等等），或者对窗口的大小进行限制。

```xml
<request name="set_max_size">
  <arg name="width" type="int"/>
  <arg name="height" type="int"/>
</request>

<request name="set_min_size">
  <arg name="width" type="int"/>
  <arg name="height" type="int"/>
</request>

<request name="set_maximized" />

<request name="unset_maximized" />

<request name="set_fullscreen" />
  <arg name="output"
    type="object"
    interface="wl_output"
    allow-null="true"/>
</request>

<request name="unset_fullscreen" />

<request name="set_minimized" />
```

混成器通过发送一个相应的 `configure` 配置事件来表明它对这些请求的确认。

[^1]: 这考虑到了客户端 `set_window_geometry` 请求所发送的窗口的几何形状。建议的尺寸仅包括窗口几何形状所代表的空间（即外接矩形）。