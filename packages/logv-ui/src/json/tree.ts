import { computed, observable, action } from 'mobx'

type Json = any

export enum JsonType {
	String,
	Number,
	Boolean,
	Null,
	Array,
	Object,
}

export class JsonTree {
	parent?: JsonTree
	children?: JsonTree[]

	type?: JsonType
	key?: string | number
	value: Json

	@observable expanded = true

	constructor(value: Json, key?: string | number, parent?: JsonTree) {
		this.value = value
		this.key = key
		this.parent = parent

		if (!parent) {
			this.expanded = true
		}

		if (value == null) {
			this.type = JsonType.Null
		} else {
			switch (typeof value) {
				case 'string':
					this.type = JsonType.String
					break
				case 'number':
					this.type = JsonType.Number
					break
				case 'boolean':
					this.type = JsonType.Boolean
					break
				default:
					if (Array.isArray(value)) {
						this.type == JsonType.Array
						this.children = value.map((value, key) => {
							return new JsonTree(value, key, this)
						})
					} else {
						this.type = JsonType.Object
						this.children = Object.entries(value).map(([key, value]) => {
							return new JsonTree(value, key, this)
						})
					}
			}
		}
	}

	@computed
	get flatChildren(): JsonTree[] {
		let items = [] as JsonTree[]
		if (this.children && this.expanded) {
			for (const child of this.children) {
				items.push(child)
				if (child.expanded) {
					items.push(...child.flatChildren)
				}
			}
		}
		return items
	}

	@computed
	get depth(): number {
		if (this.parent) {
			return this.parent.depth + 1
		} else {
			return 0
		}
	}

	@action
	expand() {
		this.expanded = !this.expanded
	}
}
