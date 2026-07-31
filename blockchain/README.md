# Local ETH payment contract

This folder contains the Solidity contract used by the checkout flow.

```powershell
cd blockchain
npm install
npm run compile
npm run deploy
npm run smoke-test
```

Ganache Desktop must be running at `http://127.0.0.1:7545` with chain ID `1337`.
The deployer is Ganache account `0`; ETH received by the contract is forwarded to
the configured merchant wallet.

After deployment, copy the two printed `set` commands into the root
`config.local.bat`, then restart the Spring Boot backend. Redeploy whenever the
Ganache workspace is reset.
