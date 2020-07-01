import { observable, action } from 'mobx'
import { boundMethod } from 'autobind-decorator'

interface FormFieldSpec<T> {
	defaultValue: T
	name: string
	required?: boolean
	missing?: string
	isEmpty?: (v: T) => boolean
}

export class FormField<T> {
	spec: FormFieldSpec<T>
	@observable value: T
	@observable error?: string

	constructor(spec: FormFieldSpec<T>) {
		this.spec = spec
		this.value = spec.defaultValue
	}

	@boundMethod
	change(value: T) {
		this.value = value
	}

	@boundMethod
	@action
	fresh() {
		this.error = undefined
	}

	@boundMethod
	@action
	validate(): boolean {
		if (this.spec.required && (this.spec.isEmpty ? this.spec.isEmpty(this.value) : !this.value)) {
			this.error = this.spec.missing || `Field "${this.spec.name}" value is required`
			return false
		} else {
			return true
		}
	}
}

export class PasswordField extends FormField<string> {
	@observable isVisible = false

	constructor() {
		super({
			name: 'password',
			defaultValue: '',
			isEmpty: v => !v,
			required: true,
			missing: 'Password is required',
		})
	}

	@boundMethod
	@action
	toggle() {
		this.isVisible = !this.isVisible
	}
}
