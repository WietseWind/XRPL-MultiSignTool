<template>
  <div class="TxCombine">
    <div class="d-flex align-items-center p-3 my-3 text-white-50 bg-purple rounded shadow-sm">
      <div class="lh-100">
        <h5 class="mb-0 text-white lh-100">3. Combine MultiSigned transactions &amp; submit the transaction</h5>
        <div class="pt-2 mb-0">
          Combine all received signed transactions into one MultiSigned transaction, and submit to the XRP ledger.
        </div>
      </div>
    </div>

    <div class="my-3 p-3 bg-white rounded shadow-sm">
      <p class="alert alert-warning text-center" v-if="!ready && $env.online">
        <span v-if="$env.rippled.endpoint">
          Connecting...
        </span>
        <span v-else>
          Please connect to either the XRPL <b>livenet</b> or <b>testnet</b> using the top right buttons (<code>LIVE</code> / <code>TEST</code>).
        </span>
      </p>
      <p>
        So you have a bunch of signed transactions? Time to check if the Quorum is met, and if so: combine the signatures into a
        MultiSigned transaction 🎉 Just paste one or more signed HEX transaction blobs into the text area.
      </p>
      <div class="form-group row">
        <label for="tx" class="col-sm-2 col-form-label">Transaction HEX</label>
        <div class="col-sm-10">
          <div v-if="Object.keys(accountData).length > 0 && quorumMet >= accountData.signer_lists[0].SignerQuorum && !fullySigned" class="alert alert-success text-center mb-0">
            ✓ <b>Signer Quorum is met.</b>
            <!-- Existing signer weight (sum) (<code class="text-dark">{{ quorumMet }}</code>) satisfies signer list -->
            quorum (<code class="text-dark">{{ accountData.signer_lists[0].SignerQuorum }}</code>).
          </div>

          <div v-if="Object.keys(accountData).length > 0 && fullySigned" class="alert alert-success text-center mb-0">
            ✓ <b>Transaction fully signed.</b> All signers from at SignerList have signed.
          </div>

          <input v-if="allowAddNewTx" :disabled="!ready || fetching" autocomplete="off" type="text" id="tx" class="form-control" v-model="tx" placeholder="Signed transaction HEX to combine" />
        </div>
        <div class="col-sm-10 offset-sm-2 text-right pt-2">
          <button v-if="hex.length > 0" @click="reset()" class="btn btn-outline-secondary float-left">⌫ Restart</button>
          <button v-if="allowAddNewTx" :disabled="!ready || !txIsHex || fetching" @click="decodeTx()" class="btn btn-primary">Add →</button>
        </div>
      </div>

      <div class="form-group row" v-if="error">
        <label class="col-sm-2 pt-2 col-form-label">Error</label>
        <div class="col-sm-10">
          <div class="alert alert-danger text-center"><b>Error:</b>&nbsp; <span v-html="errorData"></span></div>
        </div>
      </div>

      <div class="row" v-if="Object.keys(accountData).length > 0">
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
              'btn-success text-white': existingSigners.indexOf(signer.SignerEntry.Account) > -1 && minimalSignerListAccounts.indexOf(signer.SignerEntry.Account) > -1,
              'btn-outline-info': existingSigners.indexOf(signer.SignerEntry.Account) > -1 && minimalSignerListAccounts.indexOf(signer.SignerEntry.Account) < 0
            }"
          >
            <!-- <span v-if="existingSigners.indexOf(signer.SignerEntry.Account) > -1 && minimalSignerListAccounts.indexOf(signer.SignerEntry.Account) > -1">✓</span> -->
            <code>{{ signer.SignerEntry.Account }}</code>
            <span class="ml-1 badge" :class="{
              'badge-primary': existingSigners.indexOf(signer.SignerEntry.Account) < 0,
              'badge-light text-success': existingSigners.indexOf(signer.SignerEntry.Account) > -1 && minimalSignerListAccounts.indexOf(signer.SignerEntry.Account) > -1,
              'badge-info text-white': existingSigners.indexOf(signer.SignerEntry.Account) > -1 && minimalSignerListAccounts.indexOf(signer.SignerEntry.Account) < 0
            }">{{ signer.SignerEntry.SignerWeight }}</span>
          </a>
          <div class="alert alert-warning text-center mt-2" v-if="existingSigners.length !== minimalSignerListAccounts.length">
            The quorum is satisfied by using <code class="text-dark"><b>{{ minimalSignerListAccounts.length }}</b></code> of the
            <code class="text-dark"><b>{{ existingSigners.length }}</b></code> multisigned transactions.
          </div>
        </div>

        <div v-if="quorumMet < accountData.signer_lists[0].SignerQuorum && !fullySigned" class="col-sm-12 mt-2">
          <div class="alert alert-warning text-center">
            Signer weight (sum) (<code class="text-dark">{{ quorumMet }}</code>) doesn't satisfie the signer list quorum (<code class="text-dark">{{ accountData.signer_lists[0].SignerQuorum }}</code>) yet.
            <br />
            <small>Please add more signatures.</small>
          </div>
        </div>

        <label v-if="Object.keys(theTx).length > 0" class="col-sm-2 col-form-label">Decoded Transaction</label>
        <div v-if="Object.keys(theTx).length > 0" class="col-sm-10 pt-2">
          <small v-if="txData.Memos" class="text-muted">
            Memo's are automatically converted from HEX to UTF-8.
          </small>
          <VueJsonPretty :data="theTx" />
        </div>

        <div v-if="quorumMet >= accountData.signer_lists[0].SignerQuorum || fullySigned" class="col-sm-10 offset-sm-2 mt-2">
          <div class="text-center">
            <a v-if="txSuccess" :href="$env.explorerUrl + submitResult.tx_json.hash" target="_blank" class="mt-5 mb-5 btn btn-lg btn-block btn-outline-success">View transaction (explorer) →</a>

            <!-- <div class="text-left">
              <VueJsonPretty :data="minimalSignerListAccounts" />
            </div> -->

            <button v-if="!txSuccess" @click="combineAndSubmit()" :disabled="submitting" class="mt-5 mb-5 btn btn-lg btn-block btn-primary">Submit MultiSigned transaction →</button>
          </div>
        </div>

        <label v-if="Object.keys(submitResult).length > 0" class="col-sm-2 col-form-label">Rippled response</label>
        <div v-if="Object.keys(submitResult).length > 0" class="col-sm-10 pt-2">
          <VueJsonPretty class="mt-1" :data="submitResult" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty'
