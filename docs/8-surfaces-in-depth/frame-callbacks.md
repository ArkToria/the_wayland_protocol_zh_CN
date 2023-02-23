# 帧回调

更新表面最简单的方法是：在需要改变时简单渲染和附加新的帧。这种方法很好用，例如，在事件驱动的应用中，用户按下了一个键，文本框需要重新渲染，那么你就可以立即开始重新渲染，将相应的区域标记为 “损坏”，并附加一个新的缓冲区，在下一帧中呈现。

然而，有些程序可能希望连续渲染帧率。你可能正在渲染视频游戏的帧、回放视频、或者渲染动画。你的显示器有一个固定的刷新率，或者说它能够显示更新的最快速度（通常是一个数字，如 60Hz、144Hz 等）。超出这个范围渲染帧的速度在快也没有意义，而且这样做会浪费资源——CPU、GPU、甚至是用户的电量。如果你在每次刷新间隔之内发送几个帧，那么除了最后一个帧以外，其它的都会被丢掉，而且是白白地浪费渲染。

此外，某些情况下，混成器甚至可能不想为你显示新的帧。比如你的应用程序可能已经离开屏幕、被最小化或者隐藏在其它窗口后面、或者只显示了你应用程序的小缩略图，所以混成器可能想以比较低的帧速率渲染你的应用，以节省资源。因此，在 Wayland 客户端中连续渲染帧的最好方法是让混成器告诉你什么时候它准备好接收新的帧：使用帧回调。

```xml
<interface name="wl_surface" version="4">
  <!-- ... -->

  <request name="frame">
    <arg name="callback" type="new_id" interface="wl_callback" />
  </request>

  <!-- ... -->
</interface>
```

这一请求将会分配一个 `wl_callback` 对象，它有一个相当简单的接口：

```xml
<interface name="wl_callback" version="1">
  <event name="done">
    <arg name="callback_data" type="uint" />
  </event>
</interface>
```

当你在一个表面上请求一个帧回调时，一旦这个表面的新帧准备好了，混成器会向回到对象发送一个完成事件。在帧事件的情况下，`callback_data` 被设置为从一个未指定的时期开始到当前时间，以毫秒为单位计算。你可以将其与上一帧进行比较，以计算动画的进度或对输入事件进行调整。 

有了帧回调这个工具，我们为什么不更新一下第 7.3 章节中的应用程序，让它每一帧都滚动一下呢？让我们先在我们的 `client_state` 结构体中添加一点状态：

```c
--- a/client.c
+++ b/client.c
@@ -71,6 +71,8 @@ struct client_state {
 	struct xdg_surface *xdg_surface;
 	struct xdg_toplevel *xdg_toplevel;
+	/* State */
+	float offset;
+	uint32_t last_frame;
 };
 
 static void wl_buffer_release(void *data, struct wl_buffer *wl_buffer) {
```

然后我们将更新我们的 `draw_frame` 函数以考虑偏移量。

```c
@@ -107,9 +109,10 @@ draw_frame(struct client_state *state)
 	close(fd);
 
 	/* Draw checkerboxed background */
+	int offset = (int)state->offset % 8;
 	for (int y = 0; y < height; ++y) {
 		for (int x = 0; x < width; ++x) {
-			if ((x + y / 8 * 8) % 16 < 8)
+			if (((x + offset) + (y + offset) / 8 * 8) % 16 < 8)
 				data[y * width + x] = 0xFF666666;
 			else
 				data[y * width + x] = 0xFFEEEEEE;
```

在主函数中，让我们为我们的第一个新帧注册一个回调。

```c
@@ -195,6 +230,9 @@ main(int argc, char *argv[])
 	xdg_toplevel_set_title(state.xdg_toplevel, "Example client");
 	wl_surface_commit(state.wl_surface);
 
+	struct wl_callback *cb = wl_surface_frame(state.wl_surface);
+	wl_callback_add_listener(cb, &wl_surface_frame_listener, &state);
+
 	while (wl_display_dispatch(state.wl_display)) {
 		/* This space deliberately left blank */
 	}
```

然后这样实现它：

```c
@@ -147,6 +150,38 @@ static const struct xdg_wm_base_listener xdg_wm_base_listener = {
 	.ping = xdg_wm_base_ping,
 };
 
+static const struct wl_callback_listener wl_surface_frame_listener;
+
+static void
+wl_surface_frame_done(void *data, struct wl_callback *cb, uint32_t time)
+{
+	/* Destroy this callback */
+	wl_callback_destroy(cb);
+
+	/* Request another frame */
+	struct client_state *state = data;
+	cb = wl_surface_frame(state->wl_surface);
+	wl_callback_add_listener(cb, &wl_surface_frame_listener, state);
+
+	/* Update scroll amount at 24 pixels per second */
+	if (state->last_frame != 0) {
+		int elapsed = time - state->last_frame;
+		state->offset += elapsed / 1000.0 * 24;
+	}
+
+	/* Submit a frame for this event */
+	struct wl_buffer *buffer = draw_frame(state);
+	wl_surface_attach(state->wl_surface, buffer, 0, 0);
+	wl_surface_damage_buffer(state->wl_surface, 0, 0, INT32_MAX, INT32_MAX);
+	wl_surface_commit(state->wl_surface);
+
+	state->last_frame = time;
+}
+
+static const struct wl_callback_listener wl_surface_frame_listener = {
+	.done = wl_surface_frame_done,
+};
+
 static void
 registry_global(void *data, struct wl_registry *wl_registry,
 		uint32_t name, const char *interface, uint32_t version)
```

现在，每一帧中，我们将：

1. 销毁现在使用的帧回调
2. 为下一帧请求一个新的回调
3. 渲染并提交新的帧

第三步细分为：

1. 用一个新的偏移量来更新，使用同上一帧一致的速度滚动。
2. 准备一个新的 `wl_buffer` 并为其渲染一帧。
3. 将新的 `wl_buffer` 附加到我们的表面。
4. 将整个表面标记为 “损坏”。
5. 提交表面。

步骤 3 和 4 更新表面的待定状态，为其赋予一个新的缓冲区，并表示整个表面状态已经改变。第 5 步提交这个待定状态，并在下一帧中使用它。原子化应用这个新的缓冲区意味着我们永远不会只显示最后帧的一半，从而产生一个更好的无撕裂体验。编译并运行更新后的客户端，亲身体验一下吧。

[^1]: 想要更准确的描述吗？在第 12.1 章中我们谈到了一个扩展协议，它能以纳秒级的分辨率告诉你每一帧画面是何时呈现给用户的。