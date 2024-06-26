import { localeFromElement } from './utils'
import RelativeTime from './relative-time'
import RelativeTimeElement from './relative-time-element'

export default class TimeAgoElement extends RelativeTimeElement {
	getFormattedDate() {
		const format = this.getAttribute('format')
		const date = this.date

		if (!date) {
			return
		}

		if (format === 'micro') {
			return new RelativeTime(date, localeFromElement(this)).microTimeAgo()
		} else {
			return new RelativeTime(date, localeFromElement(this)).timeAgo()
		}
	}
}

if (!window.customElements.get('time-ago')) {
	window.TimeAgoElement = TimeAgoElement
	window.customElements.define('time-ago', TimeAgoElement)
}