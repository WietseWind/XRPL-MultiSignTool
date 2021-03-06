<template>
  <div class="MultiSignSetup">
    <div class="d-flex align-items-center p-3 my-3 text-white-50 bg-purple rounded shadow-sm">
      <div class="lh-100">
        <h5 class="mb-0 text-white lh-100">Setup MultiSigning</h5>
        <div class="pt-2 mb-0">
          Add a SignerList to an account, and (after that) optionally: disable the MasterKey
        </div>
      </div>
    </div>

    <div class="my-3 p-3 bg-white rounded shadow-sm">
      <p>
        Please configure the <a href="https://developers.ripple.com/signerlist.html" target="_blank">SignerList</a> that's to
        be <a href="https://developers.ripple.com/signerlistset.html" target="_blank">setup</a>.
      </p>
      <div class="form-group row">
        <label for="account" class="col-sm-2 col-form-label">Account</label>
        <div class="col-sm-10">
          <input disabled autocomplete="off" type="text" id="account" class="form-control" v-model="routeData.account">
        </div>
      </div>
      <div class="form-group row">
        <label for="account" class="col-sm-2 col-form-label">Signer list Quorum</label>
        <div class="col-sm-10">
          <input :class="{ 'is-invalid': !(quorum + '').match(/^[1-9][0-9]*$/) }" autocomplete="off" type="text" id="account" class="monospace form-control" v-model.number="quorum" placeholder="Eg. 2">
          <span class="text-muted small">
            A target number for the signer weights. A multi-signature from this list is valid only if the
            sum weights of the signatures provided is greater than or equal to this value.
          </span>
        </div>
      </div>
      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Signer list (max. 8)</label>
        <div class="col-sm-10">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Account</th>
                <th width="100">Weight</th>
                <th width="1"></th>
              </tr>
            </thead>
            <tbody>
              <tr class="alert" v-for="(a, i) in accounts" :key="i" >
                <td>
                  <input autocomplete="off" type="text" class="monospace form-control" :class="{ 'is-invalid': a.Account !== '' && !a.Account.match(/^r[a-zA-Z0-9]{20,}$/) }" v-model="a.Account" placeholder="XRPL Account, eg. rXXXXXXXXX...">
                </td>
                <td>
                  <input autocomplete="off" type="text" class="monospace form-control" :class="{ 'is-invalid': !(a.Weight + '').match(/^[1-9][0-9]*$/) }" v-model.number="a.Weight" placeholder="">
                </td>
                <td>
                  <button @click="removeSigner(i)" class="btn btn-block" :class="{
                    'btn-outline-secondary': accounts.length < 3,
                    'btn-outline-danger': accounts.length >= 3,
                  }" :disabled="accounts.length < 3">&times;</button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <th></th>
                <th></th>
                <th>
                  <button v-show="accounts.length < 8" @click="addSigner()" :disabled="accounts.slice(-1)[0].Account === ''" class="btn btn-primary">＋</button>
                </th>
              </tr>
            </tfoot>
          </table>
        </div>
        <div v-if="preCheckError" class="col-sm-12">
          <div class="alert alert-danger text-center" v-html="preCheckError"></div>
        </div>
        <label v-if="signerWeight > 0 && !preCheckError" for="account" class="col-sm-2 col-form-label">Total signer weight</label>
        <div v-if="signerWeight > 0 && !preCheckError" class="col-sm-10 pt-1">
          <span v-if="(signerWeight >= quorum || signerWeight === 0) && signerWeight > 1" class="h4" :class="{
            'text-muted': signerWeight === 0,
            'text-success': signerWeight >= quorum,
            'text-danger': signerWeight < quorum
          }">
            <b>{{ signerWeight }}</b>
          </span>
          <span v-if="(signerWeight >= quorum && quorum > 0) && signerWeight > 1">
            <span class="h4 text-muted"> / {{ quorum }} {{ preCheckWarning ? '' : '🎉' }}</span>
            <div v-if="preCheckWarning" v-html="preCheckWarning" class="mt-3 alert alert-warning text-center"></div>
            <div v-if="preCheckWarning" class="text-center">
              <button @click="ignoreWarning = true" v-if="!ignoreWarning" class="btn btn-outline-primary">OK. I know what I'm doing, continue →</button>
            </div>
          </span>
          <div v-else>
            <div class="alert alert-danger text-center" v-if="signerWeight === 1">
              The total signer list should have at least a total weight of <code class="text-dark"><b>2</b></code>
            </div>
            <div class="alert alert-danger text-center" v-if="signerWeight > 1 && signerWeight < quorum">
              Total weight of the signer (<code class="text-dark"><b>{{ signerWeight }}</b></code>) list is below the signer list quorum
              (<code class="text-dark"><b>{{ quorum }}</b></code>).
            </div>
          </div>
        </div>
      </div>
      <div class="form-group row" v-if="quorum > 0 && signerWeight >= quorum && signerWeight > 1 && !preCheckError && !(preCheckWarning && !ignoreWarning)">
        <label for="account" class="col-sm-2 col-form-label">SignerListSet tx</label>
        <div class="col-sm-10 pt-2">
          <VueJsonPretty :data="txData" />
        </div>

        <div class="col-sm-12 pt-2">
          <Sign :noSignAs="true" :signAs="routeData.account" :rawTxData="txData" :transaction="transaction" />
        </div>

        <label v-if="transaction.signed.id" for="account" class="mt-2 col-sm-2 col-form-label">Submit</label>
        <div v-if="transaction.signed.id" class="col-sm-10 pt-2 mt-2">
          <p><b>Transaction signed 🎉</b></p>
          <p v-if="!$env.online" class="alert alert-warning text-center">Now go back online to submit the transaction to the XRP ledger.</p>
          <button @click="submit()" :disabled="submitting" class="btn btn-block btn-lg btn-primary" v-if="$env.online && !tesSUCCESS">Submit transaction →</button>
        </div>

        <label v-if="Object.keys(submitResult).length > 0" for="account" class="mt-2 col-sm-2 col-form-label">Result</label>
        <div v-if="Object.keys(submitResult).length > 0" class="col-sm-10 pt-2 mt-2">
          <a v-if="tesSUCCESS" :href="$env.explorerUrl + submitResult.tx_json.hash" target="_blank" class="mb-2 btn btn-lg btn-block btn-outline-success">View transaction (explorer) →</a>
          <VueJsonPretty :data="submitResult" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty'
