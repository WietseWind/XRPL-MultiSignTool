<template>
  <div class="TxCompose">
    <div class="d-flex align-items-center p-3 my-3 text-white-50 bg-purple rounded shadow-sm">
      <div class="lh-100">
        <h5 class="mb-0 text-white lh-100">1. Compose transaction</h5>
        <div class="pt-2 mb-0">
          Create the base transaction you wish to be MultiSigned, to be distributed to the signers.
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
        Please enter the XRPL account wherefore you wish to compose a transaction.
      </p>
      <div class="form-group row">
        <label for="account" class="col-sm-2 col-form-label">Account</label>
        <div class="col-sm-10">
          <input :disabled="!ready || fetching" autocomplete="off" type="text" id="account" class="form-control" v-model="account" placeholder="XRPL account, eg. rXXXXXXX...">
        </div>
      </div>
      <div class="form-group row">
        <div class="col-sm-12 text-right">
          <button :disabled="!ready || account === '' || fetching" @click="checkAccount()" class="btn btn-primary">Next →</button>
        </div>
      </div>

      <div class="alert alert-primary text-center" v-if="fetching">Querying the XRPL...</div>
      <div class="alert alert-danger text-center" v-if="error"><b>Error:</b> {{ errorData }}</div>
      <div class="alert alert-warning text-center" v-if="setupMultiSigning && !fetching && !error">
        This account (<a :href="explorerUrl + account" target="_blank"><code class="text-primary">{{ account }}</code></a>)
        isn't setup for MultiSigning.
        <br />
        <button @click="routeSetupMultiSigning()" class="mt-3 btn btn-primary">Setup MultiSigning</button>
      </div>
      <div v-if="Object.keys(accountData).length > 0">
        <div class="alert alert-success text-center">
          🎉 Retrieved account &amp; MultiSign information for
          <a :href="explorerUrl + accountData.Account" target="_blank"><code class="text-primary">{{ accountData.Account }}</code></a>
          from the XRP ledger.
        </div>
        <div class="row">
          <label class="col-sm-2">Account Sequence</label>
          <div class="col-sm-10">
            <code class="text-primary h6">{{ accountData.Sequence }}</code>
          </div>
          <label class="col-sm-2">Signer Quorum</label>
          <div class="col-sm-10">
            <code class="text-primary h6">{{ accountData.signer_lists[0].SignerQuorum }}</code>
          </div>
          <label class="col-sm-2">Signers</label>
          <div class="col-sm-10">
            <a v-for="signer in accountData.signer_lists[0].SignerEntries" :key="signer.Account" :href="explorerUrl + signer.SignerEntry.Account" target="_blank" class="btn btn-outline-primary btn-sm mr-2 mb-1">
              <code>{{ signer.SignerEntry.Account }}</code>
              <span class="ml-1 badge badge-primary">{{ signer.SignerEntry.SignerWeight }}</span>
            </a>
          </div>
          <label class="col-sm-2 mt-1">Transaction</label>
          <div class="col-sm-10 mt-1">
            <div class="pb-1 tx">
              <small class="text-muted">
                Memo's will be automatically converted from UTF-8 to HEX.
              </small>
              <codemirror v-model="transaction.text" :options="$env.editorOptions"></codemirror>
            </div>
            <div class="alert alert-danger text-center" v-if="!transaction.validJson">Invalid JSON: {{ transaction.invalidJsonMessage }}</div>
            <div class="text-right" v-if="transaction.validJson && transaction.signed.id === ''">
              <button @click="renderTransaction()" class="btn btn-primary">
                Render (HEX) transaction →
              </button>
            </div>
          </div>
          <label v-if="transaction.signed.id !== '' || transaction.signed.error !== ''" class="col-sm-2 mt-3">Sign(ed) result(s)</label>
          <div v-if="transaction.signed.id !== '' || transaction.signed.error !== ''" class="col-sm-10 mt-3">
            <div v-if="transaction.signed.error" class="alert alert-danger text-center">
              <small>Error signing transaction:</small><br />
              {{ transaction.signed.error }}
            </div>
            <div v-else class="alert alert-success text-center">
              🎉 Signed transaction. Please distribute the HEX below to the signers.
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
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/monokai.css'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/keymap/sublime.js'

import XRPLAccountLib from 'xrpl-accountlib'

