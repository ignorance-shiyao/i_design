/**
 * SchemaForm —— 按 schema 渲染的表单（astra.md 的 B08）。
 *
 * 显隐、校验、服务端错误落位全部走公共层的 logic/schemaform，与 Web 端同一份：
 * 各端各写一遍的话，同一份 schema 在小程序上会比在 Web 上多显示一个字段，
 * 而这种差异没有任何检查拦得住。
 *
 * schema 里不执行任何字符串——小程序尤其不能 eval（那既是安全问题，
 * 也在真机上根本不被允许）。
 */
import {
  applyServerErrors,
  submitValues,
  validateSchema,
  visibleFields
} from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    schema: { type: Object, value: null },
    value: { type: Object, value: null },
    serverErrors: { type: Array, value: [] },
    submitText: { type: String, value: '提交' },
    disabled: { type: Boolean, value: false }
  },
  data: { fields: [], formErrors: [], touched: false },
  observers: {
    'schema, value, serverErrors': function () {
      this.refresh()
    }
  },
  lifetimes: {
    attached() { this.refresh() }
  },
  methods: {
    schemaOf() { return this.data.schema || { fields: [] } },
    valuesOf() { return this.data.value || {} },

    errors() {
      const schema = this.schemaOf()
      const sync = this.data.touched ? validateSchema(schema, this.valuesOf()) : []
      return sync.concat(applyServerErrors(schema, this.data.serverErrors || []))
    },

    refresh() {
      const schema = this.schemaOf()
      const values = this.valuesOf()
      const errors = this.errors()
      const errorOf = (path) => {
        const hit = errors.find((e) => e.path === path)
        return hit ? hit.message : ''
      }
      // wxml 里做不了类型分支，所以把「该渲染成什么」摊平到字段上
      const fields = visibleFields(schema, values).map((field) => ({
        name: field.name,
        label: field.label,
        placeholder: field.placeholder || '',
        help: field.help || '',
        required: (field.rules || []).some((r) => r.kind === 'required'),
        error: errorOf(field.name),
        isText: field.kind === 'text' || field.kind === 'date',
        isTextarea: field.kind === 'textarea',
        isNumber: field.kind === 'number',
        isSwitch: field.kind === 'switch',
        isSelect: field.kind === 'select',
        isArray: field.kind === 'array',
        options: field.options || [],
        text: values[field.name] === undefined || values[field.name] === null ? '' : String(values[field.name]),
        on: !!values[field.name],
        rows: field.kind === 'array'
          ? (Array.isArray(values[field.name]) ? values[field.name] : []).map((row, index) => ({
              index,
              cells: (field.item || []).map((sub) => ({
                name: sub.name,
                label: sub.label,
                value: row[sub.name] === undefined || row[sub.name] === null ? '' : String(row[sub.name]),
                error: errorOf(`${field.name}[${index}].${sub.name}`)
              }))
            }))
          : []
      }))
      // 对不上字段的服务端错误显示在表单级，而不是丢掉
      this.setData({ fields, formErrors: errors.filter((e) => e.orphan) })
    },

    emit(values) {
      this.triggerEvent('change', { values })
    },

    onInput(e) {
      const { name } = e.currentTarget.dataset
      const next = Object.assign({}, this.valuesOf())
      next[name] = e.detail.value
      this.emit(next)
    },

    onSwitch(e) {
      const { name } = e.currentTarget.dataset
      const next = Object.assign({}, this.valuesOf())
      next[name] = e.detail.value
      this.emit(next)
    },

    onSelect(e) {
      const { name, options } = e.currentTarget.dataset
      const picked = options[e.detail.value]
      const next = Object.assign({}, this.valuesOf())
      next[name] = picked ? picked.value : ''
      this.emit(next)
    },

    onCell(e) {
      const { name, index, key } = e.currentTarget.dataset
      const values = this.valuesOf()
      const rows = (Array.isArray(values[name]) ? values[name] : []).map((row, i) =>
        i === index ? Object.assign({}, row, { [key]: e.detail.value }) : row
      )
      const next = Object.assign({}, values)
      next[name] = rows
      this.emit(next)
    },

    onAddRow(e) {
      const { name } = e.currentTarget.dataset
      const values = this.valuesOf()
      const rows = (Array.isArray(values[name]) ? values[name] : []).concat([{}])
      this.emit(Object.assign({}, values, { [name]: rows }))
    },

    onRemoveRow(e) {
      const { name, index } = e.currentTarget.dataset
      const values = this.valuesOf()
      const rows = (Array.isArray(values[name]) ? values[name] : []).filter((_, i) => i !== index)
      this.emit(Object.assign({}, values, { [name]: rows }))
    },

    onSubmit() {
      this.setData({ touched: true }, () => {
        this.refresh()
        const schema = this.schemaOf()
        const sync = validateSchema(schema, this.valuesOf())
        if (sync.length) {
          this.triggerEvent('invalid', { errors: sync })
          return
        }
        // 隐藏字段的值不参与提交：改回「个人」之后税号跟着发上去，服务端会存下脏数据
        this.triggerEvent('submit', { values: submitValues(schema, this.valuesOf()) })
      })
    }
  }
})
