package com.fenglin.springboottest.service;

import com.fenglin.springboottest.controller.dto.UserAddressRequest;
import com.fenglin.springboottest.controller.dto.UserProfileUpdateRequest;
import com.fenglin.springboottest.vo.UserAddressVO;
import com.fenglin.springboottest.vo.UserProfileVO;

import java.util.List;

/**
 * 个人资料 + 收货地址业务（「我的页面」）。
 */
public interface UserProfileService {

    /** 查询个人资料 */
    UserProfileVO getProfile(String account);

    /** 更新个人资料（头像 / 昵称 / 性别 / 手机 / 签名） */
    UserProfileVO updateProfile(UserProfileUpdateRequest req);

    /** 查询某账号的全部收货地址（默认地址排在最前） */
    List<UserAddressVO> listAddresses(String account);

    /** 新增收货地址 */
    UserAddressVO addAddress(UserAddressRequest req);

    /** 编辑收货地址 */
    UserAddressVO updateAddress(Long id, UserAddressRequest req);

    /** 删除收货地址（带归属校验） */
    void removeAddress(Long id, String account);

    /** 设为默认地址（同账号其余地址取消默认） */
    UserAddressVO setDefault(Long id, String account);
}
