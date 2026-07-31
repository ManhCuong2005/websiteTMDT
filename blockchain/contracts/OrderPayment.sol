// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OrderPayment
 * @notice Receives one ETH payment per off-chain order and forwards it to the merchant.
 *         Personal and order details stay in the application's PostgreSQL database.
 */
contract OrderPayment {
    address payable public immutable merchant;

    struct PaymentRecord {
        address payer;
        uint256 amount;
        uint256 paidAt;
    }

    mapping(bytes32 => PaymentRecord) public payments;

    event OrderPaid(
        bytes32 indexed orderId,
        address indexed payer,
        uint256 amount,
        uint256 paidAt
    );

    error InvalidMerchant();
    error InvalidAmount();
    error OrderAlreadyPaid();
    error TransferFailed();

    constructor(address payable merchantAddress) {
        if (merchantAddress == address(0)) revert InvalidMerchant();
        merchant = merchantAddress;
    }

    function payOrder(bytes32 orderId) external payable {
        if (msg.value == 0) revert InvalidAmount();
        if (payments[orderId].paidAt != 0) revert OrderAlreadyPaid();

        payments[orderId] = PaymentRecord({
            payer: msg.sender,
            amount: msg.value,
            paidAt: block.timestamp
        });

        (bool success, ) = merchant.call{value: msg.value}("");
        if (!success) revert TransferFailed();

        emit OrderPaid(orderId, msg.sender, msg.value, block.timestamp);
    }
}
