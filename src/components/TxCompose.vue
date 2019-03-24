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
      <div class="alert alert-warning text-center" v-if="setup.multiSigning && !fetching && !error">
        This account (<a :href="$env.explorerUrl + account" target="_blank"><code class="text-primary">{{ account }}</code></a>)
        <u>isn't setup for MultiSigning</u>.
        <br />
        <button @click="route('MultiSignSetup', 'multiSigning')" class="mt-3 btn btn-primary">Setup MultiSigning →</button>
      </div>
      <div v-if="Object.keys(accountData).length > 0">
        <div v-if="setup.regularKey && !setup.disableMaster && specialTx === ''" class="row">
          <div class="col-12">
            <div class="mt-3 alert alert-warning text-center">
              Your account has a <b>regular key</b> (<code class="text-dark"><a :href="$env.explorerUrl + setup.regularKey" target="_blank"><code class="text-primary">{{ setup.regularKey }}</code></a></code>) configured.
              <br />
              <small>The XRP Ledger allows an account to authorize a secondary key pair, called a regular key pair, to sign future transactions.</small>
              <br />
              <br />
              With a <b>regular key</b> setup, multi signing can be bypassed by simply signing only with the regular key. This may be on purpose, in which case
              you can continue keeping the regular key in place. However, if you <b>only want to allow multi signed transactions</b>
              for your account, you can compose, multisign and submit a transaction to <b>unset the regular key</b>.
            </div>
            <div class="text-center">
              <button @click="setup.regularKey = false" class="btn btn-outline-danger mr-2">Keep the regular key, continue →</button>
              or
              <button @click="setup.regularKey = false; specialTx = 'regularKey'" class="btn btn-primary ml-2">Continue by <b><u>unsetting</u> the regular key</b> →</button>
            </div>
          </div>
        </div>
        <div v-if="setup.disableMaster && specialTx === ''" class="row">
          <div class="col-12">
            <div class="mt-3 alert alert-warning text-center">
              Your account has <b><u>not disabled</u></b> the <b>master key</b>.
              <br />
              <br />
              Without a disabled <b>master key</b>, multi signing can be bypassed by simply signing only with the key beloning to your account.
              This may be on purpose, in which case you can continue. However, if you <b>only want to allow multi signed transactions</b>
              for your account, you can compose, multisign and submit a transaction to <b>disable the master key</b>.
            </div>
            <div class="text-center">
              <button @click="setup.disableMaster = false" class="btn btn-outline-danger mr-2">Ignore, continue →</button>
              or
              <button @click="setup.disableMaster = false; specialTx = 'disableMaster'" class="btn btn-primary ml-2"><b><u>Disable</u> the master key</b> →</button>
            </div>
          </div>
        </div>
        <div class="row" v-if="!(setup.regularKey || setup.disableMaster) || specialTx !== ''">
          <label v-if="specialTx !== 'disableMaster'" class="col-sm-2">Account Sequence</label>
          <div v-if="specialTx !== 'disableMaster'" class="col-sm-10">
            <code class="text-primary h6">{{ accountData.Sequence }}</code>
          </div>
          <label v-if="specialTx !== 'disableMaster'" class="col-sm-2">Signer Quorum</label>
          <div v-if="specialTx !== 'disableMaster'" class="col-sm-10">
            <code class="text-primary h6">{{ accountData.signer_lists[0].SignerQuorum }}</code>
          </div>
          <label class="col-sm-2">Signers</label>
          <div class="col-sm-10">
            <a v-for="signer in accountData.signer_lists[0].SignerEntries" :key="signer.Account" :href="$env.explorerUrl + signer.SignerEntry.Account" target="_blank" class="btn btn-outline-primary btn-sm mr-2 mb-1">
              <code>{{ signer.SignerEntry.Account }}</code>
              <span class="ml-1 badge badge-primary">{{ signer.SignerEntry.SignerWeight }}</span>
            </a>
          </div>
          <label v-if="specialTx !== 'disableMaster'"  class="col-sm-2 mt-1">Transaction</label>
          <div v-if="specialTx === 'disableMaster'" class="col-sm-12 mt-4">
            <p class="alert alert-danger text-center">
              <b>ARE YOU SURE!?</b>
              If you continue, the master key will be <b>DISABLED</b>, meaning from that moment on
              you can <b>ONLY</b> send multisigned transactions (signed by the appropriate signers ↑).
              If your signers don't have access to their key(s) anymore and you can't satisfy the
              quorum, you will loose access to your funds.
            </p>
            <div class="text-center" v-if="!goSign">
              <button @click="goSign = true" class="mt-0 btn btn-outline-danger">Yes, I'm sure. Disable the master key.</button>
            </div>
          </div>
          <div v-if="specialTx !== 'disableMaster'" class="col-sm-10 mt-1">
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
          <label v-if="specialTx !== 'disableMaster' && (transaction.signed.id !== '' || transaction.signed.error !== '')" class="col-sm-2 mt-3">Sign(ed) result(s)</label>
          <div v-if="specialTx !== 'disableMaster' && (transaction.signed.id !== '' || transaction.signed.error !== '')" class="col-sm-10 mt-3">
            <div v-if="transaction.signed.error" class="alert alert-danger text-center">
              <small>Error signing transaction:</small><br />
              {{ transaction.signed.error }}
            </div>
            <div v-else class="alert alert-success text-center">
              🎉 Signed transaction<br />
              <b>Please distribute the HEX below to the signers and ask them to sign it.</b>
              <br />
              <small>After signing, they can distribute their signed transaction to you, so you can <b>combine and submit</b> the transaction.</small>
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
        <Sign v-if="goSign" :noSignAs="true" :rawTxData="transaction.json" :transaction="transaction" />
        <div class="row" v-if="specialTx === 'disableMaster' && (transaction.signed.id !== '' || transaction.signed.error !== '')">
          <label class="col-sm-2 mt-3">Submit</label>
          <div class="col-sm-10 mt-3">
            <a v-if="txSuccess" :href="$env.explorerUrl + submitResult.tx_json.hash" target="_blank" class="mb-2 btn btn-lg btn-block btn-outline-success">View transaction (explorer) →</a>
            <button v-if="!txSuccess" @click="submitTx()" :disabled="submitting" class="mb-2 btn btn-lg btn-block btn-primary">Submit transaction →</button>
          </div>
          <label v-if="Object.keys(submitResult).length > 0" class="col-sm-2 col-form-label">Rippled response</label>
          <div v-if="Object.keys(submitResult).length > 0" class="col-sm-10 pt-2">
            <VueJsonPretty class="mt-1" :data="submitResult" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty'
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/monokai.css'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/keymap/sublime.js'

