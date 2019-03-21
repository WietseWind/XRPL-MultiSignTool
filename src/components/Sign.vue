<template>
  <div class="Sign">
    <div class="row mt-2">
      <div class="col-sm-12" v-if="$env.online && !$env.devmode && !signed">
        <div class="alert alert-danger text-center">
          <span class="h4">NOW <b>GO OFFLINE</b>!</span>
          <br />
          You don't want to be entering your family seed / mnemonic while you're online.
        </div>
      </div>
      <div class="col-sm-12" v-if="!($env.online && !$env.devmode) && !$env.local && !signed">
        <div class="alert alert-warning text-center">
          <span class="h4">You are running this application from a webserver</span>
          <br />
          Downloading and running a release (or locally built version) of this application from your local computer is safer!
        </div>
      </div>
    </div>

    <div class="row mt-2" v-if="signed">
      <label v-if="signed" for="signbtn" class="col-sm-2 pt-1">Retry</label>
      <div class="col-sm-10">
        <button @click="reset()" id="signbtn" class="btn btn-outline-primary">⌫ Sign again</button>
      </div>
    </div>

    <div class="row mt-2" v-if="(!$env.online || $env.devmode) && !signed">
      <label v-if="!signed" for="secret" class="col-sm-2">Account secret</label>
      <div v-if="!signed" class="col-sm-10">
        <textarea id="passPhrase" autocomplete="off" type="text" rows="3" class="form-control form-control-sm text-muted no-resize" v-model="secret" placeholder="Family seed (sXXXXX...) or mnemonic (alpha bravo ...)"></textarea>
      </div>
      <label v-if="!signed && secretIsMnemonic" for="passphrase" class="mt-1 col-sm-2">Passphrase <small>(optional)</small></label>
      <div v-if="!signed && secretIsMnemonic" class="mt-1 col-sm-10">
        <input id="passphrase" autocomplete="off" type="text" class="form-control form-control-sm text-muted" v-model="passphrase" placeholder="Optionally: passphrase (a.k.a. 25th word)" />
      </div>
      <label for="signbtn" class="col-sm-2"></label>
      <div class="col-sm-10">
        <button :disabled="!canSign" @click="sign()" id="signbtn" class="mt-1 float-right btn btn-primary">Sign →</button>
      </div>
      <label v-if="transaction.signed.error" class="col-sm-2"></label>
      <div v-if="transaction.signed.error" class="col-sm-10">
        <p class="alert alert-danger text-center mt-2">
          <small>Error signing the transaction:</small>
          <br />
          <b>{{ transaction.signed.error }}</b>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import XRPLAccountLib from 'xrpl-accountlib'

export default {
  name: 'Sign',
  props: {
    signAs: String,
    rawTxData: Object,
    transaction: Object,
    noSignAs: Boolean
  },
  computed: {
    secretIsFamilySeed () {
      return this.secret.trim().match(/^s[a-zA-Z0-9]{15,}$/) ? 'familySeed' : false
    },
    secretIsMnemonic () {
      return this.secret.trim().toLowerCase() === this.secret.trim() && this.secret.replace(/[^a-z]+/g, ' ').trim().split(' ').length >= 12 ? 'mnemonic' : false
    },
    secretIsHex () {
      return this.secret.trim().toUpperCase().match(/^s[A-F0-9]{64,66}$/) ? 'privatekey' : false
    },
    secretType () {
      let secretType = this.secretIsFamilySeed
      if (this.secretIsMnemonic) secretType = this.secretIsMnemonic
      if (this.secretIsHex) secretType = this.secretIsHex
      return secretType
    },
    canSign () {
      return this.secretIsFamilySeed || this.secretIsMnemonic || this.secretIsHex
    },
    signed () {
      return this.transaction.signed.id !== '' && this.transaction.signed.error === ''
    }
  },
  data () {
    return {
      // transaction: {
      //   signed: {
      //     id: '',
      //     blob: '',
      //     error: ''
      //   }
      // },
      secret: '',
      passphrase: ''
    }
  },
  methods: {
    reset () {
      this.transaction.signed.id = ''
      this.transaction.signed.blob = ''
      this.transaction.signed.error = ''
    },
    sign () {
      this.transaction.signed.error = ''
      try {
        let options = {}
        if (this.secretIsMnemonic && this.passphrase !== '') {
          options.passphrase = this.passphrase
        }
        const account = XRPLAccountLib.derive[this.secretType](this.secret, options)
        if (typeof this.noSignAs === 'undefined' || !this.noSignAs) {
          account.signAs(this.signAs)
        }
        const signed = XRPLAccountLib.sign(this.rawTxData, account)
        this.transaction.signed.id = signed.id
        this.transaction.signed.blob = signed.signedTransaction
      } catch (e) {
        this.transaction.signed.error = e.message
      }
    }
  }
}
</script>

<style scoped lang="scss">
  textarea {
    &.no-resize {
      resize: none;
    }
  }
</style>
