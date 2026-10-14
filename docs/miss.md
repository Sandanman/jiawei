
缺失/可完善的功能

  P0 关键缺失

  1. 房主无法移除管理员 — removeMember 仅 owner 可操作，但代码只检查 target.role === 'owner'
   不可移除，未禁止 owner 移除 admin（建议补充：owner 可移除 admin，admin 不可移除 admin） ✅
  2. 家庭内积分余额展示不一致 — getUserFamilies 返回 points: 0 占位，前端 getCurrentPoints
  取的是 user.points，但订单扣减的是 user.points，多家庭场景下积分未按家庭隔离
  3. 订单无管理端确认/完成入口 — 前端 orders/index.vue
  只看到下单者取消按钮，未见管理员确认/完成订单的 UI 操作 ✅

  P1 推荐完善

  4. 任务无"暂停/恢复"前端入口 — 后端有 pauseTask/publishTask，前端 tasks 页面未暴露
  5. 菜品缺分类管理 — 分类是硬编码字符串，无后台分类维护
  6. 订单无法删除历史 — cancelled 订单永久保留，建议支持清理或自动归档
  7. 积分流水无筛选 — 前端只按 userId 拉取，未按 type 筛选（后端已支持）
  8. 任务指派支持"全员" — 当前必须选具体成员，建议支持"任意成员可接"
  9. 个人中心无积分流水 — profile/index 未展示本人积分变动历史
  10. 注册后自动登录 — 当前注册成功需返回登录页手动登录，可优化为直接登录

  P2 体验优化

  11. 订单详情用弹窗 — 复杂订单信息塞在 showModal 里体验差，建议独立详情页
  12. 菜品图片上传 — 当前 imageUrl 需手填，建议接入上传
  13. 任务重复/模板 — 每日重复任务需手动建，建议支持模板
  14. 缺家庭切换提示 — 多家庭用户切换后页面数据刷新依赖 onShow，无主动提示