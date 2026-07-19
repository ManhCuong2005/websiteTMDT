package com.banhang.controller;

import com.banhang.dto.AuthDtos;
import com.banhang.dto.CommonDtos;
import com.banhang.dto.UserDtos;
import com.banhang.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users/me")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PutMapping
    public AuthDtos.UserResponse updateProfile(@Valid @RequestBody UserDtos.UpdateProfileRequest request) {
        return userService.updateProfile(request);
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AuthDtos.UserResponse uploadAvatar(@RequestParam("file") MultipartFile file) {
        return userService.uploadAvatar(file);
    }

    @GetMapping("/addresses")
    public List<UserDtos.AddressResponse> addresses() {
        return userService.addresses();
    }

    @PostMapping("/addresses")
    public UserDtos.AddressResponse createAddress(@Valid @RequestBody UserDtos.AddressRequest request) {
        return userService.createAddress(request);
    }

    @PutMapping("/addresses/{id}")
    public UserDtos.AddressResponse updateAddress(@PathVariable Long id,
                                                   @Valid @RequestBody UserDtos.AddressRequest request) {
        return userService.updateAddress(id, request);
    }

    @DeleteMapping("/addresses/{id}")
    public CommonDtos.MessageResponse deleteAddress(@PathVariable Long id) {
        userService.deleteAddress(id);
        return new CommonDtos.MessageResponse("Đã xóa địa chỉ");
    }
}
