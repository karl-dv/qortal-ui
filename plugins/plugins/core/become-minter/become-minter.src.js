import { html, LitElement } from 'lit'
import { Epml } from '../../../epml'
import { blocksNeed } from '../../utils/functions'
import { becomeMinterStyles } from '../components/plugins-css'
import isElectron from 'is-electron'
import './not-sponsored'
import './yes-sponsored'
import '../components/ButtonIconCopy'
import '@polymer/paper-spinner/paper-spinner-lite.js'
import '@material/mwc-button'
import '@material/mwc-textfield'
import '@vaadin/button'

// Multi language support
import { get, registerTranslateConfig, translate, use } from '../../../../core/translate'
registerTranslateConfig({
	loader: lang => fetch(`/language/${lang}.json`).then(res => res.json())
})

const parentEpml = new Epml({ type: 'WINDOW', source: window.parent })

class BecomeMinter extends LitElement {
	static get properties() {
		return {
			theme: { type: String, reflect: true },
			sponsorshipKeyValue: { type: String },
			nodeInfo: { type: Object },
			isPageLoading: { type: Boolean },
			addressInfo: { type: Object },
			rewardSharePublicKey: { type: String },
			mintingAccountData: { type: Array }
		}
	}

	static get styles() {
		return [becomeMinterStyles]
	}

	constructor() {
		super()
		this.theme = localStorage.getItem('qortalTheme') ? localStorage.getItem('qortalTheme') : 'light'
		this.sponsorshipKeyValue = ''
		this.isPageLoading = true
		this.nodeInfo = {}
		this.addressInfo = {}
		this.rewardSharePublicKey = ''
		this.mintingAccountData = null
	}

	render() {
		const findMintingAccount = this.mintingAccountData?.find((ma) => ma.recipientAccount === window.parent.reduxStore.getState().app?.selectedAddress?.address)
		const isAlreadySponsored = this.addressInfo?.error !== 124 && this.addressInfo?.level === 0 && this.addressInfo?.blocksMinted > 0 && this.addressInfo?.blocksMinted < 7200
		return html`
			${this.isPageLoading
				? html`
					<div class="loadingContainer">
						<div class="loading"></div>
					</div>
					<div class="backdrop"></div>
				`
			: ''}
			<div class="page-container">
				<h1 class="header-title">
					${translate('mintingpage.mchange32')}
				</h1>
				<div class="fullWidth">
					<hr class="divider" />
				</div>
				${isAlreadySponsored
				? ''
				: html`
					<not-sponsored
						.atMount="${() => this.atMount()}"
					>
					</not-sponsored>
				`}
				${!isAlreadySponsored
				? ''
				: html`
					<yes-sponsored
						.rewardSharePublicKey=${this
						.rewardSharePublicKey}
							.addressInfo=${this.addressInfo}
							.isMinting=${!!findMintingAccount}
					>
					</yes-sponsored>
				`}
			</div>
		`
	}

	async firstUpdated() {
		await this.atMount()

		if (!isElectron()) {
		} else {
			window.addEventListener('contextmenu', (event) => {
				event.preventDefault()
				window.parent.electronAPI.showMyMenu()
			})
		}

		this.clearConsole()

		setInterval(() => {
			this.clearConsole()
		}, 60000)
	}

	connectedCallback() {
		super.connectedCallback()
		window.addEventListener('storage', this._handleStorage)
	}

	disconnectedCallback() {
		window.removeEventListener('storage', this._handleStorage)
		super.disconnectedCallback()
	}

	changeLanguage() {
		const checkLanguage = localStorage.getItem('qortalLanguage')

		if (checkLanguage === null || checkLanguage.length === 0) {
			localStorage.setItem('qortalLanguage', 'us')
			use('us')
		} else {
			use(checkLanguage)
		}
	}

	_handleStorage() {
		const checkLanguage = localStorage.getItem('qortalLanguage')
		const checkTheme = localStorage.getItem('qortalTheme')

		use(checkLanguage)

		if (checkTheme === 'dark') {
			this.theme = 'dark'
		} else {
			this.theme = 'light'
		}

		document.querySelector('html').setAttribute('theme', this.theme)
	}

	async getNodeInfo() {
		return await parentEpml.request('apiCall', {
			url: `/admin/status`
		})
	}

	async getMintingAcccounts() {
		return await parentEpml.request('apiCall', {
			url: `/admin/mintingaccounts`
		})
	}

	async atMount() {
		this.changeLanguage()
		this.isPageLoading = true

		try {
			const [nodeInfo, myRewardShareArray, mintingaccounts] =
				await Promise.all([
					this.getNodeInfo(),
					this.getRewardShareRelationship(
						window.parent.reduxStore.getState().app?.selectedAddress?.address
					),
					this.getMintingAcccounts()
				])
			this.nodeInfo = nodeInfo
			this.rewardSharePublicKey = myRewardShareArray[0]?.rewardSharePublicKey
			this.isPageLoading = false
			this.mintingAccountData = mintingaccounts
			this.addressInfo = window.parent.reduxStore.getState().app.accountInfo.addressInfo
		} catch (error) {
			console.error(error)

			this.isPageLoading = false
		}
	}

	clearConsole() {
		if (!isElectron()) {
		} else {
			console.clear()
			window.parent.electronAPI.clearCache()
		}
	}

	async getRewardShareRelationship(recipientAddress) {
		return await parentEpml.request('apiCall', {
			type: 'api',
			url: `/addresses/rewardshares?recipients=${recipientAddress}`
		})
	}

	_levelUpBlocks() {
		return (blocksNeed(0) - (this.addressInfo?.blocksMinted + this.addressInfo?.blocksMintedAdjustment)).toString()
	}

	// Standard functions
	getApiKey() {
		const myNode = window.parent.reduxStore.getState().app.nodeConfig.knownNodes[window.parent.reduxStore.getState().app.nodeConfig.node]
		return myNode.apiKey
	}

	isEmptyArray(arr) {
		if (!arr) { return true }
		return arr.length === 0
	}

	round(number) {
		return (Math.round(parseFloat(number) * 1e8) / 1e8).toFixed(8)
	}
}

window.customElements.define('become-minter', BecomeMinter)