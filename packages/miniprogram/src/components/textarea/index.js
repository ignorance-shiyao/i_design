Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: String, value: '' },
    placeholder: { type: String, value: '' },
    rows: { type: Number, value: 3 },
    maxlength: { type: Number, value: -1 },
    disabled: { type: Boolean, value: false },
    invalid: { type: Boolean, value: false },
    showCount: { type: Boolean, value: false }
  },
  data: { overLimit: false },
  observers: {
    'value, maxlength': function (value, maxlength) {
      this.setData({ overLimit: maxlength > 0 && value.length > maxlength })
    }
  },
  methods: {
    onInput(e) {
      this.triggerEvent('change', { value: e.detail.value })
    }
  }
})
