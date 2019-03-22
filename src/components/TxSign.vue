<template>
  <div class="TxSign">
    <div class="d-flex align-items-center p-3 my-3 text-white-50 bg-purple rounded shadow-sm">
      <div class="lh-100">
        <h5 class="mb-0 text-white lh-100">2. (Multi)Sign transaction</h5>
        <div class="pt-2 mb-0">
          Review a transaction to be MultiSigned, and add your own signature.
        </div>
      </div>
    </div>

    <div class="my-3 p-3 bg-white rounded shadow-sm">
      <p class="alert alert-warning text-center" v-if="!$env.online">
        To compose the transaction, make sure to be connected to the internet; this tool will have fetch some data from the XRP ledger.
      </p>
      <p class="alert alert-warning text-center" v-if="!ready && $env.online">
        <span v-if="$env.rippled.endpoint">
          Connecting...
        </span>
        <span v-else>
          Please connect to either the XRPL <b>livenet</b> or <b>testnet</b> using the top right buttons (<code>LIVE</code> / <code>TEST</code>).
        </span>
      </p>
      <p>
        Start by pasting the transaction HEX you wish to add a signature to:
      </p>
      <div class="form-group row">
        <label for="tx" class="col-sm-2 col-form-label">Transaction HEX</label>
        <div class="col-sm-10">
          <textarea :disabled="!ready || fetching" autocomplete="off" type="text" id="tx" class="form-control" v-model="tx" placeholder="Transaction HEX to MultiSign"></textarea>
        </div>
      </div>
      <div class="form-group row">
        <div class="col-sm-12 text-right">
          <button :disabled="!ready || !txIsHex || fetching" @click="decodeTx()" class="btn btn-primary">Next →</button>
        </div>
      </div>

      <div class="form-group row" v-if="error">
        <label class="col-sm-2 col-form-label">Error</label>
        <div class="col-sm-10">
          <div class="alert alert-danger text-center"><b>Error:</b> {{ errorData }}</div>
        </div>
      </div>

      <div class="form-group row" v-if="Object.keys(txData).length > 0">
        <label class="col-sm-2 col-form-label">Decoded Transaction</label>
        <div class="col-sm-10 pt-2">
          <small v-if="txData.Memos" class="text-muted">
            Memo's are automatically converted from HEX to UTF-8.
          </small>
          <VueJsonPretty :data="txData" />
        </div>
      </div>

      <div v-if="Object.keys(accountData).length > 0 && !error">
        <div class="alert alert-success text-center">
          🎉 Retrieved account &amp; MultiSign information for
          <a :href="$env.explorerUrl + accountData.Account" target="_blank"><code class="text-primary">{{ accountData.Account }}</code></a>
          from the XRP ledger.
        </div>

        <div class="row">
          <label class="col-sm-2">Signer Quorum</label>
          <div class="col-sm-10">
            <code class="text-primary h6">{{ accountData.signer_lists[0].SignerQuorum }}</code>
          </div>
          <label class="col-sm-2">Signers</label>
          <div class="col-sm-10 mb-3">
            <a v-for="signer in accountData.signer_lists[0].SignerEntries"
              :key="signer.Account" :href="$env.explorerUrl + signer.SignerEntry.Account"
              target="_blank"
              class="btn btn-sm mr-2 mb-1"
              :class="{
                'btn-outline-primary': existingSigners.indexOf(signer.SignerEntry.Account) < 0,
                'btn-success text-white': existingSigners.indexOf(signer.SignerEntry.Account) > -1
              }"
            >
              <span v-if="existingSigners.indexOf(signer.SignerEntry.Account) > -1">✓</span>
              <code>{{ signer.SignerEntry.Account }}</code>
              <span v-if="existingSigners.indexOf(signer.SignerEntry.Account) < 0" class="ml-1 badge badge-primary">{{ signer.SignerEntry.SignerWeight }}</span>
            </a>
          </div>

          <div v-if="fullySigned" class="col-sm-12 mt-2">
            <div class="alert alert-success text-center">
              ✓ <b>Transaction fully signed.</b> All signers from at SignerList have signed.
              <br />
              <small>No need to add more signatures unless you want to replace an existing signature.</small>
            </div>
          </div>

          <div v-if="quorumMet >= accountData.signer_lists[0].SignerQuorum && !fullySigned" class="col-sm-12 mt-2">
            <div class="alert alert-success text-center">
              ✓ <b>Signer Quorum is met.</b> Existing signer weight (sum) (<code class="text-dark">{{ quorumMet }}</code>) satisfies signer list quorum (<code class="text-dark">{{ accountData.signer_lists[0].SignerQuorum }}</code>).
              <br />
              <small>No need to add more signatures unless you explicitly want to.</small>
            </div>
          </div>

          <div class="col-sm-12 mt-2">
            If you agree with the transaction, please select your account to generate your signature to be added to the transaction.
          </div>
          <label for="signAs" class="mt-3 col-sm-2 pt-2 h5">Sign as</label>
          <div class="mt-3 col-sm-10">
            <select id="signAs" class="form-control form-control-lg" v-model="signAs">
              <option selected value="">Select...</option>
              <option :value="signer.SignerEntry.Account" v-for="signer in accountData.signer_lists[0].SignerEntries" :key="signer.Account">
                {{ existingSigners.indexOf(signer.SignerEntry.Account) > -1 ? '✓' : '' }}
                {{ signer.SignerEntry.Account }} ({{ signer.SignerEntry.SignerWeight }})
              </option>
            </select>
          </div>
        </div>

        <Sign :signAs="signAs" :rawTxData="rawTxData" :transaction="transaction" v-if="signAs" />

        <div v-if="transaction.signed.id !== ''" class="form-group row">
          <label class="col-sm-2 mt-3">Sign(ed) result(s)</label>
          <div class="col-sm-10 mt-3">
            <div v-if="transaction.signed.error" class="alert alert-danger text-center">
              <small>Error signing transaction:</small><br />
              {{ transaction.signed.error }}
            </div>
            <div v-else class="alert alert-success text-center">
              🎉 Signed transaction. Please distribute the HEX below to the person that will combine &amp; submit the signatures.
            </div>
            <div v-clipboard:copy="transaction.signed.blob" class="alert alert-secondary signed-tx" v-if="transaction.signed.blob !== ''">
              <div class="text-center">
                <small class="text-muted">
                  Click to copy
                </small>
              </div>
              <code class="text-dark"><b>{{ transaction.signed.blob }}</b></code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty'
