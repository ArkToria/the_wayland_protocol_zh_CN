# 损坏表面

你可能已经注意到，在上一个例子中，当我们向表面提交一个新的帧的时候，在代码中添加了这样一行：

```c
wl_surface_damage_buffer(state->wl_surface, 0, 0, INT32_MAX, INT32_MAX);
```

如果是这样的话，请擦亮眼睛！这段代码损坏了我们的表面，向混成器表明其需要重新被绘制。在这里，我们损坏了整个表面（甚至远远超过其范围），但我们也可以只损坏其中的一部分。

例如，你写了一个 GUI 工具，用户正在向一个文本框中输入信息。这个文本框可能只占窗口的一小部分，而每个新的字符所占的部分就更小了。当用户按下一个按键，你可以只渲染文本上的新字符，然后只标记表面的那一部分即可。然后，混成器可以只复制表面的一小部分，这可以大大加快速度——特别是对于嵌入式设备。当光标在字符之间闪烁的时候，你仅需要提交更新部分的损坏，而当用户改变视图的时候，才可能会损坏整个表面。这样，每项改动的开销都减少了，并且用户会感谢你提高了他们的电池寿命。

**注意：** Wayland 协议为破坏表面提供了两个请求 `damage` 和 `damage_buffer`。前者实际上已经弃用了，你应该只使用后者。二者的区别在于，`damage` 考虑到了影响曲面的所有变换，比如旋转、缩放比例、缓冲区位置和剪切。后者则是相对于缓冲区标记损坏，这样更容易解释。