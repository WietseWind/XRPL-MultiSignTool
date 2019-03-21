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
          <input :class="{ 'is-invalid': !(quorum + '').match(/^[1-9][0-9]*$/) }" autocomplete="off" type="text" id="account" class="form-control" v-model.number="quorum" placeholder="Eg. 2">
          <span class="text-muted small">
            A target number for the signer weights. A multi-signature from this list is valid only if the
            sum weights of the signatures provided is greater than or equal to this value.
          </span>
        </div>
      </div>
      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Signer list</label>
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
                  <input autocomplete="off" type="text" class="form-control" :class="{ 'is-invalid': a.Account !== '' && !a.Account.match(/^r[a-zA-Z0-9]{20,}$/) }" v-model="a.Account" placeholder="XRPL Account, eg. rXXXXXXXXX...">
                </td>
                <td>
                  <input autocomplete="off" type="text" class="form-control" :class="{ 'is-invalid': !(a.Weight + '').match(/^[1-9][0-9]*$/) }" v-model.number="a.Weight" placeholder="">
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
                  <button @click="addSigner()" :disabled="accounts.slice(-1)[0].Account === ''" class="btn btn-primary">＋</button>
                </th>
              </tr>
            </tfoot>
          </table>
        </div>
        <label for="account" class="col-sm-2 col-form-label">Total signer weight</label>
        <div class="col-sm-10 pt-1">
          <span v-if="(signerWeight >= quorum || signerWeight === 0) && signerWeight > 1" class="h4" :class="{
            'text-muted': signerWeight === 0,
            'text-success': signerWeight >= quorum,
            'text-danger': signerWeight < quorum
          }">
            <b>{{ signerWeight }}</b>
          </span>
          <span class="h4 text-muted" v-if="(signerWeight >= quorum && quorum > 0) && signerWeight > 1"> / {{ quorum }} 🎉</span>
          <div class="alert alert-danger text-center" v-if="signerWeight === 1">
            The total signer list should have at least a total weight of <code class="text-dark"><b>2</b></code>
          </div>
          <div class="alert alert-danger text-center" v-if="signerWeight > 1 && signerWeight < quorum">
            Total weight of the signer (<code class="text-dark"><b>{{ signerWeight }}</b></code>) list is below the signer list quorum
            (<code class="text-dark"><b>{{ quorum }}</b></code>).
          </div>
        </div>
      </div>
      <div class="form-group row" v-if="quorum > 0 && signerWeight >= quorum && signerWeight > 1">
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
          <button @click="submit()" :disabled="submitting || tesSUCCESS" class="btn btn-block btn-lg btn-primary" v-if="$env.online">Submit transaction →</button>
        </div>

        <label v-if="Object.keys(submitResult).length > 0" for="account" class="mt-2 col-sm-2 col-form-label">Result</label>
        <div v-if="Object.keys(submitResult).length > 0" class="col-sm-10 pt-2 mt-2">
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
      quorum: 1,
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
    },
    'transaction.signed.id' () {
      this.submitResult = {}
    },
    accounts: {
      handler () {
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
</style>
