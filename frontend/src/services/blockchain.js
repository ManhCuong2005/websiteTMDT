const PENDING_TRANSACTION_KEY = 'banhang_pending_eth_transactions'

function ethereumProvider() {
  if (!window.ethereum) {
    throw new Error('Không tìm thấy MetaMask. Hãy cài đặt hoặc mở khóa MetaMask để thanh toán ETH.')
  }
  return window.ethereum
}

function chainHex(chainId) {
  return `0x${Number(chainId).toString(16)}`
}

function readableWalletError(error) {
  if (error?.code === 4001) return 'Bạn đã từ chối yêu cầu trong MetaMask.'
  if (error?.code === -32002) return 'MetaMask đang có một yêu cầu chờ xác nhận. Hãy mở MetaMask.'
  return error?.message || 'MetaMask không thể thực hiện giao dịch.'
}

export async function prepareGanacheWallet(config) {
  if (!config?.enabled) throw new Error('Thanh toán ETH chưa được cấu hình trên máy chủ.')

  const ethereum = ethereumProvider()
  const expectedChain = chainHex(config.chainId)
  let currentChain = await ethereum.request({ method: 'eth_chainId' })

  if (currentChain.toLowerCase() !== expectedChain.toLowerCase()) {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: expectedChain }],
      })
    } catch (error) {
      if (error?.code !== 4902) throw new Error(readableWalletError(error))
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: expectedChain,
          chainName: 'Ganache Local 1337',
          nativeCurrency: { name: 'Ganache ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: [config.rpcUrl],
        }],
      })
    }
    currentChain = await ethereum.request({ method: 'eth_chainId' })
  }

  if (currentChain.toLowerCase() !== expectedChain.toLowerCase()) {
    throw new Error(`MetaMask phải kết nối chain ID ${config.chainId}.`)
  }

  const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
  if (!accounts?.[0]) throw new Error('MetaMask chưa chọn tài khoản thanh toán.')
  return accounts[0]
}

export async function sendOrderPayment(order, config, from) {
  const payment = order?.cryptoPayment
  if (!payment?.blockchainOrderId || !payment?.expectedAmountWei) {
    throw new Error('Đơn hàng chưa có thông tin thanh toán blockchain.')
  }

  const selector = config.paymentSelector.replace(/^0x/, '')
  const orderId = payment.blockchainOrderId.replace(/^0x/, '')
  if (selector.length !== 8 || orderId.length !== 64) {
    throw new Error('Dữ liệu gọi smart contract không hợp lệ.')
  }

  try {
    return await ethereumProvider().request({
      method: 'eth_sendTransaction',
      params: [{
        from,
        to: config.contractAddress,
        value: `0x${BigInt(payment.expectedAmountWei).toString(16)}`,
        data: `0x${selector}${orderId}`,
      }],
    })
  } catch (error) {
    throw new Error(readableWalletError(error))
  }
}

export function rememberPendingTransaction(orderId, transactionHash) {
  const pending = readPendingTransactions()
  pending[String(orderId)] = transactionHash
  localStorage.setItem(PENDING_TRANSACTION_KEY, JSON.stringify(pending))
}

export function pendingTransactionFor(orderId) {
  return readPendingTransactions()[String(orderId)] || null
}

export function forgetPendingTransaction(orderId) {
  const pending = readPendingTransactions()
  delete pending[String(orderId)]
  localStorage.setItem(PENDING_TRANSACTION_KEY, JSON.stringify(pending))
}

function readPendingTransactions() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_TRANSACTION_KEY) || '{}')
  } catch {
    return {}
  }
}

export function shortHash(value, head = 10, tail = 8) {
  if (!value) return ''
  return `${value.slice(0, head)}…${value.slice(-tail)}`
}