import * as XRPLAccountLib from 'xrpl-accountlib'

const rippleCodec = require('ripple-binary-codec')

export default {
  name: 'TxCombine',
  components: {
    VueJsonPretty
  },
  computed: {
    allowAddNewTx () {
      return !(Object.keys(this.accountData).length > 0 && this.fullySigned) && !(Object.keys(this.accountData).length > 0 && this.quorumMet >= this.accountData.signer_lists[0].SignerQuorum && !this.fullySigned)
    },
    minimalSignerList () {
      if (Object.keys(this.accountData).length < 1) {
        return []
      }
      let signers = {}
      this.accountData.signer_lists[0].SignerEntries.forEach(s => {
        signers[s.SignerEntry.Account] = s.SignerEntry.SignerWeight
      })
      const descWeightSigned = this.hex.map(h => {
        let totalWeight = 0
        return {
          signers: h.signers,
          tx: h,
          signerWeight: h.signers.map(s => {
            totalWeight += signers[s]
            return {
              Account: s,
              Weight: signers[s]
            }
          }),
          totalWeight: totalWeight
        }
      }).sort((a, b) => {
        if (a.totalWeight < b.totalWeight) return 1
        if (a.totalWeight > b.totalWeight) return -1
        return 0
      })

      const oneSufficient = descWeightSigned.filter(a => {
        return a.totalWeight === this.accountData.signer_lists[0].SignerQuorum
      })

      if (oneSufficient.length > 0) {
        return [ oneSufficient[0].tx ]
      } else {
        /**
         * Todo: need to make this more efficient to select the best combination of signers (weight)
         */
        const descSignedLimited = descWeightSigned.reduce((a, b) => {
          const sumThisFar = a.reduce((c, d) => {
            return c + d.totalWeight
          }, 0)
          if (sumThisFar < this.accountData.signer_lists[0].SignerQuorum) {
            a.push(b)
          }
          return a
        }, [])
        const descSignedLimitedWeight = descSignedLimited.reduce((a, b) => {
          return a + b.totalWeight
        }, 0)

        const ascSignedLimited = descWeightSigned.reverse().reduce((a, b) => {
          const sumThisFar = a.reduce((c, d) => {
            return c + d.totalWeight
          }, 0)
          if (sumThisFar < this.accountData.signer_lists[0].SignerQuorum) {
            a.push(b)
          }
          return a
        }, [])
        const ascSignedLimitedWeight = ascSignedLimited.reduce((a, b) => {
          return a + b.totalWeight
        }, 0)

        if (descSignedLimitedWeight < ascSignedLimitedWeight) {
          return descSignedLimited.map(a => {
            return a.tx
          })
        }

        return ascSignedLimited.map(a => {
          return a.tx
        })
      }
    },
    minimalSignerListAccounts () {
      return this.minimalSignerList.map(a => {
        return a.signers
      }).reduce((a, b) => {
        b.forEach(c => {
          a.push(c)
        })
        return a
      }, [])
    },
    existingSigners () {
      return this.hex.map(h => {
        return h.signers
      }).reduce((a, b) => {
        b.forEach(s => {
          if (a.indexOf(s) < 0) {
            a.push(s)
          }
        })
        return a
      }, []).sort()
    },
    txSuccess () {
      return Object.keys(this.submitResult).length > 0 && typeof this.submitResult.engine_result_code !== 'undefined' && this.submitResult.engine_result_code === 0
    },
    theTx () {
      if (this.hex.length > 0) {
        let clone = Object.assign({}, this.hex[0].json)
        delete clone.Signers
        return clone
      }
      return {}
    },
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
      hex: [],
      rawTxData: {},
      txData: {},
      errorData: '',
      error: false,
      accountData: {},
      submitting: false,
      submitResult: {}
    }
  },
  watch: {
    '$env.rippled.endpoint' () {
      this.reset()
    },
    tx () {
      this.clear()
    }
  },
  methods: {
    reset () {
      this.hex = []
      this.accountData = {}
      this.submitting = false
      this.submitResult = {}
      this.clear()
    },
    combineAndSubmit () {
      this.submitting = true
      this.submitResult = {}

      const Tx = XRPLAccountLib.sign(this.minimalSignerList.map(h => {
        return { signedTransaction: h.blob }
      }))

      console.log(Tx)

      this.$env.rippled.connection.send({
        command: 'submit',
        tx_blob: Tx.signedTransaction
      }).then(r => {
        this.submitting = false
        this.submitResult = r
      }).catch(e => {
        this.submitting = false
        this.submitResult = e
      })
    },
    addHex (hex) {
      if (this.hex.length > 0) {
        let existingSignerFound = false
        hex.signers.forEach(s => {
          if (this.existingSigners.indexOf(s) > -1) {
            this.setError(`Added transaction contains a signer (<code class="text-danger">${s}</code>) that's already in (one of) the existing signed transaction(s).`)
            existingSignerFound = true
          }
        })
        if (existingSignerFound) {
          return false
        }
        if (hex.jsonHex !== this.hex[0].jsonHex) {
          this.setError(`Added transaction doesn't match the other transaction(s). You can only add and combine the same signed transaction(s).`)
          return false
        }
        if (this.hex.map(h => { return h.blob }).indexOf(hex.blob) > -1) {
          this.setError(`A transaction with this signature has already been added.`)
          return false
        }
      }
      this.hex.push(hex)
      return true
    },
    clear () {
      this.fetching = false
      this.error = false
      this.errorData = ''
      this.txData = {}
      this.rawTxData = {}
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
        this.renderTransactionMemos()

        // Don't show and remove before composing rawTxData for next signature
        if (typeof this.txData.SigningPubKey !== 'undefined') delete this.txData.SigningPubKey
        if (typeof this.txData.TxnSignature !== 'undefined') delete this.txData.TxnSignature

        const clonedTxData = JSON.parse(JSON.stringify(this.txData))
        Object.assign(this.rawTxData, clonedTxData)

        // Only remove after composing the rawTxData for next signature, so only don't show
        if (typeof this.txData.Signers !== 'undefined') delete this.txData.Signers

        if (typeof clonedTxData.Signers === 'undefined' || !Array.isArray(clonedTxData.Signers) || clonedTxData.Signers.length < 1) {
          this.setError(`Transaction doesn't contain (MultiSign) signatures.`)
          return
        }

        const hexAdded = this.addHex({
          blob: this.tx.trim().toUpperCase(),
          json: clonedTxData,
          jsonHex: Buffer.from(JSON.stringify(this.txData), 'utf-8').toString('base64'),
          signers: clonedTxData.Signers.map(s => { return s.Signer.Account })
        })
        if (!hexAdded) {
          return
        }

        if (typeof this.txData.Account === 'undefined') {
          this.setError('No "Account" found in the decoded transaction.')
        } else {
          if (typeof this.txData.LastLedgerSequence !== 'undefined' && this.$env.rippled.ledger.ledger_index && this.txData.LastLedgerSequence < this.$env.rippled.ledger.ledger_index) {
            this.setError(`Transaction LastLedgerSequence already passed (${this.txData.LastLedgerSequence} < ${this.$env.rippled.ledger.ledger_index})`)
            return
          }

          if (this.hex.length === 1) {
            this.fetching = true
            this.$env.rippled.connection.send({
              command: 'account_info',
              account: this.txData.Account,
              signer_lists: true
            }).then(accountInfo => {
              this.fetching = false
              if (accountInfo.error) {
                this.setError(typeof accountInfo.error_message !== 'undefined' ? accountInfo.error_message : accountInfo.error)
                this.hex = []
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
              this.hex = []
              this.setError(e.message)
            })
          }

          this.tx = ''
        }
      } catch (e) {
        this.setError(e.message)
      }
    }
  }
}

</script>

<style scoped lang="scss">
</style>
