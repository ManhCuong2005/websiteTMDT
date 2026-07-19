package com.banhang.service;

import com.banhang.domain.Order;
import com.banhang.domain.enums.OrderStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.util.Locale;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String from;
    private final boolean enabled;

    public EmailService(JavaMailSender mailSender,
                        @Value("${app.mail.from:${spring.mail.username:}}") String from,
                        @Value("${app.mail.enabled:false}") boolean enabled) {
        this.mailSender = mailSender;
        this.from = from;
        this.enabled = enabled;
    }

    public void sendRegistrationCode(String email, String code, int minutes) {
        send(email, "Mã xác thực đăng ký tài khoản",
                "Mã xác thực của bạn là: " + code + "\nMã có hiệu lực trong " + minutes + " phút.");
    }

    public void sendGoogleLoginSuccess(String email, String name) {
        send(email, "Đăng nhập thành công với Google",
                "Xin chào " + safeName(name) + ",\nài khoản Google liên kết với email này vừa đăng nhập thành công.");
    }

    public void sendOrderStatus(Order order) {
        NumberFormat money = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN"));
        send(order.getUser().getEmail(), "Cập nhật đơn hàng " + order.getOrderCode(),
                "Xin chào " + safeName(order.getUser().getFullName()) + ",\n"
                        + "Đơn hàng " + order.getOrderCode() + " hiện đang ở trạng thái: "
                        + displayStatus(order.getStatus()) + ".\n"
                        + "Tổng tiền: " + money.format(order.getTotal()) + "\n"
                        + "Địa chỉ giao hàng: " + order.getShippingAddress());
    }

    private void send(String to, String subject, String text) {
        if (!enabled || to == null || to.isBlank()) {
            log.info("Mail disabled or missing recipient. Subject: {}, to: {}", subject, to);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (from != null && !from.isBlank()) {
                message.setFrom(from);
            }
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
        } catch (MailException ex) {
            log.warn("Could not send email '{}' to {}", subject, to, ex);
        }
    }

    private String safeName(String name) {
        return name == null || name.isBlank() ? "ban" : name.trim();
    }

    private String displayStatus(OrderStatus status) {
        return switch (status) {
            case PENDING -> "Chờ xác nhận";
            case CONFIRMED -> "Đã xác nhận";
            case PACKING -> "Đang đóng gói";
            case SHIPPING -> "Đang giao hàng";
            case DELIVERED -> "Đã giao hàng";
            case CANCELLED -> "Đã hủy";
        };
    }
}
