package com.banhang.service;

import com.banhang.domain.Address;
import com.banhang.domain.User;
import com.banhang.dto.AuthDtos;
import com.banhang.dto.ImageDtos;
import com.banhang.dto.UserDtos;
import com.banhang.exception.AppException;
import com.banhang.repository.AddressRepository;
import com.banhang.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class UserService {
    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final MappingService mappingService;
    private final CloudinaryService cloudinaryService;

    public UserService(CurrentUserService currentUserService,
                       UserRepository userRepository,
                       AddressRepository addressRepository,
                       MappingService mappingService,
                       CloudinaryService cloudinaryService) {
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.mappingService = mappingService;
        this.cloudinaryService = cloudinaryService;
    }

    @Transactional
    public AuthDtos.UserResponse updateProfile(UserDtos.UpdateProfileRequest request) {
        User user = currentUserService.requireUser();
        user.setFullName(clean(request.fullName()) == null ? user.getFullName() : request.fullName().trim());
        user.setPhone(clean(request.phone()));
        user.setAvatarUrl(clean(request.avatarUrl()));
        userRepository.save(user);
        return mappingService.toUser(user);
    }

    @Transactional
    public AuthDtos.UserResponse uploadAvatar(MultipartFile file) {
        User user = currentUserService.requireUser();
        ImageDtos.ImageUploadResponse uploaded = cloudinaryService.uploadAvatar(file);
        user.setAvatarUrl(uploaded.url());
        userRepository.save(user);
        return mappingService.toUser(user);
    }

    @Transactional(readOnly = true)
    public List<UserDtos.AddressResponse> addresses() {
        User user = currentUserService.requireUser();
        return addressRepository.findByUserIdOrderByDefaultAddressDescCreatedAtDesc(user.getId())
                .stream().map(mappingService::toAddress).toList();
    }

    @Transactional
    public UserDtos.AddressResponse createAddress(UserDtos.AddressRequest request) {
        User user = currentUserService.requireUser();
        if (Boolean.TRUE.equals(request.defaultAddress())) {
            clearDefault(user.getId());
        }
        Address address = new Address();
        apply(address, request, user);
        return mappingService.toAddress(addressRepository.save(address));
    }

    @Transactional
    public UserDtos.AddressResponse updateAddress(Long id, UserDtos.AddressRequest request) {
        User user = currentUserService.requireUser();
        Address address = addressRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy địa chỉ"));
        if (Boolean.TRUE.equals(request.defaultAddress())) {
            clearDefault(user.getId());
        }
        apply(address, request, user);
        return mappingService.toAddress(addressRepository.save(address));
    }

    @Transactional
    public void deleteAddress(Long id) {
        User user = currentUserService.requireUser();
        Address address = addressRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy địa chỉ"));
        addressRepository.delete(address);
    }

    private void clearDefault(Long userId) {
        addressRepository.findByUserIdOrderByDefaultAddressDescCreatedAtDesc(userId).forEach(address -> {
            if (address.isDefaultAddress()) {
                address.setDefaultAddress(false);
                addressRepository.save(address);
            }
        });
    }

    private void apply(Address address, UserDtos.AddressRequest request, User user) {
        address.setUser(user);
        address.setRecipientName(request.recipientName().trim());
        address.setPhone(request.phone().trim());
        address.setAddressLine(request.addressLine().trim());
        address.setWard(clean(request.ward()));
        address.setDistrict(clean(request.district()));
        address.setProvince(request.province().trim());
        address.setDefaultAddress(Boolean.TRUE.equals(request.defaultAddress()));
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