import Sign from './Sign.vue'

const rippleCodec = require('ripple-binary-codec')

export default {
  name: 'TxSign',
  components: {
    VueJsonPretty,
    Sign
  },
  computed: {
    ready () {
      return this.$env.rippled.connected && this.$env.rippled.ledger
    },
    txIsHex () {
      return this.tx.trim().toUpperCase().match(/^[A-F0-9]+$/)
    },
    fullySigned () {
      const signerList = this.accountData.signer_lists[0].SignerEntries.map(e => { return e.SignerEntry.Account }).sort()
      return signerList.length === this.existingSigners.length && signerList.every((u, i) => { return u === this.existingSigners[i] })
    },
    quorumMet () {
      return this.existingSigners.map(s => {
        const matchingWeight = this.accountData.signer_lists[0].SignerEntries
          .filter(e => { return e.SignerEntry.Account === s })
          .map(e => { return e.SignerEntry.SignerWeight })
        if (matchingWeight.length === 1) {
          return matchingWeight[0]
        }
        return 0
      }).reduce((a, b) => { return a + b }, 0)
    }
  },
  data () {
    return {
      fetching: false,
      tx: '',
      rawTxData: {},
      existingSigners: [],
      txData: {},
      transaction: {
        signed: {
          id: '',
          blob: '',
          error: ''
        }
      },
      errorData: '',
      error: false,
      accountData: {},
      signAs: '',
      secret: '',
      passphrase: ''
    }
  },
  watch: {
    '$env.rippled.endpoint' () {
      this.clear()
    },
    signAs () {
      this.transaction.signed.id = ''
      this.transaction.signed.blob = ''
      this.transaction.signed.error = ''
    },
    tx () {
      this.clear()
    }
  },
  methods: {
    clear () {
      this.fetching = false
      this.signAs = ''
      this.error = false
      this.errorData = ''
      this.txData = {}
      this.rawTxData = {}
      this.accountData = {}
      this.existingSigners = []
    },
    setError (message) {
      if (message === 'false == true') {
        message = 'Invalid HEX'
      }
      this.error = true
      this.errorData = message
    },
    renderTransactionMemos () {
      try {
        if (typeof this.txData.Memos !== 'undefined' && Array.isArray(this.txData.Memos) && this.txData.Memos.length > 0) {
          this.txData.Memos.forEach(m => {
            if (typeof m.Memo === 'object' && Object.keys(m.Memo).length > 0) {
              Object.keys(m.Memo).forEach(mKey => {
                if (m.Memo[mKey].match(/^[A-F0-9]+$/) && m.Memo[mKey].length % 2 === 0) {
                  m.Memo[mKey] = Buffer.from(m.Memo[mKey], 'hex').toString('utf8')
                }
              })
            }
          })
          return true
        }
      } catch (e) {}
      return false
    },
    decodeTx () {
      this.clear()

      try {
        this.txData = rippleCodec.decode(this.tx.trim().toUpperCase())

        // Don't show and remove before composing rawTxData for next signature
        if (typeof this.txData.SigningPubKey !== 'undefined') delete this.txData.SigningPubKey
        if (typeof this.txData.TxnSignature !== 'undefined') delete this.txData.TxnSignature

        Object.assign(this.rawTxData, JSON.parse(JSON.stringify(this.txData)))
        if (typeof this.rawTxData.Signers !== 'undefined') {
          this.existingSigners = this.rawTxData.Signers.map(s => { return s.Signer.Account }).sort()
        }

        // Only remove after composing the rawTxData for next signature, so only don't show
        if (typeof this.txData.Signers !== 'undefined') delete this.txData.Signers

        if (typeof this.txData.Account === 'undefined') {
          this.setError('No "Account" found in the decoded transaction.')
        } else {
          if (typeof this.txData.LastLedgerSequence !== 'undefined' && this.$env.rippled.ledger.ledger_index && this.txData.LastLedgerSequence < this.$env.rippled.ledger.ledger_index) {
            this.setError(`Transaction LastLedgerSequence already passed (${this.txData.LastLedgerSequence} < ${this.$env.rippled.ledger.ledger_index})`)
            return
          }

          this.renderTransactionMemos()
          this.fetching = true
          this.$env.rippled.connection.send({
            command: 'account_info',
            account: this.txData.Account,
            signer_lists: true
          }).then(accountInfo => {
            this.fetching = false
            if (accountInfo.error) {
              this.setError(typeof accountInfo.error_message !== 'undefined' ? accountInfo.error_message : accountInfo.error)
            } else {
              if (accountInfo.account_data.signer_lists && accountInfo.account_data.signer_lists.length > 0) {
                this.accountData = accountInfo.account_data
                if (typeof this.accountData.Sequence !== 'undefined' && typeof this.txData.Sequence !== 'undefined' && this.accountData.Sequence > this.txData.Sequence) {
                  this.setError('Expired. Account Sequence is higher than transaction Sequence')
                }
              } else {
                this.setError(`Account isn't setup for multisiging (no signer list present)`)
              }
            }
          }).catch(e => {
            this.setError(e.message)
          })
        }
      } catch (e) {
        this.setError(e.message)
      }
    }
  }
}
</script>

<style scoped lang="scss">
  textarea {
    &#tx {
      height: 200px;
      resize: none;
    }
    &.no-resize {
      resize: none;
    }
  }
</style>
