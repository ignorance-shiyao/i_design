/**
 * AvatarGroup —— 重叠排列，超出 max 的部分折成 +N。
 *
 * 与 Web 端一样只负责容器与折叠数字，头像本身由使用方以 i-avatar 填进插槽，
 * 因此圆形/方形、图片/文字这些选择不必在这里再开一遍属性。
 */
import { avatarSizePx } from '@i-design/common'

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    max: { type: Number, value: 0 },
    size: { type: null, value: 'md' },
    total: { type: Number, value: 0 }
  },
  data: { more: 0, chip: 32 },
  observers: {
    'max, total': function (max, total) {
      this.setData({ more: max > 0 && total > max ? total - max : 0 })
    },
    // 「+N」圆点要和旁边的头像一样大，尺寸档位与头像共用公共层那一份
    size: function (size) {
      this.setData({ chip: avatarSizePx(size) })
    }
  }
})
