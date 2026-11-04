package com.fenglin.springboottest.controller;

import com.fenglin.springboottest.common.Result;
import com.fenglin.springboottest.controller.dto.UserAddressRequest;
import com.fenglin.springboottest.controller.dto.UserProfileUpdateRequest;
import com.fenglin.springboottest.service.UserProfileService;
import com.fenglin.springboottest.vo.UserAddressVO;
import com.fenglin.springboottest.vo.UserProfileVO;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 个人资料 + 收货地址接口，统一挂在 /api/users 下，与前端 src/api/profile.js 约定一致：
 *   GET    /api/users/profile?account=              查询资料
 *   PUT    /api/users/profile                       更新资料（头像/昵称/性别/手机/签名）
 *   GET    /api/users/addresses?account=            地址列表
 *   POST   /api/users/addresses                     新增地址
 *   PUT    /api/users/addresses/{id}                编辑地址
 *   DELETE /api/users/addresses/{id}?account=       删除地址
 *   POST   /api/users/addresses/{id}/default?account=  设为默认
 */
@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/profile")
    public Result<UserProfileVO> getProfile(@RequestParam String account) {
        return Result.success(userProfileService.getProfile(account));
    }

    @PutMapping("/profile")
    public Result<UserProfileVO> updateProfile(@RequestBody UserProfileUpdateRequest req) {
        return Result.success(userProfileService.updateProfile(req));
    }

    @GetMapping("/addresses")
    public Result<List<UserAddressVO>> listAddresses(@RequestParam String account) {
        return Result.success(userProfileService.listAddresses(account));
    }

    @PostMapping("/addresses")
    public Result<UserAddressVO> addAddress(@RequestBody UserAddressRequest req) {
        return Result.success(userProfileService.addAddress(req));
    }

    @PutMapping("/addresses/{id}")
    public Result<UserAddressVO> updateAddress(@PathVariable Long id, @RequestBody UserAddressRequest req) {
        return Result.success(userProfileService.updateAddress(id, req));
    }

    @DeleteMapping("/addresses/{id}")
    public Result<Void> removeAddress(@PathVariable Long id,
                                     @RequestParam(required = false) String account) {
        userProfileService.removeAddress(id, account);
        return Result.success();
    }

    @PostMapping("/addresses/{id}/default")
    public Result<UserAddressVO> setDefault(@PathVariable Long id,
                                            @RequestParam(required = false) String account) {
        return Result.success(userProfileService.setDefault(id, account));
    }
}