import Sign from './Sign.vue'

export default {
  name: 'MultiSignSetup',
  components: {
    VueJsonPretty,
    Sign
  },
  data () {
    return {
      quorum: 2,
      ignoreWarning: false,
      accounts: [
        { Account: '', Weight: 1 },
        { Account: '', Weight: 1 }
      ],
      submitting: false,
      submitResult: {},
      transaction: {
        signed: {
          id: '',
          blob: '',
          error: ''
        }
      }
    }
  },
  computed: {
    tesSUCCESS () {
      return Object.keys(this.submitResult).length > 0 && typeof this.submitResult.engine_result !== 'undefined' && this.submitResult.engine_result === 'tesSUCCESS'
    },
    preCheckWarning () {
      if (this.signerWeight === this.quorum) {
        return `
          The total signer weight (<code class="text-dark">${this.signerWeight}</code>) is equal to the quorum (<code class="text-dark">${this.quorum}</code>).
          This would mean if <b>one of the signers no longer has access to his/her key, or <u>refuses</u> to sign, you can <u>no longer access your funds</u></b>.
          <br />
          <br />
          Are you sure you want to continue without signer redundancy?
        `
      }

      const accountsEqQuorum = this.accounts.filter(a => { return a.Weight === this.quorum })
      if (accountsEqQuorum.length > 0) {
        return `
          There's at least one account in the Signer list with a weight equal to the quorum (<code class="text-dark">${this.quorum}</code>).
          The account <code class="text-dark">${accountsEqQuorum[0].Account}</code> is able to <u>single handedly sign a transaction</u>.
          <br />
          <br />
          This may be on purpose, but just to make sure: is this really what you want?
        `
      }

      const signersSortedByWeight = this.accounts.filter(a => { return true }).sort((a, b) => {
        if (a.Weight > b.Weight) return -1
        if (a.Weight < b.Weight) return 1
        return 0
      })
      const remainingQuorum = signersSortedByWeight.slice(1).map(a => { return a.Weight }).reduce((a, b) => { return a + b }, 0)
      if (remainingQuorum < this.quorum) {
        return `
          The <u>one</u> signer (<code class="text-dark">${signersSortedByWeight[0].Account}</code>) with the highest weight
          (<code class="text-dark">${signersSortedByWeight[0].Weight}</code>) can block all signing (eg. <u>keys lost</u> or <u>refusing to sign</u>),
          since the total weight (<code class="text-dark">${remainingQuorum}</code>) of the <u>remaining signers together cannot satisfy</u>
          the quorum (<code class="text-dark">${this.quorum}</code>).
          <br />
          <br />
          This may be on purpose, but just to make sure: is this really what you want?
        `
      }

      return false
    },
    preCheckError () {
      const accounts = this.accounts.filter(a => { return a.Account !== '' }).map(a => { return a.Account }).sort()
      const unique = accounts.filter((elem, pos) => {
        return accounts.indexOf(elem) === pos
      })

      if (unique.length !== accounts.length) {
        return 'Duplicate signer in Signer List. A signer should occur only once in the Signer list.'
      }

      if (accounts.indexOf(this.routeData.account) > -1) {
        return `The account (<code class="text-danger">${this.routeData.account}</code>) should not be one of the signers.`
      }

      const gtQuorum = this.accounts.filter(a => { return a.Weight > this.quorum })
      if (gtQuorum.length > 0) {
        return `
          A signer with a weight (<code class="text-dark">${gtQuorum[0].Weight}</code>) greater than the quorum (<code class="text-dark">${this.quorum}</code>) 
          is found (<code class="text-danger">${gtQuorum[0].Account}</code>).
        `
      }

      return false
    },
    txData () {
      return {
        Flags: 0,
        TransactionType: 'SignerListSet',
        Account: this.routeData.account,
        Sequence: this.routeData.accountData.Sequence,
        Fee: (12 * 4) + '',
        SignerQuorum: this.quorum,
        SignerEntries: this.accounts.filter(a => { return a.Weight > 0 && a.Account.match(/^r[a-zA-Z0-9]{20,}$/) }).map(a => {
          return {
            SignerEntry: {
              Account: a.Account,
              SignerWeight: a.Weight
            }
          }
        })
      }
    },
    signerWeight () {
      return this.accounts.filter(a => {
        return a.Account.match(/^r[a-zA-Z0-9]{20,}$/)
      }).map(a => {
        return a.Weight
      }).reduce((a, b) => {
        return a + b
      }, 0)
    }
  },
  methods: {
    submit () {
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
    removeSigner (i) {
      this.accounts.splice(i, 1)
    },
    addSigner () {
      this.accounts.push({ Account: '', Weight: 1 })
    }
  },
  watch: {
    quorum (a) {
      this.quorum = parseInt((a + '').replace(/[^0-9]/g, ''))
      if (isNaN(this.quorum)) this.quorum = ''
      this.ignoreWarning = false
    },
    'transaction.signed.id' () {
      this.submitResult = {}
    },
    accounts: {
      handler () {
        this.ignoreWarning = false
        this.accounts.forEach(a => {
          if ((a.Weight + '').match(/[^0-9]/)) {
            a.Weight = parseInt((a.Weight + '').replace(/[^0-9]/g, ''))
            if (isNaN(a.Weight)) a.Weight = ''
          }
        })
      },
      deep: true
    }
  },
  props: {
    routeData: Object
  }
}
</script>

<style scoped lang="scss">
  .monospace {
    font-family: "Monaco", "Lucida Console", Courier, monospace;
  }
</style>