import Sign from './Sign.vue'
import XRPLAccountLib from 'xrpl-accountlib'

export default {
  name: 'TxCompose',
  components: {
    codemirror,
    Sign,
    VueJsonPretty
  },
  data () {
    return {
      account: '',
      specialTx: '',
      setup: {
        multiSigning: false,
        regularKey: false,
        disableMaster: false
      },
      goSign: false,
      accountData: {},
      fetching: false,
      error: false,
      errorData: '',
      submitting: false,
      submitResult: {},
      transaction: {
        defaultJson: {},
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
    txSuccess () {
      return Object.keys(this.submitResult).length > 0 && typeof this.submitResult.engine_result_code !== 'undefined' && this.submitResult.engine_result_code === 0
    },
    ready () {
      return this.$env.rippled.connected && this.$env.rippled.ledger
    }
  },
  watch: {
    specialTx () {
      if (this.specialTx === '') {
        this.transaction.json = this.transaction.defaultJson
        this.renderTransactionText()
      } else {
        switch (this.specialTx) {
          case 'regularKey':
            this.transaction.json = {
              TransactionType: 'SetRegularKey',
              Account: this.transaction.json.Account,
              Sequence: this.transaction.json.Sequence,
              LastLedgerSequence: this.transaction.json.LastLedgerSequence,
              Fee: '50'
            }
            break
          case 'disableMaster':
            this.transaction.json = {
              TransactionType: 'AccountSet',
              Account: this.transaction.json.Account,
              Sequence: this.transaction.json.Sequence,
              LastLedgerSequence: this.transaction.json.LastLedgerSequence,
              SetFlag: 4,
              Fee: '50'
            }
            break
          default:
            //
        }
        this.renderTransactionText()
      }
    },
    '$env.rippled.endpoint' () {
      this.clear()
    },
    account () {
      this.setup.multiSigning = false
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
    submitTx () {
      this.submitting = true
      this.submitResult = {}

      this.$env.rippled.connection.send({
        command: 'submit',
        tx_blob: this.transaction.signed.blob
      }).then(r => {
        this.submitting = false
        this.submitResult = r
      }).catch(e => {
        this.submitting = false
        this.submitResult = e
      })
    },
    route (route, el) {
      this.changeRoute(route, { account: this.account, accountData: this.setup[el] })
      this.setup[el] = false
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
      if (Object.keys(this.transaction.defaultJson).length < 1) {
        this.transaction.defaultJson = this.transaction.json
      }
      this.transaction.text = JSON.stringify(this.transaction.json, null, '\t')
    },
    setError (message) {
      this.error = true
      this.errorData = message
    },
    clear () {
      Object.keys(this.setup).forEach(o => {
        this.setup[o] = false
      })
      this.fetching = false
      this.error = false
      this.errorData = ''
      this.accountData = {}
      this.specialTx = ''
      this.goSign = false
      this.submitting = false
      this.submitResult = {}
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
            if (typeof accountInfo.account_data.RegularKey !== 'undefined') {
              this.setup.regularKey = accountInfo.account_data.RegularKey
            }
            if (typeof accountInfo.account_data.Flags !== 'undefined') {
              let accountFlags = []
              const accountRootFlags = {
                PasswordSpent: 0x00010000, // password set fee is spent
                RequireDestTag: 0x00020000, // require a DestinationTag for payments
                RequireAuth: 0x00040000, // require authorization to hold IOUs
                DepositAuth: 0x01000000, // require account to auth deposits
                DisallowXRP: 0x00080000, // disallow sending XRP
                DisableMaster: 0x00100000, // force regular key
                NoFreeze: 0x00200000, // permanently disallowed freezing trustlines
                GlobalFreeze: 0x00400000, // trustlines globally frozen
                DefaultRipple: 0x00800000
              }
              Object.keys(accountRootFlags).forEach(f => {
                if (accountInfo.account_data.Flags & accountRootFlags[f]) {
                  accountFlags.push(f)
                }
              })
              if (accountFlags.indexOf('DisableMaster') < 0) {
                this.setup.disableMaster = true
              }
            }
            this.accountData = accountInfo.account_data
            this.transaction.json.Fee = (100 + (1 + this.accountData.signer_lists[0].SignerEntries.length)) + ''
            this.transaction.json.Account = this.accountData.Account
            this.transaction.json.Sequence = this.accountData.Sequence
            this.transaction.json.LastLedgerSequence = this.$env.rippled.ledger.ledger_index + (60 * 60 * 24 * 30 / 4) // ~ One month
            this.renderTransactionText()
          } else {
            // this.setError(`Account isn't setup for multisiging (no signer list present)`)
            this.setup.multiSigning = accountInfo.account_data
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
