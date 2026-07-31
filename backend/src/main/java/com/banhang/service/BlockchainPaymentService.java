package com.banhang.service;

import com.banhang.dto.OrderDtos;
import com.banhang.exception.AppException;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class BlockchainPaymentService {
    private static final BigDecimal WEI_PER_ETH = new BigDecimal("1000000000000000000");

    private final String rpcUrl;
    private final long chainId;
    private final String merchantAddress;
    private final String contractAddress;
    private final String paymentSelector;
    private final BigDecimal vndPerEth;
    private final RestClient rpcClient;
    private final AtomicLong requestId = new AtomicLong(1);

    public BlockchainPaymentService(
            @Value("${app.blockchain.rpc-url}") String rpcUrl,
            @Value("${app.blockchain.chain-id}") long chainId,
            @Value("${app.blockchain.merchant-address}") String merchantAddress,
            @Value("${app.blockchain.contract-address:}") String contractAddress,
            @Value("${app.blockchain.payment-selector}") String paymentSelector,
            @Value("${app.blockchain.vnd-per-eth}") BigDecimal vndPerEth) {
        this.rpcUrl = rpcUrl;
        this.chainId = chainId;
        this.merchantAddress = normalizeAddress(merchantAddress);
        this.contractAddress = normalizeAddress(contractAddress);
        this.paymentSelector = paymentSelector.toLowerCase(Locale.ROOT);
        this.vndPerEth = vndPerEth;
        this.rpcClient = RestClient.builder().baseUrl(rpcUrl).build();
    }

    public boolean isEnabled() {
        return contractAddress.matches("^0x[0-9a-f]{40}$")
                && paymentSelector.matches("^0x[0-9a-f]{8}$")
                && vndPerEth.signum() > 0;
    }

    public String calculateExpectedWei(BigDecimal amountVnd) {
        if (amountVnd == null || amountVnd.signum() <= 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Số tiền thanh toán ETH phải lớn hơn 0");
        }
        return amountVnd.multiply(WEI_PER_ETH)
                .divide(vndPerEth, 0, RoundingMode.HALF_UP)
                .toBigIntegerExact()
                .toString();
    }

    public OrderDtos.CryptoPaymentResponse config() {
        return new OrderDtos.CryptoPaymentResponse(
                isEnabled(), rpcUrl, chainId, contractAddress, merchantAddress, vndPerEth,
                paymentSelector, null, null, null, null, null, null);
    }

    public VerifiedTransaction verify(
            String transactionHash,
            String blockchainOrderId,
            String expectedAmountWei) {
        if (!isEnabled()) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Thanh toán ETH chưa được cấu hình contract");
        }

        JsonNode actualChainId = rpc("eth_chainId", List.of());
        if (hexToBigInteger(actualChainId.asText()).longValueExact() != chainId) {
            throw new AppException(HttpStatus.BAD_GATEWAY, "Ganache đang chạy sai chain ID");
        }

        JsonNode transaction = requireResult(
                rpc("eth_getTransactionByHash", List.of(transactionHash)),
                "Không tìm thấy giao dịch trên Ganache");
        JsonNode receipt = requireResult(
                rpc("eth_getTransactionReceipt", List.of(transactionHash)),
                "Giao dịch chưa được xác nhận trên Ganache");

        if (!"0x1".equalsIgnoreCase(receipt.path("status").asText())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Giao dịch ETH đã thất bại");
        }
        if (!contractAddress.equals(normalizeAddress(transaction.path("to").asText()))
                || !contractAddress.equals(normalizeAddress(receipt.path("to").asText()))) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Giao dịch không gửi tới contract của cửa hàng");
        }

        BigInteger actualWei = hexToBigInteger(transaction.path("value").asText());
        if (!actualWei.equals(new BigInteger(expectedAmountWei))) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Số ETH thanh toán không đúng giá trị đơn hàng");
        }

        String expectedInput = paymentSelector + stripHexPrefix(blockchainOrderId);
        if (!expectedInput.equalsIgnoreCase(transaction.path("input").asText())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Mã đơn hàng trong giao dịch không hợp lệ");
        }

        String receiptHash = receipt.path("transactionHash").asText();
        if (!transactionHash.equalsIgnoreCase(receiptHash)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Transaction receipt không hợp lệ");
        }

        return new VerifiedTransaction(
                normalizeAddress(transaction.path("from").asText()),
                hexToBigInteger(receipt.path("blockNumber").asText()).longValueExact());
    }

    private JsonNode rpc(String method, List<?> params) {
        try {
            JsonNode response = rpcClient.post()
                    .body(Map.of(
                            "jsonrpc", "2.0",
                            "id", requestId.getAndIncrement(),
                            "method", method,
                            "params", params))
                    .retrieve()
                    .body(JsonNode.class);
            if (response == null) {
                throw new AppException(HttpStatus.BAD_GATEWAY, "Ganache không trả về dữ liệu");
            }
            if (response.hasNonNull("error")) {
                throw new AppException(HttpStatus.BAD_GATEWAY,
                        "Ganache RPC báo lỗi: " + response.path("error").path("message").asText());
            }
            return response.path("result");
        } catch (AppException ex) {
            throw ex;
        } catch (RestClientException ex) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Không kết nối được Ganache tại " + rpcUrl);
        }
    }

    private JsonNode requireResult(JsonNode result, String message) {
        if (result.isMissingNode() || result.isNull()) {
            throw new AppException(HttpStatus.BAD_REQUEST, message);
        }
        return result;
    }

    private BigInteger hexToBigInteger(String value) {
        if (value == null || !value.matches("^0x[0-9a-fA-F]+$")) {
            throw new AppException(HttpStatus.BAD_GATEWAY, "Ganache trả về số hexadecimal không hợp lệ");
        }
        return new BigInteger(value.substring(2), 16);
    }

    private static String normalizeAddress(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private static String stripHexPrefix(String value) {
        return value != null && value.startsWith("0x") ? value.substring(2) : value;
    }

    public record VerifiedTransaction(String payerWalletAddress, long blockNumber) {
    }
}
