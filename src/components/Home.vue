<template>
  <div class="Home">
    <div class="d-flex align-items-center p-3 my-3 text-white-50 bg-purple rounded shadow-sm">
      <div class="lh-100">
        <h5 class="mb-0 text-white lh-100">XRPL MultiSignTool</h5>
        <div class="pt-2 mb-0">
          A tool to compose, sign and combine MultiSign transactions by <a href="https://twitter.com/WietseWind/" class="text-white" target="_blank">@WietseWind</a>
        </div>
      </div>
    </div>

    <div class="my-3 p-3 bg-white rounded shadow-sm">
      <p>
        This tool will help signing, collecting and combining multisigned transactions.

        Someone has to initate the process by <a><b>composing</b></a> a transaction. The composed transaction can then be
        distributed to the (listed) multisigning users.
      </p>
      <p>
        The multisigning users will then <b>review</b> the transaction, and if they agree they can <b>sign</b> the transaction as well,
        then to send the signed transaction to a collecting party (probably the initiating user).
      </p>
      <p class="mb-0">
        When all (or sufficient) signatures are received, the transactions can be <b>combined and submitted</b> to the XRP ledger.
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
  // ,
  // props: {
  //   msg: String
  // }
}
</script>

<style scoped lang="scss">
</style>