export default {
  name: 'TxCompose',
  components: {
    codemirror
  },
  data () {
    return {
      account: '',
      setupMultiSigning: false,
      accountData: {},
      fetching: false,
      error: false,
      errorData: '',
      transaction: {
        validJson: true,
        invalidJsonMessage: '',
        text: `{}`,
        signed: {
          id: '',
          blob: '',
          error: ''
        },
        json: {
          TransactionType: 'Payment',
          Account: '',
          Sequence: 0,
          Destination: 'rPdvC6ccq8hCdPKSPJkPmyZ4Mi1oG2FFkT',
          LastLedgerSequence: 0,
          Fee: '10',
          Amount: '1',
          Memos: [
            {
              Memo: {
                MemoType: 'SomeType',
                MemoData: 'SomeData'
              }
            },
            {
              Memo: {
                MemoType: 'Developer',
                MemoData: '@WietseWind'
              }
            }
          ]
        }
      }
    }
  },
  computed: {
    explorerUrl () {
      return 'https://bithomp.com/explorer/'
    },
    ready () {
      return this.$env.rippled.connected && this.$env.rippled.ledger
    }
  },
  watch: {
    '$env.rippled.endpoint' () {
      this.clear()
    },
    account () {
      this.setupMultiSigning = false
    },
    'transaction.text' () {
      this.clearSignedTxData()
      this.transaction.validJson = true
      try {
        const parsedJson = JSON.parse(this.transaction.text)
        this.transaction.json = parsedJson
      } catch (e) {
        this.transaction.validJson = false
        this.transaction.invalidJsonMessage = e.message
      }
    }
  },
  props: {
    changeRoute: Function
  },
  methods: {
    routeSetupMultiSigning () {
      this.changeRoute('MultiSignSetup', { account: this.account, accountData: this.setupMultiSigning })
      this.setupMultiSigning = false
    },
    clearSignedTxData () {
      this.transaction.signed.id = ''
      this.transaction.signed.blob = ''
      this.transaction.signed.error = ''
    },
    renderTransaction () {
      this.renderTransactionMemos()
      this.clearSignedTxData()

      // Some preliminary checks
      if (typeof this.transaction.json.Fee !== 'undefined' && typeof this.transaction.json.Fee !== 'string') {
        this.transaction.signed.error = '"Fee" field should be string, representing a value in Drops'
        return
      }
      if (typeof this.transaction.json.DestinationTag !== 'undefined' && typeof this.transaction.json.DestinationTag !== 'number') {
        this.transaction.signed.error = '"DestinationTag" field should be integer or left out'
        return
      }
      if (typeof this.transaction.json.Sequence !== 'undefined' && typeof this.accountData.Sequence !== 'undefined' && this.transaction.json.Sequence < this.accountData.Sequence) {
        this.transaction.signed.error = 'Transaction Sequence is already expired (account Sequence is greater)'
        return
      }
      if (typeof this.transaction.json.LastLedgerSequence !== 'undefined' && this.$env.rippled.ledger.ledger_index && this.transaction.json.LastLedgerSequence < this.$env.rippled.ledger.ledger_index) {
        this.transaction.signed.error = `Transaction LastLedgerSequence already passed (${this.$env.rippled.ledger.ledger_index})`
        return
      }

      try {
        const account = XRPLAccountLib.derive.passphrase('masterpassphrase')
        const signed = XRPLAccountLib.sign(this.transaction.json, account)
        this.transaction.signed.id = signed.id
        this.transaction.signed.blob = signed.signedTransaction
      } catch (e) {
        this.transaction.signed.error = e.message
      }
    },
    renderTransactionMemos () {
      try {
        if (typeof this.transaction.json.Memos !== 'undefined' && Array.isArray(this.transaction.json.Memos) && this.transaction.json.Memos.length > 0) {
          this.transaction.json.Memos.forEach(m => {
            if (typeof m.Memo === 'object' && Object.keys(m.Memo).length > 0) {
              Object.keys(m.Memo).forEach(mKey => {
                if (!m.Memo[mKey].match(/^[A-F0-9]+$/) || m.Memo[mKey].length % 2 > 0) {
                  m.Memo[mKey] = Buffer.from(m.Memo[mKey], 'utf8').toString('hex').toUpperCase()
                }
              })
            }
          })
          return true
        }
      } catch (e) {}
      return false
    },
    renderTransactionText () {
      this.transaction.text = JSON.stringify(this.transaction.json, null, '\t')
    },
    setError (message) {
      this.error = true
      this.errorData = message
    },
    clear () {
      this.setupMultiSigning = false
      this.fetching = false
      this.error = false
      this.errorData = ''
      this.accountData = {}
    },
    checkAccount () {
      this.clear()
      this.fetching = true

      this.$env.rippled.connection.send({
        command: 'account_info',
        account: this.account.trim(),
        signer_lists: true
      }).then(accountInfo => {
        this.fetching = false
        if (accountInfo.error) {
          this.setError(typeof accountInfo.error_message !== 'undefined' ? accountInfo.error_message : accountInfo.error)
        } else {
          if (accountInfo.account_data.signer_lists && accountInfo.account_data.signer_lists.length > 0) {
            this.accountData = accountInfo.account_data
            this.transaction.json.Account = this.accountData.Account
            this.transaction.json.Sequence = this.accountData.Sequence
            this.transaction.json.LastLedgerSequence = this.$env.rippled.ledger.ledger_index + (60 * 60 * 24 * 30 / 4) // ~ One month
            this.renderTransactionText()
          } else {
            // this.setError(`Account isn't setup for multisiging (no signer list present)`)
            this.setupMultiSigning = accountInfo.account_data
          }
        }
      }).catch(e => {
        this.setError(e.message)
      })
    }
  }
}
</script>

<style lang="scss">
  .signed-tx {
    background-color: #fcfcfc;
    cursor: pointer;
    &:hover {
      background-color: #f0f0f0;
    }
    &:active {
      background-color: #333;
      code.text-dark {
        color: #fff !important;
      }
    }
    // Vue-clipboard2 height fix:
    position: relative;
    overflow: hidden;
  }
</style>

<style lang="scss">
  div.tx {
    div.cm-s-monokai.CodeMirror { height: 475px; }
  }
</style>
